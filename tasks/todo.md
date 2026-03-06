# GuardScope — Phase-by-Phase Development Todo List
## Every item must be verified before marking complete.

---

## PRE-DEVELOPMENT (Do Before Writing Code)

- [ ] Register domain: guardscope.io or guardscope.app (~$10–15/year)
- [ ] Register guardscope.com redirect if available
- [ ] Secure @guardscope on Twitter/X
- [ ] Secure @guardscope on YouTube
- [ ] Secure @guardscope on LinkedIn
- [ ] Secure @guardscope on Product Hunt
- [ ] Create dedicated Google account for Chrome Web Store (never personal)
- [ ] Enable 2FA on Chrome Web Store developer account
- [ ] Create Anthropic account + get API key (Claude Haiku + Sonnet)
- [ ] Create VirusTotal account + get free API key
- [ ] Create Google Cloud account + enable Safe Browsing API
- [ ] Create Supabase project
- [ ] Create Vercel account + connect to GitHub
- [ ] Create Stripe account (test mode)
- [ ] Create Upstash Redis instance
- [ ] Create Sentry project (JavaScript/Next.js)
- [ ] Create GitHub repository (branch protection on main, require PR reviews)

---

## PHASE 1 — FOUNDATION & SCAFFOLDING ✅ COMPLETE (2026-03-03)
**Milestone: Open Gmail → click extension → see mock sidebar with sample data**

### 1.1 Project Setup
- [x] Initialize monorepo structure (extension/ + backend/ + tasks/)
- [x] Set up TypeScript config for extension
- [x] Set up Next.js project for backend
- [x] Set up Tailwind CSS in extension sidebar
- [x] Set up .gitignore (no secrets, no node_modules, no .env)
- [x] Create .env.example with all required environment variable names (no values)

### 1.2 Chrome Extension Scaffold (Manifest V3)
- [x] Create manifest.json (MV3, permissions: activeTab + scripting + storage)
- [x] Define content_scripts targeting mail.google.com
- [x] Define service_worker background script
- [x] Create popup.html + Popup.tsx (usage counter, open Gmail CTA)
- [x] Configure Content Security Policy in manifest.json
- [x] Set up extension build system (Vite + CRXJS v2)
- [x] Verify extension loads in Chrome without errors
- [x] Verify popup opens correctly

### 1.3 Gmail Content Script
- [x] Create content.ts — inject sidebar iframe into Gmail DOM (Shadow DOM host)
- [x] Mount React sidebar app into injected iframe
- [x] Verify sidebar renders when Gmail is open ✅ confirmed by user screenshot
- [x] Sidebar uses hashchange + MutationObserver for reliable SPA detection
- [x] Create emailExtractor.ts — extract From name/email from Gmail DOM
- [x] Create emailExtractor.ts — extract Subject from Gmail DOM
- [x] Create emailExtractor.ts — extract email body text (HTML stripped)
- [x] Create emailExtractor.ts — extract all URLs from email body
- [x] Create emailExtractor.ts — extract attachment filenames/types
- [x] Create emailExtractor.ts — extract date/time sent
- [x] Implement multiple fallback selectors for each extracted element

