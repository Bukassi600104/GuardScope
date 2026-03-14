# GuardScope Engine v3 — Comprehensive Scan Upgrade Plan
*Authored: 2026-03-14 | Status: PLANNING → ACTIVE*
*Goal: Zero false negatives on social engineering. World-class, country-agnostic protection.*

---

## ROOT CAUSE ANALYSIS — Why Liberto-type Scams Get Through

"Liberto" emails are a textbook **social engineering / advance-fee scam** sent from free
providers (Gmail, Yahoo) with:

| Signal | Current Behavior | Problem |
|--------|-----------------|---------|
| Sender: `liberto@gmail.com` | freeProvider=true, no trust cap | ✅ correct, but adds ZERO risk points |
| SPF/DKIM pass (real Gmail server) | Green flags added | ❌ pass from a legit free provider is meaningless for trust |
| No brand impersonation | displayNameMismatch=false | ✅ correct — but no penalty for "random person claiming riches" |
| No malicious URLs | VT/SB/PT/URLhaus = clean | ✅ correct — no URLs in many scam emails |
| No urgency keywords (or reversed: TOO friendly) | urgency_score=0 | ❌ these scams use GREED not URGENCY |
| Body text: inheritance/opportunity/partnership | Mercury sees ≤3000 chars | ❌ may truncate the actual social engineering |
| New or old domain (gmail.com = old) | domain age: green | ❌ gmail.com age is irrelevant to sender trust |
| No attachment | attachmentRisk=NONE | ✅ correct |

**Core bugs:**
1. A green SPF/DKIM from a **free provider should carry zero trust weight** — currently Mercury sees green DKIM and partially anchors to it.
2. **Advance-fee / romance / job / investment scam patterns are not explicitly scored** in the rule engine — all detection is left to Mercury's content analysis, which gets 3000 chars and may still score it LOW.
3. **bodyText cap of 3000 chars** is too aggressive — a long business-proposal scam email can bury the key fraud signals past char 3000.
4. **No content-based floor** — if Mercury says LOW and rule score says LOW, the final score is LOW even when the email body is textbook fraud.
5. The **Mercury system prompt is still Nigeria-centric** ("Nigerian cybersecurity specialist", CBN/EFCC/BVN patterns) — this creates model bias toward Nigerian patterns and AWAY from global scam patterns.

---

## IMPROVEMENT PLAN — 7 Phases

---

### PHASE 7A — Mercury Prompt v3 + Content Engine Overhaul
**Priority: CRITICAL | Fixes false negatives immediately**
**Files:** `backend/lib/inception.ts`

#### 7A-1: Expand body text limit 3000 → 6000 chars
- Change `MAX_BODY_CHARS = 3000` → `6000`
- max_tokens already at 8000 — can accommodate
- This is the single highest-ROI change for catching social engineering buried in email body

#### 7A-2: Remove Nigeria-specific prompt bias
- Remove the "NIGERIA-SPECIFIC THREAT PATTERNS" section header
- Reframe as "UNIVERSAL THREAT PATTERNS" with global examples
- Remove CBN/BVN/NIN-specific language from hard rules
- The domain/brand lists in headerAnalysis.ts and allowlist.ts remain but the AI prompt should be global

#### 7A-3: Add Global Social Engineering Taxonomy to prompt
New MODULE 9 — SOCIAL ENGINEERING TAXONOMY:

```
ADVANCE-FEE FRAUD (global, not country-specific):
• "inheritance", "next of kin", "beneficiary", "unclaimed funds", "compensation"
• "World Bank", "IMF", "United Nations", "diplomat", "customs clearance"
• "transfer fee", "processing charge", "administrative fee" + money promise
• "Dear Beneficiary", "Dear Friend" + large sum offer
→ Always CRITICAL regardless of sender authentication

ROMANCE / FRIENDSHIP SCAM:
• Unsolicited friendly email establishing relationship
• "I found your email online / through a mutual friend"
• Building trust before asking for anything (first email may score LOW — this is the SETUP)
• "I am a widow / widower", "I have a proposal for you"
→ MEDIUM-HIGH; flag for relationship-building pattern

JOB / WORK-FROM-HOME SCAM:
• Unsolicited job offer, "no experience required", unusually high pay
• "money transfer agent", "payment processor", "package reshipping"
• Request for bank account details to "receive payments"
→ HIGH — money mule recruitment

INVESTMENT / CRYPTO SCAM:
• "guaranteed returns", "double your money", "100% profit"
• "I can teach you my secret trading strategy"
• "limited spots available", "exclusive opportunity"
→ HIGH

PRIZE / LOTTERY SCAM:
• "You have won", "selected as winner", "claim your prize"
• Any lottery/prize for contest not entered
→ CRITICAL

IMPERSONATION WITHOUT DOMAIN SPOOFING:
• Sender claims to be CEO/CFO/manager but uses personal email
• "This is [Name], your boss — please keep this confidential"
• BEC (Business Email Compromise) via free email: HIGH
→ HIGH
```

