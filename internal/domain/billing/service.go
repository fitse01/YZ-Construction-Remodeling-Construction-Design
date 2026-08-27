package billing

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math"
	"math/big"
	"strings"
	"time"

	"doki/internal/domain/reservation"

	"github.com/google/uuid"
)

// Service defines the complete business interface for direct bank payments, CRUD operations, folios, and ledger reconciliation.
type Service interface {
	InitiatePayment(ctx context.Context, req InitiatePaymentRequest) (*InitiatePaymentResponse, error)
	GetPaymentByID(ctx context.Context, paymentID uuid.UUID) (*PaymentOrderDetailsResponse, error)
	VoidPayment(ctx context.Context, paymentID uuid.UUID, req VoidPaymentRequest) (*VoidPaymentResponse, error)
	RefundPayment(ctx context.Context, paymentID uuid.UUID, req RefundPaymentRequest) (*RefundPaymentResponse, error)
	GetReservationFolio(ctx context.Context, reservationID uuid.UUID) (*ReservationFolioResponse, error)
	GetReservationPaymentStatus(ctx context.Context, reservationID uuid.UUID) (*ReservationPaymentStatusResponse, error)
	ListPropertyPayments(ctx context.Context, filter PropertyPaymentsFilter) (*PaginatedPaymentsResponse, error)
	RecordManualPayment(ctx context.Context, propertyID uuid.UUID, req ManualPaymentRequest) (*ManualPaymentResponse, error)
	ProcessBankCallback(ctx context.Context, req BankCallbackRequest, rawPayload []byte) (*BankCallbackResponse, error)
}

type service struct {
	paymentOrderRepo PaymentOrderRepository
	bankTxRepo       BankTransactionRepository
	reservationRepo  reservation.Repository
	txManager        TransactionManager
}

// NewService instantiates a production-ready billing and reconciliation engine.
func NewService(
	paymentOrderRepo PaymentOrderRepository,
	bankTxRepo BankTransactionRepository,
	reservationRepo reservation.Repository,
	txManager TransactionManager,
) Service {
	return &service{
		paymentOrderRepo: paymentOrderRepo,
		bankTxRepo:       bankTxRepo,
		reservationRepo:  reservationRepo,
		txManager:        txManager,
	}
}

