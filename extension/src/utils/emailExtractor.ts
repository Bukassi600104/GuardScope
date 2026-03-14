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
  returnPath: string | null   // Return-Path header (actual delivery address)
  xMailer: string | null      // X-Mailer / sending software
  messageId: string | null
  gmailAuth: GmailAuthResult
  gmailWarning: boolean       // Gmail's own phishing/spam warning banner was showing
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
    returnPath: extractHeaderField('return-path'),
    xMailer: extractHeaderField('x-mailer') ?? extractHeaderField('user-agent'),
    messageId: extractMessageId(),
    gmailAuth: extractGmailAuthResults(),
    gmailWarning: detectGmailWarning(),
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
    if (body) return stripHtmlAndQuotes(body.innerHTML)

    // Fallback 1: .a3s (any message body)
    const a3s = document.querySelector('.a3s')
    if (a3s) return stripHtmlAndQuotes(a3s.innerHTML)

    // Fallback 2: [dir="ltr"] in main (common Gmail pattern)
    const ltr = document.querySelector('[role="main"] [dir="ltr"]')
    if (ltr) return stripHtmlAndQuotes(ltr.innerHTML)

    // Fallback 3: .ii.gt div
    const iiGt = document.querySelector('.ii.gt div')
    if (iiGt) return stripHtmlAndQuotes(iiGt.innerHTML)

    return null
  } catch {
    return null
  }
}

/**
 * Detect if Gmail is showing its own phishing/spam warning banner.
 * Gmail warns users about suspected phishing with a yellow/red banner.
 * If Gmail already suspects this email, GuardScope should reflect that.
 */
function detectGmailWarning(): boolean {
  try {
    // Gmail phishing warning banner selectors (may change with UI updates)
    // Look for text patterns that indicate Gmail's own warnings
    const warningSelectors = [
      '.aZo.a3J',           // phishing warning container
      '[data-phishing-warning]',
      '.J-J5-Ji.aQv',       // "Be careful" banner
    ]
    for (const sel of warningSelectors) {
      if (document.querySelector(sel)) return true
    }

    // Text-based detection: look for Gmail's warning text
    const mainArea = document.querySelector('[role="main"]')
    if (mainArea) {
      const text = mainArea.textContent?.toLowerCase() ?? ''
      if (
        text.includes('be careful with this message') ||
        text.includes('this message may be a phishing') ||
        text.includes('avoid clicking links') ||
        text.includes('gmail could not verify') ||
        text.includes('this message contains content that')
      ) {
        return true
      }
    }
    return false
  } catch {
    return false
  }
}

/**
 * Extract a specific header field value from the expanded Gmail header view.
 * Used to get Return-Path, X-Mailer, etc. when header details are expanded.
 */
function extractHeaderField(fieldName: string): string | null {
  try {
    const lower = fieldName.toLowerCase()
    // Walk text nodes looking for "fieldname: value" patterns
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
    let node: Text | null
    while ((node = walker.nextNode() as Text | null)) {
      const text = node.textContent?.trim() ?? ''
      if (text.toLowerCase().startsWith(lower + ':')) {
        const value = text.slice(lower.length + 1).trim()
        if (value) return value.slice(0, 200)
      }
    }
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

    return links.slice(0, 100)  // cap at 100 to prevent payload bloat
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
      // Also scan plain text — phishers often write URLs without hyperlinking them
      // to bypass URL scanners that only check anchor hrefs
      const plainText = container.textContent ?? ''
      const plainUrls = extractPlainTextUrls(plainText)
      for (const url of plainUrls) {
        if (!seen.has(url)) {
          seen.add(url)
          urls.push(url)
        }
      }
      // Only use first matching container to avoid duplicates
      if (urls.length > 0) break
    }

    return urls
  } catch {
    return []
  }
}

/**
 * Extract URLs written as plain text (not in anchor tags).
 * Phishers write domains as plain text (e.g. "youtu.be-dmca.report/...") to
 * avoid Gmail's auto-link detection and URL scanners that only check <a href>.
 * We match both https:// URLs and bare domain-path patterns.
 */
function extractPlainTextUrls(text: string): string[] {
  const urls: string[] = []
  const seen = new Set<string>()

  // Match explicit protocol URLs
  const protocolRe = /https?:\/\/[^\s"'<>)\],]+/gi
  let m: RegExpExecArray | null
  while ((m = protocolRe.exec(text)) !== null) {
    const url = m[0].replace(/[.,;:!?]+$/, '')
    if (url.length > 10 && !seen.has(url)) {
      seen.add(url)
      urls.push(url)
    }
  }

  // Match bare domain patterns: word.word.tld/path (no protocol)
  // Require at least one path segment to reduce false positives on normal text
  // e.g. "youtu.be-dmca.report/?notification-id=..." but NOT "e.g. word.word"
  const bareDomainRe = /\b((?:[\w-]+\.)+[\w]{2,}\/[\w\-._~:/?#[\]@!$&'()*+,;=%]{3,})/g
  while ((m = bareDomainRe.exec(text)) !== null) {
    const raw = m[1].replace(/[.,;:!?]+$/, '')
    const withProtocol = `https://${raw}`
    if (!seen.has(withProtocol) && !seen.has(raw)) {
      seen.add(withProtocol)
      urls.push(withProtocol)
    }
  }

  return urls
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
  // DOMParser creates a detached document — inline event handlers (onerror, onclick, etc.)
  // do NOT fire during parsing, unlike innerHTML assignment on a live DOM node.
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove())
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Strip HTML tags AND quoted reply content.
 * Gmail quoted replies are in .gmail_quote elements — they contain historical
 * email content, NOT the current email's content. Stripping them ensures the
 * actual malicious/social-engineered content fills the analysis window
 * instead of being pushed out by quoted history.
 */
function stripHtmlAndQuotes(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove())
  // Remove Gmail quoted reply containers
  doc.querySelectorAll('.gmail_quote, .gmail_extra, blockquote[type="cite"]').forEach((el) => el.remove())
  // Remove common forwarded message headers
  const text = (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
  // Also strip "--- Forwarded message ---" and "---- Original Message ----" sections
  const forwardIdx = text.search(/[-—]{3,}\s*(forwarded|original)\s*message\s*[-—]{3,}/i)
  return forwardIdx > 100 ? text.slice(0, forwardIdx).trim() : text
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
