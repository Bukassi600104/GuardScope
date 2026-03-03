// GuardScope Service Worker — Phase 1 placeholder
// Full implementation in Phase 3 (API communication, JWT management)

chrome.runtime.onInstalled.addListener(() => {
  console.log('[GuardScope] Extension installed')
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ type: 'PONG', version: '1.0.0' })
  }
  return true
})