#### 7A-4: Fix free provider + content = high risk scoring
Add to Mercury prompt:
```
FREE PROVIDER TRUST RULE:
• freeProvider=true means Gmail/Yahoo/Outlook sender
• SPF/DKIM pass from a free provider proves only that Gmail's servers sent it — NOT that the person is legitimate
• Green DKIM from freeProvider = NEUTRAL, not a trust signal
• freeProvider + business/financial claim in body = STRONGER suspicion, not weaker
• Score free provider emails on CONTENT MERIT ONLY — do not let technical green flags reduce score
```

#### 7A-5: Add content-based floor rules
Add to system prompt hard minimums:
```
CONTENT FLOOR MINIMUMS:
• Advance-fee fraud indicators (ANY ONE of: inheritance/beneficiary/unclaimed funds/transfer fee + money promise) → minimum 75 HIGH
• Explicit credential request (password/PIN/OTP/card number requested in body) → minimum 70 HIGH
• Prize/lottery win for contest not entered → minimum 80 HIGH
• Money mule recruitment pattern (job offer + bank account request) → minimum 75 HIGH
• Romance scam pattern (unsolicited relationship + money mention) → minimum 60 MEDIUM
• "Dear Customer/Account Holder/Valued User" + financial request → minimum 55 MEDIUM
```

---

### PHASE 7B — URL Intelligence Upgrade
**Priority: HIGH | Catches zero-day phishing VT/SB misses**
**New files:** `backend/lib/urlscan.ts`, `backend/lib/redirectchain.ts`
**Modified:** `backend/app/api/analyze/route.ts`, `backend/lib/types.ts`

#### 7B-1: URL Redirect Chain Resolution
Many phishing links are behind URL shorteners (bit.ly, tinyurl, ow.ly, rb.gy, t.co,
cutt.ly, short.gy, is.gd, buff.ly, ift.tt). The destination URL is what gets scanned.

**Implementation:**
```typescript
// backend/lib/redirectchain.ts
async function resolveRedirectChain(url: string, maxHops = 5): Promise<{
  finalUrl: string
  chain: string[]
  isShortener: boolean
  hasLoop: boolean
}>
```
- HEAD request with redirect following (no body)
- Timeout 3s per hop
- Returns final destination URL
- Flag if chain goes through ≥3 redirects (suspicious)
- Flag if final domain ≠ initial domain (cloaking)
- Run on all URLs before passing to VT/SB

#### 7B-2: URL Shortener Detection (expanded)
Current: Mercury mentions bit.ly/tinyurl as MEDIUM
Needed: Deterministic detection in headerAnalysis.ts

```typescript
const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'rb.gy', 'cutt.ly',
  'short.gy', 'is.gd', 'buff.ly', 'ift.tt', 'tiny.cc', 'lnkd.in',
  'fb.me', 'goo.gl', 'youtu.be', 'amzn.to', 'su.pr', 'dlvr.it',
  'ff.im', 'bl.gy', 'po.st', 'zpr.io', 'shorte.st',
])
```
- Add `shortenerUrls: string[]` to `HeaderAnalysisResult`
- Score: +10 per shortener URL (max +20) in rule scorer

#### 7B-3: URLScan.io Integration
Free: 100 submissions/day, unlimited lookups
- **Submit** new domains for scanning (async, non-blocking)
- **Lookup** existing scan results for URLs
- Returns: screenshot, verdict (malicious/suspicious), categories, DOM analysis

```typescript
// backend/lib/urlscan.ts
export async function urlScanCheck(urls: string[]): Promise<UrlScanResult>
// Only scan domains not in Tranco top 500 — don't waste quota on google.com/paypal.com
```

