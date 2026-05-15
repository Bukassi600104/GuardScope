# GuardScope Chrome Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish GuardScope to production-launch quality for Chrome Web Store submission at `guardscope.app`.

**Architecture:** Treat this as a two-surface product: a Chrome MV3 Gmail extension in `extension/` and a Next.js 15 API/marketing backend in `backend/`. The work is split into audit, consistency cleanup, security hardening, build verification, Chrome Web Store packaging, and launch operations so each phase is independently reviewable.

**Tech Stack:** Chrome MV3, Vite, CRXJS, React 18, TypeScript, Tailwind CSS, Next.js 15, React 19, Supabase, Upstash Redis, Mercury-2/InceptionLabs, VirusTotal, Google Safe Browsing, PhishTank, URLhaus, Spamhaus, Stripe, Paystack, Sentry, Vercel.

---

## Current Audit Summary

The repo is close to launch, but not yet launch-safe. The main product flow exists: Gmail extraction -> extension side panel -> `/api/analyze` -> rule and threat-intel analysis -> Mercury-2 AI -> risk report. The biggest blockers are consistency, production verification, security proof, Chrome Web Store compliance, and missing automated tests.

Confirmed issues from audit:

- `guardscope.io` still appears in legal copy, email templates, promo errors, task docs, and master plan. Product domain must be `guardscope.app`.
- README and `tasks/MASTER_PLAN.md` still describe Claude Haiku/Sonnet, but implementation uses Mercury-2/InceptionLabs through `backend/lib/inception.ts`.
- Anonymous quota is implemented as 5/day in `backend/lib/ratelimit.ts` and `backend/app/api/analyze/route.ts`, but extension UI still says monthly in `extension/src/utils/i18n.ts` and `extension/src/sidebar/App.tsx`.
- Free authenticated quota appears to remain 5/month through `backend/lib/quota.ts` and `backend/app/api/usage/route.ts`; decide whether that is intentional. The user explicitly specified anonymous users should be 5/day.
- `extension/PERMISSION_JUSTIFICATIONS.md` is stale: it documents `activeTab`, `scripting`, and the old Vercel backend, while `extension/manifest.json` currently requests `storage`, `clipboardWrite`, `sidePanel`, and `tabs`, plus `https://guardscope.app/*`.
- `backend/.env.example` is stale: it still names Anthropic/Claude and says Mercury is optional, but Mercury is the actual provider.
- No test files were found by `rg --files | rg "(test|spec|vitest|jest|playwright|e2e)"`.
- Clean build verification is blocked until dependency installation completes. Prior `npm ci` timed out at 120s in both `backend/` and `extension/`, leaving incomplete `node_modules`; `npm run build` failed because `next` and `vite` were unavailable.
- Promo code system exists: `backend/supabase/migrations/003_promo_codes.sql` seeds 100 codes, `backend/lib/promo.ts` assigns and redeems, `/api/promo/request` sends codes, `/api/promo/validate` upgrades users for 30 days. It still contains `guardscope.io` support addresses and needs concurrency/security testing.

---

## File Responsibility Map

Documentation and launch copy:
- Modify: `README.md` - replace with production-grade GitHub README.
- Modify: `tasks/MASTER_PLAN.md` - update domain, AI provider, pipeline, permission model, quota language.
- Modify: `tasks/todo.md` - update launch status and verification checklist.
- Modify: `extension/PERMISSION_JUSTIFICATIONS.md` - align with actual manifest permissions.
- Optionally create: `docs/CHROME_WEB_STORE_SUBMISSION.md` - listing fields, screenshots, data-use answers.
- Optionally create: `docs/SECURITY_REVIEW.md` - audit findings and hardening checklist.
- Optionally create: `docs/ENVIRONMENT.md` - Vercel, Supabase, extension, and local env setup.

Backend consistency:
- Modify: `backend/.env.example` - Mercury-first envs, app domain, Supabase JWT secret, Redis, email, payment, threat-intel keys.
- Modify: `backend/lib/promo.ts` - support email domain and stronger redemption behavior if needed.
- Modify: `backend/lib/email.ts` - replace support/privacy links with `guardscope.app` addresses.
- Modify: `backend/lib/quota.ts` - update comments and any user-facing quota wording.
- Modify: `backend/app/api/analyze/route.ts` - align authenticated/anonymous limit messages and ensure CORS headers on all 429s.
- Modify: `backend/app/api/promo/request/route.ts` - `guardscope.app` copy and security headers/CORS if needed.
- Modify: `backend/app/api/promo/validate/route.ts` - same response header and brute-force protections.
- Modify: `backend/app/privacy/page.tsx`, `backend/app/terms/page.tsx`, `backend/app/signup/page.tsx`, `backend/app/layout.tsx`, `backend/app/components/Footer.tsx` - domain and quota copy.
- Modify: `backend/app/api/auth/*` routes if security review finds missing consistent headers.