// InitiatePayment generates a new host-to-host payment bill for a held reservation.
func (s *service) InitiatePayment(ctx context.Context, req InitiatePaymentRequest) (*InitiatePaymentResponse, error) {
	if req.ReservationID == uuid.Nil {
		return nil, fmt.Errorf("%w: reservation_id is required", ErrReservationNotFound)
	}

	// 1. Fetch reservation and verify status is HELD
	res, err := s.reservationRepo.GetByID(ctx, req.ReservationID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrReservationNotFound, err)
	}

	if res.Status != reservation.StatusHeld {
		return nil, fmt.Errorf("%w: current status is %s", ErrReservationNotHeld, res.Status)
	}

	now := time.Now().UTC()
	if now.After(res.HoldExpiresAt) {
		return nil, fmt.Errorf("%w: hold expired at %s", ErrReservationHoldExpired, res.HoldExpiresAt.Format(time.RFC3339))
	}

	// Check if an existing initiated order already exists and is unexpired
	existingOrder, err := s.paymentOrderRepo.GetByReservationID(ctx, req.ReservationID)
	if err == nil && existingOrder != nil {
		if existingOrder.Status == StatusSettled {
			return nil, ErrPaymentOrderAlreadySettled
		}
		if existingOrder.Status == StatusInitiated && now.Before(existingOrder.ExpiresAt) {
			return &InitiatePaymentResponse{
				PaymentOrderID:  existingOrder.ID,
				ReservationID:   existingOrder.ReservationID,
				PropertyID:      existingOrder.PropertyID,
				ReferenceNumber: existingOrder.ReferenceNumber,
				PNR:             existingOrder.PNR,
				HotelName:       existingOrder.HotelName,
				GuestName:       existingOrder.GuestName,
				StayNights:      existingOrder.StayNights,
				CheckInDate:     existingOrder.CheckInDate.Format("2006-01-02"),
				CheckOutDate:    existingOrder.CheckOutDate.Format("2006-01-02"),
				Amount:          float64(existingOrder.AmountMinor) / 100.0,
				AmountMinor:     existingOrder.AmountMinor,
				Currency:        existingOrder.Currency,
				PaymentStatus:   string(existingOrder.Status),
				PaymentMethod:   string(existingOrder.PaymentMethod),
				ExpiresAt:       existingOrder.ExpiresAt,
				CreatedAt:       existingOrder.CreatedAt,
			}, nil
		}
	}

	// 2. Generate Reference Number and PNR
	refNumber := GenerateReferenceNumber()
	pnr := GeneratePNR()

	stayNights := res.StayNights
	if stayNights <= 0 {
		stayNights = int(res.CheckOutDate.Sub(res.CheckInDate).Hours() / 24)
		if stayNights <= 0 {
			stayNights = 1
		}
	}

	currency := res.Currency
	if currency == "" {
		currency = "ETB"
	}

	order := &PaymentOrder{
		ID:              uuid.New(),
		ReservationID:   res.ID,
		PropertyID:      res.HotelID,
		ReferenceNumber: refNumber,
		PNR:             pnr,
		HotelName:       res.HotelName,
		GuestName:       res.GuestName,
		StayNights:      stayNights,
		CheckInDate:     res.CheckInDate,
		CheckOutDate:    res.CheckOutDate,
		AmountMinor:     res.TotalAmountMinor,
		Currency:        currency,
		Status:          StatusInitiated,
		PaymentMethod:   MethodDirectBank,
		CreatedAt:       now,
		ExpiresAt:       res.HoldExpiresAt,
	}

	if err := s.paymentOrderRepo.CreateOrder(ctx, nil, order); err != nil {
		return nil, fmt.Errorf("failed to persist payment order: %w", err)
	}

	return &InitiatePaymentResponse{
		PaymentOrderID:  order.ID,
		ReservationID:   order.ReservationID,
		PropertyID:      order.PropertyID,
		ReferenceNumber: order.ReferenceNumber,
		PNR:             order.PNR,
		HotelName:       order.HotelName,
		GuestName:       order.GuestName,
		StayNights:      order.StayNights,
		CheckInDate:     order.CheckInDate.Format("2006-01-02"),
		CheckOutDate:    order.CheckOutDate.Format("2006-01-02"),
		Amount:          float64(order.AmountMinor) / 100.0,
		AmountMinor:     order.AmountMinor,
		Currency:        order.Currency,
		PaymentStatus:   string(order.Status),
		PaymentMethod:   string(order.PaymentMethod),
		ExpiresAt:       order.ExpiresAt,
		CreatedAt:       order.CreatedAt,
	}, nil
}

