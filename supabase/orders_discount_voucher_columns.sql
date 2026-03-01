-- Add discount and voucher columns to orders so place_order (customer/consumer) can persist them.
-- Run this in Supabase SQL Editor if your orders table doesn't have these columns yet.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS voucher_code text;

COMMENT ON COLUMN public.orders.discount_cents IS 'Discount from voucher in cents';
COMMENT ON COLUMN public.orders.voucher_code IS 'Voucher/promo code applied to this order';