Extension consistency:
- Modify: `extension/.env.example` - set expected `https://guardscope.app` backend example.
- Modify: `extension/src/utils/i18n.ts` - daily quota copy in English and French.
- Modify: `extension/src/sidebar/App.tsx` - all visible quota copy and promo wording.
- Modify: `extension/src/popup/Popup.tsx` - verify usage wording and promo status wording.
- Modify: `extension/manifest.json` only if audit finds permission reduction possible.

Tests and verification:
- Create or modify: backend test setup if we add Node test runner or Vitest.
- Create or modify: extension test setup if we add Vitest.
- Add focused tests for scorer/quota/promo utilities where practical.
- Add manual verification docs for Gmail behavior that cannot be reliably automated locally.

---

## Launch Readiness To-Do List

### Task 1: Establish A Clean Baseline

**Files:**
- Inspect: `backend/package.json`
- Inspect: `extension/package.json`
- Inspect: `backend/package-lock.json`
- Inspect: `extension/package-lock.json`
- Inspect: `git status --short`

- [ ] **Step 1: Clean incomplete dependency installs if needed**

Run:

```powershell
Remove-Item -Recurse -Force backend\node_modules, extension\node_modules -ErrorAction SilentlyContinue
```

Expected: command exits successfully and does not touch source files.

- [ ] **Step 2: Install backend dependencies with enough time**

Run:

```powershell
npm ci --prefix backend
```

Expected: exit code `0`; `backend/node_modules/.bin/next.cmd` exists.

- [ ] **Step 3: Install extension dependencies with enough time**

Run:

```powershell
npm ci --prefix extension
```

Expected: exit code `0`; `extension/node_modules/.bin/vite.cmd` exists.

- [ ] **Step 4: Record baseline build status**

Run:

```powershell
npm run build --prefix backend
npm run build --prefix extension
```

Expected: either both pass, or failures are captured with exact error text before any code changes.

- [ ] **Step 5: Confirm no unintended source changes**

Run:

```powershell
git status --short
```

Expected: only intentionally generated lock/cache artifacts if any; source tree unchanged.

---

### Task 2: Standardize Domain To `guardscope.app`

**Files:**
- Modify: `README.md`
- Modify: `backend/lib/promo.ts`
- Modify: `backend/lib/email.ts`
- Modify: `backend/app/privacy/page.tsx`
- Modify: `backend/app/terms/page.tsx`
- Modify: `backend/app/api/promo/request/route.ts`
- Modify: `tasks/MASTER_PLAN.md`
- Modify: `tasks/todo.md`
- Verify: all repo files except package lock URLs.

- [ ] **Step 1: Find every old domain reference**

Run:

```powershell
rg -n "guardscope\.io|backend-gules-sigma-37\.vercel\.app"
```

Expected: list all stale domain references before editing.

- [ ] **Step 2: Replace user-facing and config defaults**

Replace:

```text
guardscope.io -> guardscope.app
https://backend-gules-sigma-37.vercel.app -> https://guardscope.app
support@guardscope.io -> support@guardscope.app
privacy@guardscope.io -> privacy@guardscope.app
```

Keep historical commit hashes unchanged if any appear in Git metadata only.

- [ ] **Step 3: Verify domain cleanup**

Run:

```powershell
rg -n "guardscope\.io|backend-gules-sigma-37\.vercel\.app"
```

Expected: no matches, unless a changelog explicitly documents historical migration.

---

### Task 3: Standardize AI Provider To Mercury-2

**Files:**
- Modify: `README.md`
- Modify: `backend/.env.example`
- Modify: `backend/lib/types.ts`
- Modify: `backend/lib/inception.ts`
- Modify: `tasks/MASTER_PLAN.md`
- Modify: `tasks/todo.md`

- [ ] **Step 1: Find Claude/Anthropic references**

Run:

```powershell
rg -n "Claude|Haiku|Sonnet|Anthropic|ANTHROPIC"
```

Expected: list all stale provider references.

- [ ] **Step 2: Update env example**

Use Mercury-first wording:

```dotenv
# InceptionLabs Mercury-2 (required)
INCEPTION_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://guardscope.app
NEXT_PUBLIC_SITE_URL=https://guardscope.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
```

Remove `ANTHROPIC_API_KEY` unless there is active fallback code.

- [ ] **Step 3: Remove stale provider types**

If `backend/lib/types.ts` still exports `HaikuResult` and nothing imports it, remove it. Verify with:

```powershell
rg -n "HaikuResult"
```

Expected after edit: no references, or only a deliberate migration note.

- [ ] **Step 4: Verify provider cleanup**

Run:

```powershell
rg -n "Claude|Haiku|Sonnet|Anthropic|ANTHROPIC"
```

Expected: no stale production/docs references. `backend/lib/inception.ts` may mention Mercury comparison only if useful, but avoid marketing claims that require proof.

---

### Task 4: Fix Quota Copy And Server Responses

**Files:**
- Modify: `extension/src/utils/i18n.ts`
- Modify: `extension/src/sidebar/App.tsx`
- Modify: `backend/app/api/analyze/route.ts`
- Modify: `backend/lib/quota.ts`
- Modify: `backend/app/signup/page.tsx`
- Review: `backend/app/pricing/page.tsx`, `backend/app/page.tsx`, `backend/app/features/page.tsx`, `backend/app/how-it-works/page.tsx`

- [ ] **Step 1: Confirm intended quota model**

Document this model in `README.md` and code comments:

```text
Anonymous users: 5 analyses per day per IP.
Signed-in free users: 5 analyses per month per account, unless changed later.
Pro and Team users: unlimited, subject to abuse rate limits.
Promo users: Pro for 30 days after redemption.
```

If signed-in free users should also be 5/day, update `backend/lib/quota.ts` and `backend/app/api/usage/route.ts` in the same task.

- [ ] **Step 2: Update anonymous UI copy**

Replace anonymous copy such as:

```text
You've used all 5 free analyses this month.
Anonymous · {anonCount}/5 free this month
5 free analyses/month
```

With:

```text
You've used all 5 free analyses today.
Anonymous · {anonCount}/5 free today
5 free analyses/day
```

- [ ] **Step 3: Keep signed-in free copy distinct**

Where copy refers to authenticated free usage, keep or clarify:

```text
Signed-in free accounts include 5 analyses per month.
Upgrade to Pro for unlimited analyses.
```

- [ ] **Step 4: Fix backend 429 headers**

Ensure every `NextResponse.json(..., { status: 429 })` in `/api/analyze` includes `headers: SECURITY_HEADERS`, including the authenticated quota response.

- [ ] **Step 5: Verify quota wording**

Run:

```powershell
rg -n "this month|per month|/month|monthly|5 analyses/month|5 free analyses/month|5 free analyses this month|5 analyses per day|free today"
```

Expected: monthly wording remains only where it describes signed-in free account quota or paid subscription billing; anonymous quota copy says daily.

---

### Task 5: Chrome Web Store Permission And Data-Use Cleanup

**Files:**
- Modify: `extension/PERMISSION_JUSTIFICATIONS.md`
- Review: `extension/manifest.json`
- Create: `docs/CHROME_WEB_STORE_SUBMISSION.md`

- [ ] **Step 1: Align permission justifications with manifest**

Document only actual permissions:

```text
storage: auth/session state, onboarding flag, current email cache, local history
clipboardWrite: copy report action
sidePanel: Gmail analysis panel
tabs: detect Gmail tab, open onboarding/signup/upgrade/Gmail tabs, configure side panel per tab
host permission https://mail.google.com/*: Gmail content script
host permission https://guardscope.app/*: backend API and web pages
host permission Supabase URL: authentication
```

Remove stale `activeTab`, `scripting`, and old Vercel URL sections unless the manifest is changed to reintroduce them.

- [ ] **Step 2: Verify minimum permissions**

Review whether `tabs` can be replaced by narrower alternatives. If it cannot, explain every usage from `extension/src/background.ts`, `extension/src/sidebar/App.tsx`, `extension/src/popup/Popup.tsx`, and `extension/src/onboarding/onboarding.tsx`.

- [ ] **Step 3: Prepare CWS submission doc**

Create `docs/CHROME_WEB_STORE_SUBMISSION.md` with:

