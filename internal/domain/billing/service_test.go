package billing_test

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"doki/internal/adapter/repository/memory"
	"doki/internal/domain/billing"
	"doki/internal/domain/reservation"

	"github.com/google/uuid"
)

func setupTestService() (billing.Service, *memory.ReservationRepo, *memory.BillingRepo) {
	resRepo := memory.NewReservationRepo()
	billingRepo := memory.NewBillingRepo()
	svc := billing.NewService(billingRepo, billingRepo, resRepo, billingRepo)
	return svc, resRepo, billingRepo
}

func createTestHeldReservation(t *testing.T, resRepo *memory.ReservationRepo, amountMinor int64, expiresAt time.Time) *reservation.Reservation {
	t.Helper()
	res := &reservation.Reservation{
		ID:               uuid.New(),
		HotelID:          uuid.New(),
		HotelName:        "Skylight Hotel Addis",
		RoomID:           uuid.New(),
		RoomType:         "Deluxe Suite",
		GuestName:        "Abebe Kebede",
		GuestEmail:       "abebe@example.com",
		GuestPhone:       "+251911223344",
		StayNights:       3,
		CheckInDate:      time.Now().Add(24 * time.Hour).Truncate(24 * time.Hour),
		CheckOutDate:     time.Now().Add(96 * time.Hour).Truncate(24 * time.Hour),
		TotalAmountMinor: amountMinor,
		Currency:         "ETB",
		Status:           reservation.StatusHeld,
		HoldExpiresAt:    expiresAt,
		CreatedAt:        time.Now().UTC(),
		UpdatedAt:        time.Now().UTC(),
	}

	if err := resRepo.Create(context.Background(), res); err != nil {
		t.Fatalf("failed to create test reservation: %v", err)
	}
	return res
}

func TestInitiatePayment_Success(t *testing.T) {
	svc, resRepo, _ := setupTestService()
	res := createTestHeldReservation(t, resRepo, 450000, time.Now().Add(30*time.Minute))

	resp, err := svc.InitiatePayment(context.Background(), billing.InitiatePaymentRequest{
		ReservationID: res.ID,
	})
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if resp.ReservationID != res.ID {
		t.Errorf("expected reservation ID %s, got %s", res.ID, resp.ReservationID)
	}
	if !strings.HasPrefix(resp.ReferenceNumber, "DOKI-PAY-") {
		t.Errorf("expected reference number starting with DOKI-PAY-, got %s", resp.ReferenceNumber)
	}
	if len(resp.PNR) != 6 {
		t.Errorf("expected 6-character PNR, got %s", resp.PNR)
	}
	if resp.AmountMinor != 450000 {
		t.Errorf("expected amount_minor 450000, got %d", resp.AmountMinor)
	}
	if resp.Amount != 4500.00 {
		t.Errorf("expected amount 4500.00, got %f", resp.Amount)
	}
	if resp.PaymentStatus != "INITIATED" {
		t.Errorf("expected status INITIATED, got %s", resp.PaymentStatus)
	}
}

func TestGetPaymentByID_Success(t *testing.T) {
	svc, resRepo, _ := setupTestService()
	res := createTestHeldReservation(t, resRepo, 450000, time.Now().Add(30*time.Minute))

	initResp, err := svc.InitiatePayment(context.Background(), billing.InitiatePaymentRequest{
		ReservationID: res.ID,
	})
	if err != nil {
		t.Fatalf("failed to initiate payment: %v", err)
	}

	details, err := svc.GetPaymentByID(context.Background(), initResp.PaymentOrderID)
	if err != nil {
		t.Fatalf("expected no error fetching payment by id, got: %v", err)
	}

	if details.PaymentOrderID != initResp.PaymentOrderID {
		t.Errorf("expected payment ID %s, got %s", initResp.PaymentOrderID, details.PaymentOrderID)
	}
	if details.PNR != initResp.PNR {
		t.Errorf("expected PNR %s, got %s", initResp.PNR, details.PNR)
	}
	if details.PaymentStatus != "INITIATED" {
		t.Errorf("expected INITIATED, got %s", details.PaymentStatus)
	}
}

