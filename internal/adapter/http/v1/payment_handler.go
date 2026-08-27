package v1

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"doki/internal/domain/billing"
	"doki/internal/domain/reservation"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PaymentHandler exposes HTTP endpoints for payment lifecycle management, bank webhooks, and front-desk PMS billing.
type PaymentHandler struct {
	billingService  billing.Service
	reservationRepo reservation.Repository
}

// NewPaymentHandler returns a new instance of PaymentHandler.
func NewPaymentHandler(billingService billing.Service, reservationRepo reservation.Repository) *PaymentHandler {
	return &PaymentHandler{
		billingService:  billingService,
		reservationRepo: reservationRepo,
	}
}

// InitiatePayment godoc
// @Summary      Initiate direct bank payment order
// @Description  [CREATE] Generates reference_number, 6-character PNR, stay duration, and bank payment instructions for a held reservation
// @Tags         Payments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request body billing.InitiatePaymentRequest true "Payment initiation payload containing reservation_id"
// @Success      201  {object}  billing.InitiatePaymentResponse "Payment order created successfully"
// @Failure      400  {object}  map[string]string "Invalid request payload or malformed UUID"
// @Failure      401  {object}  map[string]string "Missing or invalid authorization token"
// @Failure      404  {object}  map[string]string "Reservation not found"
// @Failure      409  {object}  map[string]string "Reservation not in HELD state or order already settled"
// @Router       /v1/payments/initiate [post]
func (h *PaymentHandler) InitiatePayment(c *gin.Context) {
	var req billing.InitiatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "BadRequest",
			"message": "Invalid request payload: " + err.Error(),
		})
		return
	}

	resp, err := h.billingService.InitiatePayment(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, billing.ErrReservationNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "NotFound",
				"message": err.Error(),
			})
		case errors.Is(err, billing.ErrReservationNotHeld),
			errors.Is(err, billing.ErrReservationHoldExpired),
			errors.Is(err, billing.ErrPaymentOrderAlreadySettled):
			c.JSON(http.StatusConflict, gin.H{
				"error":   "Conflict",
				"message": err.Error(),
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "InternalServerError",
				"message": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// GetPaymentByID godoc
// @Summary      Get payment order profile
// @Description  [READ] Fetch complete payment order details, PNR, payer account, bank reference, and ledger transaction history
// @Tags         Payments
// @Produce      json
// @Security     BearerAuth
// @Param        payment_id path string true "Payment Order UUID"
// @Success      200 {object} billing.PaymentOrderDetailsResponse "Payment order details"
// @Failure      400 {object} map[string]string "Invalid payment UUID"
// @Failure      401 {object} map[string]string "Unauthorized"
// @Failure      404 {object} map[string]string "Payment order not found"
// @Router       /v1/payments/{payment_id} [get]
func (h *PaymentHandler) GetPaymentByID(c *gin.Context) {
	idParam := c.Param("payment_id")
	paymentID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid payment_id: " + idParam})
		return
	}

	resp, err := h.billingService.GetPaymentByID(c.Request.Context(), paymentID)
	if err != nil {
		if errors.Is(err, billing.ErrPaymentOrderNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "NotFound", "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "InternalServerError", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// VoidPayment godoc
// @Summary      Void unpaid payment order
// @Description  [UPDATE] Cancels an open, un-settled payment order before expiry or if guest changes payment method
// @Tags         Payments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        payment_id path string true "Payment Order UUID"
// @Param        request body billing.VoidPaymentRequest true "Void payment justification and staff ID"
// @Success      200 {object} billing.VoidPaymentResponse "Payment order voided"
// @Failure      400 {object} map[string]string "Invalid payload"
// @Failure      401 {object} map[string]string "Unauthorized"
// @Failure      404 {object} map[string]string "Payment order not found"
// @Failure      409 {object} map[string]string "Order cannot be voided"
// @Router       /v1/payments/{payment_id}/void [post]
func (h *PaymentHandler) VoidPayment(c *gin.Context) {
	idParam := c.Param("payment_id")
	paymentID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid payment_id: " + idParam})
		return
	}

	var req billing.VoidPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid void payload: " + err.Error()})
		return
	}

	resp, err := h.billingService.VoidPayment(c.Request.Context(), paymentID, req)
	if err != nil {
		switch {
		case errors.Is(err, billing.ErrPaymentOrderNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "NotFound", "message": err.Error()})
		case errors.Is(err, billing.ErrPaymentOrderCannotBeVoided):
			c.JSON(http.StatusConflict, gin.H{"error": "Conflict", "message": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "InternalServerError", "message": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, resp)
}

// RefundPayment godoc
// @Summary      Process full or partial payment refund
// @Description  [UPDATE] Issues an accounting credit and marks the transaction as REFUNDED, logging staff ID and justification
// @Tags         Payments
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        payment_id path string true "Payment Order UUID"
// @Param        request body billing.RefundPaymentRequest true "Refund payload"
// @Success      200 {object} billing.RefundPaymentResponse "Refund processed and ledgered"
// @Failure      400 {object} map[string]string "Invalid payload or invalid refund amount"
// @Failure      401 {object} map[string]string "Unauthorized"
// @Failure      404 {object} map[string]string "Payment order not found"
// @Failure      409 {object} map[string]string "Order not settled"
// @Router       /v1/payments/{payment_id}/refund [post]
func (h *PaymentHandler) RefundPayment(c *gin.Context) {
	idParam := c.Param("payment_id")
	paymentID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid payment_id: " + idParam})
		return
	}

	var req billing.RefundPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid refund payload: " + err.Error()})
		return
	}

	resp, err := h.billingService.RefundPayment(c.Request.Context(), paymentID, req)
	if err != nil {
		switch {
		case errors.Is(err, billing.ErrPaymentOrderNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "NotFound", "message": err.Error()})
		case errors.Is(err, billing.ErrInvalidRefundAmount):
			c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": err.Error()})
		case errors.Is(err, billing.ErrPaymentOrderCannotBeRefund):
			c.JSON(http.StatusConflict, gin.H{"error": "Conflict", "message": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "InternalServerError", "message": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetReservationFolio godoc
// @Summary      Get guest reservation financial folio
// @Description  [READ] Returns the complete financial folio displaying total stay cost, paid amounts, outstanding balance, and transaction history
// @Tags         Folios
// @Produce      json
// @Security     BearerAuth
// @Param        reservation_id path string true "Reservation UUID"
// @Success      200 {object} billing.ReservationFolioResponse "Financial folio"
// @Failure      400 {object} map[string]string "Invalid reservation UUID"
// @Failure      401 {object} map[string]string "Unauthorized"
// @Failure      404 {object} map[string]string "Reservation not found"
// @Router       /v1/reservations/{reservation_id}/payments [get]
func (h *PaymentHandler) GetReservationFolio(c *gin.Context) {
	idParam := c.Param("reservation_id")
	if idParam == "" {
		idParam = c.Param("id")
	}
	resID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid reservation_id: " + idParam})
		return
	}

	resp, err := h.billingService.GetReservationFolio(c.Request.Context(), resID)
	if err != nil {
		if errors.Is(err, billing.ErrReservationNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "NotFound", "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "InternalServerError", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetReservationPaymentStatus godoc
// @Summary      Poll checkout payment status
// @Description  [READ] Lightweight polling endpoint for the frontend checkout screen during the 15-minute hold window
// @Tags         Payments
// @Produce      json
// @Security     BearerAuth
// @Param        reservation_id path string true "Reservation UUID"
// @Success      200 {object} billing.ReservationPaymentStatusResponse "Payment order and reservation status"
// @Failure      400 {object} map[string]string "Invalid reservation UUID"
// @Failure      401 {object} map[string]string "Unauthorized"
// @Failure      404 {object} map[string]string "Reservation or payment order not found"
// @Router       /v1/reservations/{reservation_id}/payments/status [get]
func (h *PaymentHandler) GetReservationPaymentStatus(c *gin.Context) {
	idParam := c.Param("reservation_id")
	if idParam == "" {
		idParam = c.Param("id")
	}
	resID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid reservation_id: " + idParam})
		return
	}

	resp, err := h.billingService.GetReservationPaymentStatus(c.Request.Context(), resID)
	if err != nil {
		if errors.Is(err, billing.ErrReservationNotFound) || errors.Is(err, billing.ErrPaymentOrderNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "NotFound", "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "InternalServerError", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// ListPropertyPayments godoc
// @Summary      List and filter property payment ledger
// @Description  [READ] Paginated ledger listing for hotel accountants, filterable by status, bank_id, payment_method, PNR, and date range
// @Tags         Admin
// @Produce      json
// @Security     BearerAuth
// @Param        property_id path string true "Property UUID"
// @Param        status query string false "Payment Status filter (INITIATED, SETTLED, VOIDED, REFUNDED)"
// @Param        bank_id query string false "Bank ID filter (e.g. BANK_CBE, BANK_BOA)"
// @Param        payment_method query string false "Payment Method filter (DIRECT_BANK, CASH, POS)"
// @Param        pnr query string false "Booking PNR filter"
// @Param        reference_number query string false "Reference Number filter"
// @Param        page query int false "Page number (default: 1)"
// @Param        limit query int false "Page size limit (default: 20)"
// @Success      200 {object} billing.PaginatedPaymentsResponse "Paginated ledger records"
// @Failure      400 {object} map[string]string "Invalid property UUID"
// @Failure      401 {object} map[string]string "Unauthorized"
// @Router       /v1/admin/properties/{property_id}/payments [get]
func (h *PaymentHandler) ListPropertyPayments(c *gin.Context) {
	idParam := c.Param("property_id")
	propertyID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid property_id: " + idParam})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filter := billing.PropertyPaymentsFilter{
		PropertyID:      propertyID,
		Status:          c.Query("status"),
		BankID:          c.Query("bank_id"),
		PaymentMethod:   c.Query("payment_method"),
		PNR:             c.Query("pnr"),
		ReferenceNumber: c.Query("reference_number"),
		Page:            page,
		Limit:           limit,
	}

	if fromStr := c.Query("from_date"); fromStr != "" {
		if t, err := time.Parse("2006-01-02", fromStr); err == nil {
			filter.FromDate = &t
		}
	}
	if toStr := c.Query("to_date"); toStr != "" {
		if t, err := time.Parse("2006-01-02", toStr); err == nil {
			filter.ToDate = &t
		}
	}

	resp, err := h.billingService.ListPropertyPayments(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "InternalServerError", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// RecordManualPayment godoc
// @Summary      Record front-desk cash or POS payment
// @Description  [CREATE] Records manual counter cash or terminal POS settlement directly into the guest folio and confirms reservation
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        property_id path string true "Property UUID"
// @Param        request body billing.ManualPaymentRequest true "Manual payment settlement payload"
// @Success      201 {object} billing.ManualPaymentResponse "Manual payment recorded and reservation confirmed"
// @Failure      400 {object} map[string]string "Invalid payload"
// @Failure      401 {object} map[string]string "Unauthorized"
// @Failure      404 {object} map[string]string "Reservation not found"
// @Router       /v1/admin/properties/{property_id}/payments/manual [post]
func (h *PaymentHandler) RecordManualPayment(c *gin.Context) {
	idParam := c.Param("property_id")
	propertyID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid property_id: " + idParam})
		return
	}

	var req billing.ManualPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid manual payment request: " + err.Error()})
		return
	}

	resp, err := h.billingService.RecordManualPayment(c.Request.Context(), propertyID, req)
	if err != nil {
		switch {
		case errors.Is(err, billing.ErrReservationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "NotFound", "message": err.Error()})
		case errors.Is(err, billing.ErrInvalidPaymentMethod):
			c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "InternalServerError", "message": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// BankCallback godoc
// @Summary      Inbound bank credit webhook callback
// @Description  [INGEST] Direct host-to-host inbound webhook invoked by the bank upon guest transfer completion with paid amount, payer account, bank ID, and bank reference
// @Tags         Webhooks
// @Accept       json
// @Produce      json
// @Param        request body billing.BankCallbackRequest true "Inbound bank credit callback payload"
// @Success      200 {object} billing.BankCallbackResponse "Callback acknowledged and payment reconciled"
// @Failure      400 {object} map[string]string "Invalid webhook payload or amount mismatch"
// @Failure      422 {object} map[string]string "Unprocessable callback state or currency mismatch"
// @Router       /v1/webhooks/bank/credit [post]
func (h *PaymentHandler) BankCallback(c *gin.Context) {
	rawBody, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "BadRequest",
			"message": "Failed to read request body: " + err.Error(),
		})
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewBuffer(rawBody))

	var req billing.BankCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "BadRequest",
			"message": "Malformed bank callback payload: " + err.Error(),
		})
		return
	}

	resp, err := h.billingService.ProcessBankCallback(c.Request.Context(), req, rawBody)
	if err != nil {
		switch {
		case errors.Is(err, billing.ErrAmountMismatch),
			errors.Is(err, billing.ErrCurrencyMismatch),
			errors.Is(err, billing.ErrInvalidPaymentStatus):
			c.JSON(http.StatusUnprocessableEntity, gin.H{
				"error":   "UnprocessableEntity",
				"message": err.Error(),
			})
		case errors.Is(err, billing.ErrPaymentOrderNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "NotFound",
				"message": err.Error(),
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "InternalServerError",
				"message": err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, resp)
}

// HoldReservation godoc
// @Summary      Hold a room for booking
// @Description  Creates a room hold reservation with hold TTL prior to payment initiation
// @Tags         Reservations
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request body reservation.HoldReservationRequest true "Hold reservation payload"
// @Success      201 {object} reservation.HoldReservationResponse "Room successfully held"
// @Failure      400 {object} map[string]string "Invalid request payload"
// @Failure      401 {object} map[string]string "Missing or invalid authorization token"
// @Router       /v1/reservations/hold [post]
func (h *PaymentHandler) HoldReservation(c *gin.Context) {
	var req reservation.HoldReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "BadRequest",
			"message": "Invalid hold reservation request: " + err.Error(),
		})
		return
	}

	checkIn, err := time.Parse("2006-01-02", req.CheckInDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid check_in_date format (expected YYYY-MM-DD)"})
		return
	}

	checkOut, err := time.Parse("2006-01-02", req.CheckOutDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BadRequest", "message": "Invalid check_out_date format (expected YYYY-MM-DD)"})
		return
	}

	holdMins := req.HoldDurationMins
	if holdMins <= 0 {
		holdMins = 30
	}

	now := time.Now().UTC()
	currency := req.Currency
	if currency == "" {
		currency = "ETB"
	}

	res := &reservation.Reservation{
		ID:               uuid.New(),
		HotelID:          req.HotelID,
		HotelName:        req.HotelName,
		RoomID:           req.RoomID,
		RoomType:         req.RoomType,
		GuestName:        req.GuestName,
		GuestEmail:       req.GuestEmail,
		GuestPhone:       req.GuestPhone,
		StayNights:       req.StayNights,
		CheckInDate:      checkIn,
		CheckOutDate:     checkOut,
		TotalAmountMinor: req.TotalAmountMinor,
		Currency:         currency,
		Status:           reservation.StatusHeld,
		HoldExpiresAt:    now.Add(time.Duration(holdMins) * time.Minute),
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if err := h.reservationRepo.Create(c.Request.Context(), res); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "InternalServerError",
			"message": "Failed to hold reservation: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, reservation.HoldReservationResponse{
		ReservationID:    res.ID,
		HotelName:        res.HotelName,
		GuestName:        res.GuestName,
		StayNights:       res.StayNights,
		CheckInDate:      req.CheckInDate,
		CheckOutDate:     req.CheckOutDate,
		TotalAmountMinor: res.TotalAmountMinor,
		TotalAmount:      float64(res.TotalAmountMinor) / 100.0,
		Currency:         res.Currency,
		Status:           string(res.Status),
		HoldExpiresAt:    res.HoldExpiresAt,
	})
}
