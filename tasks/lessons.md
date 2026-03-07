# GuardScope — Lessons Learned

## Purpose
Updated after every user correction. Rules to prevent repeating mistakes.

---

## Lesson 4 — Never Ask User for Manual Deployments or Tokens Twice (2026-03-03)

**Mistake (pattern to avoid):** Telling the user to manually deploy to Vercel, run
SQL in Supabase dashboard, or provide tokens more than once.

**Rule:**
- Supabase MCP and Vercel MCP are configured in `~/.claude/settings.json`
- Tokens are already stored there — never ask again
- For ALL Supabase tasks (migrations, queries, RLS, auth): use `mcp__supabase__*` tools
- For ALL Vercel tasks (deploy, env vars, domains): use `mcp__vercel__*` tools or `vercel` CLI
- Secret tokens belong in `settings.json` ONLY — never write them to memory files or code
- If MCP tools aren't responding, check settings.json or ask user to regenerate tokens
  (but ask at most once per session)

---

## Lesson 1 — Gmail SPA Sidebar Detection (2026-03-03)

**Mistake:** Used `MutationObserver` alone to detect when Gmail opens an email.
Gmail is a hash-based SPA — navigating between emails changes the URL hash
(`#inbox/16hexchars`) but the DOM mutation may fire before the email elements
exist. Observer-only approach misses the initial navigation event.

**Also wrong:** Used `.gs` as a selector in `isEmailOpen()`. This class appears
on inbox list items, not just open emails — causes false positives or confusion.

**Fix:**
1. Add `window.addEventListener('hashchange', syncSidebar)` as the PRIMARY trigger.
   Gmail's URL hash is the most reliable and immediate signal.
2. `isEmailOpen()` checks URL hash FIRST: `/^#[^/]+\/[a-f0-9]{10,}/`
   This matches any Gmail email URL (inbox/sent/all/etc + 10+ hex message ID).
3. DOM fallback uses `.adn.ads` (reading pane) — only present when email is open.
4. Added `waitForGmail()` with 20 retries/500ms to ensure `[role="main"]` exists
   before starting the MutationObserver.

**Rule:** For Gmail (and any SPA), ALWAYS add URL change listeners alongside DOM
mutation observers. SPAs navigate via URL before DOM is updated.

---

## Lesson 2 — Extension Popup Buttons Need onClick Handlers (2026-03-03)

**Mistake:** Phase 1 popup had a "Sign In" button with no `onClick` — just a
styled element. User clicked it and nothing happened.

**Fix:** Even for placeholder/stub functionality in early phases, EVERY button
must do SOMETHING:
- If the real feature isn't built yet: open the relevant page, show a message,
  or change button state to give visible feedback
- Phase 1 sign-in button now opens Gmail tab (or focuses existing one) via
  `chrome.tabs.query` — useful AND honest about Phase 1 scope

**Rule:** Never ship a button without an onClick. If the feature isn't ready,
the onClick should explain why or redirect usefully. Dead buttons erode trust.

---

## Lesson 3 — Use All Available MCP Tools Proactively (2026-03-03)

**Reminder from user:** Stitch MCP, Vercel CLI, and other tools should be
used without being asked. Stitch generates production-quality UI designs
that inform the React component implementation (e.g. conic gradient gauge).

**Adopted patterns:**
- Use Stitch MCP at Phase start to generate reference designs for each UI screen
- Download Stitch HTML → extract CSS/layout → implement in React/Tailwind
- GuardScope Stitch project: `18432972729058615564`
  - Sidebar HIGH RISK: `154bfd27ab354cf8b10a57c9155b1f70`
  - Popup: `f2b95aaab5d945918995491d6711626f`
- Don't hammer Stitch download URLs rapidly — 429 rate limit kicks in fast