func TestVoidPayment_Success(t *testing.T) {
	svc, resRepo, _ := setupTestService()
	res := createTestHeldReservation(t, resRepo, 450000, time.Now().Add(30*time.Minute))

	initResp, err := svc.InitiatePayment(context.Background(), billing.InitiatePaymentRequest{
		ReservationID: res.ID,
	})
	if err != nil {
		t.Fatalf("failed to initiate payment: %v", err)
	}

	staffID := uuid.New()
	voidResp, err := svc.VoidPayment(context.Background(), initResp.PaymentOrderID, billing.VoidPaymentRequest{
		Reason:  "Guest changed payment method to cash",
		StaffID: &staffID,
	})
	if err != nil {
		t.Fatalf("expected no error voiding payment, got: %v", err)
	}

	if voidResp.Status != "VOIDED" {
		t.Errorf("expected status VOIDED, got %s", voidResp.Status)
	}

	// Verify details reflect VOIDED status
	details, _ := svc.GetPaymentByID(context.Background(), initResp.PaymentOrderID)
	if details.PaymentStatus != "VOIDED" {
		t.Errorf("expected details status VOIDED, got %s", details.PaymentStatus)
	}
	if details.VoidReason != "Guest changed payment method to cash" {
		t.Errorf("expected void reason, got: %s", details.VoidReason)
	}
}

func TestRefundPayment_Success(t *testing.T) {
	svc, resRepo, _ := setupTestService()
	res := createTestHeldReservation(t, resRepo, 500000, time.Now().Add(30*time.Minute))

	initResp, err := svc.InitiatePayment(context.Background(), billing.InitiatePaymentRequest{
		ReservationID: res.ID,
	})
	if err != nil {
		t.Fatalf("failed to initiate payment: %v", err)
	}

	// Settle via bank callback
	callbackReq := billing.BankCallbackRequest{
		EventType:          "PAYMENT_RECEIVED",
		BankID:             "BANK_CBE",
		BankName:           "Commercial Bank of Ethiopia",
		BankReference:      "FT_SETTLE_FOR_REFUND",
		ReferenceNumber:    initResp.ReferenceNumber,
		PaidAmount:         500000,
		Currency:           "ETB",
		PayerAccountNumber: "1000123456789",
		PayerName:          "Abebe Kebede",
		PaymentStatus:      "SUCCESS",
		PaidAt:             time.Now().UTC(),
	}
	rawPayload, _ := json.Marshal(callbackReq)
	if _, err := svc.ProcessBankCallback(context.Background(), callbackReq, rawPayload); err != nil {
		t.Fatalf("failed to settle payment: %v", err)
	}

	// Issue full refund
	staffID := uuid.New()
	refundResp, err := svc.RefundPayment(context.Background(), initResp.PaymentOrderID, billing.RefundPaymentRequest{
		RefundAmountMinor: 500000,
		Reason:            "Guest requested cancellation within policy",
		StaffID:           &staffID,
	})
	if err != nil {
		t.Fatalf("expected no error processing refund, got: %v", err)
	}

	if refundResp.Status != "REFUNDED" {
		t.Errorf("expected status REFUNDED, got %s", refundResp.Status)
	}
	if refundResp.RefundAmountMinor != 500000 || refundResp.RefundAmount != 5000.00 {
		t.Errorf("expected refund amount 500000, got %d", refundResp.RefundAmountMinor)
	}

	// Verify folio reflects refund
	folio, err := svc.GetReservationFolio(context.Background(), res.ID)
	if err != nil {
		t.Fatalf("failed to get folio: %v", err)
	}
	if folio.TotalPaidMinor != 0 {
		t.Errorf("expected total paid after full refund to be 0, got %d", folio.TotalPaidMinor)
	}
	if folio.OutstandingBalanceMinor != 500000 {
		t.Errorf("expected outstanding balance 500000, got %d", folio.OutstandingBalanceMinor)
	}
}

