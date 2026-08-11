# Security Review

## Implemented Controls

- Chrome MV3 extension with a restrictive CSP.
- No server secrets bundled in extension code.
- Side panel enabled only for Gmail tabs.
- Background message handlers reject non-internal senders for sensitive actions.
- `/api/analyze` enforces body size limits before analysis.
- Mercury-2 input is truncated and wrapped as untrusted XML-tagged data.
- Prompt-injection patterns are redacted before AI analysis.
- Supabase JWTs are cryptographically verified in production with `SUPABASE_JWT_SECRET`.
- Upstash Redis rate limits authenticated and anonymous analysis traffic.
- Anonymous free quota is server-side: 5 analyses per day per IP.
- Promo redemption requires authentication and matching JWT email.
- Promo code claiming uses a `status=unused` guard.
- Paystack webhooks use HMAC signature verification and idempotent event storage.

## Required Production Environment

- `NEXT_PUBLIC_APP_URL=https://guardscope.app`
- `NEXT_PUBLIC_SITE_URL=https://guardscope.app`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `INCEPTION_API_KEY`
- `VIRUSTOTAL_API_KEY`
- `GOOGLE_SAFE_BROWSING_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `SENTRY_DSN`

## Known Limitations

- Anonymous quotas depend on IP address and are best-effort. Shared networks and VPNs can affect accuracy.
- Gmail DOM extraction must be manually retested because Gmail can change selectors.
- Threat-intelligence APIs can fail open in some cases to preserve user experience.
- Signed-in free users are currently limited monthly by account, while anonymous users are limited daily by IP.

## Manual Security Checks

Run before launch:

```powershell
rg -n "sk-|SUPABASE_SERVICE|PAYSTACK_SECRET|VIRUSTOTAL_API_KEY|GOOGLE_SAFE_BROWSING_API_KEY|INCEPTION_API_KEY|UPSTASH" extension backend
rg -n "eval\(|new Function|http://" extension/src extension/manifest.json
npm run build --prefix backend
npm run build --prefix extension
```

Expected: no real secrets in source or extension build, no remote-code execution patterns, and both builds exit `0`.

## Supabase Checks

```sql
select status, count(*) from promo_codes group by status;
select column_name from information_schema.columns where table_name = 'users' and column_name = 'pro_expires_at';
```

Expected: 100 seeded promo codes before launch and `users.pro_expires_at` present.

