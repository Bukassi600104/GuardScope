# GuardScope Chrome Extension Permission Justifications

This document explains every permission and host permission requested by GuardScope for Chrome Web Store review.

GuardScope has one purpose: analyze Gmail messages for phishing, impersonation, malicious links, and social engineering signals after the user opens Gmail and chooses to run analysis.

## Permissions

### `storage`

GuardScope uses `chrome.storage.local` to store:

- the user's local auth/session state so they stay signed in,
- the onboarding completion flag,
- the current Gmail message metadata while analysis runs,
- local analysis history for the last 20 results,
- local anonymous daily usage counter display state.

Email content is cached locally only to support the active analysis flow and is replaced when the user opens another email.

### `clipboardWrite`

GuardScope uses this permission only for the "Copy report" action in the side panel. The extension writes the generated analysis summary to the clipboard when the user clicks the copy button.

### `sidePanel`

GuardScope uses Chrome's side panel API to display the phishing analysis report next to Gmail. The panel is enabled only for Gmail tabs.

### `tabs`

GuardScope uses tab access to:

- detect whether the active tab is Gmail,
- enable or disable the side panel per tab,
- open the first-run onboarding page,
- open or focus Gmail after onboarding,
- open `guardscope.app` signup and upgrade pages from the extension UI,
- route analysis to the correct Gmail tab so multiple Gmail tabs do not overwrite each other's state.

The extension does not collect browsing history.

## Host Permissions

### `https://mail.google.com/*`

Required for the Gmail content script. GuardScope reads the currently opened Gmail message DOM to extract sender, subject, body text, URLs, attachment names, and visible Gmail authentication hints.

### `https://guardscope.app/*`

Required for backend API calls, signup, upgrade, privacy, terms, and promo-code pages hosted at the production domain.

### Supabase project URL

Required for Supabase Auth calls from the extension. The bundled anon key is public by design; service-role keys are never included in the extension.

## Data Use Disclosure

| Data | Purpose | Stored? |
| --- | --- | --- |
| Sender, subject, body text, URLs, attachment names | Security analysis | Not stored in database |
| Risk score, risk level, sender domain, duration | Optional history and usage analytics | Stored for signed-in users |
| User email address | Authentication, account support, promo code delivery | Stored in Supabase |
| Promo lead name, email, country | Early-access code assignment | Stored temporarily |
| Local auth token | Keep user signed in | Stored locally in Chrome |

## Remote Code Statement

GuardScope does not execute remote code. The extension uses bundled JavaScript only, blocks external scripts through CSP, and does not use `eval()` or `new Function()`.