#### 7B-4: URL Path Impersonation Detection
Currently domainSimilarity.ts only checks the sender domain, not URLs.
Detect: `attacker.com/paypal/login`, `randomdomain.net/microsoft/verify`

```typescript
// In headerAnalysis.ts
function detectUrlPathImpersonation(urls: string[]): PathImpersonationResult[]
// Check if URL path segments contain brand names while domain is NOT that brand
// e.g., URL = "http://click123.com/paypal/signin" → flag "paypal" in path
```

Add to `HeaderAnalysisResult`: `urlPathImpersonations: PathImpersonationResult[]`
Score: +25 per URL path impersonation in rule scorer
Mercury: add to url_analysis module

#### 7B-5: Google Forms / Docs Abuse Detection
Phishers embed Google Forms for credential harvesting — currently scored as trusted (google.com domain).

```
In Mercury prompt and headerAnalysis.ts:
• URLs containing: docs.google.com/forms, forms.gle, docs.google.com/spreadsheets
  with email/password/OTP type labels in body → flag as potential credential harvesting
• forms.gle links in financial/security context → MEDIUM flag
• Note: Not all Google Forms links are malicious — only flag in suspicious context
```

---

### PHASE 7C — New Threat Intelligence Sources
**Priority: HIGH | Catches what VT/SB/PT/URLhaus miss**
**New files:** `backend/lib/spamhaus.ts`, `backend/lib/abuseipdb.ts`, `backend/lib/emailrep.ts`
**Modified:** `backend/app/api/analyze/route.ts`, `backend/lib/types.ts`, `backend/lib/scorer.ts`

#### 7C-1: SpamHaus DNSBL (Free, DNS-based, zero API key)
Spamhaus ZEN is the gold standard spam/phishing IP blocklist.
Query: reverse the sender IP and do DNS lookup against zen.spamhaus.org

```typescript
// backend/lib/spamhaus.ts
// Requires: sender IP (from X-Originating-IP header if available, else skip)
// Query: {reversed_ip}.zen.spamhaus.org → A record response
// 127.0.0.2 = SBL (spam source)
// 127.0.0.10 = PBL (policy blocklist — dynamic IPs sending email directly)
// 127.0.0.4 = XBL (exploits/botnet)
// Free: unlimited DNS queries
```

Also check sender **domain** against Spamhaus DBL (Domain Block List):
```
{sender_domain}.dbl.spamhaus.org → A record
127.0.1.2 = spam domain
127.0.1.4 = phishing domain ← HIGH value
127.0.1.5 = malware domain ← CRITICAL value
```

Score impact: Spamhaus DBL phishing hit → min 80; DBL spam → +25; SBL IP → +15

#### 7C-2: AbuseIPDB (Free: 1000 checks/day)
Check sender IP reputation against crowdsourced abuse reports.
API: `GET https://api.abuseipdb.com/api/v2/check?ipAddress={ip}&maxAgeInDays=90`
Requires: X-Originating-IP from email headers (only available if extracted by extension)

```typescript
// backend/lib/abuseipdb.ts
// Returns: abuseConfidenceScore (0-100), totalReports, countryCode, usageType
// Flag: abuseConfidenceScore > 25 → MEDIUM; > 50 → HIGH
```

#### 7C-3: emailrep.io (Free: 100/day without key, 10k/day with free key)
Email address reputation database — specifically checks:
- Has this email address been seen in spam campaigns?
- Is it a disposable/temporary address?
- Is it tied to known malicious activity?

```typescript
// backend/lib/emailrep.ts
// GET https://emailrep.io/{email_address}
// Returns: reputation (none/low/medium/high), suspicious, blacklisted,
//          spam, spoofing, disposable, free_provider, profiles
// Free key: no registration required for 100/day
// Flag: suspicious=true → +20; blacklisted=true → +35; disposable=true → +25
```

Score impact: blacklisted sender → min 65; suspicious → +20; disposable address → +25

#### 7C-4: AlienVault OTX (Free: unlimited with free API key)
Open Threat Exchange — community-sourced threat intelligence.
Best for: domain reputation, IP reputation, URL indicators.

