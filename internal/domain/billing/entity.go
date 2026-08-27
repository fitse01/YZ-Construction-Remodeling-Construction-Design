package billing

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type PaymentOrderStatus string

const (
	StatusInitiated PaymentOrderStatus = "INITIATED"
	StatusSettled   PaymentOrderStatus = "SETTLED"
	StatusVoided    PaymentOrderStatus = "VOIDED"
	StatusRefunded  PaymentOrderStatus = "REFUNDED"
	StatusExpired   PaymentOrderStatus = "EXPIRED"
	StatusFailed    PaymentOrderStatus = "FAILED"
)

type PaymentMethod string

const (
	MethodDirectBank PaymentMethod = "DIRECT_BANK"
	MethodCash       PaymentMethod = "CASH"
	MethodPOS        PaymentMethod = "POS"
	MethodCard       PaymentMethod = "CARD"
	MethodManual     PaymentMethod = "MANUAL"
)

type TransactionType string

const (
	TxTypeCredit     TransactionType = "CREDIT"
	TxTypeRefund     TransactionType = "REFUND"
	TxTypeManualCash TransactionType = "MANUAL_CASH"
	TxTypeManualPOS  TransactionType = "MANUAL_POS"
	TxTypeVoid       TransactionType = "VOID"
)

// PaymentOrder represents the billing order and financial state for a reservation.
type PaymentOrder struct {
	ID                 uuid.UUID          `json:"id"`
	ReservationID      uuid.UUID          `json:"reservation_id"`
	PropertyID         uuid.UUID          `json:"property_id"`
	ReferenceNumber    string             `json:"reference_number"`
	PNR                string             `json:"pnr"`
	HotelName          string             `json:"hotel_name"`
	GuestName          string             `json:"guest_name"`
	StayNights         int                `json:"stay_nights"`
	CheckInDate        time.Time          `json:"check_in_date"`
	CheckOutDate       time.Time          `json:"check_out_date"`
	AmountMinor        int64              `json:"amount_minor"`
	Currency           string             `json:"currency"`
	Status             PaymentOrderStatus `json:"status"`
	PaymentMethod      PaymentMethod      `json:"payment_method"`
	ReceiptNumber      string             `json:"receipt_number,omitempty"`
	StaffID            *uuid.UUID         `json:"staff_id,omitempty"`
	CreatedAt          time.Time          `json:"created_at"`
	ExpiresAt          time.Time          `json:"expires_at"`
	SettledAt          *time.Time         `json:"settled_at,omitempty"`
	VoidedAt           *time.Time         `json:"voided_at,omitempty"`
	VoidReason         string             `json:"void_reason,omitempty"`
	RefundedAt         *time.Time         `json:"refunded_at,omitempty"`
	RefundAmountMinor  *int64             `json:"refund_amount_minor,omitempty"`
	RefundReason       string             `json:"refund_reason,omitempty"`
}

// BankTransaction represents an immutable ledger entry for credits, refunds, and manual settlements.
type BankTransaction struct {
	ID                 uuid.UUID       `json:"id"`
	PaymentOrderID     uuid.UUID       `json:"payment_order_id"`
	TransactionType    TransactionType `json:"transaction_type"`
	PaymentMethod      PaymentMethod   `json:"payment_method"`
	BankID             string          `json:"bank_id,omitempty"`
	BankName           string          `json:"bank_name,omitempty"`
	BankReference      string          `json:"bank_reference,omitempty"`
	PaidAmountMinor    int64           `json:"paid_amount_minor"`
	PayerAccountNumber string          `json:"payer_account_number,omitempty"`
	PayerName          string          `json:"payer_name,omitempty"`
	ReceiptNumber      string          `json:"receipt_number,omitempty"`
	StaffID            *uuid.UUID      `json:"staff_id,omitempty"`
	Notes              string          `json:"notes,omitempty"`
	RawPayload         json.RawMessage `json:"raw_payload" swaggertype:"object"`
	ReceivedAt         time.Time       `json:"received_at"`
}
