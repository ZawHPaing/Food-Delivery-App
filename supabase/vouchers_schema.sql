-- Vouchers and order discount support.
-- Run in Supabase SQL editor if you want voucher/discount features.

-- Vouchers table: code-based discounts (percentage or fixed amount).
CREATE TABLE IF NOT EXISTS vouchers (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL,  -- percentage 1-100, or fixed amount in cents
  min_order_cents INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  max_uses INTEGER,  -- NULL = unlimited
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  restaurant_id BIGINT REFERENCES restaurants(id),  -- NULL = global voucher
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON vouchers(is_active) WHERE is_active = true;

-- Optional: add discount columns to orders (run if your orders table exists and doesn't have these).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_cents INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_code TEXT;

COMMENT ON TABLE vouchers IS 'Discount codes: percentage or fixed amount, optional min order and validity window.';

-- Example vouchers (optional; remove or change codes in production):
-- INSERT INTO vouchers (code, discount_type, discount_value, min_order_cents, is_active) VALUES
--   ('SAVE10', 'percentage', 10, 2000, true),
--   ('FLAT5', 'fixed', 500, 1000, true);