```typescript
// backend/lib/otx.ts
// GET https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general
// GET https://otx.alienvault.com/api/v1/indicators/url/{url}/general
// Returns: pulse_count (community threat reports), validation[], tags[]
// Flag: pulse_count > 0 → suspicious; validation contains 'malicious' → CRITICAL
```

#### 7C-5: TLD Risk Scoring (no API needed — deterministic)
Certain TLDs have >10x higher phishing rates than .com. Flag these.

```typescript
// In domainSimilarity.ts or new tldRisk.ts
const HIGH_RISK_TLDS = new Set([
  'xyz', 'top', 'click', 'link', 'club', 'online', 'site', 'website',
  'tk', 'ml', 'ga', 'cf', 'gq',  // Freenom free TLDs — massively abused
  'pw', 'cc', 'buzz', 'live', 'support', 'help', 'info',
  'cam', 'bid', 'trade', 'review', 'country', 'stream',
])
// TLD risk score: HIGH_RISK_TLD + new domain → +15
// HIGH_RISK_TLD alone → +8
// Add to AnalysisIntel: tldRisk: { tld: string; riskLevel: 'HIGH'|'MEDIUM'|'LOW' }
```

#### 7C-6: Registrar Reputation Scoring (deterministic, from RDAP data)
Some registrars are used almost exclusively for phishing domains.

```typescript
// In rdap.ts or scorer.ts
const HIGH_RISK_REGISTRARS = new Set([
  'namecheap',      // legitimate but heavily abused for phishing
  'namesilo',       // same
  'godaddy',        // large = high absolute abuse volume
  'reg.ru',         // Russian registrar
  'beget',          // Russian hosting
  'hosting-ukraine',
  'ukraine.com.ua',
])
// Flag: HIGH_RISK_REGISTRAR + domain age < 90 days → +10
// Not penalized alone (too many false positives)
```

---

### PHASE 7D — Header Forensics Upgrade
**Priority: HIGH | Catches BEC and sophisticated header spoofing**
**Modified:** `extension/src/utils/emailExtractor.ts`, `backend/lib/headerAnalysis.ts`,
              `backend/lib/types.ts`, `backend/lib/inception.ts`

#### 7D-1: Extract Additional Headers from Gmail DOM
Gmail exposes some headers in the "Show original" or expanded header view.
The extension needs to extract more data:

```typescript
// In emailExtractor.ts — new fields to extract:
// 1. Return-Path: different from From = spoofing indicator
//    Selector: look for "Return-Path:" in expanded headers (if open)
// 2. X-Mailer / User-Agent: identifies sending software
//    Bulk mailer software names = red flag
// 3. fromDisplayEmail: the raw "From:" header value (may show spoofed name)
// 4. Received headers count: number of Received: headers = hop count
```

Add to `EmailInput` type:
```typescript
returnPath?: string | null
xMailer?: string | null
receivedCount?: number | null  // number of Received: hops
```

#### 7D-2: Return-Path vs From Mismatch Detection
The Return-Path header is the actual delivery address. If it differs from From:
it strongly indicates spoofing or mailing list abuse.

```typescript
// In headerAnalysis.ts
const returnPathDomain = extractEmailDomain(email.returnPath)
const returnPathMismatch = !!(
  returnPathDomain &&
  fromDomain &&
  !domainsMatch(returnPathDomain, fromDomain) &&
  !isTrustedDomain(returnPathDomain)  // ESP sending is OK (sendgrid.net, etc.)
)
// Add to HeaderAnalysisResult: returnPathMismatch: boolean, returnPathDomain: string|null
```

Add to scorer: `returnPathMismatch` → +20

#### 7D-3: Suspicious X-Mailer Detection
Legitimate email clients (Outlook, Gmail, Apple Mail) are fine.
Bulk phishing tools leave distinct X-Mailer signatures.

```typescript
const SUSPICIOUS_MAILERS = [
  'PHPMailer',    // legitimate but massively abused
  'sendmail',     // if used from suspicious domain
  'Mass Mailer',
  'Bulk Mailer',
  'The Bat!',     // old Windows email client, often seen in spam
]
// Low weight: +5 per suspicious mailer (not a hard signal alone)
// Mercury: X-Mailer value passed in intel for context
```

#### 7D-4: Received Hop Count Analysis
Legitimate emails typically have 2-4 Received: headers.
Spammers route through many relays to obscure origin.

