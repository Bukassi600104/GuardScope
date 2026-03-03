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

## PHASE 1 — FOUNDATION & SCAFFOLDING
**Milestone: Open Gmail → click extension → see mock sidebar with sample data**

### 1.1 Project Setup
- [ ] Initialize monorepo structure (extension/ + backend/ + landing/ + tasks/)
- [ ] Set up TypeScript config for extension
- [ ] Set up Next.js project for backend
- [ ] Set up Tailwind CSS in extension sidebar
- [ ] Configure ESLint + Prettier across all packages
- [ ] Set up .gitignore (no secrets, no node_modules, no .env)
- [ ] Create .env.example with all required environment variable names (no values)

### 1.2 Chrome Extension Scaffold (Manifest V3)
- [ ] Create manifest.json (MV3, minimal permissions: activeTab + scripting only)
- [ ] Define content_scripts targeting mail.google.com
- [ ] Define service_worker background script
- [ ] Create popup.html + popup.tsx (login status, usage counter)
- [ ] Configure Content Security Policy in manifest.json
- [ ] Set up extension build system (webpack or vite)
- [ ] Verify extension loads in Chrome without errors
- [ ] Verify popup opens correctly

### 1.3 Gmail Content Script
- [ ] Create content.ts — inject sidebar container div into Gmail DOM
- [ ] Mount React sidebar app into injected container
- [ ] Verify sidebar renders when Gmail is open
- [ ] Verify sidebar does NOT render on non-Gmail pages
- [ ] Create emailExtractor.ts — extract From address from Gmail DOM
- [ ] Create emailExtractor.ts — extract Subject from Gmail DOM
- [ ] Create emailExtractor.ts — extract email body text (HTML stripped)
- [ ] Create emailExtractor.ts — extract all URLs from email body
- [ ] Create emailExtractor.ts — extract attachment filenames/types
- [ ] Create emailExtractor.ts — extract date/time sent
- [ ] Create emailExtractor.ts — access email headers (trigger "Show original")
- [ ] Implement multiple fallback selectors for each extracted element
- [ ] Test extraction on: standard email, email with attachments, forwarded email
- [ ] Console.log extracted data to verify correctness

### 1.4 Basic React Sidebar (Mock Data)
- [ ] Create App.tsx with hardcoded mock report data
- [ ] Add "Analyze This Email" button (no functionality yet)
- [ ] Display mock risk score (hardcoded: 72)
- [ ] Display mock verdict text
- [ ] Display mock green flags (2 items)
- [ ] Display mock red flags (3 items)
- [ ] Apply Tailwind styling — clean, professional layout
- [ ] Verify sidebar renders correctly at different Gmail viewport widths

### 1.5 Next.js Backend Setup
- [ ] Create Next.js app in backend/ directory
- [ ] Create GET /api/health endpoint (returns { status: "ok", timestamp })
- [ ] Deploy to Vercel (even with just health endpoint)
- [ ] Test health endpoint returns 200 on deployed URL
- [ ] Store Vercel deployment URL for extension config

### 1.6 Supabase Setup
- [ ] Create `users` table with: id, email, tier (free/pro/team), created_at
- [ ] Create `usage` table with: id, user_id, analysis_count, month, year
- [ ] Enable Row-Level Security (RLS) on all tables
- [ ] Write RLS policies: users can only read/write their own rows
- [ ] Test RLS policies work correctly
- [ ] Get Supabase project URL and anon key for backend .env

### 1.7 Environment Variables
- [ ] Add to Vercel: ANTHROPIC_API_KEY
- [ ] Add to Vercel: SUPABASE_URL
- [ ] Add to Vercel: SUPABASE_SERVICE_KEY
- [ ] Add to Vercel: VIRUSTOTAL_API_KEY
- [ ] Add to Vercel: GOOGLE_SAFE_BROWSING_API_KEY
- [ ] Add to Vercel: STRIPE_SECRET_KEY
- [ ] Add to Vercel: STRIPE_WEBHOOK_SECRET
- [ ] Add to Vercel: UPSTASH_REDIS_URL
- [ ] Add to Vercel: UPSTASH_REDIS_TOKEN
- [ ] Add to Vercel: SENTRY_DSN
- [ ] Verify NO secrets exist in extension code or committed to git

### 1.8 Phase 1 Milestone Verification
- [ ] Open Gmail in Chrome
- [ ] Click GuardScope extension icon
- [ ] Sidebar slides in from right
- [ ] Mock data renders: score, verdict, flags
- [ ] Call /api/health from browser → 200 OK confirmed
- [ ] Supabase dashboard shows tables with RLS enabled

---

## PHASE 2 — ANALYSIS ENGINE
**Milestone: Send real suspicious email through pipeline → receive structured JSON report**

### 2.1 Claude Haiku Pre-Scan Integration
- [ ] Create lib/claude.ts in backend
- [ ] Implement Haiku pre-scan function using Anthropic SDK
- [ ] Write system prompt (from PRD §20.1): deterministic checks, JSON output only
- [ ] Implement user message template (email headers + body)
- [ ] Parse and validate Haiku JSON response structure
- [ ] Handle Haiku API errors gracefully (timeout, rate limit)
- [ ] Test: send real email data → verify pre_score, signals, urls_found, escalate_to_sonnet
- [ ] Verify Haiku responds within 8 seconds for typical emails

