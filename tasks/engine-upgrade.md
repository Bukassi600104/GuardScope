# GuardScope Engine Upgrade — Premium Accuracy Initiative

## Mission: Zero tolerance for incorrect scans. Industry-grade, production-quality engine.

---

## BUGS FOUND (fix first)

- [ ] **BUG-1**: `scoreToLevel()` defined twice with different thresholds
  - `scorer.ts`: 0-10=SAFE, 11-25=LOW, 26-49=LOW (redundant line)
  - `route.ts` fallback: 0-25=SAFE, 26-49=LOW
  - **Fix**: standardize to 0-25=SAFE, 26-49=LOW across BOTH files + Mercury prompt

---

## ENGINE GAPS (by industry standard)

### EG-1: Reply-To Mismatch Detection ❌ CRITICAL GAP
**Industry standard**: ProofPoint, Mimecast, Barracuda all check this as tier-1 signal.
Reply-To domain ≠ From domain = HIGH phishing indicator (attacker wants replies to go to their inbox)
- **Data exists**: `email.replyTo` is extracted by extension, sent to backend, but NEVER analyzed
- **Fix**: Detect in `headerAnalysis.ts`, score +25 in scorer, add to Mercury prompt

### EG-2: Display Name Brand Impersonation ❌ CRITICAL GAP
**Industry standard**: "PayPal <attacker@gmail.com>" — fromName contains brand, domain doesn't match
- **Fix**: Deterministic brand list check in `headerAnalysis.ts`, score +30 in scorer, hard override

### EG-3: Lookalike Domain Detection ❌ HIGH IMPACT
**Industry standard**: Typosquatting, homograph/IDN attacks, combo squatting
- `paypa1.com` (digit substitution), `pаypal.com` (Cyrillic а), `paypal-secure.com` (combo squatting)
- `login.paypal.com.attacker.com` (subdomain impersonation)
- **Fix**: New `domainSimilarity.ts` module using Levenshtein + unicode normalization

### EG-4: Attachment Risk Scoring ❌ HIGH IMPACT
**Industry standard**: .exe/.vbs/.ps1 attachments = HIGH; .zip/.docm = MEDIUM risk
- **Data exists**: `email.attachments` is extracted AND sent to backend, but scorer/Mercury NEVER use it
- **Fix**: Add attachment rules to scorer + Mercury prompt

### EG-5: IP Address URL Detection ❌ MEDIUM IMPACT
**Industry standard**: `http://123.45.67.89/login` = strong phishing signal (no legitimate org sends IP URLs)
- **Fix**: Detect in `headerAnalysis.ts`, rule score +20, Mercury module

### EG-6: Anchor Text vs Href Mismatch ❌ HIGH IMPACT
**Industry standard**: Link text shows "paypal.com" but href is "evil.com" = CRITICAL social engineering
- **Fix**: Extract in extension `emailExtractor.ts`, analyze in backend

### EG-7: MX Record Verification ❌ MEDIUM IMPACT
**Industry standard**: Domain with no MX records sending email = suspicious
- **Fix**: Add `hasMx` to `dnsLookup()` in `dns.ts`

### EG-8: freeProvider Flag ❌ (types.ts added but never implemented)
**Logic**: gmail.com/yahoo.com senders should NOT get trust cap benefit
- **Fix**: Set `intel.freeProvider` in route.ts, use in scorer (skip trust cap), inform Mercury

### EG-9: Mercury Prompt Missing New Signals ❌ MEDIUM IMPACT
Current prompt missing guidance for: reply-to mismatch, display name impersonation,
attachment risk, IP URLs, anchor text mismatch, domain similarity, freeProvider, MX records
- **Fix**: Add MODULE 6 (Header Integrity), MODULE 7 (Domain Similarity), MODULE 8 (Attachment Risk)

### EG-10: URL Structural Analysis Gaps ❌ MEDIUM IMPACT
Current: URLhaus/VT check URLs. Missing:
- `data:` URI detection (rare, always malicious in email)
- `javascript:` URI detection
- URL shortener pass-through (bit.ly → unknown destination)
- **Fix**: Detect in `headerAnalysis.ts`, add rules + Mercury guidance

### EG-11: TechnicalDetails UX — Show new signals ❌ UX GAP
The extension sidebar doesn't show: reply-to mismatch, domain similarity results, attachment risk
- **Fix**: Update `TechnicalDetails.tsx` to render new red flags cleanly

---

