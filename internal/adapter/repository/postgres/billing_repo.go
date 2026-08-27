package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"doki/internal/domain/billing"

	"github.com/google/uuid"
)

type BillingRepo struct {
	db *sql.DB
}

func NewBillingRepo(db *sql.DB) *BillingRepo {
	return &BillingRepo{db: db}
}

// PaymentOrderRepository methods

func (r *BillingRepo) CreateOrder(ctx context.Context, tx any, order *billing.PaymentOrder) error {
	q := getQueryer(r.db, tx)
	query := `
		INSERT INTO billing.payment_orders (
			id, reservation_id, property_id, reference_number, pnr, hotel_name, guest_name,
			stay_nights, check_in_date, check_out_date, amount_minor, currency,
			status, payment_method, receipt_number, staff_id, created_at, expires_at,
			settled_at, voided_at, void_reason, refunded_at, refund_amount_minor, refund_reason
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
		)
	`
	if order.ID == uuid.Nil {
		order.ID = uuid.New()
	}
	if order.CreatedAt.IsZero() {
		order.CreatedAt = time.Now().UTC()
	}

	_, err := q.ExecContext(
		ctx,
		query,
		order.ID,
		order.ReservationID,
		order.PropertyID,
		order.ReferenceNumber,
		order.PNR,
		order.HotelName,
		order.GuestName,
		order.StayNights,
		order.CheckInDate,
		order.CheckOutDate,
		order.AmountMinor,
		order.Currency,
		string(order.Status),
		string(order.PaymentMethod),
		order.ReceiptNumber,
		order.StaffID,
		order.CreatedAt,
		order.ExpiresAt,
		order.SettledAt,
		order.VoidedAt,
		order.VoidReason,
		order.RefundedAt,
		order.RefundAmountMinor,
		order.RefundReason,
	)
	return err
}

func (r *BillingRepo) GetByID(ctx context.Context, id uuid.UUID) (*billing.PaymentOrder, error) {
	query := `
		SELECT id, reservation_id, property_id, reference_number, pnr, hotel_name, guest_name,
		       stay_nights, check_in_date, check_out_date, amount_minor, currency,
		       status, payment_method, COALESCE(receipt_number, ''), staff_id, created_at,
		       expires_at, settled_at, voided_at, COALESCE(void_reason, ''), refunded_at,
		       refund_amount_minor, COALESCE(refund_reason, '')
		FROM billing.payment_orders
		WHERE id = $1
	`
	return r.scanPaymentOrder(r.db.QueryRowContext(ctx, query, id))
}

func (r *BillingRepo) GetByReservationID(ctx context.Context, reservationID uuid.UUID) (*billing.PaymentOrder, error) {
	query := `
		SELECT id, reservation_id, property_id, reference_number, pnr, hotel_name, guest_name,
		       stay_nights, check_in_date, check_out_date, amount_minor, currency,
		       status, payment_method, COALESCE(receipt_number, ''), staff_id, created_at,
		       expires_at, settled_at, voided_at, COALESCE(void_reason, ''), refunded_at,
		       refund_amount_minor, COALESCE(refund_reason, '')
		FROM billing.payment_orders
		WHERE reservation_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	return r.scanPaymentOrder(r.db.QueryRowContext(ctx, query, reservationID))
}

func (r *BillingRepo) ListOrdersByReservationID(ctx context.Context, reservationID uuid.UUID) ([]billing.PaymentOrder, error) {
	query := `
		SELECT id, reservation_id, property_id, reference_number, pnr, hotel_name, guest_name,
		       stay_nights, check_in_date, check_out_date, amount_minor, currency,
		       status, payment_method, COALESCE(receipt_number, ''), staff_id, created_at,
		       expires_at, settled_at, voided_at, COALESCE(void_reason, ''), refunded_at,
		       refund_amount_minor, COALESCE(refund_reason, '')
		FROM billing.payment_orders
		WHERE reservation_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, reservationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []billing.PaymentOrder
	for rows.Next() {
		o, err := r.scanPaymentOrderRows(rows)
		if err != nil {
			return nil, err
		}
		orders = append(orders, *o)
	}
	return orders, rows.Err()
}