```text
Extension name
Short description
Detailed description
Single purpose statement
Permission justification answers
Data use disclosure answers
Remote code statement: no remote code execution, no eval, no external scripts
Screenshots required: safe result, critical result, progress, popup, technical details, onboarding
Demo video script: 60-90 seconds
Privacy policy URL: https://guardscope.app/privacy
Support email: support@guardscope.app
```

- [ ] **Step 4: Verify CWS references**

Run:

```powershell
rg -n "activeTab|scripting|backend-gules|guardscope\.io|Chrome Web Store|Data Use"
```

Expected: no stale permission/domain references.

---

### Task 6: Promo Code Launch Path Review

**Files:**
- Review/modify: `backend/supabase/migrations/003_promo_codes.sql`
- Review/modify: `backend/supabase/migrations/005_add_pro_expires_at.sql`
- Modify: `backend/lib/promo.ts`
- Modify: `backend/app/api/promo/request/route.ts`
- Modify: `backend/app/api/promo/validate/route.ts`
- Modify: `backend/app/page.tsx`
- Modify: `backend/app/pricing/page.tsx`
- Modify: `extension/src/sidebar/App.tsx`
- Modify: `extension/src/popup/Popup.tsx`

- [ ] **Step 1: Confirm promo data model**

Validate migration fields:

```sql
promo_codes.status in ('unused', 'claimed', 'expired')
promo_codes.claim_deadline defaults to now() + interval '30 days'
users.pro_expires_at exists
100 unique codes are seeded
```

- [ ] **Step 2: Fix support domain in promo errors**

Replace any promo flow copy using `support@guardscope.io` with `support@guardscope.app`.

- [ ] **Step 3: Review assignment race condition**

Current flow reads the first unused code, then patches it. Under high concurrency, two leads may select the same row before patch. Keep the `status=eq.unused` guard, then add handling when `PATCH` returns zero rows: retry up to 3 times before returning `null`.

- [ ] **Step 4: Make promo status truthful**

`/api/promo/status` should report available only when at least one unassigned, unexpired code remains. Verify `countRemainingCodes()` and status route use the same logic.

- [ ] **Step 5: Verify redemption security**

Confirm:

```text
JWT is required.
JWT email must match request email.
Code is uppercased and length capped.
Rate limiting applies to validate attempts.
Claim update is atomic with status=unused.
User upgrade writes tier=pro and pro_expires_at.
```

- [ ] **Step 6: Define launch operations for 100 codes**

Document:

```text
How to run migration 003.
How to verify total unused codes.
How to export assigned leads.
How to resend a code to a lead.
How to manually upgrade if redemption fails.
How to expire or revoke a code.
```

---

### Task 7: Security Hardening Pass

**Files:**
- Review/modify: `backend/lib/quota.ts`
- Review/modify: `backend/lib/ratelimit.ts`
- Review/modify: `backend/lib/cors.ts`
- Review/modify: `backend/app/api/analyze/route.ts`
- Review/modify: `backend/app/api/auth/*/route.ts`
- Review/modify: `backend/app/api/promo/*/route.ts`
- Review/modify: `backend/app/api/stripe/webhook/route.ts`
- Review/modify: `backend/app/api/paystack/webhook/route.ts`
- Review/modify: `extension/src/background.ts`
- Review/modify: `extension/manifest.json`
- Create: `docs/SECURITY_REVIEW.md`

- [ ] **Step 1: JWT verification**

Confirm production hard-fails without:

```text
SUPABASE_JWT_SECRET
SUPABASE_SERVICE_ROLE_KEY
```

Current `backend/lib/quota.ts` already throws if `SUPABASE_JWT_SECRET` is missing in production. Verify Vercel env includes it before launch.

- [ ] **Step 2: Anonymous quota bypass review**

Review IP detection in `/api/analyze`. If deploying on Vercel, prefer `x-forwarded-for` first IP as currently implemented, but document that IP quotas are best-effort and supplement with Upstash rate limits.

- [ ] **Step 3: CORS consistency**

Every API route that is called from extension or frontend should use `buildCorsHeaders(req)`. Promo routes currently use static security headers only; update if extension/browser calls require CORS.

- [ ] **Step 4: Security headers consistency**