### 2.2 Claude Sonnet Deep Analysis Integration
- [ ] Implement Sonnet deep analysis function in lib/claude.ts
- [ ] Write system prompt (from PRD §20.1): 5-module analysis, JSON output only
- [ ] Implement user message template (full email + Haiku results + API data)
- [ ] Parse and validate Sonnet JSON response structure
- [ ] Handle Sonnet API errors gracefully (timeout, rate limit, long response)
- [ ] Test: send suspicious email → verify full report JSON with all fields
- [ ] Verify Sonnet responds within 60 seconds

### 2.3 Escalation Logic
- [ ] Implement score threshold check: score ≥ 26 → escalate
- [ ] Implement VirusTotal flag check: any URL flagged → escalate
- [ ] Implement combined decision: if either condition met → Sonnet
- [ ] Implement fast path: score 0–25 + no VirusTotal → return Haiku report
- [ ] Test fast path with known safe email (< 8s)
- [ ] Test escalation path with suspicious email (< 60s)

### 2.4 DNS Lookup Module (Cloudflare DoH)
- [ ] Create lib/dns.ts
- [ ] Implement SPF record lookup via Cloudflare DNS over HTTPS (TXT record)
- [ ] Implement DKIM record lookup (TXT record _domainkey)
- [ ] Implement DMARC record lookup (TXT record _dmarc)
- [ ] Parse SPF: extract pass/fail/neutral/none
- [ ] Parse DKIM: extract signature present/absent/invalid
- [ ] Parse DMARC: extract policy (none/quarantine/reject)
- [ ] Handle DNS lookup errors (domain not found, timeout)
- [ ] Test with known good domain (google.com) — verify all pass
- [ ] Test with suspicious domain — verify fails

### 2.5 VirusTotal URL Scanning
- [ ] Create lib/virustotal.ts
- [ ] Implement URL submission to VirusTotal v3 API
- [ ] Implement batch URL scanning for all URLs in email
- [ ] Parse response: extract malicious count, suspicious count, engine names
- [ ] Implement result flagging: any malicious > 0 → flag as HIGH risk
- [ ] Handle VirusTotal errors (rate limit, invalid URL, API unavailable)
- [ ] Monitor quota: log each API call, alert if approaching 500/day
- [ ] Test with known malicious URL → verify flag returned
- [ ] Test with clean URL → verify no flag

### 2.6 Google Safe Browsing API
- [ ] Create lib/safebrowsing.ts
- [ ] Implement URL threat check using Safe Browsing Lookup API v4
- [ ] Parse response: extract MALWARE, SOCIAL_ENGINEERING, UNWANTED_SOFTWARE
- [ ] Handle API errors gracefully
- [ ] Test with known phishing URL → verify detection
- [ ] Test with clean URL → verify clean result

### 2.7 RDAP Domain Age Lookup
- [ ] Create lib/rdap.ts
- [ ] Implement RDAP lookup for sender domain registration date
- [ ] Calculate domain age in days from registration date
- [ ] Risk classify: < 30 days = HIGH, 30–90 days = MEDIUM, > 90 days = LOW
- [ ] Extract registrar name
- [ ] Handle RDAP lookup failures (no RDAP support, timeout)
- [ ] Test with freshly registered domain → verify HIGH classification
- [ ] Test with established domain → verify LOW classification

### 2.8 Parallel Execution Orchestration
- [ ] Implement Promise.allSettled() wrapper for all 4 external APIs
- [ ] Run Haiku, DNS, VirusTotal, SafeBrowsing, RDAP simultaneously
- [ ] Handle individual API failure without failing entire analysis
- [ ] Collect all results even if some APIs time out
- [ ] Aggregate all results into unified data object before escalation check
- [ ] Log timing: measure total parallel execution time
- [ ] Test: verify all 5 parallel calls complete before escalation decision

### 2.9 Main Analysis Endpoint
- [ ] Create POST /api/analyze route in Next.js
- [ ] Implement request body validation (email headers, body, URLs required)
- [ ] Implement 500KB payload size limit (reject with 413)
- [ ] Implement input sanitization on email content
- [ ] Call parallel execution → aggregation → escalation → report
- [ ] Return structured JSON report response
- [ ] Implement proper error handling (500 with safe error message)
- [ ] Test end-to-end with Postman/curl: send email data → get report

### 2.10 Phase 2 Milestone Verification
- [ ] Copy headers + body from a real suspicious email
- [ ] POST to /api/analyze → receive full JSON report
- [ ] Verify report contains: risk_score, risk_level, verdict, recommendation
- [ ] Verify report contains: green_flags array, red_flags array
- [ ] Verify report contains: modules object (all 5 modules)
- [ ] Verify fast path (safe email) completes < 8 seconds
- [ ] Verify escalated path (suspicious email) completes < 60 seconds

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
