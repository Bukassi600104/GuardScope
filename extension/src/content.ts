// GuardScope Content Script — Gmail sidebar injection

const SIDEBAR_ID = 'guardscope-sidebar-container'
const SIDEBAR_WIDTH = '360px'

let sidebarMounted = false
let shadowRoot: ShadowRoot | null = null

function createSidebar(): void {
  if (document.getElementById(SIDEBAR_ID)) return

  // Create host container
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
    transition: transform 0.3s ease;
  `

  // Use Shadow DOM to prevent CSS conflicts with Gmail
  shadowRoot = container.attachShadow({ mode: 'open' })

  // Create sidebar iframe entry point (loads our React app)
  const iframe = document.createElement('iframe')
  iframe.src = chrome.runtime.getURL('src/sidebar/sidebar.html')
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
  `

  shadowRoot.appendChild(iframe)
  document.body.appendChild(container)
  sidebarMounted = true

  console.log('[GuardScope] Sidebar mounted')
}

function removeSidebar(): void {
  const container = document.getElementById(SIDEBAR_ID)
  if (container) {
    container.remove()
    sidebarMounted = false
    shadowRoot = null
    console.log('[GuardScope] Sidebar removed')
  }
}

function isEmailOpen(): boolean {
  // Check for Gmail's email view — various selectors for robustness
  return !!(
    document.querySelector('[data-message-id]') ||
    document.querySelector('.gs') ||
    document.querySelector('.adn.ads') ||
    document.querySelector('[role="main"] .h7')
  )
}

// Watch for Gmail navigation changes (it's an SPA)
const observer = new MutationObserver(() => {
  const emailOpen = isEmailOpen()

  if (emailOpen && !sidebarMounted) {
    // Small delay to let Gmail finish rendering
    setTimeout(createSidebar, 500)
  } else if (!emailOpen && sidebarMounted) {
    removeSidebar()
  }
})

// Start observing once Gmail has loaded its main content area
function startObserver(): void {
  const mainArea = document.querySelector('[role="main"]') || document.body
  observer.observe(mainArea, {
    childList: true,
    subtree: true,
  })
  console.log('[GuardScope] Observer started on', mainArea.tagName)

  // Check immediately in case email is already open
  if (isEmailOpen()) {
    setTimeout(createSidebar, 500)
  }
}

// Gmail takes a moment to fully load — wait for the main area
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserver)
} else {
  startObserver()
}