```typescript
// receivedCount > 8 → suspicious (+5)
// receivedCount === 1 AND not from major ESP → suspicious (direct injection)
```

#### 7D-5: Message-ID Format Validation
A properly formatted Message-ID looks like: `<unique@sending-domain.com>`
Phishers often use malformed Message-IDs (missing domain, random strings, etc.)

```typescript
// In headerAnalysis.ts
function validateMessageId(messageId: string | null, fromDomain: string | null): boolean {
  // Valid: <{random}@{domain}> where domain matches sending domain
  // Invalid: empty, missing @, domain in MessageId ≠ fromDomain (for non-ESPs)
  // Flag: messageId domain wildly different from sender domain → +10
}
```

---

### PHASE 7E — Domain Intelligence Upgrade
**Priority: MEDIUM-HIGH | Improves detection on new/suspicious domains**
**Modified:** `backend/lib/rdap.ts`, `backend/lib/domainSimilarity.ts`, `backend/lib/types.ts`

#### 7E-1: Enhanced Domain Similarity — URL Checking
Currently only checks the **sender domain**. Must also check **all URLs** in the email.

```typescript
// In route.ts: run analyzeDomainSimilarity on EACH unique URL domain too
// Not just senderDomain — the phishing link domain needs similarity checking
const urlDomains = [...new Set(email.urls.map(u => {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return null }
}).filter(Boolean))]

const urlSimilarityResults = urlDomains
  .filter(d => !isTopDomain(d!) && !isTrustedDomain(d!))
  .map(d => analyzeDomainSimilarity(d!))
  .filter(r => r.isLookalike)
// Add to intel: urlDomainSimilarity: DomainSimilarityResult[]
```

Score: URL domain that is a HIGH-confidence lookalike → min 80

#### 7E-2: Expanded Typosquatting Brand List (global, 200+ brands)
Current: 58 brands. Target: 200+ covering ALL major global sectors.

Additions needed:
```
GLOBAL BANKING: Barclays, NatWest, Santander, Deutsche Bank, BNP Paribas,
  Credit Agricole, Lloyds, Halifax, Nationwide, RBS, Standard Chartered,
  ING, Rabobank, UniCredit, Intesa, BBVA, CaixaBank, Commonwealth Bank,
  ANZ, NAB, Westpac, TD Bank, RBC, Scotiabank, CIBC, BMO
PAYMENTS: Venmo, Cash App, Zelle, Wise (TransferWise), Revolut, N26,
  Monzo, Starling, Klarna, Afterpay, Square, Skrill, Neteller, Paysafecard
CRYPTO: Kraken, Bybit, OKX, KuCoin, Gate.io, Crypto.com, Gemini, Bitstamp,
  Ledger, Trezor, MetaMask, Trust Wallet, Phantom
DELIVERY/SHIPPING: Royal Mail, La Poste, Deutsche Post, Australia Post,
  Canada Post, India Post, PostNL, Correos, PTT, TNT, DB Schenker, Purolator
STREAMING: Disney+, Hulu, HBO Max, Prime Video, Paramount+, Apple TV+, Peacock
TELECOM: AT&T, Verizon, T-Mobile, Sprint, O2, Vodafone, Orange, SFR, EE,
  Three, Telstra, Rogers, Bell Canada, Telus, Bharti Airtel (India)
E-COMMERCE: eBay, Etsy, AliExpress, Alibaba, Lazada, Jumia, Noon, Souq,
  Mercado Libre, Flipkart, Myntra, Zalando, ASOS, H&M
INSURANCE: Blue Cross, Aetna, Cigna, UnitedHealth, AXA, Allianz, Zurich
GOV: IRS (US), HMRC (UK), ATO (Australia), CRA (Canada),
  Social Security Administration, NHS, DVLA, DWP
TECH/SAAS: Zoom (zoom.us), DocuSign, Adobe Sign, Salesforce, ServiceNow,
  Workday, SAP, Oracle, Atlassian, Jira, Notion, Figma, Canva, HubSpot
```

#### 7E-3: WHOIS Privacy Proxy Detection
Most legitimate enterprises DON'T use WHOIS privacy. Phishers almost always do.
The RDAP registrar field often contains "Privacy" or "Proxy" keywords.

