# GuardScope — Chrome Extension Permission Justifications

This document explains why each permission requested by GuardScope is necessary.
Submitted as part of the Chrome Web Store review process.

---

## `activeTab`

**Why needed:** GuardScope reads the currently open Gmail email from the DOM in order to extract the sender address, subject line, body text, and URLs for security analysis. This permission is required to access the content of the active Gmail tab when the user clicks "Analyze This Email."

**Scope:** Only the Gmail tab that is currently active. No other tabs are accessed.

---

## `storage`

**Why needed:** GuardScope uses `chrome.storage.local` to:
1. Store the JWT authentication token (so the user stays signed in across browser sessions)
2. Temporarily cache the currently-open email's metadata while the analysis runs (cleared when the user closes the email)
3. Store the onboarding completion flag (so the consent screen is shown only once)
4. Store local analysis history (last 20 results, for user reference)

No email content is permanently stored. The email data in storage is overwritten each time a new email is opened.

---

## `scripting`

**Why needed:** GuardScope injects a sidebar iframe into the Gmail page to display the security analysis panel. This requires the `scripting` permission to programmatically add a UI element to the Gmail DOM. Without this, the sidebar cannot be shown alongside the email.

**Scope:** The injection targets only `https://mail.google.com/*` as specified in `content_scripts`.

---

## Host Permission: `https://mail.google.com/*`

**Why needed:** Required by `content_scripts` to run on Gmail pages where emails are displayed.

---

## Host Permission: `https://backend-gules-sigma-37.vercel.app/*`

**Why needed:** The analysis engine (AI + DNS + URL threat scanning) runs on our secure backend server. The extension sends email metadata to this endpoint for analysis and receives a security report. No other hosts are contacted directly from the extension.

---

## Host Permission: `https://zfuxxoyjfedmtoeydcvp.supabase.co/*`

**Why needed:** User authentication (sign in / sign out) and usage count display are handled via Supabase. The extension queries the user's monthly analysis count to display it in the popup.

---

## Data Use Disclosure

GuardScope collects and transmits the following data:

| Data | Purpose | Stored? |
|------|---------|---------|
| Email sender address, subject, body text, URLs | Security analysis (sent to backend, analyzed, discarded) | No |
| User email address + password hash | Authentication | Yes (Supabase Auth) |
| Monthly analysis count | Usage limiting and display | Yes (Supabase, count only) |
| JWT token | Session authentication | Yes (chrome.storage.local, local only) |

**What is NOT collected:** Full email content is never stored. No browsing history. No contacts. No attachment content.
