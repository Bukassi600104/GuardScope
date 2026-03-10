// GuardScope Email Extractor — Gmail DOM parsing
// Handles Gmail's obfuscated class names with multiple fallback selectors

export interface GmailAuthResult {
  signedBy: string | null   // DKIM signing domain (real result from Gmail header)
  mailedBy: string | null   // SPF mailed-by domain (envelope sender)
}

export interface AnchorLink {
  text: string   // visible link text (what user sees)
  href: string   // actual destination URL
}

export interface ExtractedEmail {
  fromName: string | null
  fromEmail: string | null
  subject: string | null
  date: string | null
  bodyText: string | null
  urls: string[]
  anchorLinks: AnchorLink[]  // pairs of visible text + href for mismatch detection
  attachments: Attachment[]
  replyTo: string | null
  messageId: string | null
  gmailAuth: GmailAuthResult
}

export interface Attachment {
  name: string
  type: string
  extension: string
}

/**
 * Extract all available email data from Gmail's current open email view.
 * Returns partial data gracefully if some elements can't be found.
 */
export function extractEmailData(): ExtractedEmail {
  return {
    fromName: extractFromName(),
    fromEmail: extractFromEmail(),
    subject: extractSubject(),
    date: extractDate(),
    bodyText: extractBodyText(),
    urls: extractUrls(),
    anchorLinks: extractAnchorLinks(),
    attachments: extractAttachments(),
    replyTo: extractReplyTo(),
    messageId: extractMessageId(),
    gmailAuth: extractGmailAuthResults(),
  }
}

/**
 * Extract Gmail's own "Signed-by" and "Mailed-by" fields from the expanded
 * email header. These reflect real DKIM/SPF results as verified by Gmail itself,
 * which is far more accurate than our DNS probe.
 *
 * Gmail renders these in the expanded header details panel. The DOM uses
 * obfuscated class names so we use text-based matching as a reliable fallback.
 */
export function extractGmailAuthResults(): GmailAuthResult {
  try {
    const result: GmailAuthResult = { signedBy: null, mailedBy: null }

    // Strategy 1: walk all elements in the header details area looking for
    // text content that includes "signed-by" or "mailed-by"
    // Gmail renders these as label spans followed by domain spans
    const headerArea = document.querySelector('.aHl, .iJ, .cf.ix, [data-message-id]')
      ?.closest('.gs') ?? document.querySelector('[role="main"]')

    if (headerArea) {
      // Look for spans/divs whose text exactly matches "signed-by:" or "mailed-by:"
      // then get the next sibling's text or the parent's full text
      const allEls = headerArea.querySelectorAll('span, div, td')
      for (const el of allEls) {
        const text = el.textContent?.trim().toLowerCase() ?? ''
        if (text.startsWith('signed-by:') || text === 'signed-by') {
          const domain = extractDomainFromElement(el)
          if (domain) result.signedBy = domain
        }
        if (text.startsWith('mailed-by:') || text === 'mailed-by') {
          const domain = extractDomainFromElement(el)
          if (domain) result.mailedBy = domain
        }
      }
    }

    // Strategy 2: scan ALL text nodes in document for signed-by / mailed-by patterns
    // This handles cases where the header details aren't in a predictable container
    if (!result.signedBy && !result.mailedBy) {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      )
      let node: Text | null
      while ((node = walker.nextNode() as Text | null)) {
        const text = node.textContent?.trim() ?? ''
        const lower = text.toLowerCase()
        if (lower.includes('signed-by:')) {
          const match = text.match(/signed-by:\s*([\w.-]+\.[a-z]{2,})/i)
          if (match && !result.signedBy) result.signedBy = match[1].toLowerCase()
        }
        if (lower.includes('mailed-by:')) {
          const match = text.match(/mailed-by:\s*([\w.-]+\.[a-z]{2,})/i)
          if (match && !result.mailedBy) result.mailedBy = match[1].toLowerCase()
        }
      }
    }

    return result
  } catch {
    return { signedBy: null, mailedBy: null }
  }
}

