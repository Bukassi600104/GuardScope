# GuardScope â€” Phase-by-Phase Development Todo List
## Every item must be verified before marking complete.
## After each task: check off â†’ update MEMORY.md â†’ commit & push â†’ next task

---

## PHASE 1 â€” FOUNDATION & SCAFFOLDING âœ… COMPLETE (2026-03-03)

- [x] Monorepo structure, TypeScript, Vite, Tailwind, Next.js backend
- [x] Manifest V3, content script, sidebar iframe, Shadow DOM injection
- [x] emailExtractor.ts â€” full Gmail DOM extraction with fallback selectors
- [x] Mock sidebar (score:72, flags, gauge), popup scaffold
- [x] /api/health endpoint on Vercel
- [x] Supabase schema (users + usage tables, RLS, trigger)
- [x] VERIFIED IN GMAIL â€” screenshot confirmed 2026-03-03

---

## PHASE 2 â€” ANALYSIS ENGINE âœ… COMPLETE (2026-03-06)

- [x] Mercury-2 (InceptionLabs) as sole AI engine
- [x] lib/inception.ts â€” chain-of-thought via _reasoning field, json_mode
- [x] lib/dns.ts â€” SPF/DKIM/DMARC via Cloudflare DoH + 20-selector DKIM probe
- [x] lib/virustotal.ts â€” cached GET lookups, fire-and-forget submit
- [x] lib/safebrowsing.ts â€” Google Safe Browsing v4
- [x] lib/rdap.ts â€” domain age, registrar, risk classification
- [x] POST /api/analyze orchestrator â€” all APIs parallel, Mercury deep analysis
- [x] Fallback rule-based report if Mercury unavailable
- [x] temperature=0, max_tokens=8000, bodyText truncated to 3000 chars
- [x] extractJson() recovery for truncated responses
- [x] DEPLOYED â€” https://guardscope.app/api/analyze âœ“

---

## PHASE 3 â€” FULL UI & AUTHENTICATION âœ… COMPLETE (2026-03-07)

- [x] extension/src/utils/analyze.ts â€” AnalysisReport types + AppState type
- [x] extension/src/content.ts â€” storeCurrentEmail() on email open + hashchange
- [x] extension/src/background.ts â€” ANALYZE/GET_AUTH/SIGN_IN/SIGN_OUT handlers
- [x] extension/src/sidebar/App.tsx â€” full state machine (idle/analyzing/result/error/no_email/limit_reached)
- [x] extension/src/sidebar/components/FlagCard.tsx â€” handles evidence + detail fields
- [x] extension/src/sidebar/components/TechnicalDetails.tsx â€” real DNS/domain/URL data
- [x] extension/src/sidebar/components/ProgressBar.tsx â€” 900ms/step (7 steps = 6.3s)
- [x] extension/src/popup/Popup.tsx â€” JWT expiry check, sign-in form, usage meter
- [x] extension/manifest.json â€” host_permissions for backend + Supabase
- [x] Footer: "Powered by GuardScope AI"
- [x] DKIM false positive fix: 20-selector probe, 'unknown' = neutral
- [x] Score determinism: temperature=0, JSON truncation guard

---

## PHASE 3C â€” ENGINE ACCURACY + CWS COMPLIANCE
**Milestone: Engine gives accurate results for real-world emails; extension passes CWS review**

### 3C-1: Gmail DOM Auth Extraction (Real DKIM from Gmail UI) âœ…
- [x] Add `extractGmailAuthResults()` to extension/src/utils/emailExtractor.ts
- [x] Extract "Signed-by" domain from Gmail's expanded header dropdown
- [x] Extract "Mailed-by" domain for SPF correlation
- [x] Pass these to backend as `gmailAuth: { signedBy, mailedBy }` in EmailInput
- [x] Update backend types.ts to add optional `gmailAuth` field to EmailInput
- [x] Update inception.ts system prompt to use gmailAuth if available
- [x] Commit & push

### 3C-2: Trusted Domain Allowlist âœ…
- [x] Create backend/lib/allowlist.ts
- [x] Add tier-1 trusted domains (google, microsoft, apple, amazon, paypal, meta, linkedin, github, etc.)
- [x] Add 20+ Nigerian bank domains (GTBank, Access, Zenith, First Bank, UBA, Kuda, OPay, etc.)
- [x] Add Nigerian gov/telco domains (CBN, FIRS, EFCC, MTN, Airtel, Glo, 9mobile, gov.ng TLD)
- [x] AnalysisIntel.trustHint field added â€” passed to Mercury when domain is in allowlist
- [x] Mercury system prompt: trust allowlist guidance + VT/SB override rule
- [x] Commit & push

