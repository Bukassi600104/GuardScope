# Deployment

## Production Domain

GuardScope production runs at:

```text
https://guardscope.app
```

## Vercel Environment

Configure these variables in Vercel:

```text
NEXT_PUBLIC_APP_URL=https://guardscope.app
NEXT_PUBLIC_SITE_URL=https://guardscope.app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
CONTROL_PANEL_SESSION_SECRET=
CONTROL_PANEL_SETUP_TOKEN=
INCEPTION_API_KEY=
VIRUSTOTAL_API_KEY=
GOOGLE_SAFE_BROWSING_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
SENTRY_DSN=
GUARDSCOPE_ACCESS_MODE=legacy
PAYMENTS_ENABLED=false
PAYSTACK_SECRET_KEY=
PAYSTACK_PRO_MONTHLY_PLAN_CODE=
PAYSTACK_PRO_ANNUAL_PLAN_CODE=
```

Paystack checkout stays unavailable until `PAYMENTS_ENABLED=true` and both recurring plan codes are configured. Follow `backend/PAYSTACK_SETUP.md` for the safe activation order.

Do not set `AUTH_AUTO_CONFIRM_SIGNUP` in production. Leaving it unset makes
public account creation use Supabase's standard signup flow and email
confirmation policy. Set `AUTH_AUTO_CONFIRM_SIGNUP=true` only for controlled
internal test environments where automatic email confirmation is intentional.

`CONTROL_PANEL_SESSION_SECRET` should be a long random secret used to sign owner
Control Panel sessions. If it is not set, GuardScope falls back to
`SUPABASE_JWT_SECRET`.

Set `CONTROL_PANEL_SETUP_TOKEN` to a long random one-time owner setup secret and
store it outside the repository. Production first-owner setup is locked without
this token if the owner credential row is ever missing after a database reset.

## Supabase Migrations

Apply migrations in order:

```text
001_initial_schema.sql
002_team_and_history.sql
003_promo_codes.sql
004_security_hardening.sql
005_add_pro_expires_at.sql
```

Verify promo codes:

```sql
select count(*) from promo_codes;
select status, count(*) from promo_codes group by status;
select column_name
from information_schema.columns
where table_name = 'users' and column_name = 'pro_expires_at';
```

Expected before beta launch:

- 100 total promo codes.
- Codes start as `unused`.
- `users.pro_expires_at` exists.

## Backend Smoke Test

```powershell
Invoke-RestMethod https://guardscope.app/api/health
```

Expected: JSON health response.

## Extension Package

```powershell
npm run build --prefix extension
Compress-Archive -Path extension\dist\* -DestinationPath GuardScope-chrome-web-store.zip -Force
```

Upload the ZIP built from `extension/dist`, not the source directory.

Before upload:

```powershell
rg -n "eval\(|new Function|http://|SUPABASE_SERVICE|INCEPTION_API_KEY|PAYSTACK_SECRET" extension\dist
```

Expected: no server secrets or remote-code execution patterns.

