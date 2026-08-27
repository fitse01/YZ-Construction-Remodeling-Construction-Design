-- 000007_bank_payments_and_ledger.up.sql
CREATE SCHEMA IF NOT EXISTS billing;

CREATE TABLE IF NOT EXISTS billing.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
    property_id UUID NOT NULL,
    reference_number VARCHAR(100) UNIQUE NOT NULL,
    pnr VARCHAR(20) UNIQUE NOT NULL,
    hotel_name VARCHAR(200) NOT NULL,
    guest_name VARCHAR(150) NOT NULL,
    stay_nights INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    amount_minor BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
    status VARCHAR(30) NOT NULL DEFAULT 'INITIATED', -- INITIATED, SETTLED, VOIDED, REFUNDED, EXPIRED, FAILED
    payment_method VARCHAR(50) NOT NULL DEFAULT 'DIRECT_BANK', -- DIRECT_BANK, CASH, POS, CARD, MANUAL
    receipt_number VARCHAR(100),
    staff_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    settled_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    refunded_at TIMESTAMPTZ,
    refund_amount_minor BIGINT,
    refund_reason TEXT
);

CREATE TABLE IF NOT EXISTS billing.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_order_id UUID NOT NULL REFERENCES billing.payment_orders(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(30) NOT NULL DEFAULT 'CREDIT', -- CREDIT, REFUND, MANUAL_CASH, MANUAL_POS, VOID
    payment_method VARCHAR(30) NOT NULL DEFAULT 'BANK_TRANSFER',
    bank_id VARCHAR(50),
    bank_name VARCHAR(100),
    bank_reference VARCHAR(100),
    paid_amount_minor BIGINT NOT NULL,
    payer_account_number VARCHAR(50),
    payer_name VARCHAR(150),
    receipt_number VARCHAR(100),
    staff_id UUID,
    notes TEXT,
    raw_payload JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_reservation ON billing.payment_orders(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_property ON billing.payment_orders(property_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_ref ON billing.payment_orders(reference_number);
CREATE INDEX IF NOT EXISTS idx_payment_orders_pnr ON billing.payment_orders(pnr);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON billing.payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_bank_tx_order_id ON billing.bank_transactions(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_bank_ref ON billing.bank_transactions(bank_reference);