function extractDomainFromElement(el: Element): string | null {
  // Check if this element's text includes the domain after ":"
  const text = el.textContent?.trim() ?? ''
  const colonMatch = text.match(/:\s*([\w.-]+\.[a-z]{2,})/i)
  if (colonMatch) return colonMatch[1].toLowerCase()

  // Try next sibling
  const next = el.nextElementSibling
  if (next) {
    const nextText = next.textContent?.trim() ?? ''
    if (/^[\w.-]+\.[a-z]{2,}$/i.test(nextText)) return nextText.toLowerCase()
  }

  // Try parent's full text minus the label
  const parent = el.parentElement
  if (parent) {
    const parentText = parent.textContent?.trim() ?? ''
    const domainMatch = parentText.match(/(?:signed-by|mailed-by):\s*([\w.-]+\.[a-z]{2,})/i)
    if (domainMatch) return domainMatch[1].toLowerCase()
  }

  return null
}

function extractFromName(): string | null {
  try {
    // Primary: .gD span with name attribute
    const sender = document.querySelector('.gD') as HTMLElement
    if (sender?.getAttribute('name')) return sender.getAttribute('name')

    // Fallback 1: .go (display name span)
    const go = document.querySelector('.go')
    if (go?.textContent) return go.textContent.trim()

    // Fallback 2: [data-hovercard-id] element
    const hovercard = document.querySelector('[data-hovercard-id]')
    if (hovercard?.textContent) return hovercard.textContent.trim()

    // Fallback 3: .yP element
    const yP = document.querySelector('.yP')
    if (yP?.textContent) return yP.textContent.trim()

    return null
  } catch {
    return null
  }
}

function extractFromEmail(): string | null {
  try {
    // Primary: .gD with email attribute
    const sender = document.querySelector('.gD') as HTMLElement
    if (sender?.getAttribute('email')) return sender.getAttribute('email')

    // Fallback 1: look for email in the from section
    const fromSpans = document.querySelectorAll('.g2')
    for (const span of fromSpans) {
      const email = (span as HTMLElement).getAttribute('email')
      if (email) return email
    }

    // Fallback 2: parse from visible text that looks like email
    const senderArea = document.querySelector('.cf.ix')
    if (senderArea?.textContent) {
      const match = senderArea.textContent.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)
      if (match) return match[0]
    }

    return null
  } catch {
    return null
  }
}

function extractSubject(): string | null {
  try {
    // Primary: .hP
    const hP = document.querySelector('.hP')
    if (hP?.textContent) return hP.textContent.trim()

    // Fallback 1: h2 in the email view
    const h2 = document.querySelector('[role="main"] h2')
    if (h2?.textContent) return h2.textContent.trim()

    // Fallback 2: document title (Gmail sets it to subject)
    const title = document.title
    if (title && !title.includes('Gmail')) return title.trim()

    return null
  } catch {
    return null
  }
}

function extractDate(): string | null {
  try {
    // Primary: .g3
    const g3 = document.querySelector('.g3')
    if (g3?.textContent) return g3.textContent.trim()

    // Fallback 1: .aJ6
    const aJ6 = document.querySelector('.aJ6')
    if (aJ6?.getAttribute('title')) return aJ6.getAttribute('title')
    if (aJ6?.textContent) return aJ6.textContent.trim()

    // Fallback 2: time element
    const time = document.querySelector('[role="main"] time')
    if (time) {
      return (time as HTMLTimeElement).dateTime || time.textContent?.trim() || null
    }

    // Fallback 3: .xW span with title
    const xW = document.querySelector('.xW span[title]')
    if (xW?.getAttribute('title')) return xW.getAttribute('title')

    return null
  } catch {
    return null
  }
}

function extractBodyText(): string | null {
  try {
    // Primary: .a3s.aiL (Gmail's message body container)
    const body = document.querySelector('.a3s.aiL')
    if (body) return stripHtml(body.innerHTML)

    // Fallback 1: .a3s (any message body)
    const a3s = document.querySelector('.a3s')
    if (a3s) return stripHtml(a3s.innerHTML)

    // Fallback 2: [dir="ltr"] in main (common Gmail pattern)
    const ltr = document.querySelector('[role="main"] [dir="ltr"]')
    if (ltr) return stripHtml(ltr.innerHTML)

    // Fallback 3: .ii.gt div
    const iiGt = document.querySelector('.ii.gt div')
    if (iiGt) return stripHtml(iiGt.innerHTML)

    return null
  } catch {
    return null
  }
}

/**
 * Extract anchor links with both visible text and href destination.
 * Used to detect anchor text vs href mismatch attacks — where the link SHOWS
 * "paypal.com" but the actual href destination is "evil.com".
 */