func TestRefundPayment_InvalidAmountOrNotSettled(t *testing.T) {
	svc, resRepo, _ := setupTestService()
	res := createTestHeldReservation(t, resRepo, 450000, time.Now().Add(30*time.Minute))

	initResp, err := svc.InitiatePayment(context.Background(), billing.InitiatePaymentRequest{
		ReservationID: res.ID,
	})
	if err != nil {
		t.Fatalf("failed to initiate payment: %v", err)
	}

	// Attempting to refund an UNSETTLED (INITIATED) order -> must fail
	_, err = svc.RefundPayment(context.Background(), initResp.PaymentOrderID, billing.RefundPaymentRequest{
		RefundAmountMinor: 450000,
		Reason:            "Early refund attempt",
	})
	if err == nil {
		t.Fatal("expected error refunding unsettled payment, got nil")
	}
	if !strings.Contains(err.Error(), "must be settled") {
		t.Errorf("expected ErrPaymentOrderCannotBeRefund, got: %v", err)
	}
}

func TestRecordManualPayment_CashAndPOS(t *testing.T) {
	svc, resRepo, _ := setupTestService()
	res := createTestHeldReservation(t, resRepo, 350000, time.Now().Add(30*time.Minute))

	staffID := uuid.New()
	manualResp, err := svc.RecordManualPayment(context.Background(), res.HotelID, billing.ManualPaymentRequest{
		ReservationID: res.ID,
		AmountMinor:   350000,
		PaymentMethod: "CASH",
		ReceiptNumber: "REC-2026-0099",
		Notes:         "Settled at front-desk counter with cash receipt",
		StaffID:       &staffID,
	})
	if err != nil {
		t.Fatalf("failed to record manual cash payment: %v", err)
	}

	if manualResp.PaymentStatus != "SETTLED" {
		t.Errorf("expected status SETTLED, got %s", manualResp.PaymentStatus)
	}
	if manualResp.ReservationStatus != "CONFIRMED" {
		t.Errorf("expected reservation status CONFIRMED, got %s", manualResp.ReservationStatus)
	}
	if manualResp.ReceiptNumber != "REC-2026-0099" {
		t.Errorf("expected receipt REC-2026-0099, got %s", manualResp.ReceiptNumber)
	}

	// Verify Reservation state in repo
	updatedRes, _ := resRepo.GetByID(context.Background(), res.ID)
	if updatedRes.Status != reservation.StatusConfirmed {
		t.Errorf("expected reservation confirmed, got %s", updatedRes.Status)
	}
}

func TestListPropertyPayments_FilteringAndPagination(t *testing.T) {
	svc, resRepo, _ := setupTestService()
	propertyID := uuid.New()

	for i := 0; i < 5; i++ {
		res := &reservation.Reservation{
			ID:               uuid.New(),
			HotelID:          propertyID,
			HotelName:        "Skylight Hotel Addis",
			RoomID:           uuid.New(),
			RoomType:         "Deluxe Suite",
			GuestName:        "Guest",
			GuestEmail:       "guest@example.com",
			StayNights:       2,
			CheckInDate:      time.Now().Add(24 * time.Hour),
			CheckOutDate:     time.Now().Add(72 * time.Hour),
			TotalAmountMinor: int64(200000 + i*10000),
			Currency:         "ETB",
			Status:           reservation.StatusHeld,
			HoldExpiresAt:    time.Now().Add(30 * time.Minute),
		}
		_ = resRepo.Create(context.Background(), res)
		_, _ = svc.InitiatePayment(context.Background(), billing.InitiatePaymentRequest{ReservationID: res.ID})
	}

	// Query with pagination
	paginated, err := svc.ListPropertyPayments(context.Background(), billing.PropertyPaymentsFilter{
		PropertyID: propertyID,
		Page:       1,
		Limit:      3,
	})
	if err != nil {
		t.Fatalf("failed to list property payments: %v", err)
	}

	if paginated.Total != 5 {
		t.Errorf("expected total 5, got %d", paginated.Total)
	}
	if len(paginated.Data) != 3 {
		t.Errorf("expected page size 3, got %d", len(paginated.Data))
	}
	if paginated.TotalPages != 2 {
		t.Errorf("expected 2 total pages, got %d", paginated.TotalPages)
	}
}

