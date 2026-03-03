# GuardScope — Master Development Plan
## AI-Powered Email Authentication & Phishing Investigation Chrome Extension

---

## PRODUCT SUMMARY

GuardScope is a Chrome extension that integrates into Gmail and uses a hybrid Claude AI pipeline (Haiku + Sonnet) combined with real-time DNS lookups and external threat intelligence APIs to perform deep, multi-dimensional investigation of any email on demand. It delivers a structured security report with a risk score (0–100), categorized green/red flags, and a plain-English verdict + recommended action.

**Core Differentiator**: Explains WHY an email is suspicious — not just yes/no.
**Primary Market**: Nigeria/Africa
**Business Model**: Freemium SaaS — Free (5/mo) | Pro ($4.99/mo) | Team ($14.99/mo)

---

## TECH STACK (LOCKED FROM PRD)

| Layer | Technology |
|-------|-----------|
| Chrome Extension | Manifest V3, TypeScript, React + Tailwind CSS |
| Backend API | Next.js API Routes → Vercel (serverless) |
| AI Pre-Scan | Claude Haiku (claude-haiku-4-5) |
| AI Deep Analysis | Claude Sonnet (claude-sonnet-4-6) |
| Database | Supabase (PostgreSQL) + Row-Level Security |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Payments | Stripe (subscriptions + webhooks) |
| DNS Lookups | Cloudflare DNS over HTTPS |
| URL Threat Intel | VirusTotal API + Google Safe Browsing API |
| Domain Age | RDAP/WHOIS |
| Rate Limiting | Upstash Redis |
| Error Tracking | Sentry |
| Deployment | Vercel (backend + landing page) + Chrome Web Store |

---

## REPOSITORY STRUCTURE

```
guardscope/
├── extension/                    # Chrome Extension (MV3)
│   ├── manifest.json
│   ├── background.ts             # Service worker — API comms
│   ├── content.ts                # Injected into Gmail
│   ├── popup.html
│   ├── popup.tsx                 # Extension popup UI
│   └── src/
│       ├── sidebar/
│       │   ├── App.tsx           # Main sidebar React component
│       │   ├── components/
│       │   │   ├── RiskScore.tsx
│       │   │   ├── FlagCard.tsx
│       │   │   ├── ProgressBar.tsx
│       │   │   └── TechnicalDetails.tsx
│       │   └── index.tsx
│       └── utils/
│           ├── emailExtractor.ts # Gmail DOM parsing
│           └── auth.ts           # Token management
│
├── backend/                      # Next.js backend
│   ├── app/
│   │   └── api/
│   │       ├── analyze/route.ts
│   │       ├── auth/session/route.ts
│   │       ├── usage/route.ts
│   │       ├── stripe/checkout/route.ts
│   │       ├── stripe/webhook/route.ts
│   │       └── health/route.ts
│   └── lib/
│       ├── claude.ts             # Haiku + Sonnet pipeline
│       ├── dns.ts                # Cloudflare DoH lookups
│       ├── virustotal.ts
│       ├── safebrowsing.ts
│       ├── rdap.ts
│       ├── supabase.ts
│       ├── stripe.ts
│       ├── redis.ts
│       └── security.ts           # Input sanitization, headers
│
├── landing/                      # Landing page (Next.js)
│   └── app/
│       ├── page.tsx              # Hero, features, pricing
│       ├── privacy/page.tsx
│       ├── terms/page.tsx
│       └── cookies/page.tsx
│
└── tasks/
    ├── MASTER_PLAN.md            # This file
    ├── todo.md                   # Phase-by-phase checklist
    └── lessons.md                # Lessons learned
```

---

## ANALYSIS PIPELINE (FROM PRD §8)

