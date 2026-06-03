# GuardScope

AI-powered Gmail phishing investigation in a Chrome side panel.

GuardScope is a published Chrome MV3 extension and Next.js backend that helps users inspect suspicious Gmail messages before they click, reply, or open attachments. It combines deterministic security checks with Mercury-2 AI analysis to produce a plain-English risk report with evidence, a 0-100 score, and recommended action.

**Launch status:** Published on the Chrome Web Store.
**Chrome Web Store:** https://chromewebstore.google.com/detail/guardscope-email-security/fbjajijepjmcmkcidfbmjbjmmegokhif
**Production domain:** https://guardscope.app
**Primary AI engine:** Mercury-2 by InceptionLabs.

## What It Does

- Extracts the open Gmail message from the browser after user consent.
- Checks sender authentication signals such as SPF, DKIM, DMARC, Gmail mailed-by, and Gmail signed-by.
- Evaluates sender domain age, suspicious TLDs, free-provider risk, lookalike domains, and known trusted domains.
- Scans URLs with VirusTotal, Google Safe Browsing, PhishTank, URLhaus, Spamhaus, and local URL heuristics.
- Detects social engineering patterns such as credential harvesting, BEC, prize scams, delivery scams, authority impersonation, and advance-fee fraud.
- Returns a structured report with risk score, risk level, verdict, green flags, red flags, technical details, and a shareable summary.

## Architecture

```text
Gmail message
  -> Chrome MV3 content script extracts metadata
  -> Chrome side panel requests analysis
  -> Next.js /api/analyze validates quota and rate limits
  -> Parallel security intelligence checks run
  -> Mercury-2 produces deep analysis when needed
  -> Hybrid scorer normalizes final risk
  -> Side panel renders the report
```

## Repository Layout

```text
GuardScope/
  extension/   Chrome MV3 extension built with Vite, CRXJS, React, TypeScript, Tailwind
  backend/     Next.js 15 app, API routes, landing pages, Supabase migrations
  tasks/       Historical implementation plans and launch checklist
  docs/        Launch-readiness, Chrome Web Store, security, deployment, and QA docs
```

## Tech Stack

- **Extension:** Chrome Manifest V3, side panel API, Vite, CRXJS, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js 15 App Router, React 19, TypeScript, Vercel
- **AI:** Mercury-2 by InceptionLabs
- **Database/Auth:** Supabase PostgreSQL, Supabase Auth, RLS
- **Threat intel:** VirusTotal, Google Safe Browsing, PhishTank, URLhaus, Spamhaus
- **Rate limiting:** Upstash Redis
- **Payments:** Stripe and Paystack, currently suspended during the launch-code promo period
- **Email:** Resend
- **Monitoring:** Sentry

## Quotas And Beta Access

- Anonymous users: 5 analyses per day per IP.
- Signed-in free users: 5 analyses per month per account.
- Pro and Team users: unlimited analyses, subject to abuse rate limits.
- Launch promo codes: 100 seeded `GS-...` codes, each granting 30 days of Pro access after redemption.

## Privacy Model

GuardScope sends email metadata and content to the backend only for analysis. Email bodies, subjects, URLs, and attachments are not stored in the database. Stored data is limited to account details, tier, usage counters, promo-code lead data, and optional analysis history metadata such as sender domain, risk score, risk level, and duration.

## Local Development

### Backend

```powershell
cd backend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Required backend environment variables are documented in `backend/.env.example`.

### Extension

```powershell
cd extension
npm ci
Copy-Item .env.example .env
npm run dev
```

For local Chrome testing, build the extension and load `extension/dist/` from `chrome://extensions` with Developer Mode enabled.

```powershell
npm run build --prefix extension
```

## Verification Commands

```powershell
npm test --prefix backend
npm test --prefix extension
npm run build --prefix backend
npm run build --prefix extension
```

The release gate is not just compilation. Manual Gmail QA is required before Chrome Web Store updates because extraction depends on Gmail DOM behavior.

## Chrome Web Store Release Checklist

- Public listing is live at `https://chromewebstore.google.com/detail/guardscope-email-security/fbjajijepjmcmkcidfbmjbjmmegokhif`.
- Production backend deployed at `https://guardscope.app`.
- Privacy Policy live at `https://guardscope.app/privacy`.
- Terms live at `https://guardscope.app/terms`.
- `extension/PERMISSION_JUSTIFICATIONS.md` matches `extension/manifest.json`.
- Extension build is packaged from `extension/dist/`.
- Package contains no source maps, `.env` files, or server secrets.
- Screenshots prepared: onboarding, popup, progress, safe result, critical result, technical details.
- Data-use disclosure matches the privacy model above.

## Security Notes

- No secrets are bundled in the extension.
- The extension CSP blocks remote scripts and `eval`.
- The backend verifies Supabase JWTs with `SUPABASE_JWT_SECRET` in production.
- Upstash enforces per-minute and hourly abuse limits.
- Anonymous free quota is enforced server-side by IP as a best-effort control.
- Promo-code redemption requires a signed-in account and matching JWT email.

## Roadmap

- Complete Chrome Web Store submission.
- Finish live production smoke tests and Gmail QA.
- Add more automated coverage around quota, promo redemption, and scoring.
- Add team invite/admin workflows.
- Expand localized threat-pattern guidance for Francophone West Africa.
