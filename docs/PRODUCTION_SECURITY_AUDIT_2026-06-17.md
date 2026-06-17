# GuardScope Production Security Audit - 2026-06-17

This note records the post-launch investigation into launch-code safety,
extension install visibility, and production readiness after Chrome Web Store
publication.

## Scope

- Public website and API on `https://guardscope.app`
- Promo-code request and redemption flow
- Supabase table exposure and RLS posture
- Owner Control Panel authentication surfaces
- Chrome extension production package boundaries
- Vercel deployment state
- GitHub Actions state

## Current Production Evidence

- Promo codes total: 100
- Promo codes unused: 100
- Promo codes currently available for new requests: 99
- Promo codes assigned but not redeemed: 1
- Promo-code request records: 1
- Promo codes claimed: 0
- App user records: 1
- Public anon REST access:
  - `promo_codes`: 401
  - `control_panel_credentials`: 401
  - `extension_installations`: 401

This does not support the concern that launch codes have been drained or
claimed through a bypass. One launch code is assigned to an email address but
has not been redeemed; 99 remain available for new requests. The Chrome Web
Store install count can be higher than Control Panel registrations because
Chrome reports extension installs, while GuardScope registrations only count
users who create/sign in to a GuardScope account.

## Fixes Applied

### Promo Code Exposure

The public `/api/promo/request` route no longer returns the assigned launch code
in the normal browser JSON response. Codes are delivered to the requested email
address instead.

The route only includes a browser-visible code when all of these are true:

- Email delivery failed.
- `PROMO_BROWSER_CODE_FALLBACK=true` is explicitly set on the server.
- The request passed rate limiting, honeypot checks, duplicate-email checks,
  disposable-domain checks, IP limits, and domain limits.

By default, this prevents someone from entering another person's email address
and immediately seeing that person's code in the browser response.

Repeat requests for an already assigned code are now guarded separately from
new requests. Resends are rate-limited by hashed email and IP telemetry, and
blocked resend attempts return a neutral message without exposing whether a
specific address owns a code.

### Website And API Headers

Public website pages no longer return wildcard browser CORS. The deployed pages
return:

- `Access-Control-Allow-Origin: https://guardscope.app`
- `Content-Security-Policy` with `frame-src 'none'`, `object-src 'none'`, and
  `base-uri 'self'`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

Production API probes from an untrusted browser origin returned
`Access-Control-Allow-Origin: null` on sensitive promo and extension lifecycle
endpoints.

### Control Panel Clarity

The owner Control Panel now distinguishes assigned-but-unredeemed promo codes
from truly available inventory. Assigned codes display as `Assigned`, and the
codes table uses the assignment timestamp rather than the original seed
creation timestamp.

### Extension Lifecycle Visibility

Extension version `1.0.2` adds privacy-safe lifecycle telemetry:

- install
- update
- uninstall

The backend stores only a server-side HMAC of an extension-generated install ID,
the event type, extension version, and timestamps. It does not store Gmail
content, email bodies, subjects, recipients, raw IPs, or browser history for
this telemetry.

The production telemetry POST endpoint only accepts requests from the published
Chrome extension origin.

### Password Policy Consistency

The password reset page now matches the backend and signup policy: at least 12
characters.

## Verification Commands

- `npm test` in `backend`: 32/32 passed
- `npm run build` in `backend`: passed
- `npm audit --json` in `backend`: 0 vulnerabilities
- `npm test` in `extension`: 8/8 passed
- `npm audit --json` in `extension`: 0 vulnerabilities
- `vercel deploy --prod --yes`: deployed and aliased to `https://guardscope.app`
- Live health check: `GET /api/health` returned 200
- Live invalid promo request check: returned 400 without code exposure
- Live CORS probes: hostile origin received `Access-Control-Allow-Origin: null`
  from protected API routes
- Live promo counts: 100 total codes, 99 available, 1 assigned/unredeemed, 0
  claimed
- Supabase anon REST checks on sensitive tables returned 401

## Chrome Web Store Package

Upload-ready extension package:

`GuardScope-extension-v1.0.2-chrome-web-store.zip`

The ZIP root contains `manifest.json`, not a nested `dist` folder.

Important: Chrome Web Store install/uninstall telemetry starts only after users
receive extension version `1.0.2`. Historical installs remain visible only in
the Chrome Web Store dashboard.

## Remaining Manual Gates

These cannot be fully completed from code alone:

1. Upload `GuardScope-extension-v1.0.2-chrome-web-store.zip` to Chrome Web Store
   and submit it for review.
2. Enable Supabase Auth leaked-password protection in the Supabase dashboard.
3. Resolve the GitHub account billing lock so GitHub Actions can run again.

## GitHub Actions Note

The latest CI runs failed before executing build or test steps. GitHub reports:

`The job was not started because your account is locked due to a billing issue.`

This is not evidence of a current backend or extension build failure.

## Security Caveat

No production application can be truthfully described as "unbreakable." The
current evidence shows the reviewed promo-code, table-access, extension-origin,
and build surfaces are materially hardened, and no current evidence supports a
promo-code drain.