Standardize API response headers:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Access-Control-Allow-Origin: allowed origin
```

- [ ] **Step 5: Input size limits**

Confirm these are enforced:

```text
/api/analyze content-length <= 500KB
bodyText <= 50KB before analysis
Mercury body passed <= 6000 chars
promo name <= 100
promo email <= 254
promo country <= 100
promo code <= 30
```

- [ ] **Step 6: Extension message security**

Review `extension/src/background.ts`:

```text
OPEN_SIDE_PANEL only from Gmail content script
GET_TAB_ID only from Gmail content script
ANALYZE, SIGN_IN, SIGN_OUT, GET_AUTH, GET_HISTORY only from trusted internal sender
No external web page can trigger analysis
```

- [ ] **Step 7: Secret exposure review**

Run:

```powershell
rg -n "sk-|ANTHROPIC_API_KEY|INCEPTION_API_KEY|SUPABASE_SERVICE|STRIPE_SECRET|PAYSTACK_SECRET|VIRUSTOTAL_API_KEY|GOOGLE_SAFE_BROWSING_API_KEY|SENTRY_DSN|UPSTASH"
```

Expected: only env examples, server-side env reads, or docs. No real secret values.

- [ ] **Step 8: Record residual risks**

Create `docs/SECURITY_REVIEW.md` with:

```text
Implemented controls
Known limitations
Required Vercel env variables
Required Supabase RLS/migration checks
Manual launch checklist
```

---

### Task 8: Add Focused Automated Tests

**Files:**
- Modify: `backend/package.json`
- Create: `backend/tests/scorer.test.ts`
- Create: `backend/tests/quota-jwt.test.ts`
- Create: `backend/tests/promo.test.ts` if fetch mocking is practical.
- Modify: `extension/package.json`
- Create: `extension/src/utils/emailExtractor.test.ts` if DOM fixtures are manageable.

- [ ] **Step 1: Choose test runner**

Use Node's built-in test runner if possible to keep dependencies light, or Vitest if TypeScript ergonomics matter.

- [ ] **Step 2: Test risk threshold mapping**

Cover `scoreToLevel()`:

```text
0-25 SAFE
26-49 LOW
50-69 MEDIUM
70-84 HIGH
85-100 CRITICAL
```

- [ ] **Step 3: Test JWT rejection logic**

Cover:

```text
malformed JWT returns null
expired JWT returns null
non-UUID sub returns null
production without JWT secret rejects
```

- [ ] **Step 4: Test promo code normalization**

Cover:

```text
lowercase code input becomes uppercase
overlong code is capped before validation route
email mismatch with JWT returns 403
unauthenticated redemption returns 401
```

- [ ] **Step 5: Run tests in CI-like mode**

Run:

```powershell
npm test --prefix backend
npm test --prefix extension
```

Expected: exit code `0`.

---

### Task 9: Rewrite README For GitHub

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace stale README**

README should include:

```text
GuardScope overview
Current status: pre-launch / Chrome Web Store preparation
Architecture diagram
Repo layout
Feature list
Analysis pipeline
Security and privacy guarantees
Quota model
Promo code beta model
Tech stack
Environment variables
Local development
Build commands
Testing commands
Deployment checklist
Chrome Web Store checklist
Roadmap
License/status note
```

- [ ] **Step 2: Keep claims aligned with code**

Use:

```text
Mercury-2 by InceptionLabs
guardscope.app
anonymous: 5/day
signed-in free: 5/month, if retained
Pro promo: 30 days unlimited
email content analyzed transiently and not stored
```

- [ ] **Step 3: Verify README references**

Run:

```powershell
rg -n "Claude|Haiku|Sonnet|guardscope\.io|backend-gules|5 analyses/month|activeTab|scripting" README.md
```

Expected: no stale references except intentional explanation of signed-in free monthly quota if kept.

---

### Task 10: Production Build And Package Verification

**Files:**
- Verify: `backend/package.json`
- Verify: `extension/package.json`
- Verify: `extension/dist/`

- [ ] **Step 1: Backend build**

Run:

```powershell
npm run build --prefix backend
```

Expected: Next.js build exits `0`.

- [ ] **Step 2: Extension build**

Run:

```powershell
npm run build --prefix extension
```

Expected: Vite/CRXJS build exits `0` and `extension/dist/manifest.json` exists.

- [ ] **Step 3: Inspect extension package**

Run:

```powershell
Get-ChildItem extension\dist -Recurse | Select-Object FullName,Length
```

Expected:

```text
manifest.json present
icons present
sidebar HTML present
onboarding HTML present
no source maps if sourcemap false
no .env files
no service keys
```

- [ ] **Step 4: Static extension security scan**

Run:

```powershell
rg -n "eval\(|new Function|http://|ANTHROPIC|SUPABASE_SERVICE|INCEPTION_API_KEY|STRIPE_SECRET|PAYSTACK_SECRET" extension\dist
```

Expected: no dangerous runtime patterns or server secrets.

---

### Task 11: Manual Gmail QA Matrix

**Files:**
- Create: `docs/MANUAL_QA.md`

- [ ] **Step 1: Install local extension build**

Load `extension/dist/` through Chrome Extensions -> Developer mode -> Load unpacked.

- [ ] **Step 2: Verify onboarding**

Expected:

```text
First install opens onboarding.
Privacy link points to https://guardscope.app/privacy.
Activation opens or focuses Gmail.
```

- [ ] **Step 3: Verify Gmail extraction**

Test:

```text
ordinary email
email with multiple links
email with attachment
forwarded email
Gmail auth expanded header showing mailed-by/signed-by
```

- [ ] **Step 4: Verify analysis UI states**

Test:

```text
no email selected
analyzing progress
safe result
high/critical result
technical details
copy report
local history
extension badge
limit reached
promo redemption
network/server error
```

- [ ] **Step 5: Verify quota behavior**

Expected:

```text
Anonymous analyses 1-5 succeed.
Anonymous analysis 6 returns daily limit messaging.
Signed-in free quota behaves according to decided model.
Pro promo account has unlimited analyses subject to rate limit.
```

---

### Task 12: Deployment And Launch Operations

**Files:**
- Create: `docs/DEPLOYMENT.md`
- Verify: Vercel project settings
- Verify: Supabase migrations
- Verify: Chrome Web Store package

- [ ] **Step 1: Vercel env checklist**

Document and configure:

```text
NEXT_PUBLIC_APP_URL=https://guardscope.app
NEXT_PUBLIC_SITE_URL=https://guardscope.app
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
INCEPTION_API_KEY
VIRUSTOTAL_API_KEY
GOOGLE_SAFE_BROWSING_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY
SENTRY_DSN
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET if payments are enabled later
PAYSTACK_SECRET_KEY, PAYSTACK_PRO_PLAN_CODE if payments are enabled later
```

- [ ] **Step 2: Supabase migration verification**

Run or verify migrations:

```text
001_initial_schema.sql
002_team_and_history.sql
003_promo_codes.sql
004_security_hardening.sql
005_add_pro_expires_at.sql
```

Check:

```sql
select count(*) from promo_codes;
select status, count(*) from promo_codes group by status;
select column_name from information_schema.columns where table_name = 'users' and column_name = 'pro_expires_at';
```

- [ ] **Step 3: Production API smoke tests**

Run:

```powershell
Invoke-RestMethod https://guardscope.app/api/health
```

Expected: healthy JSON response.

- [ ] **Step 4: Chrome Web Store ZIP**

Create a ZIP from `extension/dist/`, not from source.

Expected: ZIP includes manifest/icons/assets/scripts only and no secrets.

- [ ] **Step 5: Final submission checklist**

Confirm:

```text
Privacy policy live
Terms live
Support email active
Screenshots ready
Demo video ready
Permission justifications ready
Data-use disclosure matches implementation
Remote-code answer says no remote code
```

---

## Execution Order

1. Clean baseline and dependency install.
2. Domain, LLM, and quota consistency fixes.
3. Permission/data-use docs and README rewrite.
4. Promo-code flow hardening.
5. Security hardening and focused tests.
6. Full backend and extension build verification.
7. Manual Gmail QA.
8. Vercel/Supabase production deployment verification.
9. Chrome Web Store package and submission assets.

---

## Completion Criteria

GuardScope is ready to submit to Chrome Web Store when all are true:

- `rg -n "guardscope\.io|backend-gules|Claude|Haiku|Sonnet|ANTHROPIC"` shows no stale production references.
- README accurately documents Mercury-2, `guardscope.app`, quota model, setup, build, security, privacy, promo codes, and launch status.
- `extension/PERMISSION_JUSTIFICATIONS.md` exactly matches `extension/manifest.json`.
- `npm ci --prefix backend` and `npm ci --prefix extension` complete.
- `npm run build --prefix backend` exits `0`.
- `npm run build --prefix extension` exits `0`.
- Focused backend/extension tests pass, or documented manual verification covers any unautomatable browser behavior.
- Production `https://guardscope.app/api/health` responds successfully.
- Promo code count and redemption flow are verified against Supabase.
- Chrome Web Store package is built from `extension/dist/` and scanned for secrets/remote code.
- Manual Gmail QA is complete across safe, suspicious, quota, auth, promo, and error states.

