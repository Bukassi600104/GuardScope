// GuardScope Content Script — Gmail sidebar injection

const SIDEBAR_ID = 'guardscope-sidebar-container'
const SIDEBAR_WIDTH = '360px'

let sidebarMounted = false

function createSidebar(): void {
  if (document.getElementById(SIDEBAR_ID)) return

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
  iframe.src = chrome.runtime.getURL('src/sidebar/sidebar.html')
  iframe.style.cssText = 'width:100%;height:100%;border:none;'
  shadow.appendChild(iframe)

  document.body.appendChild(container)
  sidebarMounted = true
  console.log('[GuardScope] Sidebar mounted')
}

function removeSidebar(): void {
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
  if (isEmailOpen() && !sidebarMounted) {
    setTimeout(createSidebar, 300)
  } else if (!isEmailOpen() && sidebarMounted) {
    removeSidebar()
  }
}

// ── Signal 1: URL hash changes (Gmail SPA navigation) ──────────────────────
// This is the most reliable trigger — fires immediately when user clicks an email.
window.addEventListener('hashchange', syncSidebar)

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

waitForGmail()
