-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Security Hardening — RLS privilege escalation fixes
-- Run in Supabase SQL Editor (or via supabase db push)
--
-- CRITICAL fixes:
--   1. Remove users.tier update privilege — prevents free→pro tier escalation
--   2. Remove overly permissive usage policy — prevents quota manipulation
-- ─────────────────────────────────────────────────────────────────────────────

-- ── FIX 1: Remove the client-side update policy on public.users ───────────────
-- VULNERABILITY: Authenticated users could PATCH /rest/v1/users?id=eq.<uuid>
-- with {"tier":"pro"} and escalate to Pro tier for free.
-- The service_role key (used by the backend) bypasses RLS anyway — no policy needed.
DROP POLICY IF EXISTS "Users can update own row" ON public.users;

-- ── FIX 2: Remove the overly permissive usage policy ─────────────────────────
-- VULNERABILITY: policy "Service can manage usage" used USING (true) without a FOR
-- clause, meaning ALL operations (SELECT, INSERT, UPDATE, DELETE) for ANY
-- authenticated user passed the policy. Users could reset analysis_count to 0
-- or manipulate other users' quota rows.
DROP POLICY IF EXISTS "Service can manage usage" ON public.usage;

-- The service_role key used in quota.ts bypasses RLS entirely — it does NOT need
-- an explicit RLS policy. The remaining SELECT policy for users is sufficient.

-- ── Verify remaining policies ─────────────────────────────────────────────────
-- public.users: only SELECT policy for own row (no client-side writes)
-- public.usage: only SELECT policy for own usage row (no client-side writes)
-- All mutations done via service_role key in backend/lib/quota.ts

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'usage')
ORDER BY tablename, policyname;