func TestProcessBankCallback_Success(t *testing.T) {
	svc, resRepo, billingRepo := setupTestService()
	res := createTestHeldReservation(t, resRepo, 450000, time.Now().Add(30*time.Minute))

	initResp, err := svc.InitiatePayment(context.Background(), billing.InitiatePaymentRequest{
		ReservationID: res.ID,
	})
	if err != nil {
		t.Fatalf("failed to initiate payment: %v", err)
	}

	callbackReq := billing.BankCallbackRequest{
		EventType:          "PAYMENT_RECEIVED",
		BankID:             "BANK_CBE",
		BankName:           "Commercial Bank of Ethiopia",
		BankReference:      "FT26239X8K9L",
		ReferenceNumber:    initResp.ReferenceNumber,
		PNR:                initResp.PNR,
		PaidAmount:         int64(450000),
		Currency:           "ETB",
		PayerAccountNumber: "1000123456789",
		PayerName:          "Abebe Kebede",
		PaymentStatus:      "SUCCESS",
		PaidAt:             time.Now().UTC(),
	}

	rawPayload, _ := json.Marshal(callbackReq)
	callbackResp, err := svc.ProcessBankCallback(context.Background(), callbackReq, rawPayload)
	if err != nil {
		t.Fatalf("expected successful callback reconciliation, got: %v", err)
	}

	if callbackResp.Status != "ACKNOWLEDGED" {
		t.Errorf("expected status ACKNOWLEDGED, got %s", callbackResp.Status)
	}

	// Verify Payment Order status transitioned to SETTLED
	order, err := billingRepo.GetByID(context.Background(), initResp.PaymentOrderID)
	if err != nil {
		t.Fatalf("failed to fetch payment order: %v", err)
	}
	if order.Status != billing.StatusSettled {
		t.Errorf("expected order status SETTLED, got %s", order.Status)
	}
	if order.SettledAt == nil {
		t.Error("expected settled_at timestamp to be set")
	}

	// Verify Bank Transaction record was stored
	bankTx, err := billingRepo.GetByBankReference(context.Background(), "FT26239X8K9L")
	if err != nil || bankTx == nil {
		t.Fatalf("expected bank transaction record to exist, got: %v", err)
	}
	if bankTx.PaidAmountMinor != 450000 {
		t.Errorf("expected paid amount minor 450000, got %d", bankTx.PaidAmountMinor)
	}
	if bankTx.BankID != "BANK_CBE" {
		t.Errorf("expected bank ID BANK_CBE, got %s", bankTx.BankID)
	}

	// Verify Reservation status transitioned to CONFIRMED
	updatedRes, err := resRepo.GetByID(context.Background(), res.ID)
	if err != nil {
		t.Fatalf("failed to fetch updated reservation: %v", err)
	}
	if updatedRes.Status != reservation.StatusConfirmed {
		t.Errorf("expected reservation status CONFIRMED, got %s", updatedRes.Status)
	}
	if !strings.Contains(updatedRes.SettledReason, "FT26239X8K9L") {
		t.Errorf("expected settled reason containing bank ref, got: %s", updatedRes.SettledReason)
	}
}

