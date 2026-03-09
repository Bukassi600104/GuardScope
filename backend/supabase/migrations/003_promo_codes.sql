-- ─────────────────────────────────────────────────────────────
-- Migration 003: Promo Codes — Early Access System
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'claimed', 'expired')),
  -- Lead data (collected from landing page form)
  requester_name    TEXT,
  requester_email   TEXT,
  requester_country TEXT,
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claim_deadline    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  claimed_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at        TIMESTAMPTZ,
  pro_expires_at    TIMESTAMPTZ  -- claimed_at + 30 days
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_promo_codes_code    ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_email   ON promo_codes(requester_email);
CREATE INDEX IF NOT EXISTS idx_promo_codes_status  ON promo_codes(status);

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can write; no public read (codes are secret)
CREATE POLICY "service_role_all" ON promo_codes
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Auto-expire codes past their claim_deadline (run as cron or on each request)
-- We handle expiry in application code for simplicity.

-- ─────────────────────────────────────────────────────────────
-- Seed 100 unique promo codes
-- Format: GS-XXXXXX (6 uppercase alphanumeric, prefix GS-)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I to avoid confusion
  code  TEXT;
  i     INT;
BEGIN
  FOR i IN 1..100 LOOP
    LOOP
      -- Generate 8-char random code
      code := 'GS-' ||
        substr(chars, floor(random()*32)::int+1, 1) ||
        substr(chars, floor(random()*32)::int+1, 1) ||
        substr(chars, floor(random()*32)::int+1, 1) ||
        substr(chars, floor(random()*32)::int+1, 1) ||
        substr(chars, floor(random()*32)::int+1, 1) ||
        substr(chars, floor(random()*32)::int+1, 1) ||
        substr(chars, floor(random()*32)::int+1, 1) ||
        substr(chars, floor(random()*32)::int+1, 1);
      -- Retry if duplicate
      EXIT WHEN NOT EXISTS (SELECT 1 FROM promo_codes WHERE promo_codes.code = code);
    END LOOP;
    INSERT INTO promo_codes (code) VALUES (code);
  END LOOP;
END $$;

-- Verify
SELECT COUNT(*) AS total_codes, status FROM promo_codes GROUP BY status;