```typescript
// In rdap.ts
const isPrivacyProxy = /privacy|proxy|protect|guard|redact|whoisguard/i.test(
  rdapResult.registrar ?? ''
)
// Flag: privacyProxy + new domain → +12
// NOT flagged alone (many legitimate small businesses use privacy)
```

#### 7E-4: TLD + Domain Age Compound Scoring
```typescript
// HIGH_RISK_TLD + domain age < 30 days → minimum score 60 (MEDIUM)
// HIGH_RISK_TLD + SPF fail → +15 additional
// FREE_TLD (.tk, .ml, .ga, .cf, .gq) + ANY email → minimum score 45 (LOW-MEDIUM)
```

---

### PHASE 7F — Extension Scanning Improvements
**Priority: MEDIUM | Better data extraction = better analysis**
**Modified:** `extension/src/utils/emailExtractor.ts`

#### 7F-1: Extract More Email Content
```typescript
// Extract CC/BCC count (visible in "show details")
// Extract: number of recipients (mass emails = higher risk)
// Extract: email send time (for time-based anomaly)
// Extract: thread count (is this a new thread or a reply chain?)
// Extract: sender profile image presence (spoof indicator when claimed brand)
// Extract: Gmail's own spam/security indicators (yellow/red warning banners)
```

#### 7F-2: Gmail Security Warning Detection
Gmail shows its own warnings for suspected phishing/spam.
If Gmail is already warning the user, GuardScope should reflect this.

```typescript
// Look for Gmail warning banners:
// Selector: .aZo.a3J (phishing warning), .h7 (external sender warning),
//           [data-legacy-thread-id] warning indicators
// If Gmail shows a "Be careful" or phishing warning → add to intel as gmailWarning: true
```
Score: `gmailWarning: true` → +30, minimum 55

#### 7F-3: Expanded URL Extraction
Currently capped at 50 anchor links. Issues:
- Some phishing emails have many URLs — cap causes missed links
- Mailto: links not extracted (can reveal attacker email)
- Tel: links not extracted (phone scam signal)

```typescript
// Increase anchor link cap to 100
// Extract mailto: links separately → check if different from sender
// Extract tel: links → international format unexpected for sender's claimed origin
// Extract form action URLs (if any forms in email body)
```

#### 7F-4: Quoted Reply Stripping
Long reply chains bloat bodyText with quoted content, pushing the actual malicious
content past the 6000-char limit in some cases.

```typescript
// In emailExtractor.ts: strip quoted reply sections
// Gmail quoted replies are in .gmail_quote class elements
// Strip these before sending bodyText to backend
// This ensures the CURRENT email content (not history) fills the 6000-char window
```

---

### PHASE 7G — Scoring Engine Overhaul
**Priority: HIGH | Ensures all new signals are properly weighted**
**Modified:** `backend/lib/scorer.ts`

#### 7G-1: Content-Based Floor (No Technical Signals)
Currently: if no technical red flags exist, score anchors near 0-20 SAFE.
Problem: purely social-engineered emails get SAFE.

```typescript
// New rule in applyHybridScore:
// If Mercury content_analysis.attack_pattern is in:
//   ['advance_fee', 'romance_scam', 'investment_scam', 'job_scam', 'lottery_scam']
// AND no technical green flags (SPF pass + DKIM + old domain) together
// → apply content floor minimum: 65 (HIGH)
```

#### 7G-2: Compound Signal Synergy
Multiple LOW signals together should push score higher than linear addition:

```typescript
// Synergy boosts (applied after base scoring):
// freeProvider + business/financial claim in subject + no URLs = +15
// MEDIUM RDAP + SPF none + DMARC none = +10 compound
// replyToMismatch + freeProvider = +15 compound
// shortenerUrl + freeProvider + urgency content = +20 compound
// privacyProxy + HIGH_RISK_TLD + new domain = +25 compound
```

#### 7G-3: Free Provider Sent + Business Claim = Risk Boost
```typescript
// Detect business-claim subjects from free providers:
const BUSINESS_CLAIM_SUBJECTS = [
  /\b(invoice|payment|transaction|order|receipt|account|urgent|verify|confirm)\b/i,
  /\b(wire transfer|bank transfer|funds|remittance)\b/i,
]
// if freeProvider && BUSINESS_CLAIM_SUBJECTS.test(subject) → +15 rule score
```