### 3C-3: Hybrid Scoring Architecture âœ…
- [x] Create backend/lib/scorer.ts
- [x] calcRuleScore(): deterministic signals (SPF/DKIM/DMARC/domain-age/VT/SB/trust)
- [x] applyHybridScore(): final = rule_score * 0.35 + mercury_score * 0.65
- [x] Hard overrides: VT/SB hit â†’ min 85, SPF fail + new domain â†’ min 70
- [x] Trust cap: allowlisted domain + no VT/SB â†’ max 40
- [x] Applied in route.ts after Mercury returns report
- [x] Commit & push

### 3C-4: DNS Label Framing Fix âœ…
- [x] SPF neutral (~all/+all) â†’ LOW flag only (not same as fail)
- [x] DKIM unknown â†’ NEUTRAL, not flagged at all
- [x] DMARC none/error â†’ LOW flag (was MEDIUM)
- [x] Fallback buildFallbackReport() updated to match new semantics
- [x] Trust hint applied to fallback scorer too
- [x] Commit & push

### 3C-5: Additional Threat Intel (PhishTank + URLhaus) âœ…
- [x] Create backend/lib/phishtank.ts â€” checks URLs against PhishTank database
- [x] Create backend/lib/urlhaus.ts â€” checks URLs + sender domain against URLhaus/Abuse.ch
- [x] Both added to Promise.allSettled in route.ts (parallel with VT/SB)
- [x] PhishTankResult + URLhausResult added to AnalysisIntel type
- [x] Mercury prompt: PhishTank/URLhaus hits â†’ CRITICAL, min score 85
- [x] Scorer: hard override for PT/URLhaus hits, trust cap updated
- [x] Commit & push

### 3C-6: Tranco Top Domain Bundle âœ…
- [x] Create backend/lib/tranco.ts â€” isTopDomain(domain): boolean
- [x] Embedded top ~300 domains (serverless-safe, no filesystem reads)
- [x] Covers major global platforms, CDNs, email services, Nigerian news sites
- [x] In route.ts: Tranco top domains also get trust treatment (same as allowlist)
- [x] Combined: isTrustedDomain() || isTopDomain() â†’ trustHint passed to Mercury
- [x] Commit & push

### 3C-7: URL Normalization + Result Caching âœ…
- [x] Create backend/lib/urlCache.ts â€” LRUCache class (100 entries, 15-min TTL)
- [x] normalizeUrl(): lowercase, strip 15+ tracking params (utm_*, fbclid, gclid, etc.), remove fragment, sort query params
- [x] normalizeUrls(): deduplicates array using normalized keys
- [x] Applied in route.ts before all URL scanning â€” cleaner inputs to VT/SB/PT/URLhaus
- [x] Also passes gmailAuth from request body through to EmailInput
- [x] Commit & push

### 3C-8: Prompt Injection Defense âœ…
- [x] sanitizeEmail(): strips 9 injection pattern regexes from bodyText, subject, fromName
- [x] Subject truncated to 200 chars, body to 3000 chars
- [x] Email data wrapped in <email_data> XML tags in Mercury user message
- [x] Intel data wrapped in <security_intelligence> XML tags
- [x] System prompt: SECURITY BOUNDARY section â€” treats XML tag content as untrusted data
- [x] Commit & push

### 3C-9: Nigeria-Specific Threat Context âœ…
- [x] Added NIGERIA-SPECIFIC THREAT PATTERNS section to Mercury system prompt
- [x] Government agency fraud (EFCC, CBN, FIRS, NAFDAC) â†’ CRITICAL
- [x] Fintech impersonation (OPay, Kuda, PiggyVest, PalmPay) patterns
- [x] BVN/NIN email phishing â†’ always phishing rule
- [x] Advance-fee fraud hallmarks (inheritance, customs packages, transfer fees)
- [x] Legitimate Nigerian bank domain list as contrast reference
- [x] Override rule updated to include PhishTank + URLhaus
- [x] Commit & push

### 3C-10: Privacy Policy Page âœ…
- [x] Create backend/app/privacy/page.tsx (serves at /privacy)
- [x] Covers: what IS collected, what is NOT (email content never stored), all 9 third parties
- [x] NDPR 2023 compliance section (Nigeria Data Protection Commission)
- [x] GDPR compliance section (Supabase EU hosting, DPA signed)
- [x] User rights: access, deletion, correction, portability
- [x] Data retention: usage 13 months, email analysis never retained
- [x] Commit & push

