-- Migration 005: Add pro_expires_at to users table
-- Missing column that caused promo code redemption to fail —
-- redeemCode() was patching { tier, pro_expires_at } but the column didn't exist.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;