func TestProcessBankCallback_AmountMismatch(t *testing.T) {
	svc, resRepo, billingRepo := setupTestService()
	res := createTestHeldReservation(t, resRepo, 450000, time.Now().Add(30*time.Minute))

	initResp, err := svc.InitiatePayment(context.Background(), billing.InitiatePaymentRequest{
		ReservationID: res.ID,
	})
	if err != nil {
		t.Fatalf("failed to initiate payment: %v", err)
	}

	callbackReq := billing.BankCallbackRequest{
		EventType:          "PAYMENT_RECEIVED",
		BankID:             "BANK_BOA",
		BankName:           "Bank of Abyssinia",
		BankReference:      "FT_UNDERPAID_001",
		ReferenceNumber:    initResp.ReferenceNumber,
		PaidAmount:         int64(300000), // Mismatch
		Currency:           "ETB",
		PayerAccountNumber: "2000987654321",
		PayerName:          "Abebe Kebede",
		PaymentStatus:      "SUCCESS",
		PaidAt:             time.Now().UTC(),
	}

	rawPayload, _ := json.Marshal(callbackReq)
	_, err = svc.ProcessBankCallback(context.Background(), callbackReq, rawPayload)
	if err == nil {
		t.Fatal("expected ErrAmountMismatch, got nil")
	}
	if !strings.Contains(err.Error(), "does not match expected order amount") {
		t.Errorf("expected amount mismatch error, got: %v", err)
	}

	currentRes, _ := resRepo.GetByID(context.Background(), res.ID)
	if currentRes.Status != reservation.StatusHeld {
		t.Errorf("expected reservation status to remain HELD, got: %s", currentRes.Status)
	}

	order, _ := billingRepo.GetByID(context.Background(), initResp.PaymentOrderID)
	if order.Status != billing.StatusInitiated {
		t.Errorf("expected order status to remain INITIATED, got: %s", order.Status)
	}
}

func TestProcessBankCallback_IdempotencyDuplicateBankReference(t *testing.T) {
	svc, resRepo, _ := setupTestService()
	res := createTestHeldReservation(t, resRepo, 500000, time.Now().Add(30*time.Minute))

	initResp, err := svc.InitiatePayment(context.Background(), billing.InitiatePaymentRequest{
		ReservationID: res.ID,
	})
	if err != nil {
		t.Fatalf("failed to initiate payment: %v", err)
	}

	callbackReq := billing.BankCallbackRequest{
		EventType:       "PAYMENT_RECEIVED",
		BankID:          "BANK_AWASH",
		BankName:        "Awash International Bank",
		BankReference:   "AWASH_FT_UNIQUE_999",
		ReferenceNumber: initResp.ReferenceNumber,
		PaidAmount:      500000,
		Currency:        "ETB",
		PaymentStatus:   "SUCCESS",
		PaidAt:          time.Now().UTC(),
	}
	rawPayload, _ := json.Marshal(callbackReq)

	// 1st callback invocation -> Success
	resp1, err := svc.ProcessBankCallback(context.Background(), callbackReq, rawPayload)
	if err != nil {
		t.Fatalf("first callback failed: %v", err)
	}
	if resp1.Status != "ACKNOWLEDGED" {
		t.Errorf("expected ACKNOWLEDGED, got %s", resp1.Status)
	}

	// 2nd duplicate callback invocation with same bank reference -> Must succeed idempotently
	resp2, err := svc.ProcessBankCallback(context.Background(), callbackReq, rawPayload)
	if err != nil {
		t.Fatalf("duplicate callback returned error: %v", err)
	}
	if resp2.Status != "ACKNOWLEDGED" {
		t.Errorf("expected ACKNOWLEDGED for duplicate, got %s", resp2.Status)
	}

	// Verify reservation remains CONFIRMED
	finalRes, _ := resRepo.GetByID(context.Background(), res.ID)
	if finalRes.Status != reservation.StatusConfirmed {
		t.Errorf("expected final reservation status CONFIRMED, got %s", finalRes.Status)
	}
}