```
[User clicks "Analyze This Email" in Gmail]
        ↓
[Content script extracts: headers, body, URLs, attachments]
        ↓
[Extension sends payload to /api/analyze with JWT]
        ↓
[Backend runs PARALLEL:]
    ├── Haiku pre-scan (parse headers, classify URLs, pre-score)
    ├── DNS lookup: SPF/DKIM/DMARC via Cloudflare DoH
    ├── VirusTotal: scan all URLs (70+ engines)
    ├── Google Safe Browsing: real-time URL check
    └── RDAP: domain age + registrar
        ↓
[Aggregation: combine results + Haiku score]
        ↓
[Escalation check: score ≥ 26 OR any VirusTotal hit?]
    ├── NO  → Return Haiku report (fast path, ~5-8s, $0.001-0.002)
    └── YES → Send all data to Claude Sonnet for deep analysis (~20-45s, $0.015-0.035)
        ↓
[Backend: increment user's analysis count in Supabase]
        ↓
[Extension: renders report in React sidebar]
```

**Escalation Thresholds:**
- 0–25: Haiku only (clearly safe)
- 26–55: Always escalate (ambiguous)
- 56–100: Always escalate (suspicious)
- Any score + VirusTotal hit: Always escalate

---

## 5 ANALYSIS MODULES

### Module 1 — Header Authentication
- SPF record verification
- DKIM signature validation
- DMARC policy compliance
- Reply-To vs From mismatch
- Received chain analysis
- Return-Path verification
- X-Originating-IP reputation

### Module 2 — Sender Domain Intelligence
- Domain age via RDAP (< 30 days = high risk)
- Typosquatting detection (paypa1.com vs paypal.com)
- TLD risk classification (.xyz, .top, .click, .tk = elevated)
- Display name vs email address mismatch
- Free email provider check
- MX record validation

### Module 3 — Claude AI Content & Language Analysis (Sonnet)
- Urgency/pressure language detection
- Fear-based manipulation
- Reward/prize language
- Impersonation signal detection
- Grammar and tone analysis
- Unusual request detection (wire transfers, gift cards)
- Call-to-action analysis
- Social engineering patterns
- Contextual coherence check

### Module 4 — Link & Attachment Analysis
- URL destination vs display text mismatch
- Shortened URL detection
- VirusTotal multi-engine scan
- Google Safe Browsing check
- Suspicious TLD in embedded links
- Attachment type risk (.exe, .zip, .docm, .vbs = critical)
- Link count anomaly
- Redirect chain detection

### Module 5 — Contextual Intelligence & Cross-Correlation
- Multi-signal correlation
- Industry-specific risk patterns
- Time-based anomalies
- Sender reputation scoring
- Confidence calibration
- Overall synthesis + weighted final score

---

## RISK SCORE VISUAL SYSTEM

| Score | Level | Label | Action |
|-------|-------|-------|--------|
| 0–25 | SAFE | ✅ Green | Safe to proceed |
| 26–49 | LOW | ⚠️ Yellow-Green | Proceed with awareness |
| 50–69 | MEDIUM | ⚠️ Orange | Verify sender before acting |
| 70–84 | HIGH | 🚨 Red | Do not click links or reply |
| 85–100 | CRITICAL | 🚨 Dark Red | PHISHING DETECTED — Do not engage |

---

## API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/analyze | POST | Main analysis — orchestrates full pipeline |
| /api/auth/session | POST | Validates JWT, returns user tier + usage |
| /api/usage | GET | Returns monthly analysis count |
| /api/stripe/checkout | POST | Creates Stripe checkout session |
| /api/stripe/webhook | POST | Updates Supabase on subscription changes |
| /api/health | GET | Health check |

---

## SECURITY ARCHITECTURE (6 LAYERS)

**Layer 1 — Extension Hardening**
- MV3 only, no eval()
- Zero secrets in extension code
- Minimal permissions: activeTab + scripting only
- Code minification/obfuscation before publish
- CSP in manifest.json

**Layer 2 — Backend API Security**
- JWT on EVERY endpoint (no anonymous calls)
- Upstash Redis rate limiting (10 req/min/user)
- Input sanitization (DOMPurify equivalent)
- 500KB max payload
- HTTPS enforcement (TLS 1.2+)
- CORS whitelist (guardscope.io + extension origin only)
- Security response headers
- Parameterized Supabase queries