// GetPaymentByID retrieves the complete payment order profile, payer account, bank reference, and ledger history.
func (s *service) GetPaymentByID(ctx context.Context, paymentID uuid.UUID) (*PaymentOrderDetailsResponse, error) {
	if paymentID == uuid.Nil {
		return nil, fmt.Errorf("%w: invalid payment_id", ErrPaymentOrderNotFound)
	}

	order, err := s.paymentOrderRepo.GetByID(ctx, paymentID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrPaymentOrderNotFound, err)
	}

	txs, err := s.bankTxRepo.ListTransactionsByPaymentOrderID(ctx, paymentID)
	if err != nil {
		txs = []BankTransaction{}
	}

	var (
		bankID        *string
		bankName      *string
		bankReference *string
		payerAccount  *string
		payerName     *string
		refundAmount  *float64
	)

	if order.RefundAmountMinor != nil {
		refVal := float64(*order.RefundAmountMinor) / 100.0
		refundAmount = &refVal
	}

	// Extract primary bank details from credit transaction if present
	for _, tx := range txs {
		if tx.TransactionType == TxTypeCredit || tx.TransactionType == TxTypeManualCash || tx.TransactionType == TxTypeManualPOS {
			if tx.BankID != "" {
				bankID = &tx.BankID
			}
			if tx.BankName != "" {
				bankName = &tx.BankName
			}
			if tx.BankReference != "" {
				bankReference = &tx.BankReference
			}
			if tx.PayerAccountNumber != "" {
				payerAccount = &tx.PayerAccountNumber
			}
			if tx.PayerName != "" {
				payerName = &tx.PayerName
			}
			break
		}
	}

	return &PaymentOrderDetailsResponse{
		PaymentOrderID:    order.ID,
		ReservationID:     order.ReservationID,
		PropertyID:        order.PropertyID,
		ReferenceNumber:   order.ReferenceNumber,
		PNR:               order.PNR,
		HotelName:         order.HotelName,
		GuestName:         order.GuestName,
		StayNights:        order.StayNights,
		CheckInDate:       order.CheckInDate.Format("2006-01-02"),
		CheckOutDate:      order.CheckOutDate.Format("2006-01-02"),
		Amount:            float64(order.AmountMinor) / 100.0,
		AmountMinor:       order.AmountMinor,
		Currency:          order.Currency,
		PaymentStatus:     string(order.Status),
		PaymentMethod:     string(order.PaymentMethod),
		ReceiptNumber:     order.ReceiptNumber,
		StaffID:           order.StaffID,
		BankID:            bankID,
		BankName:          bankName,
		BankReference:     bankReference,
		PayerAccount:      payerAccount,
		PayerName:         payerName,
		CreatedAt:         order.CreatedAt,
		ExpiresAt:         order.ExpiresAt,
		SettledAt:         order.SettledAt,
		VoidedAt:          order.VoidedAt,
		VoidReason:        order.VoidReason,
		RefundedAt:        order.RefundedAt,
		RefundAmountMinor: order.RefundAmountMinor,
		RefundAmount:      refundAmount,
		RefundReason:      order.RefundReason,
		Transactions:      txs,
	}, nil
}

// VoidPayment cancels an open, un-settled payment order if the guest changes payment method or cancels hold.
func (s *service) VoidPayment(ctx context.Context, paymentID uuid.UUID, req VoidPaymentRequest) (*VoidPaymentResponse, error) {
	if paymentID == uuid.Nil {
		return nil, fmt.Errorf("%w: invalid payment_id", ErrPaymentOrderNotFound)
	}

	order, err := s.paymentOrderRepo.GetByID(ctx, paymentID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrPaymentOrderNotFound, err)
	}

	if order.Status == StatusSettled || order.Status == StatusRefunded {
		return nil, fmt.Errorf("%w: settled or refunded orders cannot be voided, issue a refund instead", ErrPaymentOrderCannotBeVoided)
	}
	if order.Status == StatusVoided {
		return nil, fmt.Errorf("%w: order is already voided", ErrPaymentOrderCannotBeVoided)
	}

	now := time.Now().UTC()
	err = s.txManager.ExecuteInTx(ctx, func(tx any) error {
		if err := s.paymentOrderRepo.VoidOrder(ctx, tx, paymentID, now, req.Reason, req.StaffID); err != nil {
			return err
		}

		// Record void ledger transaction
		voidTx := &BankTransaction{
			ID:              uuid.New(),
			PaymentOrderID:  order.ID,
			TransactionType: TxTypeVoid,
			PaymentMethod:   order.PaymentMethod,
			PaidAmountMinor: 0,
			StaffID:         req.StaffID,
			Notes:           "Payment order voided: " + req.Reason,
			RawPayload:      json.RawMessage(fmt.Sprintf(`{"action":"VOID","reason":"%s"}`, req.Reason)),
			ReceivedAt:      now,
		}
		return s.bankTxRepo.CreateBankTransaction(ctx, tx, voidTx)
	})

	if err != nil {
		return nil, fmt.Errorf("failed to void payment order: %w", err)
	}

	return &VoidPaymentResponse{
		PaymentOrderID:  order.ID,
		ReferenceNumber: order.ReferenceNumber,
		PNR:             order.PNR,
		Status:          string(StatusVoided),
		VoidedAt:        now,
		Reason:          req.Reason,
	}, nil
}

