package e2e_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	internalHttp "doki/internal/adapter/http"
	v1 "doki/internal/adapter/http/v1"
	"doki/internal/adapter/repository/memory"
	"doki/internal/domain/billing"
	"doki/internal/domain/reservation"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func setupTestServer() *gin.Engine {
	gin.SetMode(gin.TestMode)

	resRepo := memory.NewReservationRepo()
	billingRepo := memory.NewBillingRepo()
	billingService := billing.NewService(billingRepo, billingRepo, resRepo, billingRepo)
	paymentHandler := v1.NewPaymentHandler(billingService, resRepo)

	return internalHttp.SetupRouter(internalHttp.RouterConfig{
		PaymentHandler: paymentHandler,
		JWTSecret:      "test-secret-key",
	})
}

func TestE2E_CompletePaymentCRUDAndLifecycle(t *testing.T) {
	router := setupTestServer()
	authHeader := "Bearer test-jwt-token"
	propertyID := uuid.New()

	// =========================================================================
	// 1. CREATE HOLD (POST /v1/reservations/hold)
	// =========================================================================
	holdReq := reservation.HoldReservationRequest{
		HotelID:          propertyID,
		HotelName:        "Skylight Hotel Addis",
		RoomID:           uuid.New(),
		RoomType:         "Executive Suite",
		GuestName:        "Bethlehem Tadesse",
		GuestEmail:       "bethlehem@example.com",
		GuestPhone:       "+251912345678",
		StayNights:       2,
		CheckInDate:      "2026-09-10",
		CheckOutDate:     "2026-09-12",
		TotalAmountMinor: 380000,
		Currency:         "ETB",
		HoldDurationMins: 45,
	}

	holdBody, _ := json.Marshal(holdReq)
	req1 := httptest.NewRequest(http.MethodPost, "/v1/reservations/hold", bytes.NewReader(holdBody))
	req1.Header.Set("Content-Type", "application/json")
	req1.Header.Set("Authorization", authHeader)
	rec1 := httptest.NewRecorder()
	router.ServeHTTP(rec1, req1)

	if rec1.Code != http.StatusCreated {
		t.Fatalf("1. Hold Failed: %d %s", rec1.Code, rec1.Body.String())
	}
	var holdResp reservation.HoldReservationResponse
	_ = json.Unmarshal(rec1.Body.Bytes(), &holdResp)
	t.Logf("✅ 1. Room Hold Created: %s", holdResp.ReservationID)

	// =========================================================================
	// 2. INITIATE PAYMENT (POST /v1/payments/initiate)
	// =========================================================================
	initReq := billing.InitiatePaymentRequest{ReservationID: holdResp.ReservationID}
	initBody, _ := json.Marshal(initReq)
	req2 := httptest.NewRequest(http.MethodPost, "/v1/payments/initiate", bytes.NewReader(initBody))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", authHeader)
	rec2 := httptest.NewRecorder()
	router.ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusCreated {
		t.Fatalf("2. Initiate Failed: %d %s", rec2.Code, rec2.Body.String())
	}
	var initResp billing.InitiatePaymentResponse
	_ = json.Unmarshal(rec2.Body.Bytes(), &initResp)
	t.Logf("✅ 2. Payment Initiated: ID=%s, Ref=%s, PNR=%s", initResp.PaymentOrderID, initResp.ReferenceNumber, initResp.PNR)

	// =========================================================================
	// 3. READ SINGLE PAYMENT ORDER (GET /v1/payments/{payment_id})
	// =========================================================================
	req3 := httptest.NewRequest(http.MethodGet, "/v1/payments/"+initResp.PaymentOrderID.String(), nil)
	req3.Header.Set("Authorization", authHeader)
	rec3 := httptest.NewRecorder()
	router.ServeHTTP(rec3, req3)

	if rec3.Code != http.StatusOK {
		t.Fatalf("3. Read Payment Failed: %d %s", rec3.Code, rec3.Body.String())
	}
	var detailsResp billing.PaymentOrderDetailsResponse
	_ = json.Unmarshal(rec3.Body.Bytes(), &detailsResp)
	if detailsResp.PaymentStatus != "INITIATED" {
		t.Fatalf("3. Expected INITIATED, got %s", detailsResp.PaymentStatus)
	}
	t.Logf("✅ 3. Read Payment Profile Verified: %s", detailsResp.PaymentOrderID)

	// =========================================================================
	// 4. INGEST BANK WEBHOOK (POST /v1/webhooks/bank/credit)
	// =========================================================================
	bankRef := "CBE_FT_20260901_889911"
	callbackReq := billing.BankCallbackRequest{
		EventType:          "PAYMENT_RECEIVED",
		BankID:             "BANK_CBE",
		BankName:           "Commercial Bank of Ethiopia",
		BankReference:      bankRef,
		ReferenceNumber:    initResp.ReferenceNumber,
		PNR:                initResp.PNR,
		PaidAmount:         380000,
		Currency:           "ETB",
		PayerAccountNumber: "1000987654321",
		PayerName:          "Bethlehem Tadesse",
		PaymentStatus:      "SUCCESS",
		PaidAt:             time.Now().UTC(),
	}

	callbackBody, _ := json.Marshal(callbackReq)
	req4 := httptest.NewRequest(http.MethodPost, "/v1/webhooks/bank/credit", bytes.NewReader(callbackBody))
	req4.Header.Set("Content-Type", "application/json")
	rec4 := httptest.NewRecorder()
	router.ServeHTTP(rec4, req4)

	if rec4.Code != http.StatusOK {
		t.Fatalf("4. Bank Webhook Failed: %d %s", rec4.Code, rec4.Body.String())
	}
	t.Logf("✅ 4. Bank Callback Settled and Reconciled")

	// =========================================================================
	// 5. POLL CHECKOUT STATUS (GET /v1/reservations/{reservation_id}/payments/status)
	// =========================================================================
	req5 := httptest.NewRequest(http.MethodGet, "/v1/reservations/"+holdResp.ReservationID.String()+"/payments/status", nil)
	req5.Header.Set("Authorization", authHeader)
	rec5 := httptest.NewRecorder()
	router.ServeHTTP(rec5, req5)

	if rec5.Code != http.StatusOK {
		t.Fatalf("5. Polling Status Failed: %d %s", rec5.Code, rec5.Body.String())
	}
	var pollResp billing.ReservationPaymentStatusResponse
	_ = json.Unmarshal(rec5.Body.Bytes(), &pollResp)
	if pollResp.PaymentStatus != "SETTLED" || pollResp.ReservationStatus != "CONFIRMED" {
		t.Fatalf("5. Expected SETTLED/CONFIRMED, got %s/%s", pollResp.PaymentStatus, pollResp.ReservationStatus)
	}
	t.Logf("✅ 5. Polling Checkout Status Verified: %s / %s", pollResp.PaymentStatus, pollResp.ReservationStatus)

	// =========================================================================
	// 6. READ FINANCIAL FOLIO (GET /v1/reservations/{reservation_id}/payments)
	// =========================================================================
	req6 := httptest.NewRequest(http.MethodGet, "/v1/reservations/"+holdResp.ReservationID.String()+"/payments", nil)
	req6.Header.Set("Authorization", authHeader)
	rec6 := httptest.NewRecorder()
	router.ServeHTTP(rec6, req6)

	if rec6.Code != http.StatusOK {
		t.Fatalf("6. Folio Failed: %d %s", rec6.Code, rec6.Body.String())
	}
	var folioResp billing.ReservationFolioResponse
	_ = json.Unmarshal(rec6.Body.Bytes(), &folioResp)
	if folioResp.TotalPaidMinor != 380000 || folioResp.OutstandingBalanceMinor != 0 {
		t.Fatalf("6. Folio amounts incorrect. Paid: %d, Balance: %d", folioResp.TotalPaidMinor, folioResp.OutstandingBalanceMinor)
	}
	t.Logf("✅ 6. Guest Financial Folio Verified: StayCost=%.2f, Paid=%.2f, Balance=%.2f",
		folioResp.TotalStayCost, folioResp.TotalPaid, folioResp.OutstandingBalance)

	// =========================================================================
	// 7. ADMIN LIST PROPERTY PAYMENTS (GET /v1/admin/properties/{property_id}/payments)
	// =========================================================================
	req7 := httptest.NewRequest(http.MethodGet, "/v1/admin/properties/"+propertyID.String()+"/payments?page=1&limit=10", nil)
	req7.Header.Set("Authorization", authHeader)
	rec7 := httptest.NewRecorder()
	router.ServeHTTP(rec7, req7)

	if rec7.Code != http.StatusOK {
		t.Fatalf("7. Property Payments Failed: %d %s", rec7.Code, rec7.Body.String())
	}
	var propResp billing.PaginatedPaymentsResponse
	_ = json.Unmarshal(rec7.Body.Bytes(), &propResp)
	if propResp.Total < 1 || len(propResp.Data) < 1 {
		t.Fatalf("7. Expected at least 1 payment record for property, got %d", propResp.Total)
	}
	t.Logf("✅ 7. Admin Property Payments List Verified: %d records found", propResp.Total)

	// =========================================================================
	// 8. REFUND PAYMENT (POST /v1/payments/{payment_id}/refund)
	// =========================================================================
	staffID := uuid.New()
	refundReq := billing.RefundPaymentRequest{
		RefundAmountMinor: 380000,
		Reason:            "Guest requested cancellation within refund policy",
		StaffID:           &staffID,
	}
	refundBody, _ := json.Marshal(refundReq)
	req8 := httptest.NewRequest(http.MethodPost, "/v1/payments/"+initResp.PaymentOrderID.String()+"/refund", bytes.NewReader(refundBody))
	req8.Header.Set("Content-Type", "application/json")
	req8.Header.Set("Authorization", authHeader)
	rec8 := httptest.NewRecorder()
	router.ServeHTTP(rec8, req8)

	if rec8.Code != http.StatusOK {
		t.Fatalf("8. Refund Failed: %d %s", rec8.Code, rec8.Body.String())
	}
	var refundResp billing.RefundPaymentResponse
	_ = json.Unmarshal(rec8.Body.Bytes(), &refundResp)
	if refundResp.Status != "REFUNDED" || refundResp.RefundAmountMinor != 380000 {
		t.Fatalf("8. Refund response invalid: %s / %d", refundResp.Status, refundResp.RefundAmountMinor)
	}
	t.Logf("✅ 8. Payment Refunded Successfully: %.2f %s", refundResp.RefundAmount, refundResp.Currency)
}