func (r *BillingRepo) GetByReferenceNumber(ctx context.Context, ref string) (*billing.PaymentOrder, error) {
	query := `
		SELECT id, reservation_id, property_id, reference_number, pnr, hotel_name, guest_name,
		       stay_nights, check_in_date, check_out_date, amount_minor, currency,
		       status, payment_method, COALESCE(receipt_number, ''), staff_id, created_at,
		       expires_at, settled_at, voided_at, COALESCE(void_reason, ''), refunded_at,
		       refund_amount_minor, COALESCE(refund_reason, '')
		FROM billing.payment_orders
		WHERE reference_number = $1
	`
	return r.scanPaymentOrder(r.db.QueryRowContext(ctx, query, ref))
}

func (r *BillingRepo) GetByReferenceForUpdate(ctx context.Context, tx any, ref string) (*billing.PaymentOrder, error) {
	q := getQueryer(r.db, tx)
	query := `
		SELECT id, reservation_id, property_id, reference_number, pnr, hotel_name, guest_name,
		       stay_nights, check_in_date, check_out_date, amount_minor, currency,
		       status, payment_method, COALESCE(receipt_number, ''), staff_id, created_at,
		       expires_at, settled_at, voided_at, COALESCE(void_reason, ''), refunded_at,
		       refund_amount_minor, COALESCE(refund_reason, '')
		FROM billing.payment_orders
		WHERE reference_number = $1
		FOR UPDATE
	`
	return r.scanPaymentOrder(q.QueryRowContext(ctx, query, ref))
}

func (r *BillingRepo) GetByPNR(ctx context.Context, pnr string) (*billing.PaymentOrder, error) {
	query := `
		SELECT id, reservation_id, property_id, reference_number, pnr, hotel_name, guest_name,
		       stay_nights, check_in_date, check_out_date, amount_minor, currency,
		       status, payment_method, COALESCE(receipt_number, ''), staff_id, created_at,
		       expires_at, settled_at, voided_at, COALESCE(void_reason, ''), refunded_at,
		       refund_amount_minor, COALESCE(refund_reason, '')
		FROM billing.payment_orders
		WHERE pnr = $1
	`
	return r.scanPaymentOrder(r.db.QueryRowContext(ctx, query, pnr))
}

func (r *BillingRepo) UpdateStatus(ctx context.Context, tx any, id uuid.UUID, status billing.PaymentOrderStatus, settledAt *time.Time) error {
	q := getQueryer(r.db, tx)
	query := `
		UPDATE billing.payment_orders
		SET status = $1, settled_at = $2
		WHERE id = $3
	`
	result, err := q.ExecContext(ctx, query, string(status), settledAt, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return billing.ErrPaymentOrderNotFound
	}
	return nil
}

func (r *BillingRepo) VoidOrder(ctx context.Context, tx any, id uuid.UUID, voidedAt time.Time, reason string, staffID *uuid.UUID) error {
	q := getQueryer(r.db, tx)
	query := `
		UPDATE billing.payment_orders
		SET status = $1, voided_at = $2, void_reason = $3, staff_id = $4
		WHERE id = $5
	`
	result, err := q.ExecContext(ctx, query, string(billing.StatusVoided), voidedAt, reason, staffID, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return billing.ErrPaymentOrderNotFound
	}
	return nil
}

func (r *BillingRepo) RefundOrder(ctx context.Context, tx any, id uuid.UUID, refundedAt time.Time, refundAmountMinor int64, reason string, staffID *uuid.UUID) error {
	q := getQueryer(r.db, tx)
	query := `
		UPDATE billing.payment_orders
		SET status = $1, refunded_at = $2, refund_amount_minor = $3, refund_reason = $4, staff_id = $5
		WHERE id = $6
	`
	result, err := q.ExecContext(ctx, query, string(billing.StatusRefunded), refundedAt, refundAmountMinor, reason, staffID, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return billing.ErrPaymentOrderNotFound
	}
	return nil
}

