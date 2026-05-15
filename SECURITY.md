# Security Policy

GuardScope handles sensitive email content during real-time analysis, so security reports are welcome.

## Reporting A Vulnerability

Email security issues to:

```text
support@guardscope.app
```

Please include:

- affected component,
- steps to reproduce,
- impact,
- any relevant logs or screenshots with private email content redacted.

## Data Handling Commitments

- Email content is analyzed transiently and not stored in the database.
- Server secrets are never bundled in the Chrome extension.
- Promo-code redemption requires a signed-in account and matching JWT email.
- Production JWT verification requires `SUPABASE_JWT_SECRET`.