### 1.4 Basic React Sidebar (Mock Data)
- [x] Create App.tsx with hardcoded mock report data (Stitch design)
- [x] Add "Analyze This Email" button
- [x] Display mock risk score (72) — conic gradient circular gauge
- [x] Display mock verdict text + recommendation
- [x] Display mock green flags (2 items) — FlagCard accordion
- [x] Display mock red flags (3 items) — FlagCard accordion with severity badges
- [x] TechnicalDetails collapsible section
- [x] Apply Tailwind dark theme — matches Stitch design (#ef4343 primary)
- [x] "Powered by Claude AI" footer
- [x] ✅ VERIFIED IN GMAIL — screenshot confirmed 2026-03-03

### 1.5 Next.js Backend Setup
- [x] Create Next.js 15 app in backend/ directory
- [x] Create GET /api/health endpoint (returns {status, timestamp, version, service})
- [x] Security headers configured (X-Frame-Options, HSTS, nosniff, Referrer-Policy)
- [x] Deploy to Vercel — https://backend-gules-sigma-37.vercel.app
- [x] Test health endpoint returns 200 on deployed URL — confirmed ✓
- [ ] Store Vercel deployment URL in extension .env

### 1.6 Supabase Setup
- [x] Migration file created: backend/supabase/migrations/001_initial_schema.sql
- [x] users table: id, email, tier, stripe_*, timestamps
- [x] usage table: user_id, analysis_count, month, year — unique per month
- [x] RLS policies written (users see own rows, service key bypasses)
- [x] Auto-create users row trigger on auth.users insert
- [x] Run migration in Supabase SQL editor — done via Management API (project: zfuxxoyjfedmtoeydcvp)
- [x] Verify tables visible with RLS enabled — users ✓ usage ✓ (rowsecurity: true)

### 1.7 Environment Variables
- [x] All 11 backend env vars documented in backend/.env.example
- [x] All 3 extension env vars documented in extension/.env.example
- [x] Verified: NO secrets in extension code or committed to git
- [ ] Add actual values to Vercel once accounts are set up

### 1.8 Phase 1 Milestone Verification ✅
- [x] Open Gmail in Chrome
- [x] Extension auto-injects sidebar when email is opened
- [x] Sidebar: conic gauge 72, HIGH RISK badge, verdict, flags all render
- [x] "Analyze This Email" + "Powered by Claude AI" visible
- [x] Call /api/health from browser → 200 OK ✓
- [x] Supabase dashboard shows tables — users + usage with RLS ✓

---

## PHASE 2 — ANALYSIS ENGINE
**Milestone: Send real suspicious email through pipeline → receive structured JSON report**

### 2.1 Claude Haiku Pre-Scan Integration ✅
- [x] Create lib/claude.ts in backend
- [x] Implement Haiku pre-scan function using Anthropic SDK
- [x] Write system prompt: deterministic checks, JSON output only
- [x] Implement user message template (email headers + body)
- [x] Parse and validate Haiku JSON response structure (with markdown-fence stripping)
- [x] Handle Haiku API errors gracefully (timeout, rate limit) — fallback to pre_score 0
- [x] 8-second SDK timeout configured

### 2.2 Claude Sonnet Deep Analysis Integration ✅
- [x] Implement Sonnet deep analysis function in lib/claude.ts
- [x] Write system prompt: 5-module analysis, JSON output only
- [x] Implement user message template (full email + Haiku results + API data)
- [x] Parse and validate Sonnet JSON response structure
- [x] Handle Sonnet API errors gracefully — falls back to fast report
- [x] 60-second SDK timeout configured

### 2.3 Escalation Logic ✅
- [x] Implement score threshold check: score ≥ 26 → escalate
- [x] Implement VirusTotal flag check: any URL flagged → escalate
- [x] Implement Safe Browsing flag check: any threat → escalate
- [x] Implement fast path: score 0–25 + no flags → return Haiku report
- [x] Test fast path with google.com email (938ms — well under 8s)

### 2.4 DNS Lookup Module (Cloudflare DoH) ✅
- [x] Create lib/dns.ts
- [x] Implement SPF record lookup via Cloudflare DNS over HTTPS
- [x] Implement DKIM record lookup (TXT record _domainkey)
- [x] Implement DMARC record lookup (TXT record _dmarc)
- [x] Parse SPF: extract pass/fail/neutral/none
- [x] Parse DKIM: extract signature present/absent
- [x] Parse DMARC: extract policy (none/quarantine/reject)
- [x] Handle DNS lookup errors (domain not found, timeout)
- [x] Tested with google.com — DMARC reject ✓, RDAP 10398 days old ✓

### 2.5 VirusTotal URL Scanning ✅
- [x] Create lib/virustotal.ts
- [x] Implement cached GET lookup (base64url ID)
- [x] Fire-and-forget submission for uncached URLs
- [x] Parse response: extract malicious count, suspicious count, engine names
- [x] Implement result flagging: any malicious > 0 → flag as CRITICAL
- [x] Handle VirusTotal errors gracefully (404 = clean, other = skip)
- [x] 250ms delay between requests (free tier: 4 req/s)
- [x] Max 10 URLs per call

### 2.6 Google Safe Browsing API ✅
- [x] Create lib/safebrowsing.ts
- [x] Implement URL threat check using Safe Browsing Lookup API v4
- [x] Parse response: extract MALWARE, SOCIAL_ENGINEERING, UNWANTED_SOFTWARE, POTENTIALLY_HARMFUL_APPLICATION
- [x] Handle API errors gracefully (returns flagged: false with error msg)

### 2.7 RDAP Domain Age Lookup ✅
- [x] Create lib/rdap.ts
- [x] Implement RDAP lookup via rdap.org gateway
- [x] Calculate domain age in days from registration event
- [x] Risk classify: < 30 days = HIGH, 30–90 days = MEDIUM, > 90 days = LOW
- [x] Extract registrar name from vcardArray
- [x] Handle RDAP lookup failures (timeout, non-existent domain)
- [x] Tested: google.com → 10398 days, LOW, MarkMonitor Inc. ✓

### 2.8 Parallel Execution Orchestration ✅
- [x] Implement Promise.allSettled() for all 5 calls simultaneously
- [x] Handle individual API failure without failing entire analysis
- [x] Fallback values for each failed module
- [x] All 5 parallel calls complete before escalation decision

### 2.9 Main Analysis Endpoint ✅
- [x] Create POST /api/analyze route in Next.js
- [x] Implement request body validation (fromEmail, subject, bodyText required)
- [x] Implement 500KB payload size limit (reject with 413)
- [x] Call parallel execution → aggregation → escalation → report
- [x] Return structured JSON report response with duration_ms
- [x] Sonnet failure falls back to fast report (graceful degradation)

### 2.10 Phase 2 Milestone Verification ✅ (2026-03-06)
- [x] POST to /api/analyze → receive full JSON report
- [x] report.risk_score present (0-100) ✓
- [x] report.risk_level in expected enum ✓
- [x] report.green_flags and red_flags are arrays ✓
- [x] report.modules has all 5 keys ✓
- [x] Fast path (google.com safe email) = 938ms — well under 8s ✓
- [ ] Escalated path (< 60s) — requires ANTHROPIC_API_KEY in .env.local
- [ ] Vercel prod deploy returns same results (deploy step pending)

### 2.11 InceptionLabs Mercury Integration ✅ (2026-03-06)
- [x] Create lib/inception.ts — Mercury pre-scan + deep analysis via OpenAI-compat API
- [x] POST /api/analyze accepts optional `provider: 'claude' | 'mercury'` field
- [x] Mercury uses mercury-coder-small for pre-scan, mercury-2 for deep analysis
- [x] INCEPTION_API_KEY added to .env.example + .env.local

---

## PHASE 3 — FULL UI & AUTHENTICATION
**Milestone: Complete user journey — sign up → use 5 analyses → hit limit → see upgrade prompt**

### 3.1 Animated Progress Bar Component
- [ ] Create src/sidebar/components/ProgressBar.tsx
- [ ] Implement 7 named steps (from PRD §9.2):
  - Step 1: "Reading email headers and metadata..." (0% → 15%)
  - Step 2: "Verifying sender authentication (SPF · DKIM · DMARC)..." (15% → 30%)
  - Step 3: "Checking domain age and reputation..." (30% → 45%)
  - Step 4: "Scanning all links against threat databases..." (45% → 60%)
  - Step 5: "Running AI pre-assessment..." (60% → 75%)
  - Step 6: "Running deep language and behavior analysis..." (75% → 90%) [if escalated]
  - Step 7: "Generating your security report..." (90% → 100%)
- [ ] Animate bar fill smoothly using CSS transitions
- [ ] Show current step label below bar
- [ ] Implement backend SSE or polling for real-time step updates
- [ ] Test: progress bar advances through all steps during analysis

### 3.2 Risk Score Component
- [ ] Create src/sidebar/components/RiskScore.tsx
- [ ] Implement animated number counter (0 → final score)
- [ ] Implement color transition based on score range:
  - 0–25: green
  - 26–49: yellow-green
  - 50–69: orange
  - 70–84: red
  - 85–100: dark red / critical
- [ ] Show risk level label (SAFE / LOW RISK / MEDIUM RISK / HIGH RISK / CRITICAL)
- [ ] Show risk level icon (✅ / ⚠️ / 🚨)
- [ ] Make score the most prominent element in sidebar

### 3.3 Verdict & Recommendation Display
- [ ] Add verdict line (one bold plain-English sentence) below score
- [ ] Add recommendation action box (color-coded background matching risk level)
- [ ] Recommendation variants:
  - SAFE: "Safe to proceed"
  - LOW: "Proceed with awareness"
  - MEDIUM: "Verify sender before acting"
  - HIGH: "Do not click links or reply"
  - CRITICAL: "Do not engage under any circumstances"

### 3.4 Flag Cards Component
- [ ] Create src/sidebar/components/FlagCard.tsx
- [ ] Implement expandable card for Red Flags section
- [ ] Each red flag shows: label, evidence detail, severity badge, module source
- [ ] Implement expandable card for Green Flags section
- [ ] Each green flag shows: label, detail, module source
- [ ] Add expand/collapse animation
- [ ] Collapsed by default on load
- [ ] Flag count displayed in card header when collapsed

### 3.5 Technical Details Component
- [ ] Create src/sidebar/components/TechnicalDetails.tsx
- [ ] Collapsed by default
- [ ] Show raw header data
- [ ] Show DNS lookup results (SPF/DKIM/DMARC raw values)
- [ ] Show VirusTotal results (engine names, counts)
- [ ] Show RDAP data (registration date, registrar)
- [ ] Format as readable key-value pairs
- [ ] Label section as "Technical Details" with expand toggle

### 3.6 Full Sidebar App.tsx Assembly
- [ ] Wire ProgressBar during analysis state
- [ ] Wire RiskScore after analysis completes
- [ ] Wire Verdict + Recommendation
- [ ] Wire Red Flags card
- [ ] Wire Green Flags card
- [ ] Wire Technical Details (collapsed)
- [ ] Add usage counter footer: "X of 5 free analyses used this month"
- [ ] Add "Analyze This Email" button state management (idle → loading → complete)
- [ ] Handle error state (analysis failed — show retry message)
- [ ] Connect sidebar to background.ts for API calls

### 3.7 Background Service Worker (API Communication)
- [ ] Create background.ts service worker
- [ ] Implement message listener for ANALYZE request from content script
- [ ] Retrieve JWT token from extension secure storage
- [ ] Call backend /api/analyze with JWT header
- [ ] Stream progress updates back to sidebar
- [ ] Return final report to sidebar
- [ ] Handle fetch errors (network down, server error)

### 3.8 Supabase Auth Integration
- [ ] Create src/utils/auth.ts in extension
- [ ] Implement Google OAuth sign-in flow within extension popup
- [ ] Implement email/password sign-in flow within extension popup
- [ ] Store JWT token in Chrome extension secure storage (chrome.storage.local)
- [ ] Implement token refresh logic (JWT expires 1 hour)
- [ ] Implement sign-out function
- [ ] Show login/signup UI in popup when not authenticated
- [ ] Show logged-in state (email, tier badge) in popup when authenticated
- [ ] Test: sign up with Google → token stored → analysis request includes JWT
- [ ] Test: sign out → token cleared → analysis blocked with 401

### 3.9 Usage Limit Enforcement
- [ ] Backend: read analysis count from Supabase on each /api/analyze request
- [ ] Backend: if free user AND count ≥ 5 → return 429 with upgrade message
- [ ] Backend: if Pro user AND count ≥ 150 → return 429 with Team upgrade message
- [ ] Backend: increment count by 1 ONLY after successful analysis
- [ ] Frontend: on 429 response → show upgrade prompt UI in sidebar
- [ ] Frontend: show current usage "X of 5 free analyses" footer
- [ ] Test: run 5 analyses as free user → 6th analysis blocked with upgrade prompt
- [ ] Test: Pro user → no limit at 5 analyses (unlimited)

### 3.10 Extension Popup Polish
- [ ] Show user email address in popup header
- [ ] Show tier badge: FREE / PRO / TEAM
- [ ] Show monthly usage: "3 / 5 analyses used"
- [ ] Show "Upgrade to Pro" CTA button (for free users)
- [ ] Show "Manage Subscription" link (for Pro users)
- [ ] Link to guardscope.io landing page
- [ ] Link to support/help

### 3.11 Phase 3 Milestone Verification
- [ ] New user: sign up with Google → popup shows FREE tier
- [ ] Open email in Gmail → click analyze → progress bar advances through all steps
- [ ] Analysis completes → risk score animates in, flags display
- [ ] Run 5 analyses → usage counter shows "5 / 5"
- [ ] Attempt 6th analysis → upgrade prompt appears in sidebar
- [ ] Upgrade prompt has clear CTA to Pro plan
- [ ] Popup shows correct usage count

---

## PHASE 4 — MONETIZATION & PRODUCTION
**Milestone: Complete payment flow — free user upgrades to Pro → unlimited analyses confirmed**

### 4.1 Stripe Integration — Checkout
- [ ] Create Stripe product "GuardScope Pro" at $4.99/month
- [ ] Create Stripe product "GuardScope Team" at $14.99/month (future)
- [ ] Create lib/stripe.ts in backend
- [ ] Implement POST /api/stripe/checkout — creates Stripe checkout session
- [ ] Checkout session metadata: user_id, plan (pro)
- [ ] Configure success_url and cancel_url
- [ ] Add "Upgrade to Pro" button in extension → opens Stripe checkout in new tab
- [ ] Test: click upgrade → Stripe checkout opens → complete test payment
- [ ] Verify success_url reached after payment

### 4.2 Stripe Webhook Handler
- [ ] Create POST /api/stripe/webhook route
- [ ] Implement Stripe webhook signature verification (STRIPE_WEBHOOK_SECRET)
- [ ] Handle checkout.session.completed → update Supabase user tier to 'pro'
- [ ] Handle customer.subscription.deleted → revert Supabase tier to 'free'
- [ ] Handle customer.subscription.updated → update subscription status
- [ ] Test webhook with Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/webhook
- [ ] Test: complete payment → Supabase user.tier = 'pro' within 60 seconds
- [ ] Test: cancel subscription → Supabase user.tier reverts to 'free'

### 4.3 Subscription Status in Extension
- [ ] Poll Supabase for tier update after payment (extension detects Pro status)
- [ ] Show PRO badge in extension popup after upgrade
- [ ] Remove "5 / 5" limit display for Pro users
- [ ] Show unlimited usage indicator for Pro
- [ ] Test: upgrade → extension shows PRO badge within 60 seconds

### 4.4 Rate Limiting (Upstash Redis)
- [ ] Create lib/redis.ts in backend
- [ ] Implement per-user rate limit: 10 requests per minute
- [ ] Implement per-endpoint rate limit for auth: 3 per minute
- [ ] Return 429 Too Many Requests with Retry-After header
- [ ] Test: send 11 requests in 1 minute → 11th blocked with 429
- [ ] Test: wait 60 seconds → requests succeed again

### 4.5 Security Headers
- [ ] Add to all API responses:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Strict-Transport-Security: max-age=31536000; includeSubDomains
  - Content-Security-Policy (API routes)
- [ ] Configure CORS: allow only guardscope.io + extension origin
- [ ] Reject HTTP connections with 301 redirect to HTTPS
- [ ] Verify headers present on deployed Vercel API

### 4.6 JWT Authentication Hardening
- [ ] Verify JWT validation on ALL endpoints (/api/analyze, /api/usage, /api/stripe/checkout)
- [ ] Return 401 for missing/invalid JWT
- [ ] Return 403 for valid JWT but insufficient tier (team feature as free user)
- [ ] Test: call /api/analyze without token → 401 confirmed
- [ ] Test: call /api/analyze with expired token → 401 confirmed
- [ ] Test: call /api/analyze with valid token → 200 confirmed

### 4.7 Sentry Error Tracking
- [ ] Install Sentry SDK in Next.js backend
- [ ] Install Sentry SDK in Chrome extension
- [ ] Configure Sentry DSN from environment variable
- [ ] Instrument /api/analyze with performance monitoring
- [ ] Set up Sentry alerts: error spike notifications to email
- [ ] Test: trigger a deliberate error → verify Sentry captures it with stack trace
- [ ] Verify Sentry shows transaction traces for /api/analyze

### 4.8 Landing Page
- [ ] Create Next.js landing page at guardscope.io
- [ ] Hero section: headline, subheadline, "Install Free" CTA button
- [ ] Features section: 5 analysis modules (visual cards)
- [ ] How it works section: 3-step visual (open email → click analyze → get report)
- [ ] Pricing section: FREE vs PRO comparison table
- [ ] Demo section: GIF or video of analysis in action
- [ ] FAQ section (at minimum 6 questions)
- [ ] Footer: Privacy Policy link, Terms of Service link, Cookie Policy link
- [ ] Mobile responsive
- [ ] HTTPS confirmed on guardscope.io
- [ ] Google Analytics or Vercel Analytics installed

### 4.9 Legal Documents
- [ ] Write Privacy Policy (cover all items from PRD §13.2):
  - What IS collected (count, timestamp, email address, tier)
  - What is NOT collected (email body, headers, URLs — explicitly stated)
  - Third parties (Anthropic, VirusTotal, GSB, Supabase, Stripe)
  - Data retention policy
  - User rights (access, deletion, export)
  - Contact email for privacy inquiries
  - GDPR compliance section
  - NDPA 2023 (Nigeria) compliance section
- [ ] Publish Privacy Policy at guardscope.io/privacy
- [ ] Write Terms of Service (cover all items from PRD §13.3):
  - Service description + accuracy disclaimer
  - Limitation of liability
  - Acceptable use (own emails only)
  - Subscription terms + refund policy
  - Termination clause
  - Governing law
- [ ] Publish Terms of Service at guardscope.io/terms
- [ ] Write Cookie Policy (Stripe + auth cookies)
- [ ] Publish Cookie Policy at guardscope.io/cookies
- [ ] Sign Supabase Data Processing Agreement (GDPR)

### 4.10 Chrome Web Store Listing Preparation
- [ ] Write extension description (clearly states: reads Gmail emails for security analysis)
- [ ] Prepare 5 screenshots (1280x800):
  1. Sidebar with SAFE email result (green score)
  2. Sidebar with CRITICAL phishing detection (red score + flags)
  3. Progress bar during analysis
  4. Extension popup with usage counter
  5. Technical details expanded
- [ ] Record demo video (60-90 seconds): open Gmail → analyze suspicious email → see report
- [ ] Prepare extension tile icon: 128x128 PNG
- [ ] Prepare extension toolbar icons: 16x16, 32x32, 48x48, 128x128 PNG
- [ ] Write permission justifications for Chrome Web Store review
- [ ] Link Privacy Policy in Web Store listing
- [ ] Complete Chrome Web Store developer registration

### 4.11 Extension Build & Submission
- [ ] Run production build: minify + obfuscate extension code
- [ ] Verify no secrets in built extension files
- [ ] Run npm audit — resolve all critical vulnerabilities
- [ ] Test production build on Chrome, Brave, Edge
- [ ] Create extension .zip package
- [ ] Submit to Chrome Web Store
- [ ] Address any reviewer feedback

### 4.12 Production Deployment & Monitoring
- [ ] Deploy backend to Vercel production environment
- [ ] Configure custom domain on Vercel (api.guardscope.io or via guardscope.io)
- [ ] Verify all environment variables set in Vercel production
- [ ] Verify Sentry receiving production events
- [ ] Set up VirusTotal quota alert at 400/500 daily requests
- [ ] Set up uptime monitoring (UptimeRobot free tier)
- [ ] Set up abuse detection alert in Supabase (50+ analyses/hour from one user)
- [ ] Set up weekly npm audit GitHub Action

### 4.13 Phase 4 Milestone Verification
- [ ] Free user clicks "Upgrade to Pro" in extension → Stripe checkout opens
- [ ] Complete test payment → subscription activated
- [ ] Extension popup shows PRO badge within 60 seconds
- [ ] Pro user runs 6+ analyses → no limit hit (unlimited confirmed)
- [ ] Cancel subscription in Stripe → tier reverts to free
- [ ] All security headers present on API responses
- [ ] Sentry captures test error correctly
- [ ] Landing page live at guardscope.io with all sections
- [ ] Privacy Policy accessible at guardscope.io/privacy
- [ ] Terms of Service accessible at guardscope.io/terms
- [ ] Chrome Web Store listing approved and extension installable

---

## POST-LAUNCH (Ongoing)

### P2 Features (After Stable Launch)
- [ ] Analysis history (30 days) for Pro users
- [ ] Export report as PDF for Pro users
- [ ] Hunter.io email verification integration (V1.1)
- [ ] AbuseIPDB IP reputation integration (V1.1)
- [ ] Gmail DOM watchlist automated weekly tests
- [ ] "Report broken analysis" button in sidebar

### V2 Features (Future)
- [ ] Gmail API with OAuth (after enterprise revenue justifies $15K–$75K/year assessment)
- [ ] Team plan admin dashboard ($14.99/month, 5 seats)
- [ ] Outlook support (separate build, different DOM)
- [ ] Mobile app consideration

### YouTube Series (Parallel to Development)
- [ ] Ep. 1: "I'm building an AI email security extension" — PRD walkthrough
- [ ] Ep. 2: Chrome MV3 deep dive — extension basics, real bugs
- [ ] Ep. 3: Gmail DOM extraction — reading emails from the DOM
- [ ] Ep. 4: The AI Pipeline — Haiku vs Sonnet, prompt engineering, escalation logic
- [ ] Ep. 5: External APIs — VirusTotal, GSB, DNS, RDAP in parallel
- [ ] Ep. 6: Building the UI — React sidebar, progress bar, risk score reveal
- [ ] Ep. 7: Auth & Backend — Supabase, Next.js, JWT, Vercel
- [ ] Ep. 8: The Money Part — Stripe, freemium enforcement, webhooks
- [ ] Ep. 9: Security Deep Dive — every security decision explained
- [ ] Ep. 10: Launch Day — Chrome Web Store, Product Hunt, first user

---

## PHASE DEPENDENCIES

```
PRE-DEVELOPMENT (accounts + domain)
    ↓
PHASE 1 (scaffold + mock UI + backend scaffold + Supabase)
    ↓
PHASE 2 (analysis engine — Claude + external APIs + /api/analyze)
    ↓
PHASE 3 (full UI + auth + usage limits — connects extension to Phase 2 backend)
    ↓
PHASE 4 (Stripe + landing page + legal + Chrome Web Store submission)
    ↓
POST-LAUNCH (monitoring, P2 features, V2 roadmap)
```

---

*Todo created: 2026-03-03 | Do not skip steps. Verify each milestone before proceeding.*