## IMPLEMENTATION PLAN

### Step 1: Update types.ts — new interfaces
- [x] Add `HeaderAnalysisResult` interface
- [x] Add `DomainSimilarityResult` interface
- [x] Update `AnalysisIntel` to include new modules
- [x] Update `EmailInput` to add `anchorLinks?: Array<{text: string; href: string}>`

### Step 2: Create backend/lib/headerAnalysis.ts
- [ ] Reply-To mismatch detection
- [ ] Display name brand impersonation (40+ brands)
- [ ] Attachment risk classification
- [ ] IP address URL detection
- [ ] data:/javascript: URI detection
- [ ] URL count signal

### Step 3: Create backend/lib/domainSimilarity.ts
- [ ] Registrable domain extraction (eTLD+1)
- [ ] Levenshtein typosquatting (distance ≤ 1-2 from brand domains)
- [ ] Homograph/IDN detection (non-ASCII chars, xn-- prefix)
- [ ] Combo squatting (brand name + extra text)
- [ ] Subdomain impersonation (brand.com.evil.com)

### Step 4: Update backend/lib/dns.ts — MX check
- [ ] Add `fetchMx()` function
- [ ] Add `hasMx: boolean` to DnsResult
- [ ] Run in parallel with SPF/DKIM/DMARC

### Step 5: Update backend/lib/scorer.ts
- [ ] Fix scoreToLevel() bug (standardize thresholds)
- [ ] Add reply-to mismatch rules (+25)
- [ ] Add display name impersonation (+30, hard override to 70+)
- [ ] Add attachment risk rules (HIGH: +25, MEDIUM: +10)
- [ ] Add domain similarity rules (HIGH confidence: +30, MEDIUM: +15)
- [ ] Add IP address URL rule (+20)
- [ ] Add MX missing rule (+8)
- [ ] Implement freeProvider flag (skip trust cap)

### Step 6: Update backend/app/api/analyze/route.ts
- [ ] Import and call `analyzeHeaders()`
- [ ] Import and call `analyzeDomainSimilarity()`
- [ ] Add anchor links pass-through from email
- [ ] Set `intel.freeProvider` for known free providers
- [ ] Add intel.headerAnalysis and intel.domainSimilarity to intel object
- [ ] Update MX result handling

### Step 7: Update backend/lib/inception.ts (Mercury prompt)
- [ ] Add MODULE 6: HEADER INTEGRITY (reply-to, display name impersonation)
- [ ] Add MODULE 7: DOMAIN SIMILARITY (typosquatting, IDN, combo, subdomain)
- [ ] Add MODULE 8: ATTACHMENT RISK (executables, macros, archives)
- [ ] Add IP URL guidance to MODULE 3
- [ ] Add anchor text mismatch guidance to MODULE 3
- [ ] Add freeProvider guidance
- [ ] Add MX guidance to MODULE 1
- [ ] Update _reasoning schema for new modules
- [ ] Update score rationale guidance

### Step 8: Update extension/src/utils/emailExtractor.ts
- [ ] Extract anchor links with both text and href (`extractAnchorLinks()`)
- [ ] Add `anchorLinks` to `ExtractedEmail` interface
- [ ] Update `extractEmailData()` to include anchorLinks

### Step 9: Update extension/src/sidebar/components/TechnicalDetails.tsx
- [ ] Add display for reply-to mismatch flag
- [ ] Add domain similarity warning
- [ ] Add attachment risk display
- [ ] Ensure new red flags render cleanly

### Step 10: Verify + commit
- [ ] Build backend (npx tsc --noEmit)
- [ ] Build extension (npm run build)
- [ ] Test with phishing email examples
- [ ] Update MEMORY.md
- [ ] Commit with comprehensive message

---

## SUCCESS CRITERIA

1. Google OTP / transactional email → scores 0-15 ✅
2. Known Nigerian bank email → scores 0-25 ✅
3. Phishing with wrong domain → scores 75+ ✅
4. Display name "PayPal" from gmail.com → scores 70+ ✅
5. Typosquatted domain (paypa1.com) → flagged as lookalike ✅
6. .exe attachment email → scores 50+ even if other signals clean ✅
7. Reply-To: attacker@gmail.com + From: bank@legit.com → flagged ✅
8. URL `http://192.168.1.1/login` → flagged ✅
9. Same email 3x → same score ✅ (cache)

---

*Created: 2026-03-10 | Engine upgrade initiative*
