# Post-Launch Monitoring

Use this checklist during the first launch window after the Chrome Web Store publication.

## Daily Checks

- Chrome Web Store listing remains public and installable.
- Chrome Web Store reviews, ratings, and support questions are reviewed.
- Support inbox at support@guardscope.app is checked.
- Production homepage CTA opens the public Chrome Web Store listing.
- `https://guardscope.app/api/health` returns healthy.
- Vercel production deployments show no new critical errors.
- Sentry or application logs show no spike in failed analysis requests.
- Supabase auth, quota, and promo-code tables show expected activity.
- Promo-code inventory and redemption rates are reviewed.

## First-Week Watch Items

- Gmail extraction failures after Chrome or Gmail UI changes.
- Quota confusion between anonymous, free-account, promo, and Pro users.
- Users expecting guaranteed protection instead of advisory analysis.
- Permission concerns about Gmail host access.
- Any support report involving unexpected email-content storage or retention.
- Any Chrome Web Store policy warning or user data disclosure mismatch.

## Response Rules

- Do not promise guaranteed phishing protection.
- Keep privacy language precise: user-triggered scans only, no GuardScope database storage of email bodies after analysis.
- Ask for reproducible steps before changing extension behavior.
- Avoid uploading a new extension ZIP unless a verified extension issue requires a new reviewed version.
- Website copy and docs can be updated independently from the extension package.

## Escalation

Escalate immediately if any of these occur:

- Chrome Web Store listing becomes unavailable.
- Install button disappears or installation fails for multiple users.
- Production analysis endpoint returns widespread errors.
- A user reports email content being stored unexpectedly.
- A Chrome Web Store policy or privacy review notice arrives.
