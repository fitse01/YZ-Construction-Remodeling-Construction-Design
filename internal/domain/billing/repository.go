package billing

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type PaymentOrderRepository interface {
	CreateOrder(ctx context.Context, tx any, order *PaymentOrder) error
	GetByID(ctx context.Context, id uuid.UUID) (*PaymentOrder, error)
	GetByReservationID(ctx context.Context, reservationID uuid.UUID) (*PaymentOrder, error)
	ListOrdersByReservationID(ctx context.Context, reservationID uuid.UUID) ([]PaymentOrder, error)
	GetByReferenceNumber(ctx context.Context, ref string) (*PaymentOrder, error)
	GetByReferenceForUpdate(ctx context.Context, tx any, ref string) (*PaymentOrder, error)
	GetByPNR(ctx context.Context, pnr string) (*PaymentOrder, error)
	UpdateStatus(ctx context.Context, tx any, id uuid.UUID, status PaymentOrderStatus, settledAt *time.Time) error
	VoidOrder(ctx context.Context, tx any, id uuid.UUID, voidedAt time.Time, reason string, staffID *uuid.UUID) error
	RefundOrder(ctx context.Context, tx any, id uuid.UUID, refundedAt time.Time, refundAmountMinor int64, reason string, staffID *uuid.UUID) error
	ListByProperty(ctx context.Context, filter PropertyPaymentsFilter) ([]PaymentOrder, int64, error)
}

type BankTransactionRepository interface {
	CreateBankTransaction(ctx context.Context, tx any, txRecord *BankTransaction) error
	GetByBankReference(ctx context.Context, bankRef string) (*BankTransaction, error)
	GetByPaymentOrderID(ctx context.Context, paymentOrderID uuid.UUID) (*BankTransaction, error)
	ListTransactionsByPaymentOrderID(ctx context.Context, paymentOrderID uuid.UUID) ([]BankTransaction, error)
	ListTransactionsByReservationID(ctx context.Context, reservationID uuid.UUID) ([]BankTransaction, error)
}

type TransactionManager interface {
	ExecuteInTx(ctx context.Context, fn func(tx any) error) error
}