// RefundPayment issues an accounting credit and marks the transaction as REFUNDED, logging staff ID and justification.
func (s *service) RefundPayment(ctx context.Context, paymentID uuid.UUID, req RefundPaymentRequest) (*RefundPaymentResponse, error) {
	if paymentID == uuid.Nil {
		return nil, fmt.Errorf("%w: invalid payment_id", ErrPaymentOrderNotFound)
	}

	order, err := s.paymentOrderRepo.GetByID(ctx, paymentID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrPaymentOrderNotFound, err)
	}

	if order.Status != StatusSettled {
		return nil, fmt.Errorf("%w: current status is %s", ErrPaymentOrderCannotBeRefund, order.Status)
	}

	if req.RefundAmountMinor <= 0 || req.RefundAmountMinor > order.AmountMinor {
		return nil, fmt.Errorf("%w: refund of %d exceeds settled amount %d",
			ErrInvalidRefundAmount, req.RefundAmountMinor, order.AmountMinor)
	}

	now := time.Now().UTC()
	err = s.txManager.ExecuteInTx(ctx, func(tx any) error {
		// Update payment order to REFUNDED
		if err := s.paymentOrderRepo.RefundOrder(ctx, tx, paymentID, now, req.RefundAmountMinor, req.Reason, req.StaffID); err != nil {
			return err
		}

		// Record negative ledger refund entry
		refundTx := &BankTransaction{
			ID:              uuid.New(),
			PaymentOrderID:  order.ID,
			TransactionType: TxTypeRefund,
			PaymentMethod:   order.PaymentMethod,
			PaidAmountMinor: -req.RefundAmountMinor,
			StaffID:         req.StaffID,
			Notes:           "Refund issued: " + req.Reason,
			RawPayload:      json.RawMessage(fmt.Sprintf(`{"action":"REFUND","amount_minor":%d,"reason":"%s"}`, req.RefundAmountMinor, req.Reason)),
			ReceivedAt:      now,
		}
		if err := s.bankTxRepo.CreateBankTransaction(ctx, tx, refundTx); err != nil {
			return err
		}

		// Optionally update reservation status if full refund
		if req.RefundAmountMinor == order.AmountMinor {
			_ = s.reservationRepo.TransitionReservationStatus(
				ctx,
				tx,
				order.ReservationID,
				string(reservation.StatusConfirmed),
				string(reservation.StatusCancelled),
				map[string]any{"refund_id": refundTx.ID},
				"Cancelled & Refunded: "+req.Reason,
			)
		}
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to process refund: %w", err)
	}

	return &RefundPaymentResponse{
		PaymentOrderID:    order.ID,
		ReservationID:     order.ReservationID,
		ReferenceNumber:   order.ReferenceNumber,
		Status:            string(StatusRefunded),
		RefundAmountMinor: req.RefundAmountMinor,
		RefundAmount:      float64(req.RefundAmountMinor) / 100.0,
		Currency:          order.Currency,
		RefundedAt:        now,
		Reason:            req.Reason,
	}, nil
}

// GetReservationFolio returns the complete financial folio (total stay cost, paid amounts, balance, and transaction history).
func (s *service) GetReservationFolio(ctx context.Context, reservationID uuid.UUID) (*ReservationFolioResponse, error) {
	if reservationID == uuid.Nil {
		return nil, fmt.Errorf("%w: invalid reservation_id", ErrReservationNotFound)
	}

	res, err := s.reservationRepo.GetByID(ctx, reservationID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrReservationNotFound, err)
	}

	orders, err := s.paymentOrderRepo.ListOrdersByReservationID(ctx, reservationID)
	if err != nil {
		orders = []PaymentOrder{}
	}

	txs, err := s.bankTxRepo.ListTransactionsByReservationID(ctx, reservationID)
	if err != nil {
		txs = []BankTransaction{}
	}

	var totalPaidMinor int64 = 0
	for _, tx := range txs {
		if tx.TransactionType == TxTypeCredit || tx.TransactionType == TxTypeManualCash || tx.TransactionType == TxTypeManualPOS {
			totalPaidMinor += tx.PaidAmountMinor
		} else if tx.TransactionType == TxTypeRefund {
			totalPaidMinor += tx.PaidAmountMinor // Already negative
		}
	}

	outstandingMinor := res.TotalAmountMinor - totalPaidMinor
	if outstandingMinor < 0 {
		outstandingMinor = 0
	}

	return &ReservationFolioResponse{
		ReservationID:           res.ID,
		HotelName:               res.HotelName,
		GuestName:               res.GuestName,
		TotalStayCostMinor:      res.TotalAmountMinor,
		TotalStayCost:           float64(res.TotalAmountMinor) / 100.0,
		TotalPaidMinor:          totalPaidMinor,
		TotalPaid:               float64(totalPaidMinor) / 100.0,
		OutstandingBalanceMinor: outstandingMinor,
		OutstandingBalance:      float64(outstandingMinor) / 100.0,
		Currency:                res.Currency,
		ReservationStatus:       string(res.Status),
		Orders:                  orders,
		Transactions:            txs,
	}, nil
}

