package billing

import (
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

// InitiatePaymentRequest is the payload from the client to initiate payment for a held room.
type InitiatePaymentRequest struct {
	ReservationID uuid.UUID `json:"reservation_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
}

// InitiatePaymentResponse is the generated payment billing order returned to the guest.
type InitiatePaymentResponse struct {
	PaymentOrderID  uuid.UUID `json:"payment_order_id" example:"6ba7b810-9dad-11d1-80b4-00c04fd430c8"`
	ReservationID   uuid.UUID `json:"reservation_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	PropertyID      uuid.UUID `json:"property_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	ReferenceNumber string    `json:"reference_number" example:"DOKI-PAY-2026-X8F29K"`
	PNR             string    `json:"pnr" example:"DK8F2X"`
	HotelName       string    `json:"hotel_name" example:"Skylight Hotel Addis"`
	GuestName       string    `json:"guest_name" example:"Abebe Kebede"`
	StayNights      int       `json:"stay_nights" example:"3"`
	CheckInDate     string    `json:"check_in_date" example:"2026-09-01"`
	CheckOutDate    string    `json:"check_out_date" example:"2026-09-04"`
	Amount          float64   `json:"amount" example:"4500.00"`
	AmountMinor     int64     `json:"amount_minor" example:"450000"`
	Currency        string    `json:"currency" example:"ETB"`
	PaymentStatus   string    `json:"payment_status" example:"INITIATED"`
	PaymentMethod   string    `json:"payment_method" example:"DIRECT_BANK"`
	ExpiresAt       time.Time `json:"expires_at" example:"2026-08-27T18:00:00Z"`
	CreatedAt       time.Time `json:"created_at" example:"2026-08-27T17:30:00Z"`
}

// BankCallbackRequest is the inbound webhook payload from the bank host-to-host system.
type BankCallbackRequest struct {
	EventType          string    `json:"event_type" example:"PAYMENT_RECEIVED"`
	BankID             string    `json:"bank_id" binding:"required" example:"BANK_CBE"`
	BankName           string    `json:"bank_name" binding:"required" example:"Commercial Bank of Ethiopia"`
	BankReference      string    `json:"bank_reference" binding:"required" example:"FT26239X8K9L"`
	ReferenceNumber    string    `json:"reference_number" binding:"required" example:"DOKI-PAY-2026-X8F29K"`
	PNR                string    `json:"pnr,omitempty" example:"DK8F2X"`
	PaidAmount         any       `json:"paid_amount" binding:"required" swaggertype:"primitive,number" example:"450000"`
	Currency           string    `json:"currency" binding:"required" example:"ETB"`
	PayerAccountNumber string    `json:"payer_account_number,omitempty" example:"1000123456789"`
	PayerName          string    `json:"payer_name,omitempty" example:"Abebe Kebede"`
	PaymentStatus      string    `json:"payment_status" binding:"required" example:"SUCCESS"`
	PaidAt             time.Time `json:"paid_at" example:"2026-08-27T17:35:00Z"`
}

// GetPaidAmountMinor reliably converts paid_amount from integer minor units, float decimal, or string decimal/int to minor units.
func (r *BankCallbackRequest) GetPaidAmountMinor() (int64, error) {
	if r.PaidAmount == nil {
		return 0, fmt.Errorf("paid_amount is required")
	}

	switch v := r.PaidAmount.(type) {
	case int:
		return int64(v), nil
	case int64:
		return v, nil
	case int32:
		return int64(v), nil
	case float64:
		if v == math.Trunc(v) {
			return int64(v), nil
		}
		return int64(math.Round(v * 100)), nil
	case json.Number:
		str := v.String()
		if !strings.Contains(str, ".") {
			if i, err := v.Int64(); err == nil {
				return i, nil
			}
		}
		if f, err := v.Float64(); err == nil {
			if f == math.Trunc(f) && !strings.Contains(str, ".") {
				return int64(f), nil
			}
			return int64(math.Round(f * 100)), nil
		}
		return 0, fmt.Errorf("invalid json.Number format for paid_amount: %s", v.String())
	case string:
		cleanStr := strings.TrimSpace(v)
		if strings.Contains(cleanStr, ".") {
			f, err := strconv.ParseFloat(cleanStr, 64)
			if err != nil {
				return 0, fmt.Errorf("invalid string float paid_amount: %w", err)
			}
			return int64(math.Round(f * 100)), nil
		}
		i, err := strconv.ParseInt(cleanStr, 10, 64)
		if err != nil {
			return 0, fmt.Errorf("invalid string int paid_amount: %w", err)
		}
		return i, nil
	default:
		return 0, fmt.Errorf("unsupported type for paid_amount: %T", r.PaidAmount)
	}
}

// BankCallbackResponse is the response sent back to acknowledge bank callback webhook invocation.
type BankCallbackResponse struct {
	Status          string    `json:"status" example:"ACKNOWLEDGED"`
	AcknowledgedAt  time.Time `json:"acknowledged_at" example:"2026-08-27T17:35:05Z"`
	ReferenceNumber string    `json:"reference_number" example:"DOKI-PAY-2026-X8F29K"`
	Message         string    `json:"message,omitempty" example:"Payment successfully reconciled"`
}

// PaymentOrderDetailsResponse is the complete profile for a single payment order (GET /v1/payments/{payment_id}).
type PaymentOrderDetailsResponse struct {
	PaymentOrderID    uuid.UUID          `json:"payment_order_id" example:"6ba7b810-9dad-11d1-80b4-00c04fd430c8"`
	ReservationID     uuid.UUID          `json:"reservation_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	PropertyID        uuid.UUID          `json:"property_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	ReferenceNumber   string             `json:"reference_number" example:"DOKI-PAY-2026-X8F29K"`
	PNR               string             `json:"pnr" example:"DK8F2X"`
	HotelName         string             `json:"hotel_name" example:"Skylight Hotel Addis"`
	GuestName         string             `json:"guest_name" example:"Abebe Kebede"`
	StayNights        int                `json:"stay_nights" example:"3"`
	CheckInDate       string             `json:"check_in_date" example:"2026-09-01"`
	CheckOutDate      string             `json:"check_out_date" example:"2026-09-04"`
	Amount            float64            `json:"amount" example:"4500.00"`
	AmountMinor       int64              `json:"amount_minor" example:"450000"`
	Currency          string             `json:"currency" example:"ETB"`
	PaymentStatus     string             `json:"payment_status" example:"SETTLED"`
	PaymentMethod     string             `json:"payment_method" example:"DIRECT_BANK"`
	ReceiptNumber     string             `json:"receipt_number,omitempty" example:"REC-2026-001"`
	StaffID           *uuid.UUID         `json:"staff_id,omitempty" example:"770e8400-e29b-41d4-a716-446655440000"`
	BankID            *string            `json:"bank_id,omitempty" example:"BANK_CBE"`
	BankName          *string            `json:"bank_name,omitempty" example:"Commercial Bank of Ethiopia"`
	BankReference     *string            `json:"bank_reference,omitempty" example:"FT26239X8K9L"`
	PayerAccount      *string            `json:"payer_account_number,omitempty" example:"1000123456789"`
	PayerName         *string            `json:"payer_name,omitempty" example:"Abebe Kebede"`
	CreatedAt         time.Time          `json:"created_at" example:"2026-08-27T17:30:00Z"`
	ExpiresAt         time.Time          `json:"expires_at" example:"2026-08-27T18:00:00Z"`
	SettledAt         *time.Time         `json:"settled_at,omitempty" example:"2026-08-27T17:35:00Z"`
	VoidedAt          *time.Time         `json:"voided_at,omitempty"`
	VoidReason        string             `json:"void_reason,omitempty"`
	RefundedAt        *time.Time         `json:"refunded_at,omitempty"`
	RefundAmountMinor *int64             `json:"refund_amount_minor,omitempty"`
	RefundAmount      *float64           `json:"refund_amount,omitempty"`
	RefundReason      string             `json:"refund_reason,omitempty"`
	Transactions      []BankTransaction  `json:"transactions,omitempty"`
}

// VoidPaymentRequest is the payload to cancel an unsettled payment order (POST /v1/payments/{payment_id}/void).
type VoidPaymentRequest struct {
	Reason  string     `json:"reason" binding:"required" example:"Guest opted for front-desk cash payment"`
	StaffID *uuid.UUID `json:"staff_id,omitempty" example:"770e8400-e29b-41d4-a716-446655440000"`
}

// VoidPaymentResponse is returned when a payment order is successfully voided.
type VoidPaymentResponse struct {
	PaymentOrderID  uuid.UUID `json:"payment_order_id" example:"6ba7b810-9dad-11d1-80b4-00c04fd430c8"`
	ReferenceNumber string    `json:"reference_number" example:"DOKI-PAY-2026-X8F29K"`
	PNR             string    `json:"pnr" example:"DK8F2X"`
	Status          string    `json:"status" example:"VOIDED"`
	VoidedAt        time.Time `json:"voided_at" example:"2026-08-27T17:40:00Z"`
	Reason          string    `json:"reason" example:"Guest opted for front-desk cash payment"`
}

// RefundPaymentRequest is the payload to issue a refund on a settled payment (POST /v1/payments/{payment_id}/refund).
type RefundPaymentRequest struct {
	RefundAmountMinor int64      `json:"refund_amount_minor" binding:"required,gt=0" example:"450000"`
	Reason            string     `json:"reason" binding:"required" example:"Guest cancellation within free cancellation policy"`
	StaffID           *uuid.UUID `json:"staff_id,omitempty" example:"770e8400-e29b-41d4-a716-446655440000"`
}

// RefundPaymentResponse is returned when a refund is recorded in the ledger.
type RefundPaymentResponse struct {
	PaymentOrderID    uuid.UUID `json:"payment_order_id" example:"6ba7b810-9dad-11d1-80b4-00c04fd430c8"`
	ReservationID     uuid.UUID `json:"reservation_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	ReferenceNumber   string    `json:"reference_number" example:"DOKI-PAY-2026-X8F29K"`
	Status            string    `json:"status" example:"REFUNDED"`
	RefundAmountMinor int64     `json:"refund_amount_minor" example:"450000"`
	RefundAmount      float64   `json:"refund_amount" example:"4500.00"`
	Currency          string    `json:"currency" example:"ETB"`
	RefundedAt        time.Time `json:"refunded_at" example:"2026-08-27T17:45:00Z"`
	Reason            string    `json:"reason" example:"Guest cancellation within free cancellation policy"`
}

// ReservationFolioResponse represents the guest billing folio (GET /v1/reservations/{reservation_id}/payments).
type ReservationFolioResponse struct {
	ReservationID          uuid.UUID         `json:"reservation_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	HotelName              string            `json:"hotel_name" example:"Skylight Hotel Addis"`
	GuestName              string            `json:"guest_name" example:"Abebe Kebede"`
	TotalStayCostMinor     int64             `json:"total_stay_cost_minor" example:"450000"`
	TotalStayCost          float64           `json:"total_stay_cost" example:"4500.00"`
	TotalPaidMinor         int64             `json:"total_paid_minor" example:"450000"`
	TotalPaid              float64           `json:"total_paid" example:"4500.00"`
	OutstandingBalanceMinor int64            `json:"outstanding_balance_minor" example:"0"`
	OutstandingBalance     float64           `json:"outstanding_balance" example:"0.00"`
	Currency               string            `json:"currency" example:"ETB"`
	ReservationStatus      string            `json:"reservation_status" example:"CONFIRMED"`
	Orders                 []PaymentOrder    `json:"orders"`
	Transactions           []BankTransaction `json:"transactions"`
}

// ReservationPaymentStatusResponse is the lightweight checkout polling response (GET /v1/reservations/{reservation_id}/payments/status).
type ReservationPaymentStatusResponse struct {
	ReservationID     uuid.UUID  `json:"reservation_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	PaymentOrderID    uuid.UUID  `json:"payment_order_id" example:"6ba7b810-9dad-11d1-80b4-00c04fd430c8"`
	ReferenceNumber   string     `json:"reference_number" example:"DOKI-PAY-2026-X8F29K"`
	PNR               string     `json:"pnr" example:"DK8F2X"`
	Amount            float64    `json:"amount" example:"4500.00"`
	AmountMinor       int64      `json:"amount_minor" example:"450000"`
	Currency          string     `json:"currency" example:"ETB"`
	PaymentStatus     string     `json:"payment_status" example:"SETTLED"`
	ReservationStatus string     `json:"reservation_status" example:"CONFIRMED"`
	BankID            *string    `json:"bank_id,omitempty" example:"BANK_CBE"`
	BankName          *string    `json:"bank_name,omitempty" example:"Commercial Bank of Ethiopia"`
	BankReference     *string    `json:"bank_reference,omitempty" example:"FT26239X8K9L"`
	ExpiresAt         time.Time  `json:"expires_at" example:"2026-08-27T18:00:00Z"`
	SettledAt         *time.Time `json:"settled_at,omitempty" example:"2026-08-27T17:35:00Z"`
}

// ManualPaymentRequest is the payload for front-desk cash/POS counter payments (POST /v1/admin/properties/{property_id}/payments/manual).
type ManualPaymentRequest struct {
	ReservationID uuid.UUID  `json:"reservation_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	AmountMinor   int64      `json:"amount_minor" binding:"required,gt=0" example:"450000"`
	PaymentMethod string     `json:"payment_method" binding:"required,oneof=CASH POS CARD MANUAL" example:"CASH"`
	ReceiptNumber string     `json:"receipt_number" binding:"required" example:"REC-2026-001"`
	Notes         string     `json:"notes,omitempty" example:"Front desk cash counter settlement"`
	StaffID       *uuid.UUID `json:"staff_id,omitempty" example:"770e8400-e29b-41d4-a716-446655440000"`
}

// ManualPaymentResponse is returned after front-desk payment is settled.
type ManualPaymentResponse struct {
	PaymentOrderID    uuid.UUID `json:"payment_order_id" example:"6ba7b810-9dad-11d1-80b4-00c04fd430c8"`
	ReservationID     uuid.UUID `json:"reservation_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	PropertyID        uuid.UUID `json:"property_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	ReferenceNumber   string    `json:"reference_number" example:"DOKI-PAY-2026-X8F29K"`
	PNR               string    `json:"pnr" example:"DK8F2X"`
	AmountMinor       int64     `json:"amount_minor" example:"450000"`
	Amount            float64   `json:"amount" example:"4500.00"`
	Currency          string    `json:"currency" example:"ETB"`
	PaymentMethod     string    `json:"payment_method" example:"CASH"`
	ReceiptNumber     string    `json:"receipt_number" example:"REC-2026-001"`
	PaymentStatus     string    `json:"payment_status" example:"SETTLED"`
	ReservationStatus string    `json:"reservation_status" example:"CONFIRMED"`
	SettledAt         time.Time `json:"settled_at" example:"2026-08-27T17:40:00Z"`
}

// PropertyPaymentsFilter contains query parameters for admin property ledger listing (GET /v1/admin/properties/{property_id}/payments).
type PropertyPaymentsFilter struct {
	PropertyID      uuid.UUID  `json:"property_id"`
	Status          string     `json:"status"`
	BankID          string     `json:"bank_id"`
	PaymentMethod   string     `json:"payment_method"`
	PNR             string     `json:"pnr"`
	ReferenceNumber string     `json:"reference_number"`
	FromDate        *time.Time `json:"from_date"`
	ToDate          *time.Time `json:"to_date"`
	Page            int        `json:"page"`
	Limit           int        `json:"limit"`
}

// PaginatedPaymentsResponse is the paginated response for property accountants.
type PaginatedPaymentsResponse struct {
	Data       []PaymentOrderDetailsResponse `json:"data"`
	Total      int64                         `json:"total" example:"125"`
	Page       int                           `json:"page" example:"1"`
	Limit      int                           `json:"limit" example:"20"`
	TotalPages int                           `json:"total_pages" example:"7"`
}
