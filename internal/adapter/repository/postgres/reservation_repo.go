package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"doki/internal/domain/reservation"

	"github.com/google/uuid"
)

type ReservationRepo struct {
	db *sql.DB
}

func NewReservationRepo(db *sql.DB) *ReservationRepo {
	return &ReservationRepo{db: db}
}

type queryer interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

func getQueryer(db *sql.DB, tx any) queryer {
	if sqlTx, ok := tx.(*sql.Tx); ok && sqlTx != nil {
		return sqlTx
	}
	return db
}

func (r *ReservationRepo) GetByID(ctx context.Context, id uuid.UUID) (*reservation.Reservation, error) {
	query := `
		SELECT id, hotel_id, hotel_name, room_id, room_type, guest_name, guest_email, 
		       COALESCE(guest_phone, ''), stay_nights, check_in_date, check_out_date, 
		       total_amount_minor, currency, status, hold_expires_at, created_at, updated_at, 
		       COALESCE(settled_reason, '')
		FROM reservations
		WHERE id = $1
	`
	var res reservation.Reservation
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&res.ID,
		&res.HotelID,
		&res.HotelName,
		&res.RoomID,
		&res.RoomType,
		&res.GuestName,
		&res.GuestEmail,
		&res.GuestPhone,
		&res.StayNights,
		&res.CheckInDate,
		&res.CheckOutDate,
		&res.TotalAmountMinor,
		&res.Currency,
		&res.Status,
		&res.HoldExpiresAt,
		&res.CreatedAt,
		&res.UpdatedAt,
		&res.SettledReason,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, reservation.ErrNotFound
		}
		return nil, err
	}
	return &res, nil
}

func (r *ReservationRepo) GetByIDForUpdate(ctx context.Context, tx any, id uuid.UUID) (*reservation.Reservation, error) {
	q := getQueryer(r.db, tx)
	query := `
		SELECT id, hotel_id, hotel_name, room_id, room_type, guest_name, guest_email, 
		       COALESCE(guest_phone, ''), stay_nights, check_in_date, check_out_date, 
		       total_amount_minor, currency, status, hold_expires_at, created_at, updated_at, 
		       COALESCE(settled_reason, '')
		FROM reservations
		WHERE id = $1
		FOR UPDATE
	`
	var res reservation.Reservation
	err := q.QueryRowContext(ctx, query, id).Scan(
		&res.ID,
		&res.HotelID,
		&res.HotelName,
		&res.RoomID,
		&res.RoomType,
		&res.GuestName,
		&res.GuestEmail,
		&res.GuestPhone,
		&res.StayNights,
		&res.CheckInDate,
		&res.CheckOutDate,
		&res.TotalAmountMinor,
		&res.Currency,
		&res.Status,
		&res.HoldExpiresAt,
		&res.CreatedAt,
		&res.UpdatedAt,
		&res.SettledReason,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, reservation.ErrNotFound
		}
		return nil, err
	}
	return &res, nil
}

func (r *ReservationRepo) Create(ctx context.Context, res *reservation.Reservation) error {
	query := `
		INSERT INTO reservations (
			id, hotel_id, hotel_name, room_id, room_type, guest_name, guest_email, guest_phone,
			stay_nights, check_in_date, check_out_date, total_amount_minor, currency, status,
			hold_expires_at, created_at, updated_at, settled_reason
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
		)
	`
	if res.ID == uuid.Nil {
		res.ID = uuid.New()
	}
	if res.CreatedAt.IsZero() {
		res.CreatedAt = time.Now().UTC()
	}
	res.UpdatedAt = res.CreatedAt

	_, err := r.db.ExecContext(
		ctx,
		query,
		res.ID,
		res.HotelID,
		res.HotelName,
		res.RoomID,
		res.RoomType,
		res.GuestName,
		res.GuestEmail,
		res.GuestPhone,
		res.StayNights,
		res.CheckInDate,
		res.CheckOutDate,
		res.TotalAmountMinor,
		res.Currency,
		res.Status,
		res.HoldExpiresAt,
		res.CreatedAt,
		res.UpdatedAt,
		res.SettledReason,
	)
	return err
}

func (r *ReservationRepo) Update(ctx context.Context, tx any, res *reservation.Reservation) error {
	q := getQueryer(r.db, tx)
	query := `
		UPDATE reservations
		SET hotel_name = $2, guest_name = $3, guest_email = $4, guest_phone = $5,
		    stay_nights = $6, check_in_date = $7, check_out_date = $8, total_amount_minor = $9,
		    currency = $10, status = $11, hold_expires_at = $12, updated_at = $13, settled_reason = $14
		WHERE id = $1
	`
	res.UpdatedAt = time.Now().UTC()
	result, err := q.ExecContext(
		ctx,
		query,
		res.ID,
		res.HotelName,
		res.GuestName,
		res.GuestEmail,
		res.GuestPhone,
		res.StayNights,
		res.CheckInDate,
		res.CheckOutDate,
		res.TotalAmountMinor,
		res.Currency,
		res.Status,
		res.HoldExpiresAt,
		res.UpdatedAt,
		res.SettledReason,
	)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return reservation.ErrNotFound
	}
	return nil
}

func (r *ReservationRepo) TransitionReservationStatus(
	ctx context.Context,
	tx any,
	id uuid.UUID,
	fromStatus string,
	toStatus string,
	metadata map[string]any,
	reason string,
) error {
	q := getQueryer(r.db, tx)
	query := `
		UPDATE reservations
		SET status = $1, settled_reason = $2, updated_at = NOW()
		WHERE id = $3 AND status = $4
	`
	result, err := q.ExecContext(ctx, query, toStatus, reason, id, fromStatus)
	if err != nil {
		return fmt.Errorf("failed to execute status transition query: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("%w: reservation %s not in status %s",
			reservation.ErrInvalidStatus, id, fromStatus)
	}
	return nil
}