// GetReservationPaymentStatus is the lightweight checkout polling endpoint during the 15-minute hold window.
func (s *service) GetReservationPaymentStatus(ctx context.Context, reservationID uuid.UUID) (*ReservationPaymentStatusResponse, error) {
	if reservationID == uuid.Nil {
		return nil, fmt.Errorf("%w: invalid reservation ID", ErrReservationNotFound)
	}

	res, err := s.reservationRepo.GetByID(ctx, reservationID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrReservationNotFound, err)
	}

	order, err := s.paymentOrderRepo.GetByReservationID(ctx, reservationID)
	if err != nil || order == nil {
		return nil, fmt.Errorf("%w for reservation %s", ErrPaymentOrderNotFound, reservationID)
	}

	resp := &ReservationPaymentStatusResponse{
		ReservationID:     res.ID,
		PaymentOrderID:    order.ID,
		ReferenceNumber:   order.ReferenceNumber,
		PNR:               order.PNR,
		Amount:            float64(order.AmountMinor) / 100.0,
		AmountMinor:       order.AmountMinor,
		Currency:          order.Currency,
		PaymentStatus:     string(order.Status),
		ReservationStatus: string(res.Status),
		ExpiresAt:         order.ExpiresAt,
		SettledAt:         order.SettledAt,
	}

	if order.Status == StatusSettled {
		bankTx, err := s.bankTxRepo.GetByPaymentOrderID(ctx, order.ID)
		if err == nil && bankTx != nil {
			resp.BankID = &bankTx.BankID
			resp.BankName = &bankTx.BankName
			resp.BankReference = &bankTx.BankReference
		}
	}

	return resp, nil
}

