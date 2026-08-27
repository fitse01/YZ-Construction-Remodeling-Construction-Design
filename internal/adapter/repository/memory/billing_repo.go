package memory

import (
	"context"
	"sort"
	"strings"
	"sync"
	"time"

	"doki/internal/domain/billing"

	"github.com/google/uuid"
)

type BillingRepo struct {
	mu           sync.RWMutex
	orders       map[uuid.UUID]*billing.PaymentOrder
	ordersByRef  map[string]uuid.UUID
	ordersByPNR  map[string]uuid.UUID
	ordersByRes  map[uuid.UUID]uuid.UUID
	bankTxs      map[uuid.UUID]*billing.BankTransaction
	bankTxsByRef map[string]uuid.UUID
}

func NewBillingRepo() *BillingRepo {
	return &BillingRepo{
		orders:       make(map[uuid.UUID]*billing.PaymentOrder),
		ordersByRef:  make(map[string]uuid.UUID),
		ordersByPNR:  make(map[string]uuid.UUID),
		ordersByRes:  make(map[uuid.UUID]uuid.UUID),
		bankTxs:      make(map[uuid.UUID]*billing.BankTransaction),
		bankTxsByRef: make(map[string]uuid.UUID),
	}
}

// PaymentOrderRepository implementation

func (r *BillingRepo) CreateOrder(ctx context.Context, tx any, order *billing.PaymentOrder) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if order.ID == uuid.Nil {
		order.ID = uuid.New()
	}
	if order.CreatedAt.IsZero() {
		order.CreatedAt = time.Now().UTC()
	}

	orderCopy := *order
	r.orders[order.ID] = &orderCopy
	r.ordersByRef[order.ReferenceNumber] = order.ID
	r.ordersByPNR[order.PNR] = order.ID
	r.ordersByRes[order.ReservationID] = order.ID
	return nil
}

func (r *BillingRepo) GetByID(ctx context.Context, id uuid.UUID) (*billing.PaymentOrder, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	order, exists := r.orders[id]
	if !exists {
		return nil, billing.ErrPaymentOrderNotFound
	}
	orderCopy := *order
	return &orderCopy, nil
}

func (r *BillingRepo) GetByReservationID(ctx context.Context, reservationID uuid.UUID) (*billing.PaymentOrder, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	orderID, exists := r.ordersByRes[reservationID]
	if !exists {
		return nil, billing.ErrPaymentOrderNotFound
	}
	order, exists := r.orders[orderID]
	if !exists {
		return nil, billing.ErrPaymentOrderNotFound
	}
	orderCopy := *order
	return &orderCopy, nil
}

func (r *BillingRepo) ListOrdersByReservationID(ctx context.Context, reservationID uuid.UUID) ([]billing.PaymentOrder, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []billing.PaymentOrder
	for _, order := range r.orders {
		if order.ReservationID == reservationID {
			result = append(result, *order)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.After(result[j].CreatedAt)
	})
	return result, nil
}

func (r *BillingRepo) GetByReferenceNumber(ctx context.Context, ref string) (*billing.PaymentOrder, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	orderID, exists := r.ordersByRef[ref]
	if !exists {
		return nil, billing.ErrPaymentOrderNotFound
	}
	order, exists := r.orders[orderID]
	if !exists {
		return nil, billing.ErrPaymentOrderNotFound
	}
	orderCopy := *order
	return &orderCopy, nil
}

func (r *BillingRepo) GetByReferenceForUpdate(ctx context.Context, tx any, ref string) (*billing.PaymentOrder, error) {
	return r.GetByReferenceNumber(ctx, ref)
}

func (r *BillingRepo) GetByPNR(ctx context.Context, pnr string) (*billing.PaymentOrder, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	orderID, exists := r.ordersByPNR[pnr]
	if !exists {
		return nil, billing.ErrPaymentOrderNotFound
	}
	order, exists := r.orders[orderID]
	if !exists {
		return nil, billing.ErrPaymentOrderNotFound
	}
	orderCopy := *order
	return &orderCopy, nil
}

func (r *BillingRepo) UpdateStatus(ctx context.Context, tx any, id uuid.UUID, status billing.PaymentOrderStatus, settledAt *time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	order, exists := r.orders[id]
	if !exists {
		return billing.ErrPaymentOrderNotFound
	}
	order.Status = status
	order.SettledAt = settledAt
	return nil
}

func (r *BillingRepo) VoidOrder(ctx context.Context, tx any, id uuid.UUID, voidedAt time.Time, reason string, staffID *uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	order, exists := r.orders[id]
	if !exists {
		return billing.ErrPaymentOrderNotFound
	}
	order.Status = billing.StatusVoided
	order.VoidedAt = &voidedAt
	order.VoidReason = reason
	order.StaffID = staffID
	return nil
}

