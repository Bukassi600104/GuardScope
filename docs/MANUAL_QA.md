# Manual Gmail QA

Manual QA is required before Chrome Web Store submission because Gmail DOM structure can change outside this repository.

## Setup

1. Run `npm run build --prefix extension`.
2. Open `chrome://extensions`.
3. Enable Developer Mode.
4. Load unpacked extension from `extension/dist`.
5. Open Gmail and sign into a test account.

## Onboarding

- First install opens onboarding.
- Privacy link points to `https://guardscope.app/privacy`.
- Activation opens or focuses Gmail.
- Content script waits until onboarding is complete before extraction.

## Gmail Extraction Cases

- Plain email with no links.
- Email with multiple links.
- Email with attachment names.
- Forwarded email.
- Email with expanded Gmail authentication details showing mailed-by and signed-by.
- Multiple Gmail tabs open at the same time.

## Analysis States

- No email selected.
- Idle with email selected.
- Progress/analyzing.
- SAFE/LOW result.
- HIGH/CRITICAL result.
- Technical details render.
- Copy report writes to clipboard.
- Local history updates.
- Extension badge updates for HIGH/CRITICAL results.
- Network failure shows a useful error.

## Quota And Promo

- Anonymous analyses 1-5 succeed.
- Anonymous analysis 6 shows daily limit messaging.
- Signed-in free quota displays separately from anonymous quota.
- Promo-code redemption requires sign-in.
- Valid promo code upgrades account to Pro for 30 days.
- Pro user can analyze without free quota blocking.

## Evidence To Capture

- Chrome version.
- Extension build date and commit.
- Screenshots for onboarding, popup, progress, safe result, critical result, and technical details.
- Any Gmail extraction failures with subject/sender redacted.