// ListPropertyPayments retrieves paginated payments for hotel accountants, filterable by status, bank, payment method, or date range.
func (s *service) ListPropertyPayments(ctx context.Context, filter PropertyPaymentsFilter) (*PaginatedPaymentsResponse, error) {
	if filter.PropertyID == uuid.Nil {
		return nil, fmt.Errorf("property_id is required")
	}
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 20
	}

	orders, total, err := s.paymentOrderRepo.ListByProperty(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list property payments: %w", err)
	}

	data := make([]PaymentOrderDetailsResponse, 0, len(orders))
	for _, order := range orders {
		txs, _ := s.bankTxRepo.ListTransactionsByPaymentOrderID(ctx, order.ID)
		var (
			bankID        *string
			bankName      *string
			bankReference *string
			payerAccount  *string
			payerName     *string
			refundAmount  *float64
		)
		if order.RefundAmountMinor != nil {
			rVal := float64(*order.RefundAmountMinor) / 100.0
			refundAmount = &rVal
		}
		for _, tx := range txs {
			if tx.BankID != "" {
				bankID = &tx.BankID
			}
			if tx.BankName != "" {
				bankName = &tx.BankName
			}
			if tx.BankReference != "" {
				bankReference = &tx.BankReference
			}
			if tx.PayerAccountNumber != "" {
				payerAccount = &tx.PayerAccountNumber
			}
			if tx.PayerName != "" {
				payerName = &tx.PayerName
			}
		}

		data = append(data, PaymentOrderDetailsResponse{
			PaymentOrderID:    order.ID,
			ReservationID:     order.ReservationID,
			PropertyID:        order.PropertyID,
			ReferenceNumber:   order.ReferenceNumber,
			PNR:               order.PNR,
			HotelName:         order.HotelName,
			GuestName:         order.GuestName,
			StayNights:        order.StayNights,
			CheckInDate:       order.CheckInDate.Format("2006-01-02"),
			CheckOutDate:      order.CheckOutDate.Format("2006-01-02"),
			Amount:            float64(order.AmountMinor) / 100.0,
			AmountMinor:       order.AmountMinor,
			Currency:          order.Currency,
			PaymentStatus:     string(order.Status),
			PaymentMethod:     string(order.PaymentMethod),
			ReceiptNumber:     order.ReceiptNumber,
			StaffID:           order.StaffID,
			BankID:            bankID,
			BankName:          bankName,
			BankReference:     bankReference,
			PayerAccount:      payerAccount,
			PayerName:         payerName,
			CreatedAt:         order.CreatedAt,
			ExpiresAt:         order.ExpiresAt,
			SettledAt:         order.SettledAt,
			VoidedAt:          order.VoidedAt,
			VoidReason:        order.VoidReason,
			RefundedAt:        order.RefundedAt,
			RefundAmountMinor: order.RefundAmountMinor,
			RefundAmount:      refundAmount,
			RefundReason:      order.RefundReason,
			Transactions:      txs,
		})
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &PaginatedPaymentsResponse{
		Data:       data,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

// RecordManualPayment records front-desk cash or terminal POS counter settlement directly into guest folio.
func (s *service) RecordManualPayment(ctx context.Context, propertyID uuid.UUID, req ManualPaymentRequest) (*ManualPaymentResponse, error) {
	if propertyID == uuid.Nil {
		return nil, fmt.Errorf("property_id is required")
	}

	res, err := s.reservationRepo.GetByID(ctx, req.ReservationID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrReservationNotFound, err)
	}

	method := PaymentMethod(strings.ToUpper(strings.TrimSpace(req.PaymentMethod)))
	if method != MethodCash && method != MethodPOS && method != MethodCard && method != MethodManual {
		return nil, fmt.Errorf("%w: allowed methods are CASH, POS, CARD, MANUAL", ErrInvalidPaymentMethod)
	}

	now := time.Now().UTC()
	refNumber := GenerateReferenceNumber()
	pnr := GeneratePNR()

	var paymentOrder *PaymentOrder

	err = s.txManager.ExecuteInTx(ctx, func(tx any) error {
		// Check if an existing initiated order exists for this reservation
		existingOrder, err := s.paymentOrderRepo.GetByReservationID(ctx, req.ReservationID)
		if err == nil && existingOrder != nil && existingOrder.Status == StatusInitiated {
			paymentOrder = existingOrder
			paymentOrder.PaymentMethod = method
			paymentOrder.ReceiptNumber = req.ReceiptNumber
			paymentOrder.StaffID = req.StaffID
			paymentOrder.SettledAt = &now
			paymentOrder.Status = StatusSettled
			if err := s.paymentOrderRepo.UpdateStatus(ctx, tx, paymentOrder.ID, StatusSettled, &now); err != nil {
				return err
			}
		} else {
			// Create a settled manual order
			paymentOrder = &PaymentOrder{
				ID:              uuid.New(),
				ReservationID:   res.ID,
				PropertyID:      propertyID,
				ReferenceNumber: refNumber,
				PNR:             pnr,
				HotelName:       res.HotelName,
				GuestName:       res.GuestName,
				StayNights:      res.StayNights,
				CheckInDate:     res.CheckInDate,
				CheckOutDate:    res.CheckOutDate,
				AmountMinor:     req.AmountMinor,
				Currency:        res.Currency,
				Status:          StatusSettled,
				PaymentMethod:   method,
				ReceiptNumber:   req.ReceiptNumber,
				StaffID:         req.StaffID,
				CreatedAt:       now,
				ExpiresAt:       now.Add(24 * time.Hour),
				SettledAt:       &now,
			}
			if err := s.paymentOrderRepo.CreateOrder(ctx, tx, paymentOrder); err != nil {
				return err
			}
		}

		// Record ledger transaction
		txType := TxTypeManualCash
		if method == MethodPOS || method == MethodCard {
			txType = TxTypeManualPOS
		}

		ledgerTx := &BankTransaction{
			ID:              uuid.New(),
			PaymentOrderID:  paymentOrder.ID,
			TransactionType: txType,
			PaymentMethod:   method,
			PaidAmountMinor: req.AmountMinor,
			ReceiptNumber:   req.ReceiptNumber,
			StaffID:         req.StaffID,
			Notes:           req.Notes,
			RawPayload:      json.RawMessage(fmt.Sprintf(`{"action":"MANUAL_SETTLEMENT","method":"%s","receipt":"%s"}`, method, req.ReceiptNumber)),
			ReceivedAt:      now,
		}

		if err := s.bankTxRepo.CreateBankTransaction(ctx, tx, ledgerTx); err != nil {
			return err
		}

		// Transition reservation from HELD to CONFIRMED
		reason := fmt.Sprintf("Settled via front-desk manual payment (%s), receipt: %s", method, req.ReceiptNumber)
		return s.reservationRepo.TransitionReservationStatus(
			ctx,
			tx,
			res.ID,
			string(reservation.StatusHeld),
			string(reservation.StatusConfirmed),
			map[string]any{
				"payment_order_id": paymentOrder.ID,
				"receipt_number":   req.ReceiptNumber,
				"payment_method":   method,
			},
			reason,
		)
	})

	if err != nil {
		return nil, fmt.Errorf("failed to record manual front-desk payment: %w", err)
	}

	return &ManualPaymentResponse{
		PaymentOrderID:    paymentOrder.ID,
		ReservationID:     paymentOrder.ReservationID,
		PropertyID:        propertyID,
		ReferenceNumber:   paymentOrder.ReferenceNumber,
		PNR:               paymentOrder.PNR,
		AmountMinor:       req.AmountMinor,
		Amount:            float64(req.AmountMinor) / 100.0,
		Currency:          res.Currency,
		PaymentMethod:     string(method),
		ReceiptNumber:     req.ReceiptNumber,
		PaymentStatus:     string(StatusSettled),
		ReservationStatus: string(reservation.StatusConfirmed),
		SettledAt:         now,
	}, nil
}

// ProcessBankCallback handles the bank webhook callback, reconciles payment, avoids replays, and confirms reservation.
func (s *service) ProcessBankCallback(ctx context.Context, req BankCallbackRequest, rawPayload []byte) (*BankCallbackResponse, error) {
	now := time.Now().UTC()

	// 1. Validate payment status reported by bank
	if !strings.EqualFold(req.PaymentStatus, "SUCCESS") {
		return nil, fmt.Errorf("%w: bank reported status '%s'", ErrInvalidPaymentStatus, req.PaymentStatus)
	}

	// 2. Idempotency Check: Verify if bank_reference already exists
	existingTx, err := s.bankTxRepo.GetByBankReference(ctx, req.BankReference)
	if err == nil && existingTx != nil {
		return &BankCallbackResponse{
			Status:          "ACKNOWLEDGED",
			AcknowledgedAt:  now,
			ReferenceNumber: req.ReferenceNumber,
			Message:         "Duplicate transaction already processed and ledgered",
		}, nil
	}

	// 3. Atomically reconcile within database transaction
	var confirmedOrder *PaymentOrder

	err = s.txManager.ExecuteInTx(ctx, func(tx any) error {
		// Double check inside tx to prevent concurrent race conditions
		innerExistingTx, err := s.bankTxRepo.GetByBankReference(ctx, req.BankReference)
		if err == nil && innerExistingTx != nil {
			return nil
		}

		// Lock payment order with SELECT ... FOR UPDATE
		order, err := s.paymentOrderRepo.GetByReferenceForUpdate(ctx, tx, req.ReferenceNumber)
		if err != nil {
			if req.PNR != "" {
				order, err = s.paymentOrderRepo.GetByPNR(ctx, req.PNR)
			}
			if err != nil || order == nil {
				return fmt.Errorf("%w: ref '%s'", ErrPaymentOrderNotFound, req.ReferenceNumber)
			}
		}

		if order.Status == StatusSettled {
			confirmedOrder = order
			return nil
		}

		paidAmountMinor, err := req.GetPaidAmountMinor()
		if err != nil {
			return fmt.Errorf("%w: %v", ErrAmountMismatch, err)
		}

		if paidAmountMinor != order.AmountMinor {
			return fmt.Errorf("%w: received %d minor units, expected %d minor units",
				ErrAmountMismatch, paidAmountMinor, order.AmountMinor)
		}

		if req.Currency != "" && !strings.EqualFold(req.Currency, order.Currency) {
			return fmt.Errorf("%w: received %s, expected %s",
				ErrCurrencyMismatch, req.Currency, order.Currency)
		}

		if len(rawPayload) == 0 {
			rawBytes, _ := json.Marshal(req)
			rawPayload = rawBytes
		}

		// 4. Insert record into billing.bank_transactions
		bankTx := &BankTransaction{
			ID:                 uuid.New(),
			PaymentOrderID:     order.ID,
			TransactionType:    TxTypeCredit,
			PaymentMethod:      MethodDirectBank,
			BankID:             req.BankID,
			BankName:           req.BankName,
			BankReference:      req.BankReference,
			PaidAmountMinor:    paidAmountMinor,
			PayerAccountNumber: req.PayerAccountNumber,
			PayerName:          req.PayerName,
			RawPayload:         rawPayload,
			ReceivedAt:         now,
		}

		if err := s.bankTxRepo.CreateBankTransaction(ctx, tx, bankTx); err != nil {
			return fmt.Errorf("failed to record bank transaction: %w", err)
		}

		// 5. Update payment order status to SETTLED
		settledAt := now
		if err := s.paymentOrderRepo.UpdateStatus(ctx, tx, order.ID, StatusSettled, &settledAt); err != nil {
			return fmt.Errorf("failed to update payment order to settled: %w", err)
		}

		// 6. Transition reservation status from HELD to CONFIRMED
		reason := fmt.Sprintf("Settled via bank reference: %s (%s)", req.BankReference, req.BankName)
		metadata := map[string]any{
			"payment_order_id": order.ID,
			"reference_number": order.ReferenceNumber,
			"pnr":              order.PNR,
			"bank_reference":   req.BankReference,
			"bank_id":          req.BankID,
			"paid_amount":      paidAmountMinor,
		}

		if err := s.reservationRepo.TransitionReservationStatus(
			ctx,
			tx,
			order.ReservationID,
			string(reservation.StatusHeld),
			string(reservation.StatusConfirmed),
			metadata,
			reason,
		); err != nil {
			return fmt.Errorf("failed to transition reservation to CONFIRMED: %w", err)
		}

		confirmedOrder = order
		return nil
	})

	if err != nil {
		return nil, err
	}

	ref := req.ReferenceNumber
	if confirmedOrder != nil && confirmedOrder.ReferenceNumber != "" {
		ref = confirmedOrder.ReferenceNumber
	}

	return &BankCallbackResponse{
		Status:          "ACKNOWLEDGED",
		AcknowledgedAt:  now,
		ReferenceNumber: ref,
		Message:         "Payment successfully reconciled and reservation confirmed",
	}, nil
}

// GenerateReferenceNumber generates a cryptographically random DOKI payment reference (e.g. DOKI-PAY-2026-X8F29K).
func GenerateReferenceNumber() string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	year := time.Now().Year()
	b := make([]byte, 6)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		b[i] = charset[n.Int64()]
	}
	return fmt.Sprintf("DOKI-PAY-%d-%s", year, string(b))
}

// GeneratePNR generates an unambiguous 6-character alphanumeric booking PNR (e.g. DK8F2X).
func GeneratePNR() string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 6)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		b[i] = charset[n.Int64()]
	}
	return string(b)
}
