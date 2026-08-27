package billing

import "errors"

var (
	ErrReservationNotFound        = errors.New("reservation not found")
	ErrReservationNotHeld         = errors.New("reservation is not in HELD status")
	ErrReservationHoldExpired     = errors.New("reservation hold has expired")
	ErrPaymentOrderNotFound       = errors.New("payment order not found")
	ErrPaymentOrderExpired        = errors.New("payment order has expired")
	ErrPaymentOrderAlreadySettled = errors.New("payment order has already been settled")
	ErrPaymentOrderCannotBeVoided = errors.New("payment order cannot be voided in its current status")
	ErrPaymentOrderCannotBeRefund = errors.New("payment order must be settled to issue a refund")
	ErrPaymentOrderAlreadyRefund  = errors.New("payment order has already been refunded")
	ErrInvalidRefundAmount        = errors.New("refund amount must be positive and cannot exceed settled amount")
	ErrAmountMismatch             = errors.New("paid amount does not match expected order amount")
	ErrCurrencyMismatch           = errors.New("payment currency does not match order currency")
	ErrInvalidPaymentStatus       = errors.New("bank payment status is not SUCCESS")
	ErrDuplicateBankReference     = errors.New("duplicate bank reference already processed")
	ErrInvalidPaymentMethod       = errors.New("invalid payment method")
	ErrDatabaseTransactionFailed  = errors.New("database atomic transaction failed")
)