**Layer 3 — Zero Email Storage**
- Email body, headers, URLs, attachments: NEVER stored
- Only stored: risk score (Pro history), timestamp, user email, subscription status, analysis count

**Layer 4 — Auth Security**
- Google OAuth as primary
- 12-char minimum password
- JWT expires 1 hour
- Login rate limiting (5 attempts → 15min lockout)
- Email verification required
- Supabase RLS on all tables

**Layer 5 — Monitoring**
- Sentry error tracking
- Vercel Analytics
- Supabase monitoring
- Custom usage abuse alerts (50+ analyses/hour)
- VirusTotal quota monitoring (alert at 400/500)

**Layer 6 — Supply Chain**
- 2FA on Chrome Web Store developer account
- Dedicated Google account for Web Store
- Code review before every submission
- No external script loading at runtime
- Version changelog with semantic versioning

---

## LEGAL REQUIREMENTS (Pre-Launch)

1. **Privacy Policy** — publicly accessible URL (required by Chrome Web Store)
2. **Terms of Service** — required for paid product
3. **Cookie Policy** — Stripe uses cookies
4. **Data Processing Agreement** — GDPR (Supabase provides template)
5. **Acceptable Use Policy**

### Compliance Targets
- **GDPR**: Right to access, erasure, portability; data minimization; DPA with Supabase
- **NDPA 2023 (Nigeria)**: Plain language policy, explicit consent, breach notification 72hrs
- **Chrome Web Store**: Single purpose, prominent disclosure, minimal permissions, no deceptive behavior

---

## LAUNCH CHECKLIST (from PRD §20.2)
- [ ] Extension installs without errors on Chrome, Brave, and Edge
- [ ] Gmail sidebar opens on any email with one click
- [ ] Email extraction works on standard, attachments, and forwarded emails
- [ ] Haiku pre-scan completes < 8 seconds (p95)
- [ ] Sonnet analysis completes < 60 seconds (p95)
- [ ] Report renders: risk score, verdict, green flags, red flags, recommendation
- [ ] Progress bar shows accurate step labels
- [ ] Free tier limits to 5 analyses/calendar month
- [ ] Pro upgrade flow works end-to-end via Stripe
- [ ] Subscription reflected in extension within 60 seconds of payment
- [ ] All API calls require valid JWT (401 on unauthenticated)
- [ ] Rate limiting enforced (10 req/min/user)
- [ ] Email content confirmed NOT stored (database inspection)
- [ ] Privacy Policy publicly accessible
- [ ] Terms of Service publicly accessible
- [ ] Sentry active in production
- [ ] Landing page live at guardscope.io
- [ ] Chrome Web Store listing approved
- [ ] Domain guardscope.io secured + HTTPS
- [ ] Social handles secured: @guardscope on Twitter/X + YouTube

---

## SUCCESS METRICS

### Day 30 (Launch)
- 500+ Chrome Web Store installs
- 300+ free signups
- 30+ Pro conversions (10% rate)
- $150+ MRR
- 4.0+ stars
- 90%+ analysis completion rate

### Day 90
- 2,000+ installs
- 200+ Pro subscribers
- $1,000+ MRR
- <5% monthly churn
- 4.5+ stars

### Technical Quality
- p95 analysis < 60s (Sonnet), < 8s (Haiku-only)
- <10% false positive rate
- <5% false negative rate
- 99.5%+ API uptime
- <0.1% extension crash rate

---

## COST MODEL REFERENCE

| Scenario | Cost Per Analysis |
|----------|------------------|
| Haiku only (score 0–25) | $0.001–0.002 |
| Haiku + Sonnet (ambiguous) | $0.015–0.025 |
| Haiku + Sonnet (suspicious) | $0.020–0.035 |
| Worst case (all APIs) | $0.035 |
| Blended average (60/40 mix) | ~$0.012 |

**Gross Margin on Pro ($4.99/mo):** ~78–93% depending on usage

---

*Plan created: 2026-03-03 | Based on: GuardScope_PRD_v2.docx*