#### 7G-4: SpamHaus / emailrep / OTX Score Integration
```typescript
if (intel.spamhaus?.dblPhishing)    finalScore = Math.max(finalScore, 80)
if (intel.spamhaus?.dblMalware)     finalScore = Math.max(finalScore, 85)
if (intel.spamhaus?.dblSpam)        score += 25
if (intel.emailRep?.blacklisted)    finalScore = Math.max(finalScore, 65)
if (intel.emailRep?.suspicious)     score += 20
if (intel.emailRep?.disposable)     score += 25
if (intel.otx?.maliciousPulses > 0) finalScore = Math.max(finalScore, 70)
if (intel.urlScan?.verdict === 'malicious') finalScore = Math.max(finalScore, 80)
if (intel.urlPathImpersonations?.length > 0) finalScore = Math.max(finalScore, 65)
if (intel.gmailWarning)             finalScore = Math.max(finalScore, 55)
```

---

### PHASE 7H — Global Brand List + UI Globalization
**Priority: MEDIUM | Makes GuardScope country-agnostic**
**Modified:** `backend/lib/headerAnalysis.ts`, `backend/lib/domainSimilarity.ts`,
              `backend/lib/allowlist.ts`, `backend/lib/inception.ts`

#### 7H-1: Expand brand list to 200+ global brands
See Phase 7E-2 for full list. Split into global sectors:
- `GLOBAL_BANKS` (50+ banks across all continents)
- `PAYMENT_PLATFORMS` (30+ payment services)
- `CRYPTO_EXCHANGES` (15+ exchanges + wallets)
- `DELIVERY_SERVICES` (15+ carriers)
- `STREAMING_SERVICES` (10+)
- `TELECOM_PROVIDERS` (20+ global carriers)
- `ECOMMERCE_PLATFORMS` (15+)
- `GOVERNMENT_AGENCIES` (by country code - IRS, HMRC, ATO, etc.)

#### 7H-2: Remove/reframe Nigeria-specific prompt language
- System prompt: remove "Nigerian cybersecurity specialist" self-description
- Reframe as: "world-class email threat analyst with deep knowledge of global phishing campaigns"
- Move Nigeria patterns to the universal patterns section with other regional examples
- Add equivalent patterns for US, UK, India, South Africa, Ghana, Kenya

#### 7H-3: Expand global threat patterns in Mercury prompt
```
GLOBAL ADVANCE-FEE & ROMANCE PATTERNS (universal):
• Government windfall: "IRS tax refund", "HMRC overpayment", "stimulus check", "compensation from [any agency]"
• Legacy/estate: "deceased relative", "will executor", "estate funds", "orphan funds"
• Business opportunity: "investment partnership", "oil deal", "mining contract" from unknown
• Military romance: "US Army / UN Peacekeeping officer abroad" + relationship building

GLOBAL CREDENTIAL PHISHING:
• "Verify your account", "Confirm your identity", "Your account has been suspended"
• "Unusual activity detected", "Sign in to continue", "Update your payment method"
• Any financial institution asking for full credentials via email link

GLOBAL DELIVERY SCAMS:
• "Your package is held", "Customs fee required", "Delivery failed" + payment link
• Impersonating DHL/FedEx/UPS/Royal Mail/USPS with generic "click here"

GLOBAL BEC (Business Email Compromise):
• "Hi [name], I need you to process a payment discreetly"
• "Don't discuss this with anyone else" — confidentiality as pressure tactic
• Wire transfer request from "CEO" via personal/free email
```

---

## IMPLEMENTATION ORDER (Optimized for Impact)

