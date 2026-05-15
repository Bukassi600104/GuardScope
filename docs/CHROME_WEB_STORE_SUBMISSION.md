# Chrome Web Store Submission

## Listing

**Name:** GuardScope - Email Security

**Short description:** AI-powered phishing detection for Gmail.

**Detailed description:**

GuardScope helps Gmail users investigate suspicious emails before they click links, reply, or open attachments. It analyzes sender authentication, domain age, link reputation, attachment names, social engineering patterns, and URL threat intelligence. Results appear in a Chrome side panel with a 0-100 risk score, a plain-English verdict, evidence-backed red and green flags, and a recommended action.

GuardScope does not store email bodies, subjects, links, or attachment content in its database. Email content is sent to the GuardScope backend only for real-time analysis and discarded after processing.

## Single Purpose

GuardScope's single purpose is Gmail phishing and email threat analysis.

## Permission Justification Summary

- `storage`: auth/session state, onboarding flag, current email cache, local history, and local usage display.
- `clipboardWrite`: copy the generated report when the user clicks "Copy report."
- `sidePanel`: display the security report next to Gmail.
- `tabs`: detect Gmail tabs, configure the side panel per tab, open onboarding, and route analysis to the correct Gmail tab.
- `https://mail.google.com/*`: run the Gmail content script.
- `https://guardscope.app/*`: call GuardScope API and open account/upgrade/legal pages.
- Supabase host: authenticate users.

## Data Use Disclosure

GuardScope collects or processes:

- Email sender, subject, body text, URLs, and attachment names for analysis only.
- User email address for authentication and account support.
- Usage counts for quota enforcement.
- Promo lead information for early-access code delivery.
- Risk metadata for signed-in analysis history.

GuardScope does not sell user data, does not collect browsing history, and does not store email bodies in the database.

## Remote Code

GuardScope does not execute remote code. All extension JavaScript is bundled at build time. The manifest CSP blocks remote scripts and disallows `eval`.

## Required Assets

- Screenshot 1: onboarding/consent screen.
- Screenshot 2: popup signed-out or signed-in state.
- Screenshot 3: progress/analyzing state.
- Screenshot 4: SAFE or LOW result.
- Screenshot 5: HIGH or CRITICAL result.
- Screenshot 6: technical details expanded.
- Demo video: 60-90 seconds showing install, consent, Gmail analysis, result, and copy report.

## URLs

- Homepage: https://guardscope.app
- Privacy Policy: https://guardscope.app/privacy
- Terms: https://guardscope.app/terms
- Support: support@guardscope.app

## Pre-Submission Checklist

- Build extension from `extension/dist`.
- Confirm ZIP contains no `.env` files, source maps, or server secrets.
- Confirm `extension/PERMISSION_JUSTIFICATIONS.md` matches `extension/manifest.json`.
- Confirm production `/api/health` is live.
- Confirm promo-code request and redemption work in production.
- Complete manual Gmail QA from `docs/MANUAL_QA.md`.