func (r *BillingRepo) ListByProperty(ctx context.Context, filter billing.PropertyPaymentsFilter) ([]billing.PaymentOrder, int64, error) {
	conditions := []string{"property_id = $1"}
	args := []any{filter.PropertyID}
	argIdx := 2

	if filter.Status != "" {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, strings.ToUpper(filter.Status))
		argIdx++
	}
	if filter.PaymentMethod != "" {
		conditions = append(conditions, fmt.Sprintf("payment_method = $%d", argIdx))
		args = append(args, strings.ToUpper(filter.PaymentMethod))
		argIdx++
	}
	if filter.PNR != "" {
		conditions = append(conditions, fmt.Sprintf("pnr = $%d", argIdx))
		args = append(args, strings.ToUpper(filter.PNR))
		argIdx++
	}
	if filter.ReferenceNumber != "" {
		conditions = append(conditions, fmt.Sprintf("reference_number = $%d", argIdx))
		args = append(args, filter.ReferenceNumber)
		argIdx++
	}
	if filter.FromDate != nil {
		conditions = append(conditions, fmt.Sprintf("created_at >= $%d", argIdx))
		args = append(args, *filter.FromDate)
		argIdx++
	}
	if filter.ToDate != nil {
		conditions = append(conditions, fmt.Sprintf("created_at <= $%d", argIdx))
		args = append(args, *filter.ToDate)
		argIdx++
	}

	whereClause := strings.Join(conditions, " AND ")

	// Count query
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM billing.payment_orders WHERE %s", whereClause)
	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Data query
	offset := (filter.Page - 1) * filter.Limit
	dataQuery := fmt.Sprintf(`
		SELECT id, reservation_id, property_id, reference_number, pnr, hotel_name, guest_name,
		       stay_nights, check_in_date, check_out_date, amount_minor, currency,
		       status, payment_method, COALESCE(receipt_number, ''), staff_id, created_at,
		       expires_at, settled_at, voided_at, COALESCE(void_reason, ''), refunded_at,
		       refund_amount_minor, COALESCE(refund_reason, '')
		FROM billing.payment_orders
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	args = append(args, filter.Limit, offset)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var orders []billing.PaymentOrder
	for rows.Next() {
		o, err := r.scanPaymentOrderRows(rows)
		if err != nil {
			return nil, 0, err
		}
		orders = append(orders, *o)
	}

	return orders, total, rows.Err()
}

func (r *BillingRepo) scanPaymentOrder(row *sql.Row) (*billing.PaymentOrder, error) {
	var o billing.PaymentOrder
	var statusStr, methodStr string
	err := row.Scan(
		&o.ID,
		&o.ReservationID,
		&o.PropertyID,
		&o.ReferenceNumber,
		&o.PNR,
		&o.HotelName,
		&o.GuestName,
		&o.StayNights,
		&o.CheckInDate,
		&o.CheckOutDate,
		&o.AmountMinor,
		&o.Currency,
		&statusStr,
		&methodStr,
		&o.ReceiptNumber,
		&o.StaffID,
		&o.CreatedAt,
		&o.ExpiresAt,
		&o.SettledAt,
		&o.VoidedAt,
		&o.VoidReason,
		&o.RefundedAt,
		&o.RefundAmountMinor,
		&o.RefundReason,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, billing.ErrPaymentOrderNotFound
		}
		return nil, err
	}
	o.Status = billing.PaymentOrderStatus(statusStr)
	o.PaymentMethod = billing.PaymentMethod(methodStr)
	return &o, nil
}

func (r *BillingRepo) scanPaymentOrderRows(rows *sql.Rows) (*billing.PaymentOrder, error) {
	var o billing.PaymentOrder
	var statusStr, methodStr string
	err := rows.Scan(
		&o.ID,
		&o.ReservationID,
		&o.PropertyID,
		&o.ReferenceNumber,
		&o.PNR,
		&o.HotelName,
		&o.GuestName,
		&o.StayNights,
		&o.CheckInDate,
		&o.CheckOutDate,
		&o.AmountMinor,
		&o.Currency,
		&statusStr,
		&methodStr,
		&o.ReceiptNumber,
		&o.StaffID,
		&o.CreatedAt,
		&o.ExpiresAt,
		&o.SettledAt,
		&o.VoidedAt,
		&o.VoidReason,
		&o.RefundedAt,
		&o.RefundAmountMinor,
		&o.RefundReason,
	)
	if err != nil {
		return nil, err
	}
	o.Status = billing.PaymentOrderStatus(statusStr)
	o.PaymentMethod = billing.PaymentMethod(methodStr)
	return &o, nil
}

// BankTransactionRepository methods

func (r *BillingRepo) CreateBankTransaction(ctx context.Context, tx any, txRecord *billing.BankTransaction) error {
	q := getQueryer(r.db, tx)
	query := `
		INSERT INTO billing.bank_transactions (
			id, payment_order_id, transaction_type, payment_method, bank_id, bank_name,
			bank_reference, paid_amount_minor, payer_account_number, payer_name,
			receipt_number, staff_id, notes, raw_payload, received_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)
	`
	if txRecord.ID == uuid.Nil {
		txRecord.ID = uuid.New()
	}
	if txRecord.ReceivedAt.IsZero() {
		txRecord.ReceivedAt = time.Now().UTC()
	}

	_, err := q.ExecContext(
		ctx,
		query,
		txRecord.ID,
		txRecord.PaymentOrderID,
		string(txRecord.TransactionType),
		string(txRecord.PaymentMethod),
		txRecord.BankID,
		txRecord.BankName,
		txRecord.BankReference,
		txRecord.PaidAmountMinor,
		txRecord.PayerAccountNumber,
		txRecord.PayerName,
		txRecord.ReceiptNumber,
		txRecord.StaffID,
		txRecord.Notes,
		txRecord.RawPayload,
		txRecord.ReceivedAt,
	)
	return err
}

func (r *BillingRepo) GetByBankReference(ctx context.Context, bankRef string) (*billing.BankTransaction, error) {
	query := `
		SELECT id, payment_order_id, transaction_type, payment_method, COALESCE(bank_id, ''),
		       COALESCE(bank_name, ''), COALESCE(bank_reference, ''), paid_amount_minor,
		       COALESCE(payer_account_number, ''), COALESCE(payer_name, ''),
		       COALESCE(receipt_number, ''), staff_id, COALESCE(notes, ''), raw_payload, received_at
		FROM billing.bank_transactions
		WHERE bank_reference = $1
	`
	var t billing.BankTransaction
	var txTypeStr, methodStr string
	err := r.db.QueryRowContext(ctx, query, bankRef).Scan(
		&t.ID,
		&t.PaymentOrderID,
		&txTypeStr,
		&methodStr,
		&t.BankID,
		&t.BankName,
		&t.BankReference,
		&t.PaidAmountMinor,
		&t.PayerAccountNumber,
		&t.PayerName,
		&t.ReceiptNumber,
		&t.StaffID,
		&t.Notes,
		&t.RawPayload,
		&t.ReceivedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	t.TransactionType = billing.TransactionType(txTypeStr)
	t.PaymentMethod = billing.PaymentMethod(methodStr)
	return &t, nil
}

func (r *BillingRepo) GetByPaymentOrderID(ctx context.Context, paymentOrderID uuid.UUID) (*billing.BankTransaction, error) {
	query := `
		SELECT id, payment_order_id, transaction_type, payment_method, COALESCE(bank_id, ''),
		       COALESCE(bank_name, ''), COALESCE(bank_reference, ''), paid_amount_minor,
		       COALESCE(payer_account_number, ''), COALESCE(payer_name, ''),
		       COALESCE(receipt_number, ''), staff_id, COALESCE(notes, ''), raw_payload, received_at
		FROM billing.bank_transactions
		WHERE payment_order_id = $1
		ORDER BY received_at DESC
		LIMIT 1
	`
	var t billing.BankTransaction
	var txTypeStr, methodStr string
	err := r.db.QueryRowContext(ctx, query, paymentOrderID).Scan(
		&t.ID,
		&t.PaymentOrderID,
		&txTypeStr,
		&methodStr,
		&t.BankID,
		&t.BankName,
		&t.BankReference,
		&t.PaidAmountMinor,
		&t.PayerAccountNumber,
		&t.PayerName,
		&t.ReceiptNumber,
		&t.StaffID,
		&t.Notes,
		&t.RawPayload,
		&t.ReceivedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	t.TransactionType = billing.TransactionType(txTypeStr)
	t.PaymentMethod = billing.PaymentMethod(methodStr)
	return &t, nil
}

func (r *BillingRepo) ListTransactionsByPaymentOrderID(ctx context.Context, paymentOrderID uuid.UUID) ([]billing.BankTransaction, error) {
	query := `
		SELECT id, payment_order_id, transaction_type, payment_method, COALESCE(bank_id, ''),
		       COALESCE(bank_name, ''), COALESCE(bank_reference, ''), paid_amount_minor,
		       COALESCE(payer_account_number, ''), COALESCE(payer_name, ''),
		       COALESCE(receipt_number, ''), staff_id, COALESCE(notes, ''), raw_payload, received_at
		FROM billing.bank_transactions
		WHERE payment_order_id = $1
		ORDER BY received_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, paymentOrderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txs []billing.BankTransaction
	for rows.Next() {
		var t billing.BankTransaction
		var txTypeStr, methodStr string
		if err := rows.Scan(
			&t.ID,
			&t.PaymentOrderID,
			&txTypeStr,
			&methodStr,
			&t.BankID,
			&t.BankName,
			&t.BankReference,
			&t.PaidAmountMinor,
			&t.PayerAccountNumber,
			&t.PayerName,
			&t.ReceiptNumber,
			&t.StaffID,
			&t.Notes,
			&t.RawPayload,
			&t.ReceivedAt,
		); err != nil {
			return nil, err
		}
		t.TransactionType = billing.TransactionType(txTypeStr)
		t.PaymentMethod = billing.PaymentMethod(methodStr)
		txs = append(txs, t)
	}
	return txs, rows.Err()
}