function extractAnchorLinks(): AnchorLink[] {
  try {
    const links: AnchorLink[] = []
    const seen = new Set<string>()

    const bodyContainers = [
      document.querySelector('.a3s.aiL'),
      document.querySelector('.a3s'),
      document.querySelector('.ii.gt'),
    ].filter(Boolean)

    for (const container of bodyContainers) {
      if (!container) continue
      const anchors = container.querySelectorAll('a[href]')
      for (const anchor of anchors) {
        const href = (anchor as HTMLAnchorElement).href
        if (!href || !isValidUrl(href)) continue

        const text = (anchor.textContent ?? '').trim()
        // Only include links where the visible text is non-empty and not the href itself
        if (!text || text === href || text.length > 200) continue

        const key = `${text.slice(0, 60)}|${href.slice(0, 120)}`
        if (!seen.has(key)) {
          seen.add(key)
          links.push({ text, href })
        }
      }
      // Only use first matching container to avoid duplicates
      if (links.length > 0) break
    }

    return links.slice(0, 50)  // cap at 50 to prevent payload bloat
  } catch {
    return []
  }
}

function extractUrls(): string[] {
  try {
    const urls: string[] = []
    const seen = new Set<string>()

    // Primary: all links inside .a3s.aiL
    const bodyContainers = [
      document.querySelector('.a3s.aiL'),
      document.querySelector('.a3s'),
      document.querySelector('.ii.gt'),
    ].filter(Boolean)

    for (const container of bodyContainers) {
      if (!container) continue
      const links = container.querySelectorAll('a[href]')
      for (const link of links) {
        const href = (link as HTMLAnchorElement).href
        if (href && isValidUrl(href) && !seen.has(href)) {
          seen.add(href)
          urls.push(href)
        }
      }
    }

    return urls
  } catch {
    return []
  }
}

function extractAttachments(): Attachment[] {
  try {
    const attachments: Attachment[] = []

    // Primary: .aZo chips (attachment containers)
    const attachmentChips = document.querySelectorAll('.aZo')
    for (const chip of attachmentChips) {
      const nameEl = chip.querySelector('.aV3')
      const name = nameEl?.textContent?.trim() || 'unknown'
      const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : ''
      const type = getFileType(ext)
      attachments.push({ name, type, extension: ext })
    }

    // Fallback: .brc attachment spans
    if (attachments.length === 0) {
      const brc = document.querySelectorAll('.brc')
      for (const el of brc) {
        const name = el.textContent?.trim() || 'unknown'
        const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : ''
        attachments.push({ name, type: getFileType(ext), extension: ext })
      }
    }

    return attachments
  } catch {
    return []
  }
}

function extractReplyTo(): string | null {
  try {
    // Reply-To is shown in the expanded header section
    // Look for the "reply-to" label in the details panel
    const details = document.querySelectorAll('.g2, [data-tooltip]')
    for (const el of details) {
      const tooltip = (el as HTMLElement).getAttribute('data-tooltip') || ''
      if (tooltip.toLowerCase().includes('reply')) {
        const emailMatch = tooltip.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)
        if (emailMatch) return emailMatch[0]
      }
    }
    return null
  } catch {
    return null
  }
}

function extractMessageId(): string | null {
  try {
    // Extract from URL hash
    const hash = window.location.hash
    const match = hash.match(/#(?:inbox|sent|all|spam)?\/([a-z0-9]+)/i)
    if (match) return match[1]

    // Fallback: data-message-id attribute
    const msgEl = document.querySelector('[data-message-id]')
    if (msgEl) return (msgEl as HTMLElement).getAttribute('data-message-id')

    return null
  } catch {
    return null
  }
}

// ── Utilities ────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  // Remove script and style elements
  tmp.querySelectorAll('script, style').forEach((el) => el.remove())
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim()
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

function getFileType(ext: string): string {
  const types: Record<string, string> = {
    pdf: 'PDF Document',
    doc: 'Word Document', docx: 'Word Document',
    xls: 'Spreadsheet', xlsx: 'Spreadsheet',
    ppt: 'Presentation', pptx: 'Presentation',
    zip: 'Archive', rar: 'Archive', '7z': 'Archive', tar: 'Archive', gz: 'Archive',
    exe: 'Executable', msi: 'Installer',
    js: 'JavaScript', vbs: 'VBScript', ps1: 'PowerShell', bat: 'Batch File',
    docm: 'Macro-enabled Document', xlsm: 'Macro-enabled Spreadsheet',
    img: 'Image', png: 'Image', jpg: 'Image', jpeg: 'Image', gif: 'Image',
    mp4: 'Video', avi: 'Video', mov: 'Video',
  }
  return types[ext] || 'Unknown'
}