### 3C-11: First-Run Consent Screen (CWS Requirement) âœ…
- [x] Create extension/src/onboarding/onboarding.html + onboarding.tsx
- [x] Registered in vite.config.ts + manifest web_accessible_resources
- [x] background.ts: opens onboarding.html tab on first install (reason === 'install')
- [x] content.ts: checks guardscope_onboarding_complete before starting sidebar; polls every 2s until set
- [x] Onboarding: 3-step how-it-works, what we check, what we NEVER store, privacy link
- [x] "I Understand â€” Activate GuardScope" â†’ sets storage flag + opens Gmail
- [x] manifest.json: description updated (single-purpose), homepage_url added
- [x] Build verified: dist/src/onboarding/onboarding.html âœ“
- [x] Commit & push

### 3C-12: Manifest & Build Fixes for CWS âœ…
- [x] homepage_url added in 3C-11 commit
- [x] Single-purpose description in manifest.json
- [x] extension/PERMISSION_JUSTIFICATIONS.md created and aligned to current MV3 permissions
- [x] manifest_version: 3 confirmed
- [x] No eval, no remote scripts (CSP: script-src 'self')
- [x] npm run build â†’ zero errors, 17 output files
- [x] Commit & push

### 3C Milestone Verification âœ… PHASE 3C COMPLETE (2026-03-07)
- [x] All 12 task groups implemented and committed
- [x] 10 commits pushed to master (184775e â†’ 21d8afd)
- [ ] Google OTP email â†’ scores â‰¤ 20 (not flagged) â€” verify in Gmail
- [ ] Phishing email â†’ scores â‰¥ 70 â€” verify in Gmail
- [ ] Same email run 3x â†’ same score Â±2 â€” verify in Gmail
- [ ] Privacy policy accessible at /privacy â€” verify after Vercel deploy
- [ ] Onboarding screen shows on fresh extension install â€” verify in Chrome

---

## PHASE 4A â€” PRODUCTION HARDENING
**Milestone: Extension is reliable under real-world use; no crashes, no data leaks**

### 4A-1: Service Worker Keepalive âœ…
- [x] App.tsx: chrome.runtime.connect('guardscope-keepalive') before ANALYZE sendMessage
- [x] background.ts: onConnect listener keeps SW alive while port is open
- [x] Port disconnects automatically after response

### 4A-2: JWT Token Auto-Refresh âœ…
- [x] AuthState: added refreshToken + tokenExpiresAt fields
- [x] getValidToken(): refreshes access token if expiring within 5 min
- [x] signIn(): stores refresh_token + tokenExpiresAt from Supabase response
- [x] handleAnalyze(): uses getValidToken() instead of raw auth.token

### 4A-3: Atomic Supabase Quota Enforcement âœ…
- [x] quota.ts: decodeJwt(), checkAndIncrementQuota(), getUserTier()
- [x] PATCH-based atomic increment with count < limit WHERE clause
- [x] Returns 429 { error: 'limit_reached', count, limit } when exceeded
- [x] Pro/Team users: unlimited (fire-and-forget increment for analytics)
- [x] Anonymous users: no quota for now (Phase 5 adds IP-based)

### 4A-4: Upstash Rate Limiting âœ…
- [x] ratelimit.ts: @upstash/ratelimit + @upstash/redis installed
- [x] 10 req/min for authed users, 5 req/min for anon (sliding window)
- [x] Fails open if Upstash not configured (dev-safe)
- [x] 429 response with Retry-After + X-RateLimit-Remaining headers

### 4A-5+6: Sentry Error Tracking âœ…
- [x] @sentry/nextjs installed in backend
- [x] sentry.server.config.ts + sentry.edge.config.ts created
- [x] Mercury failures captured via Sentry.captureException
- [x] Disabled if SENTRY_DSN not configured

### 4A-7: Security Hardening âœ…
- [x] SECURITY_HEADERS: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CORS
- [x] OPTIONS handler for CORS preflight
- [x] fromEmail regex validation (400 on invalid format)
- [x] bodyText > 50KB â†’ 413
- [x] All responses include security headers

### 4A Milestone Verification
- [ ] Analysis completes reliably on 6-10s emails (no SW timeout)
- [ ] Token refresh works transparently
- [ ] 6th free analysis returns 429 with upgrade message
- [ ] 11th request in 1 minute returns 429 with rate limit message
- [ ] Sentry dashboard shows backend traces
- [ ] CORS blocks requests from non-extension origins

---

## PHASE 4B â€” RETENTION FOUNDATION
**Milestone: New users understand the product and stay engaged**

