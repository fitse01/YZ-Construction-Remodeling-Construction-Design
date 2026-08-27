-- 000001_initial_reservations_schema.up.sql
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL,
    hotel_name VARCHAR(200) NOT NULL,
    room_id UUID NOT NULL,
    room_type VARCHAR(100) NOT NULL,
    guest_name VARCHAR(150) NOT NULL,
    guest_email VARCHAR(150) NOT NULL,
    guest_phone VARCHAR(50),
    stay_nights INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_amount_minor BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
    status VARCHAR(30) NOT NULL DEFAULT 'HELD', -- HELD, CONFIRMED, CANCELLED, EXPIRED
    hold_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_hold_expires ON reservations(hold_expires_at);