func (r *BillingRepo) ListTransactionsByReservationID(ctx context.Context, reservationID uuid.UUID) ([]billing.BankTransaction, error) {
	query := `
		SELECT t.id, t.payment_order_id, t.transaction_type, t.payment_method, COALESCE(t.bank_id, ''),
		       COALESCE(t.bank_name, ''), COALESCE(t.bank_reference, ''), t.paid_amount_minor,
		       COALESCE(t.payer_account_number, ''), COALESCE(t.payer_name, ''),
		       COALESCE(t.receipt_number, ''), t.staff_id, COALESCE(t.notes, ''), t.raw_payload, t.received_at
		FROM billing.bank_transactions t
		INNER JOIN billing.payment_orders o ON t.payment_order_id = o.id
		WHERE o.reservation_id = $1
		ORDER BY t.received_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, reservationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txs []billing.BankTransaction
	for rows.Next() {
		var t billing.BankTransaction
		var txTypeStr, methodStr string
		if err := rows.Scan(
			&t.ID,
			&t.PaymentOrderID,
			&txTypeStr,
			&methodStr,
			&t.BankID,
			&t.BankName,
			&t.BankReference,
			&t.PaidAmountMinor,
			&t.PayerAccountNumber,
			&t.PayerName,
			&t.ReceiptNumber,
			&t.StaffID,
			&t.Notes,
			&t.RawPayload,
			&t.ReceivedAt,
		); err != nil {
			return nil, err
		}
		t.TransactionType = billing.TransactionType(txTypeStr)
		t.PaymentMethod = billing.PaymentMethod(methodStr)
		txs = append(txs, t)
	}
	return txs, rows.Err()
}

// TransactionManager implementation

func (r *BillingRepo) ExecuteInTx(ctx context.Context, fn func(tx any) error) error {
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}
