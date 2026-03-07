// GuardScope Content Script — Gmail sidebar injection

import { extractEmailData } from './utils/emailExtractor'

const SIDEBAR_ID = 'guardscope-sidebar-container'
const SIDEBAR_WIDTH = '360px'

let sidebarMounted = false
let sidebarCreating = false // prevents double-create during 300ms setTimeout window

/**
 * Check if the extension context is still valid.
 * When an extension is reloaded/updated while Gmail is open, the old content
 * script loses the chrome runtime — chrome.runtime and chrome.storage both
 * become undefined, making all chrome.* calls throw TypeError.
 * This guard prevents those errors from surfacing.
 */
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

function createSidebar(): void {
  sidebarCreating = false // clear the in-flight flag regardless of outcome
  if (!isContextValid()) return
  if (!isEmailOpen()) return // safety: re-check — user may have navigated away in 300ms
  if (document.getElementById(SIDEBAR_ID)) { sidebarMounted = true; return }

  // Wrap getURL in try-catch: context can die between isContextValid() and here
  let sidebarUrl: string
  try {
    sidebarUrl = chrome.runtime.getURL('src/sidebar/sidebar.html')
  } catch {
    return // context invalidated — bail silently
  }

  const container = document.createElement('div')
  container.id = SIDEBAR_ID
  container.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: ${SIDEBAR_WIDTH};
    height: 100vh;
    z-index: 9999;
    box-shadow: -4px 0 24px rgba(0,0,0,0.4);
  `

  // Shadow DOM prevents Gmail CSS from leaking in
  const shadow = container.attachShadow({ mode: 'open' })
  const iframe = document.createElement('iframe')
  iframe.src = sidebarUrl
  iframe.style.cssText = 'width:100%;height:100%;border:none;'
  shadow.appendChild(iframe)

  document.body.appendChild(container)
  sidebarMounted = true
  console.log('[GuardScope] Sidebar mounted')

  // Capture email data immediately and store for sidebar/background to read
  storeCurrentEmail()
}

function removeSidebar(): void {
  sidebarCreating = false // cancel any pending create
  const el = document.getElementById(SIDEBAR_ID)
  if (el) {
    el.remove()
    sidebarMounted = false
    console.log('[GuardScope] Sidebar removed')
  }
}

/**
 * Reliable Gmail email-open detection.
 *
 * Two independent signals — either one triggers the sidebar:
 *  1. URL hash: Gmail navigates to /#inbox/16HEXCHARS when opening an email.
 *  2. DOM: .adn.ads is the reading pane Gmail mounts only when an email is open.
 *
 * Avoided: `.gs` (matches inbox list items), `[data-message-id]` (matches list rows).
 */
function isEmailOpen(): boolean {
  // Signal 1 — URL hash contains a message ID (hex, 10+ chars after folder name)
  if (/^#[^/]+\/[a-f0-9]{10,}/.test(window.location.hash)) {
    return true
  }
  // Signal 2 — reading pane is in the DOM
  return !!(
    document.querySelector('.adn.ads') ||          // primary reading pane
    document.querySelector('[data-legacy-message-id]') || // thread within pane
    document.querySelector('.nH.if .gs')            // opened thread container
  )
}

function syncSidebar(): void {
  if (!isContextValid()) return
  if (isEmailOpen() && !sidebarMounted && !sidebarCreating) {
    sidebarCreating = true
    setTimeout(createSidebar, 300)
  } else if (!isEmailOpen() && sidebarMounted) {
    removeSidebar()
  }
}

function storeCurrentEmail(): void {
  if (!isContextValid()) return
  try {
    const email = extractEmailData()
    chrome.storage.local.set({ guardscope_current_email: email })
    console.log('[GuardScope] Email data stored:', email.fromEmail, email.subject)
  } catch (e) {
    console.warn('[GuardScope] Failed to extract email data:', e)
  }
}

// ── Signal 1: URL hash changes (Gmail SPA navigation) ──────────────────────
// This is the most reliable trigger — fires immediately when user clicks an email.
window.addEventListener('hashchange', () => {
  if (!isContextValid()) return
  syncSidebar()
  // Re-extract on each new email open — re-check context inside the timeout
  if (isEmailOpen()) {
    setTimeout(() => { if (isContextValid()) storeCurrentEmail() }, 600)
  }
})

// ── Signal 2: DOM mutations (fallback for cases where hash doesn't change) ──
// Observe the main area for DOM changes (e.g. inline reply, thread expand).
const observer = new MutationObserver(syncSidebar)

function startObserver(): void {
  const target = document.querySelector('[role="main"]') || document.body
  observer.observe(target, { childList: true, subtree: true })
  console.log('[GuardScope] Observer started')
  syncSidebar() // check immediately on load
}

// Gmail loads asynchronously — wait for [role="main"] to exist
function waitForGmail(retries = 20): void {
  if (document.querySelector('[role="main"]')) {
    startObserver()
    return
  }
  if (retries > 0) {
    setTimeout(() => waitForGmail(retries - 1), 500)
  } else {
    // Fallback: observe body if Gmail's main area never appeared
    startObserver()
  }
}

// Guard: only start if the extension context is valid.
// On extension reload/update while Gmail is open, chrome.runtime becomes undefined —
// the old content script instance should silently stop rather than throw.
if (!isContextValid()) {
  console.warn('[GuardScope] Extension context not valid — content script will not run')
} else {
  // Check onboarding completion before starting.
  // For dev reloads, skip the gate (onboarding_complete will already be set).
  chrome.storage.local.get('guardscope_onboarding_complete', (result) => {
    if (chrome.runtime.lastError) {
      // Context invalidated between check and callback — bail silently
      return
    }
    if (result.guardscope_onboarding_complete) {
      waitForGmail()
    } else {
      // Poll until onboarding is completed (user clicks "Activate GuardScope")
      const pollInterval = setInterval(() => {
        if (!isContextValid()) {
          clearInterval(pollInterval)
          return
        }
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
  })
}
