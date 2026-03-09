import { GuardScopeLogo } from '../components/GuardScopeLogo'

export const metadata = {
  title: 'Privacy Policy — GuardScope',
  description: 'GuardScope Privacy Policy — what we collect, what we never store, and your rights.',
}

const C = {
  navy:    '#071C2C',
  cyan:    '#39B6FF',
  white:   '#E7EEF4',
  muted:   '#8ba3b8',
  muted2:  '#4a6478',
  success: '#1ED760',
  border:  'rgba(57,182,255,0.12)',
}

const sections = [
  {
    title: '1. Overview',
    body: `GuardScope is a Chrome extension that analyzes emails in Gmail for phishing and social engineering threats.
We are committed to your privacy. This policy explains exactly what data we collect, what we do not collect,
how we use data, and your rights.`,
  },
  {
    title: '2. What We DO Collect',
    bullets: [
      '<strong>Account data:</strong> Your email address and hashed password when you create an account (stored in Supabase Auth).',
      '<strong>Usage counts:</strong> The number of analyses you run each month — not the content, just the count.',
      '<strong>Account tier:</strong> Free, Pro, or Team.',
      '<strong>Timestamps:</strong> When your account was created and when you last signed in.',
      '<strong>Payment data:</strong> Handled entirely by Stripe or Paystack. We store only your subscription status — never card numbers.',
      '<strong>Promo code leads:</strong> Name, email address, and country — collected when you request an early access promo code.',
    ],
  },
  {
    title: '3. What We Do NOT Collect or Store',
    highlight: true,
    bullets: [
      '<strong>Email content:</strong> The body, subject, and headers of emails you analyze are NEVER stored. Discarded immediately after analysis.',
      '<strong>Email addresses of your contacts</strong> (senders or recipients)',
      '<strong>URLs extracted from emails</strong> — only checked against threat databases, never persisted',
      '<strong>Browsing history</strong> or any data outside of Gmail',
      '<strong>Gmail credentials</strong> — we use Gmail\'s own DOM (not your password or API tokens)',
      '<strong>Attachment content</strong> — only filename and type are noted (never uploaded)',
    ],
  },
  {
    title: '4. Third-Party Services',
    preamble: 'To provide security analysis, we use the following third-party services. Each receives only the minimum data required:',
    bullets: [
      '<strong>InceptionLabs Mercury-2 AI:</strong> Receives sanitized email content for analysis. Does not retain data per our API agreement.',
      '<strong>VirusTotal:</strong> Receives URLs (not email content) to check against malware databases.',
      '<strong>Google Safe Browsing:</strong> Receives URLs to check against Google\'s threat database.',
      '<strong>PhishTank / URLhaus (Abuse.ch):</strong> Receives URLs to check against phishing databases.',
      '<strong>Cloudflare DNS:</strong> Receives sender domain for SPF/DKIM/DMARC lookup.',
      '<strong>RDAP (rdap.org):</strong> Receives sender domain to check registration age.',
      '<strong>Supabase:</strong> Hosts our database (account and usage data only). Located in the EU.',
      '<strong>Stripe / Paystack:</strong> Process payments. We never see your full card number.',
      '<strong>Vercel:</strong> Hosts our analysis API. Located in the US.',
    ],
  },
  {
    title: '5. Data Retention',
    bullets: [
      'Usage counts are retained for 13 months (to support monthly limit tracking).',
      'Account data is retained until you delete your account.',
      'Email analysis data is never retained — not even for 1 second after the analysis response is returned.',
      'Promo code lead data (name, email, country) is retained for 90 days after the promo period ends.',
    ],
  },
  {
    title: '6. Your Rights',
    preamble: 'You have the right to:',
    bullets: [
      '<strong>Access:</strong> Request a copy of your account data (email, tier, usage count).',
      '<strong>Deletion:</strong> Delete your account at any time. All associated data is permanently deleted within 30 days.',
      '<strong>Correction:</strong> Update your email address or account information.',
      '<strong>Portability:</strong> Export your account data in JSON format on request.',
    ],
    footer: 'To exercise these rights, email us at privacy@guardscope.io',
  },
  {
    title: '7. NDPR 2023 Compliance (Nigeria)',
    body: `GuardScope complies with the Nigeria Data Protection Regulation (NDPR) 2023 and the Nigeria Data Protection Act.
As a data controller, we process your personal data lawfully, fairly, and transparently.
Nigerian users may lodge complaints with the Nigeria Data Protection Commission (NDPC) at ndpc.gov.ng.`,
  },
  {
    title: '8. GDPR Compliance (EU/EEA)',
    body: `For users in the European Union and EEA, our legal basis for processing is your explicit consent (given during onboarding)
and the performance of our service contract. You may withdraw consent at any time by deleting your account.
Our data processor (Supabase) is hosted in the EU and has signed a Data Processing Agreement.`,
  },
  {
    title: '9. Cookies',
    body: `The GuardScope Chrome extension does not use cookies. Our website may use minimal session cookies for authentication.
We do not use third-party advertising cookies or tracking pixels.`,
  },
  {
    title: '10. Children',
    body: 'GuardScope is not directed to children under 13. We do not knowingly collect data from children.',
  },
  {
    title: '11. Changes to This Policy',
    body: 'We will notify you of material changes via email. Continued use of GuardScope after the effective date constitutes acceptance.',
  },
  {
    title: '12. Contact',
    body: 'Privacy questions: privacy@guardscope.io\nGeneral support: support@guardscope.io',
  },
]

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.navy }}>

      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid rgba(57,182,255,0.1)',
        padding: '0 24px',
        background: 'rgba(7,28,44,0.85)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64 }}>
          <a href="/">
            <GuardScopeLogo size={30} textSize={16} />
          </a>
          <a href="/" style={{ marginLeft: 'auto', fontSize: 13, color: C.muted2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#4a6478" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to home
          </a>
        </div>
      </nav>

      {/* Header */}
      <div style={{
        padding: '64px 24px 48px',
        borderBottom: '1px solid rgba(57,182,255,0.08)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse at center, rgba(57,182,255,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: C.cyan, display: 'block', marginBottom: 14,
          }}>Legal · Privacy</span>
          <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, color: C.white, marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: C.muted2 }}>
            Effective date: March 7, 2026 · Last updated: March 7, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {sections.map((sec) => (
            <div
              key={sec.title}
              style={{
                background: sec.highlight
                  ? 'rgba(30,215,96,0.04)'
                  : 'rgba(10,35,56,0.4)',
                border: `1px solid ${sec.highlight ? 'rgba(30,215,96,0.15)' : 'rgba(57,182,255,0.1)'}`,
                borderRadius: 16,
                padding: '28px 32px',
              }}
            >
              <h2 style={{
                fontSize: 17, fontWeight: 700, color: C.white,
                marginBottom: 14, lineHeight: 1.3,
              }}>
                {sec.title}
              </h2>

              {sec.preamble && (
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, marginBottom: 14 }}>
                  {sec.preamble}
                </p>
              )}

              {sec.body && (
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {sec.body}
                </p>
              )}

              {sec.bullets && (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sec.bullets.map((b, i) => (
                    <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{
                        flexShrink: 0, marginTop: 5, width: 6, height: 6, borderRadius: '50%',
                        background: sec.highlight ? '#1ED760' : C.cyan,
                        display: 'inline-block',
                      }} />
                      <span
                        style={{ fontSize: 14, color: sec.highlight ? '#a8e6bc' : C.muted, lineHeight: 1.7 }}
                        dangerouslySetInnerHTML={{ __html: b }}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {sec.footer && (
                <p style={{ fontSize: 13, color: C.cyan, marginTop: 16, fontWeight: 500 }}>
                  {sec.footer}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 60, paddingTop: 28,
          borderTop: '1px solid rgba(57,182,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <GuardScopeLogo size={24} textSize={13} />
          <p style={{ fontSize: 12, color: C.muted2 }}>© 2026 GuardScope. All rights reserved.</p>
        </div>
      </main>
    </div>
  )
}
