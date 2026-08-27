package reservation

import (
	"context"
	"errors"

	"github.com/google/uuid"
)

var (
	ErrNotFound             = errors.New("reservation not found")
	ErrInvalidStatus        = errors.New("invalid reservation status")
	ErrHoldExpired          = errors.New("reservation hold has expired")
	ErrStatusTransitionFail = errors.New("failed to transition reservation status")
)

type Repository interface {
	GetByID(ctx context.Context, id uuid.UUID) (*Reservation, error)
	GetByIDForUpdate(ctx context.Context, tx any, id uuid.UUID) (*Reservation, error)
	Create(ctx context.Context, res *Reservation) error
	Update(ctx context.Context, tx any, res *Reservation) error
	TransitionReservationStatus(
		ctx context.Context,
		tx any,
		id uuid.UUID,
		fromStatus string,
		toStatus string,
		metadata map[string]any,
		reason string,
	) error
}
