-- Migration 002: Team tier support + analysis history table
-- Run: supabase db push or copy into Supabase SQL editor

-- ── Teams ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_limit INT NOT NULL DEFAULT 5,
  stripe_subscription_id TEXT,
  paystack_subscription_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  UNIQUE(team_id, user_id)
);

-- Add team_id to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT;

-- ── Analysis History ─────────────────────────────────────────────────────────
-- Stores only metadata — no email content ever stored
CREATE TABLE IF NOT EXISTS public.analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_domain TEXT NOT NULL,          -- sender domain only (not full email)
  risk_level TEXT NOT NULL,           -- SAFE | LOW | MEDIUM | HIGH | CRITICAL
  risk_score INT NOT NULL,
  analysis_path TEXT NOT NULL,        -- mercury_deep | rule_based
  duration_ms INT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast per-user history queries
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON public.analysis_history(user_id, analyzed_at DESC);

-- Keep last 90 days of history only (retention policy via Supabase cron or periodic cleanup)

-- ── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Teams: owner can read/write; members can read
CREATE POLICY "team_owner_all" ON public.teams
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "team_member_read" ON public.teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

-- Team members: users see their own memberships + same team members
CREATE POLICY "own_membership" ON public.team_members
  FOR SELECT USING (user_id = auth.uid());

-- Analysis history: users see their own only
CREATE POLICY "own_history" ON public.analysis_history
  FOR ALL USING (user_id = auth.uid());

-- ── Updated_at trigger for teams ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS teams_updated_at ON public.teams;
CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