| # | Task | Impact | Effort | Files |
|---|------|--------|--------|-------|
| 1 | 7A-1: Expand body text 3k→6k | CRITICAL | 5 min | inception.ts |
| 2 | 7A-2: Remove Nigeria prompt bias | CRITICAL | 20 min | inception.ts |
| 3 | 7A-3: Global social engineering taxonomy | CRITICAL | 45 min | inception.ts |
| 4 | 7A-4: Fix free provider trust rule | CRITICAL | 20 min | inception.ts |
| 5 | 7A-5: Content floor minimums | CRITICAL | 30 min | inception.ts |
| 6 | 7G-3: Business claim subject + freeProvider boost | HIGH | 30 min | scorer.ts, route.ts |
| 7 | 7G-1: Content-based floor (no tech signals) | HIGH | 30 min | scorer.ts |
| 8 | 7B-2: URL shortener detection | HIGH | 20 min | headerAnalysis.ts, types.ts, scorer.ts |
| 9 | 7B-4: URL path impersonation | HIGH | 30 min | headerAnalysis.ts, types.ts, scorer.ts |
| 10 | 7D-2: Return-Path mismatch | HIGH | 25 min | headerAnalysis.ts, types.ts, emailExtractor.ts |
| 11 | 7E-1: Similarity on URL domains too | HIGH | 30 min | route.ts, types.ts |
| 12 | 7C-5: TLD risk scoring | HIGH | 20 min | new tldRisk.ts, scorer.ts, types.ts |
| 13 | 7C-6: Registrar reputation | MEDIUM | 20 min | scorer.ts |
| 14 | 7F-2: Gmail security warning extraction | HIGH | 30 min | emailExtractor.ts |
| 15 | 7F-4: Quoted reply stripping | MEDIUM | 20 min | emailExtractor.ts |
| 16 | 7C-1: SpamHaus DNSBL | HIGH | 45 min | new spamhaus.ts, route.ts, scorer.ts, types.ts |
| 17 | 7C-3: emailrep.io | HIGH | 30 min | new emailrep.ts, route.ts, scorer.ts, types.ts |
| 18 | 7C-4: AlienVault OTX | MEDIUM | 40 min | new otx.ts, route.ts, scorer.ts, types.ts |
| 19 | 7B-1: Redirect chain resolution | HIGH | 60 min | new redirectchain.ts, route.ts |
| 20 | 7E-2: Expand brand list to 200+ | MEDIUM | 60 min | headerAnalysis.ts, domainSimilarity.ts |
| 21 | 7G-2: Compound signal synergy | MEDIUM | 30 min | scorer.ts |
| 22 | 7D-5: Message-ID validation | MEDIUM | 20 min | headerAnalysis.ts |
| 23 | 7H-2/3: Global prompt + patterns | MEDIUM | 30 min | inception.ts |
| 24 | 7F-1/3: Better DOM extraction | MEDIUM | 40 min | emailExtractor.ts |
| 25 | 7B-3: URLScan.io integration | MEDIUM | 45 min | new urlscan.ts, route.ts |
| 26 | 7C-2: AbuseIPDB | MEDIUM | 30 min | new abuseipdb.ts, route.ts |

---

## NEW ENVIRONMENT VARIABLES NEEDED

```env
# emailrep.io — free key at emailrep.io
EMAILREP_API_KEY=

# AlienVault OTX — free key at otx.alienvault.com
OTX_API_KEY=

# AbuseIPDB — free key at abuseipdb.com
ABUSEIPDB_API_KEY=

# URLScan.io — free key at urlscan.io
URLSCAN_API_KEY=

# SpamHaus — NO key needed (DNS-based)
```

---

## PERFORMANCE BUDGET

All new network calls must run in parallel (Promise.allSettled):
- SpamHaus: DNS query ~50ms (same path as existing DNS calls)
- emailrep.io: HTTP ~200ms
- OTX: HTTP ~300ms
- AbuseIPDB: HTTP ~200ms (only if X-Originating-IP available)
- Redirect chain: HEAD requests ~500ms per chain (parallel per URL, max 3s total)

New total budget: ~3-4s for all intel (was ~2-3s)
Mercury analysis: 5-15s (unchanged)
**Total target: <20s for complete analysis**

---

## SUCCESS CRITERIA

After Phase 7A-7G implementation:
- [ ] Liberto-type scams (advance-fee/romance/job from free providers) score ≥ 65 HIGH
- [ ] Generic "Dear Customer" financial requests from free providers score ≥ 55 MEDIUM
- [ ] URL shortener links bump score by ≥ 10 points
- [ ] Phishing links disguised as /paypal/login on attacker domains → ≥ 65
- [ ] Spamhaus DBL phishing domains → min 80
- [ ] Google OTP / legitimate transactional email stays ≤ 25 SAFE (no false positives)
- [ ] Established brands (Google, PayPal, Microsoft) sending from own domains stay ≤ 25
- [ ] All existing hard overrides preserved
- [ ] Analysis time stays under 20s p95

---

*Plan created: 2026-03-14 | Implementation starts: Phase 7A*