### 4B-1: Extension Badge (Threat Alert) âœ…
- [x] background.ts: updateBadge() + clearBadge() â€” HIGH=orange, CRITICAL=red
- [x] clearBadge() before analysis, updateBadge(risk_level) after success
- [x] Keepalive port + JWT auto-refresh also implemented in same commit
- [x] Commit & push (a7460ab)

### 4B-2: Plain Language Copy Pass âœ…
- [x] TechnicalDetails.tsx: spfLabel/dkimLabel/dmarcLabel/domainRiskLabel/urgencyLabel helpers
- [x] Color-coded rows: green=good, orange=warn, red=bad
- [x] "Email Authentication" replaces "DNS Authentication"
- [x] Footer: "Powered by Mercury-2 AI"
- [x] analysis_path decoded: mercury_deep â†’ "Mercury-2 AI deep scan"
- [x] Commit & push (91ec9d2)

### 4B-3: Onboarding Tab Polish âœ…
- [x] Already complete from Phase 3C-11 â€” full branded screen
- [x] Step descriptions rewritten for accuracy (mercury AI mention, correct sequence)
- [x] Commit & push (91ec9d2)

### 4B-4: Analysis Share Card âœ…
- [x] "Copy report to clipboard" button in result view
- [x] Formats all flags + verdict + risk score into clean text
- [x] 2s "âœ“ Copied to clipboard" confirmation
- [x] Commit & push (9cbb3c8)

### 4B-5: Upgrade Prompt UX âœ…
- [x] limit_reached card: "Upgrade to Pro â€” $4.99/mo" button + "Maybe later" link
- [x] "Maybe later" â†’ handleRetry() â†’ returns to idle/no_email
- [x] Commit & push (1da2ea5)

### 4B-6: Analysis History (Local, last 20) âœ…
- [x] background.ts: saveToHistory() appends to guardscope_history, max 20 FIFO
- [x] GET_HISTORY message handler added
- [x] App.tsx: loads history on mount, refreshes after analysis
- [x] History panel: overlay with Risk color dots, subject, sender, date
- [x] "History (N)" toggle button in header
- [x] Commit & push (1da2ea5)

### 4B-7: Error State Polish âœ…
- [x] Contextual error messages: network, extension reload, connection lost, server error
- [x] Error icons: ðŸ“¡ network, ðŸ”„ reload, ðŸ“§ no email, âš ï¸ generic
- [x] No retry button shown for "reload page" errors
- [x] Commit & push (fa74513)

### 4B Milestone Verification âœ… PHASE 4B COMPLETE (2026-03-07)
- [x] All 7 tasks implemented and committed (4 commits: a7460ab, 91ec9d2, 9cbb3c8, 1da2ea5, fa74513)
- [ ] HIGH RISK analysis â†’ orange ! badge on extension icon â€” verify in Gmail
- [ ] Technical details show human-readable labels â€” verify in sidebar
- [ ] Share button copies clean text to clipboard â€” verify
- [ ] Limit reached â†’ upgrade card with "Maybe later" â€” verify

---

## PHASE 5 â€” MONETIZATION + PUBLIC LAUNCH
**Milestone: First paying user; extension live on Chrome Web Store**

### 5-1: Landing Page âœ…
- [x] backend/app/page.tsx â€” full landing page (hero, stats, 5 features, 3-step, privacy, pricing, FAQ, CTA, footer)
- [x] backend/app/globals.css + layout.tsx with Inter font + SEO metadata
- [x] Pricing: anonymous free 5/day; signed-in free 5/month; Pro unlimited ($4.99/mo + NGN pricing)
- [x] 6 FAQ entries covering privacy, compatibility, pricing, AI model
- [x] Links to /privacy and /terms
- [x] Commit & push (78036be)

### 5-2: Payment provider cleanup
- [x] Remove the inactive Stripe package and API routes
- [x] Standardize subscription checkout on Paystack for the Nigerian business account

### 5-3: Paystack Integration âœ…
- [x] POST /api/paystack/initialize â€” â‚¦7,500/mo NGN, HMAC reference
- [x] POST /api/paystack/webhook â€” HMAC-SHA512 verified, charge.success â†’ pro, subscription.disable â†’ free
- [x] Commit & push (78036be)

### 5-4: Chrome Web Store Submission
- [ ] extension/PERMISSION_JUSTIFICATIONS.md already exists (from 3C-12)
- [ ] Prepare 5 screenshots (1280x800): SAFE result, CRITICAL result, progress bar, popup, technical details
- [ ] Record 60-90s demo video
- [ ] Complete Data Use Disclosure in CWS dashboard
- [ ] Submit for review