func TestE2E_VoidUnpaidPaymentOrder(t *testing.T) {
	router := setupTestServer()
	authHeader := "Bearer test-jwt-token"

	// 1. Hold
	holdReq := reservation.HoldReservationRequest{
		HotelID:          uuid.New(),
		HotelName:        "Kuriftu Resort Bishoftu",
		RoomID:           uuid.New(),
		RoomType:         "Lakeview Villa",
		GuestName:        "Yared Bekele",
		GuestEmail:       "yared@example.com",
		StayNights:       1,
		CheckInDate:      "2026-09-15",
		CheckOutDate:     "2026-09-16",
		TotalAmountMinor: 500000,
		Currency:         "ETB",
		HoldDurationMins: 30,
	}
	holdBody, _ := json.Marshal(holdReq)
	req1 := httptest.NewRequest(http.MethodPost, "/v1/reservations/hold", bytes.NewReader(holdBody))
	req1.Header.Set("Content-Type", "application/json")
	req1.Header.Set("Authorization", authHeader)
	rec1 := httptest.NewRecorder()
	router.ServeHTTP(rec1, req1)

	var holdResp reservation.HoldReservationResponse
	_ = json.Unmarshal(rec1.Body.Bytes(), &holdResp)

	// 2. Initiate
	initReq := billing.InitiatePaymentRequest{ReservationID: holdResp.ReservationID}
	initBody, _ := json.Marshal(initReq)
	req2 := httptest.NewRequest(http.MethodPost, "/v1/payments/initiate", bytes.NewReader(initBody))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", authHeader)
	rec2 := httptest.NewRecorder()
	router.ServeHTTP(rec2, req2)

	var initResp billing.InitiatePaymentResponse
	_ = json.Unmarshal(rec2.Body.Bytes(), &initResp)

	// 3. Void
	voidReq := billing.VoidPaymentRequest{
		Reason: "Guest cancelled payment initiation",
	}
	voidBody, _ := json.Marshal(voidReq)
	req3 := httptest.NewRequest(http.MethodPost, "/v1/payments/"+initResp.PaymentOrderID.String()+"/void", bytes.NewReader(voidBody))
	req3.Header.Set("Content-Type", "application/json")
	req3.Header.Set("Authorization", authHeader)
	rec3 := httptest.NewRecorder()
	router.ServeHTTP(rec3, req3)

	if rec3.Code != http.StatusOK {
		t.Fatalf("Void failed: %d %s", rec3.Code, rec3.Body.String())
	}
	var voidResp billing.VoidPaymentResponse
	_ = json.Unmarshal(rec3.Body.Bytes(), &voidResp)
	if voidResp.Status != "VOIDED" {
		t.Fatalf("Expected VOIDED, got %s", voidResp.Status)
	}
	t.Log("✅ Void Payment Order Verified")
}

