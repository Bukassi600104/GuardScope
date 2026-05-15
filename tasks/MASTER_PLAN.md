# GuardScope Master Development Plan

## Product Summary

GuardScope is a Chrome MV3 extension for Gmail that performs AI-powered email authentication and phishing investigation. It combines deterministic security checks, external threat intelligence, and Mercury-2 by InceptionLabs to produce a structured security report with a 0-100 risk score, green/red flags, a plain-English verdict, and a recommended action.

**Core differentiator:** GuardScope explains why an email is suspicious, not just whether it is suspicious.

**Primary market:** Nigeria and Africa first, with global phishing and social-engineering coverage.

**Business model:** Freemium SaaS with early-access promo codes.

## Production Decisions

- Production domain: `https://guardscope.app`
- AI provider: Mercury-2 by InceptionLabs
- Anonymous quota: 5 analyses per day per IP
- Signed-in free quota: 5 analyses per month per account
- Promo access: 100 early-access codes, 30 days of Pro per redeemed code
- Paid plans: Stripe and Paystack integration exists, with payments suspended during early access

## Tech Stack

| Layer | Technology |
| --- | --- |
| Chrome Extension | Manifest V3, TypeScript, React, Tailwind CSS, Vite, CRXJS |
| Backend API | Next.js 15 App Router on Vercel |
| AI Analysis | Mercury-2 by InceptionLabs |
| Database | Supabase PostgreSQL with Row-Level Security |
| Auth | Supabase Auth |
| Payments | Stripe and Paystack |
| DNS | Cloudflare DNS over HTTPS |
| Threat Intel | VirusTotal, Google Safe Browsing, PhishTank, URLhaus, Spamhaus |
| Rate Limiting | Upstash Redis |
| Error Tracking | Sentry |
| Deployment | Vercel backend and Chrome Web Store extension |

## Repository Structure

```text
GuardScope/
  extension/   Chrome MV3 extension
  backend/     Next.js backend, marketing pages, API routes, Supabase migrations
  tasks/       Historical implementation plans and checklists
  docs/        Launch, security, deployment, CWS, and QA documentation
```

## Analysis Pipeline

```text
User opens a Gmail message
  -> GuardScope content script extracts sender, subject, body, URLs, attachments, and Gmail auth hints
  -> Side panel sends the payload to /api/analyze
  -> Backend validates size, quota, rate limits, and optional JWT
  -> Backend runs security intelligence checks in parallel
  -> Confirmed threat-intel hits return a fast rule-based critical report
  -> Otherwise Mercury-2 performs deep social-engineering and content analysis
  -> Hybrid scorer applies deterministic caps/floors and normalizes final score
  -> Extension renders the risk report in the side panel
```

## Analysis Modules

1. Sender authentication: SPF, DKIM, DMARC, Gmail mailed-by/signed-by, reply-to and return-path mismatches.
2. Domain intelligence: RDAP age, registrar context, trusted domain hints, suspicious TLDs, free-provider detection.
3. URL intelligence: VirusTotal, Google Safe Browsing, PhishTank, URLhaus, Spamhaus, raw IP URLs, shorteners, anchor mismatch.
4. Header integrity: display-name impersonation, authority-role impersonation, attachment filename/type risk.
5. Domain similarity: typosquatting, homograph, combo-squatting, and suspicious subdomain patterns.
6. Content and social engineering: credential harvesting, BEC, government impersonation, delivery scams, lottery scams, romance scams, advance-fee fraud.
7. Behavioral synthesis: cross-signal correlation and final user recommendation.

## Risk Score Visual System

| Score | Level | Action |
| --- | --- | --- |
| 0-25 | SAFE | Safe to proceed |
| 26-49 | LOW | Proceed with awareness |
| 50-69 | MEDIUM | Verify sender before acting |
| 70-84 | HIGH | Do not click links or reply |
| 85-100 | CRITICAL | Phishing or confirmed threat detected |

## API Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/analyze` | POST | Main analysis pipeline |
| `/api/usage` | GET | Signed-in usage count and tier |
| `/api/history` | GET | Signed-in analysis history metadata |
| `/api/auth/signup` | POST | Supabase signup wrapper |
| `/api/auth/signin` | POST | Website sign-in verification |
| `/api/auth/forgot-password` | POST | Password reset request |
| `/api/auth/reset-password` | POST | Password reset completion |
| `/api/promo/request` | POST | Assign early-access code to lead |
| `/api/promo/status` | GET | Promo availability |
| `/api/promo/validate` | POST | Redeem code and upgrade user for 30 days |
| `/api/stripe/checkout` | POST | Stripe checkout, currently suspended during early access |
| `/api/stripe/webhook` | POST | Stripe subscription webhook |
| `/api/paystack/initialize` | POST | Paystack checkout, currently suspended during early access |
| `/api/paystack/webhook` | POST | Paystack subscription webhook |
| `/api/health` | GET | Health check |

## Security Architecture

### Extension

- Manifest V3 only.
- No remote scripts.
- No server secrets in bundled code.
- Restrictive extension CSP.
- Side panel enabled only for Gmail tabs.
- Sensitive background messages restricted to extension pages or Gmail content scripts.

### Backend

- JWT verification with `SUPABASE_JWT_SECRET` in production.
- Request body limits and input validation before analysis.
- Upstash rate limiting and anonymous daily quota.
- Security headers and CORS allowlist.
- Prompt-injection redaction before Mercury-2 analysis.
- No email body storage in Supabase.

### Data Storage

Stored:

- account email and tier,
- usage counters,
- promo lead/code state,
- optional analysis history metadata.

Not stored:

- email bodies,
- full subject text,
- full URLs,
- attachment content,
- Gmail inbox contents.

## Launch Checklist

- [ ] Backend builds cleanly.
- [ ] Extension builds cleanly.
- [ ] Production `/api/health` works at `https://guardscope.app/api/health`.
- [ ] Privacy Policy live at `https://guardscope.app/privacy`.
- [ ] Terms live at `https://guardscope.app/terms`.
- [ ] Supabase migrations applied, including 100 promo codes and `users.pro_expires_at`.
- [ ] Extension package scanned for secrets and remote-code patterns.
- [ ] Gmail manual QA completed across safe, risky, quota, auth, promo, and error states.
- [ ] Chrome Web Store screenshots prepared.
- [ ] Demo video prepared.
- [ ] Chrome Web Store data-use disclosure completed.