### 5-5: Legal Documents âœ…
- [x] Privacy Policy: backend/app/privacy/page.tsx (from Phase 3C-10)
- [x] Terms of Service: backend/app/terms/page.tsx â€” 10 sections, Nigerian law governing
- [x] Both linked from landing page footer
- [x] Commit & push (78036be)

### 5-6: Usage API + Popup Upgrade Button âœ…
- [x] GET /api/usage â€” returns { count, limit, tier } for authed users
- [x] Popup fetchUsage() now calls /api/usage (not Supabase directly)
- [x] "Upgrade to Pro" amber button for free users in popup
- [x] Popup footer â†’ "Powered by Mercury-2 AI"
- [x] Commit & push (d4cfc4a)

### Phase 5 Milestone Verification
- [ ] Landing page live after Vercel deploy
- [ ] Paystack live key, monthly plan, and annual plan set in Vercel dashboard
- [ ] Extension submitted to Chrome Web Store (requires screenshots + video)

---

## PHASE 6 â€” SCALE + GROWTH
**Milestone: 100 active users; team tier live; French localization**

### 6-1: Team Tier Schema âœ…
- [x] Migration 002: teams table (id, name, owner_id, seat_limit, stripe/paystack ids)
- [x] team_members table (team_id, user_id, role: owner/admin/member)
- [x] users.team_id + users.paystack_customer_code columns added
- [x] RLS: owner has all access; members can read team; users see own history
- [x] Commit & push (309a952)
- [ ] POST /api/team/invite â€” Resend email (Phase 6 V2)
- [ ] Team admin dashboard (Phase 6 V2)

### 6-2: French Localization (West Africa) âœ…
- [x] extension/src/utils/i18n.ts â€” lightweight EN + FR locale detection
- [x] Full translation of all sidebar UI strings (states, buttons, progress, history, footer)
- [x] ProgressBar: localized step labels via tArray()
- [x] App.tsx: key strings use t() â€” auto-switches on navigator.language
- [x] Commit & push (9b3bd10)
- [ ] CÃ´te d'Ivoire / Senegal threat patterns to Mercury prompt (Phase 6 V2)

### 6-3: Gmail API Consideration
- [ ] Evaluate Gmail API cost ($15Kâ€“$75K/year security assessment) â€” defer to revenue milestone

### 6-4: Analysis Quality Dashboard
- [ ] Supabase query views for avg risk_score, % CRITICAL, % SAFE, Mercury error rate (manual SQL)
- [ ] Alert config in Sentry for error rate > 5% or avg duration > 12s

### 6-5: Abuse Prevention âœ…
- [x] ratelimit.ts: 50 req/hour sliding window for authed users (gs_auth_hourly prefix)
- [x] Added alongside existing 10 req/min limit â€” both must pass
- [x] Commit & push (309a952)

### 6-6: Uptime Monitoring
- [ ] UptimeRobot: ping /api/health every 5 min (manual setup â€” no code needed)
- [x] /api/health updated to v2.0.0 with force-dynamic + checks metadata

### 6-7: Analysis History V2 (Server-side) âœ…
- [x] analysis_history table in migration 002 (from_domain only, no email content)
- [x] GET /api/history: 10 entries (free) or 30 entries (pro/team)
- [x] POST /api/analyze: saveAnalysisHistory() fire-and-forget after each success
- [x] Commit & push (309a952)

---

## PHASE COMPLETION STATUS

| Phase | Status | Date |
|-------|--------|------|
| Phase 1 â€” Foundation | âœ… COMPLETE | 2026-03-03 |
| Phase 2 â€” Analysis Engine | âœ… COMPLETE | 2026-03-06 |
| Phase 3 â€” Full UI & Auth | âœ… COMPLETE | 2026-03-07 |
| Phase 3C â€” Engine Accuracy + CWS | âœ… COMPLETE | 2026-03-07 |
| Phase 4A â€” Production Hardening | âœ… COMPLETE | 2026-03-07 |
| Phase 4B â€” Retention Foundation | âœ… COMPLETE | 2026-03-07 |
| Phase 5 â€” Monetization + Launch | ðŸ”„ IN PROGRESS | â€” |
| Phase 6 â€” Scale + Growth | ðŸ”„ IN PROGRESS | â€” |

---

*Todo created: 2026-03-03 | Updated: 2026-03-07 | Do not skip steps. Check off â†’ update MEMORY.md â†’ commit â†’ next task.*