func TestE2E_FrontDeskManualCashPayment(t *testing.T) {
	router := setupTestServer()
	authHeader := "Bearer test-jwt-token"
	propertyID := uuid.New()

	// 1. Hold
	holdReq := reservation.HoldReservationRequest{
		HotelID:          propertyID,
		HotelName:        "Haile Resort Hawassa",
		RoomID:           uuid.New(),
		RoomType:         "Standard Room",
		GuestName:        "Dawit Yohannes",
		GuestEmail:       "dawit@example.com",
		StayNights:       1,
		CheckInDate:      "2026-09-20",
		CheckOutDate:     "2026-09-21",
		TotalAmountMinor: 250000,
		Currency:         "ETB",
		HoldDurationMins: 30,
	}
	holdBody, _ := json.Marshal(holdReq)
	req1 := httptest.NewRequest(http.MethodPost, "/v1/reservations/hold", bytes.NewReader(holdBody))
	req1.Header.Set("Content-Type", "application/json")
	req1.Header.Set("Authorization", authHeader)
	rec1 := httptest.NewRecorder()
	router.ServeHTTP(rec1, req1)

	var holdResp reservation.HoldReservationResponse
	_ = json.Unmarshal(rec1.Body.Bytes(), &holdResp)

	// 2. Manual Front-Desk Cash Settlement (POST /v1/admin/properties/{property_id}/payments/manual)
	staffID := uuid.New()
	manualReq := billing.ManualPaymentRequest{
		ReservationID: holdResp.ReservationID,
		AmountMinor:   250000,
		PaymentMethod: "CASH",
		ReceiptNumber: "REC-HAWASSA-0042",
		Notes:         "Settled in cash at front desk during walk-in check-in",
		StaffID:       &staffID,
	}
	manualBody, _ := json.Marshal(manualReq)
	req2 := httptest.NewRequest(http.MethodPost, "/v1/admin/properties/"+propertyID.String()+"/payments/manual", bytes.NewReader(manualBody))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", authHeader)
	rec2 := httptest.NewRecorder()
	router.ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusCreated {
		t.Fatalf("Manual Payment Failed: %d %s", rec2.Code, rec2.Body.String())
	}
	var manualResp billing.ManualPaymentResponse
	_ = json.Unmarshal(rec2.Body.Bytes(), &manualResp)
	if manualResp.PaymentStatus != "SETTLED" || manualResp.ReservationStatus != "CONFIRMED" {
		t.Fatalf("Expected SETTLED/CONFIRMED, got %s/%s", manualResp.PaymentStatus, manualResp.ReservationStatus)
	}
	t.Logf("✅ Front-Desk Manual Cash Payment Verified: %s, Receipt: %s", manualResp.ReferenceNumber, manualResp.ReceiptNumber)
}
