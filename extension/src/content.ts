// GuardScope Content Script — Gmail email extraction + collapsed mini-tab
// The sidebar UI is now a Chrome Side Panel (no DOM injection needed).

import { extractEmailData } from './utils/emailExtractor'

const MINI_TAB_ID = 'guardscope-mini-tab'
const MINI_STYLE_ID = 'guardscope-mini-style'

// ── Context guard ─────────────────────────────────────────────────────────────
function isContextValid(): boolean {
  try {
    return (
      typeof chrome !== 'undefined' &&
      typeof chrome.runtime !== 'undefined' &&
      !!chrome.runtime.id &&
      typeof chrome.storage !== 'undefined' &&
      typeof chrome.storage.local !== 'undefined'
    )
  } catch {
    return false
  }
}

// ── Email-open detection ──────────────────────────────────────────────────────
function isEmailOpen(): boolean {
  if (/^#[^/]+\/[a-f0-9]{10,}/.test(window.location.hash)) return true
  return !!document.querySelector('.adn.ads')
}

// ── Email storage (tab-specific key) ─────────────────────────────────────────
// Each Gmail tab stores its email under its own key so multiple open Gmail
// tabs don't overwrite each other's state in the shared storage.
let myTabId: number | null = null
let emailSyncTimeout: ReturnType<typeof setTimeout> | null = null

function getEmailKey(): string {
  return myTabId ? `guardscope_email_${myTabId}` : 'guardscope_current_email'
}

function syncEmail(): void {
  if (emailSyncTimeout) clearTimeout(emailSyncTimeout)
  emailSyncTimeout = setTimeout(() => {
    if (!isContextValid()) return
    const key = getEmailKey()
    if (isEmailOpen()) {
      try {
        const email = extractEmailData()
        chrome.storage.local.set({ [key]: email })
      } catch (e) {
        console.warn('[GuardScope] Failed to extract email data:', e)
      }
    } else {
      chrome.storage.local.remove(key)
    }
  }, 300)
}

// ── Mini-tab (flashing shield when panel is collapsed) ────────────────────────

function injectMiniStyles(): void {
  if (document.getElementById(MINI_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = MINI_STYLE_ID
  style.textContent = `
    @keyframes gs-shield-pulse {
      0%, 100% { box-shadow: -2px 0 0 0 rgba(239,67,67,0), 0 0 0 0 rgba(239,67,67,0.8); }
      50% { box-shadow: -4px 0 12px 0 rgba(239,67,67,0.4), 0 0 0 6px rgba(239,67,67,0); }
    }
    #${MINI_TAB_ID} {
      animation: gs-shield-pulse 1.6s ease-in-out infinite;
      transition: width 0.2s ease, background 0.2s ease;
    }
    #${MINI_TAB_ID}:hover {
      width: 38px !important;
      background: #22253a !important;
    }
  `
  document.head.appendChild(style)
}

function showMiniTab(): void {
  if (!isContextValid()) return
  if (document.getElementById(MINI_TAB_ID)) return
  injectMiniStyles()

  const tab = document.createElement('button')
  tab.id = MINI_TAB_ID
  tab.title = 'Open GuardScope'
  tab.setAttribute('aria-label', 'Open GuardScope security panel')
  tab.style.cssText = `
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 32px;
    height: 64px;
    background: #071C2C;
    border: 1.5px solid rgba(57,182,255,0.5);
    border-right: none;
    border-radius: 8px 0 0 8px;
    cursor: pointer;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  `
  // Shield icon SVG (same as App.tsx)
  tab.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill="#39B6FF"/>
    <path d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="white"/>
  </svg>`

  tab.addEventListener('click', () => {
    if (!isContextValid()) return
    // Ask background to open the side panel (background has chrome.sidePanel access)
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' })
  })

  document.body.appendChild(tab)
}

function hideMiniTab(): void {
  document.getElementById(MINI_TAB_ID)?.remove()
}

// When the side panel opens/closes, App.tsx writes guardscope_panel_visible.
// Content script reacts: visible=false → show mini-tab, visible=true → hide it.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !isContextValid()) return
  if (!('guardscope_panel_visible' in changes)) return
  const visible = changes.guardscope_panel_visible.newValue as boolean
  if (visible) {
    hideMiniTab()
  } else {
    showMiniTab()
  }
})

// ── Navigation listeners ──────────────────────────────────────────────────────
window.addEventListener('hashchange', () => {
  if (!isContextValid()) return
  // Slight delay so Gmail finishes rendering the email DOM before we scrape it
  setTimeout(syncEmail, 600)
})

window.addEventListener('popstate', () => {
  if (!isContextValid()) return
  syncEmail()
})

// ── DOM observer (fallback for Gmail actions that don't change the URL) ───────
const observer = new MutationObserver(syncEmail)

function startObserver(): void {
  const target = document.querySelector('[role="main"]') || document.body
  observer.observe(target, { childList: true, subtree: true })
  syncEmail() // initial check on load
}

function waitForGmail(retries = 20): void {
  if (document.querySelector('[role="main"]')) {
    startObserver()
    return
  }
  if (retries > 0) {
    setTimeout(() => waitForGmail(retries - 1), 500)
  } else {
    startObserver()
  }
}

// ── Initialize ────────────────────────────────────────────────────────────────
if (!isContextValid()) {
  // Extension context invalid — exit silently (no console output in production)
} else {
  // Clean up any stale mini-tabs left by a previous extension instance
  document.getElementById(MINI_TAB_ID)?.remove()

  // Fetch our own tab ID first — used for tab-specific email storage keys
  chrome.runtime.sendMessage({ type: 'GET_TAB_ID' }, (res) => {
    if (chrome.runtime.lastError) return // context gone
    myTabId = (res?.tabId as number) ?? null

    chrome.storage.local.get(
      ['guardscope_onboarding_complete', 'guardscope_panel_visible'],
      (result) => {
        if (chrome.runtime.lastError) return

        if (result.guardscope_onboarding_complete) {
          waitForGmail()
          // If the panel was closed before Gmail reloaded, show the mini-tab
          if (result.guardscope_panel_visible === false) {
            setTimeout(showMiniTab, 800)
          }
        } else {
          // Poll until onboarding is completed — max 5 minutes (150 × 2s)
          let pollRetries = 0
          const MAX_POLL_RETRIES = 150
          const pollInterval = setInterval(() => {
            if (!isContextValid() || pollRetries >= MAX_POLL_RETRIES) {
              clearInterval(pollInterval)
              return
            }
            pollRetries++
            chrome.storage.local.get('guardscope_onboarding_complete', (r) => {
              if (chrome.runtime.lastError || !isContextValid()) {
                clearInterval(pollInterval)
                return
              }
              if (r.guardscope_onboarding_complete) {
                clearInterval(pollInterval)
                waitForGmail()
              }
            })
          }, 2000)
        }
      }
    )
  })
}
