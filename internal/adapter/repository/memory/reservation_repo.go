package memory

import (
	"context"
	"fmt"
	"sync"
	"time"

	"doki/internal/domain/reservation"

	"github.com/google/uuid"
)

type ReservationRepo struct {
	mu           sync.RWMutex
	reservations map[uuid.UUID]*reservation.Reservation
}

func NewReservationRepo() *ReservationRepo {
	return &ReservationRepo{
		reservations: make(map[uuid.UUID]*reservation.Reservation),
	}
}

func (r *ReservationRepo) GetByID(ctx context.Context, id uuid.UUID) (*reservation.Reservation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	res, exists := r.reservations[id]
	if !exists {
		return nil, reservation.ErrNotFound
	}
	// Return a copy
	resCopy := *res
	return &resCopy, nil
}

func (r *ReservationRepo) GetByIDForUpdate(ctx context.Context, tx any, id uuid.UUID) (*reservation.Reservation, error) {
	return r.GetByID(ctx, id)
}

func (r *ReservationRepo) Create(ctx context.Context, res *reservation.Reservation) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if res.ID == uuid.Nil {
		res.ID = uuid.New()
	}
	if res.CreatedAt.IsZero() {
		res.CreatedAt = time.Now().UTC()
	}
	res.UpdatedAt = res.CreatedAt

	resCopy := *res
	r.reservations[res.ID] = &resCopy
	return nil
}

func (r *ReservationRepo) Update(ctx context.Context, tx any, res *reservation.Reservation) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.reservations[res.ID]; !exists {
		return reservation.ErrNotFound
	}
	res.UpdatedAt = time.Now().UTC()
	resCopy := *res
	r.reservations[res.ID] = &resCopy
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
	r.mu.Lock()
	defer r.mu.Unlock()

	res, exists := r.reservations[id]
	if !exists {
		return reservation.ErrNotFound
	}

	if string(res.Status) != fromStatus {
		return fmt.Errorf("%w: cannot transition from %s to %s (current: %s)",
			reservation.ErrInvalidStatus, fromStatus, toStatus, res.Status)
	}

	res.Status = reservation.ReservationStatus(toStatus)
	res.SettledReason = reason
	res.UpdatedAt = time.Now().UTC()
	return nil
}