func (r *BillingRepo) RefundOrder(ctx context.Context, tx any, id uuid.UUID, refundedAt time.Time, refundAmountMinor int64, reason string, staffID *uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	order, exists := r.orders[id]
	if !exists {
		return billing.ErrPaymentOrderNotFound
	}
	order.Status = billing.StatusRefunded
	order.RefundedAt = &refundedAt
	order.RefundAmountMinor = &refundAmountMinor
	order.RefundReason = reason
	order.StaffID = staffID
	return nil
}

func (r *BillingRepo) ListByProperty(ctx context.Context, filter billing.PropertyPaymentsFilter) ([]billing.PaymentOrder, int64, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var matches []billing.PaymentOrder
	for _, order := range r.orders {
		if filter.PropertyID != uuid.Nil && order.PropertyID != filter.PropertyID {
			continue
		}
		if filter.Status != "" && !strings.EqualFold(string(order.Status), filter.Status) {
			continue
		}
		if filter.PaymentMethod != "" && !strings.EqualFold(string(order.PaymentMethod), filter.PaymentMethod) {
			continue
		}
		if filter.PNR != "" && !strings.EqualFold(order.PNR, filter.PNR) {
			continue
		}
		if filter.ReferenceNumber != "" && !strings.EqualFold(order.ReferenceNumber, filter.ReferenceNumber) {
			continue
		}
		if filter.FromDate != nil && order.CreatedAt.Before(*filter.FromDate) {
			continue
		}
		if filter.ToDate != nil && order.CreatedAt.After(*filter.ToDate) {
			continue
		}
		matches = append(matches, *order)
	}

	sort.Slice(matches, func(i, j int) bool {
		return matches[i].CreatedAt.After(matches[j].CreatedAt)
	})

	total := int64(len(matches))
	start := (filter.Page - 1) * filter.Limit
	if start > len(matches) {
		return []billing.PaymentOrder{}, total, nil
	}
	end := start + filter.Limit
	if end > len(matches) {
		end = len(matches)
	}

	return matches[start:end], total, nil
}

// BankTransactionRepository implementation

func (r *BillingRepo) CreateBankTransaction(ctx context.Context, tx any, txRecord *billing.BankTransaction) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if txRecord.ID == uuid.Nil {
		txRecord.ID = uuid.New()
	}
	if txRecord.ReceivedAt.IsZero() {
		txRecord.ReceivedAt = time.Now().UTC()
	}

	txCopy := *txRecord
	r.bankTxs[txRecord.ID] = &txCopy
	if txRecord.BankReference != "" {
		r.bankTxsByRef[txRecord.BankReference] = txRecord.ID
	}
	return nil
}

func (r *BillingRepo) GetByBankReference(ctx context.Context, bankRef string) (*billing.BankTransaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	txID, exists := r.bankTxsByRef[bankRef]
	if !exists {
		return nil, nil
	}
	txRecord, exists := r.bankTxs[txID]
	if !exists {
		return nil, nil
	}
	txCopy := *txRecord
	return &txCopy, nil
}

func (r *BillingRepo) GetByPaymentOrderID(ctx context.Context, paymentOrderID uuid.UUID) (*billing.BankTransaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, txRecord := range r.bankTxs {
		if txRecord.PaymentOrderID == paymentOrderID {
			txCopy := *txRecord
			return &txCopy, nil
		}
	}
	return nil, nil
}

func (r *BillingRepo) ListTransactionsByPaymentOrderID(ctx context.Context, paymentOrderID uuid.UUID) ([]billing.BankTransaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []billing.BankTransaction
	for _, txRecord := range r.bankTxs {
		if txRecord.PaymentOrderID == paymentOrderID {
			result = append(result, *txRecord)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].ReceivedAt.After(result[j].ReceivedAt)
	})
	return result, nil
}

func (r *BillingRepo) ListTransactionsByReservationID(ctx context.Context, reservationID uuid.UUID) ([]billing.BankTransaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	orderIDs := make(map[uuid.UUID]bool)
	for _, order := range r.orders {
		if order.ReservationID == reservationID {
			orderIDs[order.ID] = true
		}
	}

	var result []billing.BankTransaction
	for _, txRecord := range r.bankTxs {
		if orderIDs[txRecord.PaymentOrderID] {
			result = append(result, *txRecord)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].ReceivedAt.After(result[j].ReceivedAt)
	})
	return result, nil
}

// TransactionManager implementation

func (r *BillingRepo) ExecuteInTx(ctx context.Context, fn func(tx any) error) error {
	return fn(nil)
}
