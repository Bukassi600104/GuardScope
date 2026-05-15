import type { Metadata } from 'next'
import { GuardScopeLogo } from '../components/GuardScopeLogo'
import { PRIVACY_EMAIL, QUOTAS, SUPPORT_EMAIL } from '../../lib/launch'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'GuardScope Privacy Policy: user-triggered Gmail analysis, no email storage, subprocessors, retention, and user rights.',
  alternates: { canonical: '/privacy' },
  openGraph: { url: '/privacy', type: 'website' },
}

const EFFECTIVE_DATE = 'May 15, 2026'

const C = {
  navy: '#071C2C',
  cyan: '#39B6FF',
  white: '#E7EEF4',
  muted: '#9bb0c2',
  muted2: '#6f879b',
  success: '#1ED760',
  border: 'rgba(57,182,255,0.14)',
}

const sections = [
  {
    title: '1. Overview',
    body: `GuardScope is a Chrome extension and web service that helps Gmail users analyze suspicious emails for phishing and social-engineering signals. This policy explains what we process, what we do not store, why we use third-party services, and how you can contact us about your data.`,
  },
  {
    title: '2. User-triggered email analysis',
    body: `GuardScope analyzes an email only when you choose to run a scan. The extension reads the currently open Gmail message so the service can produce a risk report. We do not continuously monitor your inbox, read unrelated Gmail messages, or collect browsing history outside the extension's stated purpose.`,
  },
  {
    title: '3. What we process to provide a scan',
    bullets: [
      '<strong>Email content for analysis:</strong> message body, subject, visible sender information, headers available to the extension, URLs, and attachment names may be transmitted to our backend for the scan you request.',
      '<strong>Security signals:</strong> sender authentication, domain age, URL reputation, AI assessment, and threat-intelligence results.',
      '<strong>Usage metadata:</strong> scan count, account tier, timestamps, and abuse-prevention signals needed for quota enforcement and service reliability.',
      '<strong>Account data:</strong> email address and authentication data when you create an account, handled by Supabase Auth.',
      '<strong>Payment and promo data:</strong> subscription status, promo-code status, and early-access form details needed to deliver codes and support billing.',
    ],
  },
  {
    title: '4. What GuardScope does not store',
    highlight: true,
    bullets: [
      '<strong>Email bodies, subjects, sender details, recipients, and headers</strong> are not stored in GuardScope databases.',
      '<strong>Extracted URLs from email content</strong> are checked during analysis and are not persisted as email content.',
      '<strong>Gmail passwords, OAuth tokens, address books, and contact lists</strong> are not collected by GuardScope.',
      '<strong>Browsing history outside Gmail</strong> is not collected.',
      '<strong>Full payment card numbers</strong> are never handled by GuardScope; payments are processed by Stripe or Paystack.',
    ],
  },
  {
    title: '5. Subprocessors and third-party services',
    preamble: 'GuardScope uses third-party services only where needed to provide email threat analysis, authentication, hosting, payment, or support:',
    bullets: [
      '<strong>InceptionLabs Mercury-2:</strong> receives email text needed for AI-assisted threat analysis.',
      '<strong>VirusTotal, Google Safe Browsing, PhishTank, URLhaus, and SpamHaus:</strong> receive URLs or domains needed for threat-intelligence checks.',
      '<strong>Cloudflare DNS and RDAP providers:</strong> receive domains needed for sender authentication and domain-age checks.',
      '<strong>Supabase:</strong> provides authentication and database services for accounts, quota, promo codes, and subscription state.',
      '<strong>Stripe and Paystack:</strong> process payments and return billing status to GuardScope.',
      '<strong>Vercel:</strong> hosts the website and backend API.',
      '<strong>Resend:</strong> may send transactional email such as promo codes or account messages.',
    ],
  },
  {
    title: '6. Retention',
    bullets: [
      `Anonymous usage counters support the ${QUOTAS.anonymousDaily}-per-day quota and abuse prevention.`,
      `Signed-in free-account usage counters support the ${QUOTAS.signedInFreeMonthly}-per-month quota and account operation.`,
      'Account and subscription records are retained while your account is active and as needed for legal, tax, fraud-prevention, or dispute-resolution reasons.',
      `Promo lead data is retained only as needed to deliver, support, and audit the ${QUOTAS.promoProDays}-day launch-code program.`,
      'Email content submitted for analysis is not retained in GuardScope databases after the analysis response is produced.',
    ],
  },
  {
    title: '7. Chrome Web Store Limited Use disclosure',
    body: 'GuardScope uses information received from Chrome extension functionality and Google-related surfaces only to provide Gmail email threat analysis, quota enforcement, account operation, security, and user-requested support. GuardScope does not sell this data or use it for advertising. The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.',
  },
  {
    title: '8. Your choices and rights',
    bullets: [
      '<strong>Access:</strong> request a copy of account, quota, promo, or subscription records associated with your account.',
      '<strong>Deletion:</strong> request account deletion and removal of associated account records, subject to legal and abuse-prevention retention obligations.',
      '<strong>Correction:</strong> ask us to correct inaccurate account or promo records.',
      '<strong>Opt out:</strong> uninstall the extension or stop using the service at any time.',
    ],
    footer: `Email privacy requests to ${PRIVACY_EMAIL}.`,
  },
  {
    title: '9. Regional privacy notes',
    body: 'GuardScope is designed around data minimization and user-triggered processing. Users may have rights under privacy laws such as the Nigeria Data Protection Act and GDPR depending on location and circumstances. Nothing in this policy limits mandatory rights available under applicable law.',
  },
  {
    title: '10. Cookies and analytics',
    body: 'The Chrome extension does not use advertising cookies. The website may use essential session cookies for authentication and service operation. We do not use third-party advertising pixels on the launch website.',
  },
  {
    title: '11. Children',
    body: 'GuardScope is not directed to children under 13, and we do not knowingly collect data from children.',
  },
  {
    title: '12. Contact',
    body: `Privacy questions: ${PRIVACY_EMAIL}\nGeneral support: ${SUPPORT_EMAIL}`,
  },
]

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.navy }}>
      <nav style={{
        borderBottom: '1px solid rgba(57,182,255,0.1)',
        padding: '0 24px',
        background: 'rgba(7,28,44,0.88)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64 }}>
          <a href="/"><GuardScopeLogo size={30} textSize={16} /></a>
          <a href="/" style={{ marginLeft: 'auto', fontSize: 13, color: C.muted2 }}>Back to home</a>
        </div>
      </nav>

      <header style={{ padding: '64px 24px 48px', borderBottom: '1px solid rgba(57,182,255,0.08)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cyan, marginBottom: 12 }}>
            Legal / Privacy
          </p>
          <h1 style={{ fontSize: 'clamp(32px,5vw,54px)', fontWeight: 800, color: C.white, marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.08 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: C.muted2 }}>Effective: {EFFECTIVE_DATE} / Last updated: {EFFECTIVE_DATE}</p>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '58px 24px 100px' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          {sections.map((sec) => (
            <section
              key={sec.title}
              style={{
                background: sec.highlight ? 'rgba(30,215,96,0.05)' : 'rgba(10,35,56,0.42)',
                border: `1px solid ${sec.highlight ? 'rgba(30,215,96,0.2)' : C.border}`,
                borderRadius: 8,
                padding: '26px 28px',
              }}
            >
              <h2 style={{ fontSize: 17, fontWeight: 760, color: C.white, marginBottom: 12, lineHeight: 1.3 }}>{sec.title}</h2>
              {sec.preamble && <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, marginBottom: 12 }}>{sec.preamble}</p>}
              {sec.body && <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{sec.body}</p>}
              {sec.bullets && (
                <ul style={{ listStyle: 'none', display: 'grid', gap: 10 }}>
                  {sec.bullets.map((bullet) => (
                    <li key={bullet} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: sec.highlight ? C.success : C.cyan, marginTop: 8 }} />
                      <span style={{ fontSize: 14, color: sec.highlight ? '#b5ecc7' : C.muted, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: bullet }} />
                    </li>
                  ))}
                </ul>
              )}
              {sec.footer && <p style={{ fontSize: 13, color: C.cyan, marginTop: 16, fontWeight: 650 }}>{sec.footer}</p>}
            </section>
          ))}
        </div>

        <footer style={{ marginTop: 54, paddingTop: 26, borderTop: '1px solid rgba(57,182,255,0.1)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <GuardScopeLogo size={24} textSize={13} />
          <p style={{ fontSize: 12, color: C.muted2 }}>Copyright 2026 GuardScope. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}
