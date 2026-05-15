# Chrome Web Store Submission

This document maps GuardScope's website, extension behavior, legal copy, and listing assets to the Chrome Web Store review story.

## Listing

**Name:** GuardScope - Email Security

**Short description:** AI-assisted phishing analysis for Gmail.

**Detailed description:**

GuardScope helps Gmail users inspect suspicious emails before they click links, reply, or open attachments. The extension analyzes sender authentication, domain age, URL reputation, attachment names, social-engineering patterns, and threat-intelligence signals. Results appear in a Chrome side panel with a 0-100 advisory risk score, a plain-English verdict, evidence-backed red and green flags, and suggested next steps.

GuardScope analyzes a Gmail message only when the user starts a scan. GuardScope does not store email bodies, subjects, sender details, recipients, headers, or extracted email URLs in its databases after producing the analysis response.

## Single Purpose

GuardScope's single purpose is Gmail phishing and email threat analysis.

Reviewer-safe wording:

> GuardScope helps Gmail users analyze user-selected emails for phishing, impersonation, malicious links, sender authentication issues, and social-engineering risk.

Avoid broader claims such as full inbox monitoring, certain protection, complete email security, or account takeover prevention.

## Permission Justification Summary

- `storage`: auth/session state, onboarding flag, current email cache, local history, and local usage display.
- `clipboardWrite`: copy the generated report when the user clicks "Copy report."
- `sidePanel`: display the security report next to Gmail.
- `tabs`: detect Gmail tabs, configure the side panel per tab, open onboarding, and route analysis to the correct Gmail tab.
- `https://mail.google.com/*`: run the Gmail content script for the current Gmail message.
- `https://guardscope.app/*`: call GuardScope API and open account, upgrade, and legal pages.
- Supabase host: authenticate users.

## Data Use Disclosure

GuardScope processes:

- Email sender, subject, body text, headers available to the extension, URLs, and attachment names for the scan the user requests.
- User email address for authentication and account support.
- Usage counts for quota enforcement.
- Promo lead information for launch-code delivery.
- Risk metadata for signed-in analysis history, where enabled.

GuardScope does not:

- Store email bodies in its database.
- Sell user data.
- Use extension data for advertising.
- Collect browsing history outside the extension's single purpose.
- Collect Gmail passwords or OAuth tokens.

## Legal URLs

- Homepage: https://guardscope.app
- Privacy Policy: https://guardscope.app/privacy
- Terms: https://guardscope.app/terms
- Support: support@guardscope.app

## Website Alignment

- Homepage hero must say GuardScope is for Gmail email threat analysis.
- Primary CTA remains early access until the Chrome Web Store listing URL is approved.
- Privacy promise must stay visible: no email storage, user-triggered scans only, advisory results.
- Quota copy must remain consistent:
  - Anonymous users: 5 analyses per day per IP.
  - Signed-in free users: 5 analyses per month per account.
  - Launch promo users: 30 days of Pro access from code activation.

## Required Assets

- Screenshot 1: onboarding/consent screen.
- Screenshot 2: popup signed-out or signed-in state.
- Screenshot 3: progress/analyzing state.
- Screenshot 4: SAFE or LOW result.
- Screenshot 5: HIGH or CRITICAL result.
- Screenshot 6: technical details expanded.
- Optional demo video: 60-90 seconds showing install, consent, Gmail analysis, result, and copy report.

## Pre-Submission Checklist

- Build extension from `extension/dist`.
- Confirm ZIP contains no `.env` files, source maps, or server secrets.
- Confirm `extension/PERMISSION_JUSTIFICATIONS.md` matches `extension/manifest.json`.
- Confirm production `/api/health` is live.
- Confirm promo-code request and redemption work in production.
- Confirm website legal pages are deployed and linked from the footer.
- Complete manual Gmail QA from `docs/MANUAL_QA.md`.
