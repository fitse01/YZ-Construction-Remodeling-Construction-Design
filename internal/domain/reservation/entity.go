package reservation

import (
	"time"

	"github.com/google/uuid"
)

type ReservationStatus string

const (
	StatusHeld      ReservationStatus = "HELD"
	StatusConfirmed ReservationStatus = "CONFIRMED"
	StatusCancelled ReservationStatus = "CANCELLED"
	StatusExpired   ReservationStatus = "EXPIRED"
)

// Reservation represents a hotel room booking hold or confirmed stay.
type Reservation struct {
	ID               uuid.UUID         `json:"id"`
	HotelID          uuid.UUID         `json:"hotel_id"`
	HotelName        string            `json:"hotel_name"`
	RoomID           uuid.UUID         `json:"room_id"`
	RoomType         string            `json:"room_type"`
	GuestName        string            `json:"guest_name"`
	GuestEmail       string            `json:"guest_email"`
	GuestPhone       string            `json:"guest_phone,omitempty"`
	StayNights       int               `json:"stay_nights"`
	CheckInDate      time.Time         `json:"check_in_date"`
	CheckOutDate     time.Time         `json:"check_out_date"`
	TotalAmountMinor int64             `json:"total_amount_minor"`
	Currency         string            `json:"currency"`
	Status           ReservationStatus `json:"status"`
	HoldExpiresAt    time.Time         `json:"hold_expires_at"`
	CreatedAt        time.Time         `json:"created_at"`
	UpdatedAt        time.Time         `json:"updated_at"`
	SettledReason    string            `json:"settled_reason,omitempty"`
}

// HoldReservationRequest DTO for holding a room before payment.
type HoldReservationRequest struct {
	HotelID          uuid.UUID `json:"hotel_id" binding:"required"`
	HotelName        string    `json:"hotel_name" binding:"required"`
	RoomID           uuid.UUID `json:"room_id" binding:"required"`
	RoomType         string    `json:"room_type" binding:"required"`
	GuestName        string    `json:"guest_name" binding:"required"`
	GuestEmail       string    `json:"guest_email" binding:"required,email"`
	GuestPhone       string    `json:"guest_phone"`
	StayNights       int       `json:"stay_nights" binding:"required,gt=0"`
	CheckInDate      string    `json:"check_in_date" binding:"required"`  // YYYY-MM-DD
	CheckOutDate     string    `json:"check_out_date" binding:"required"` // YYYY-MM-DD
	TotalAmountMinor int64     `json:"total_amount_minor" binding:"required,gt=0"`
	Currency         string    `json:"currency"`
	HoldDurationMins int       `json:"hold_duration_mins"`
}

// HoldReservationResponse DTO returned after a room hold is placed.
type HoldReservationResponse struct {
	ReservationID    uuid.UUID `json:"reservation_id"`
	HotelName        string    `json:"hotel_name"`
	GuestName        string    `json:"guest_name"`
	StayNights       int       `json:"stay_nights"`
	CheckInDate      string    `json:"check_in_date"`
	CheckOutDate     string    `json:"check_out_date"`
	TotalAmountMinor int64     `json:"total_amount_minor"`
	TotalAmount      float64   `json:"total_amount"`
	Currency         string    `json:"currency"`
	Status           string    `json:"status"`
	HoldExpiresAt    time.Time `json:"hold_expires_at"`
}
