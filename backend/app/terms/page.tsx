import type { Metadata } from 'next'
import { GuardScopeLogo } from '../components/GuardScopeLogo'

export const metadata: Metadata = {
  title: 'Terms of Service — GuardScope',
}

const EFFECTIVE_DATE = 'March 7, 2026'

const C = {
  navy:    '#071C2C',
  cyan:    '#39B6FF',
  white:   '#E7EEF4',
  muted:   '#8ba3b8',
  muted2:  '#4a6478',
}

const TERMS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By installing or using GuardScope ("the Extension"), you agree to these Terms of Service. If you do not agree, uninstall the Extension and do not use the service. These terms constitute a binding agreement between you and GuardScope.',
  },
  {
    title: '2. Description of Service',
    body: 'GuardScope is a Chrome browser extension that analyzes Gmail emails for phishing and security threats. Analysis uses AI (Mercury-2 by InceptionLabs), DNS authentication checks, and third-party threat intelligence databases. Results are advisory — they do not constitute legal or security guarantees.',
  },
  {
    title: '3. Free and Paid Tiers',
    body: 'The Free tier provides 5 email analyses per day at no cost, forever. The Pro tier ($4.99/month USD or ₦7,500/month NGN) provides unlimited analyses and is billed monthly via Stripe or Paystack. Early access users with a promo code receive 30 days of Pro access from code activation. Subscriptions renew automatically until cancelled. Refunds are not provided for partial months, but you may cancel at any time and retain access until the period ends.',
  },
  {
    title: '4. Promo Codes',
    body: 'Promo codes are issued at our discretion and grant temporary Pro access. Codes expire if not activated within 30 days of issuance. One code per email address. Codes may not be transferred, sold, or shared. We reserve the right to revoke codes at any time if misuse is detected.',
  },
  {
    title: '5. Acceptable Use',
    body: 'You may use GuardScope only for lawful purposes: analyzing emails you have legitimate access to. You may not: reverse-engineer or copy the Extension; attempt to circumvent rate limits or quotas; use the service to process emails on behalf of others without their consent; submit intentionally malformed inputs to probe backend behavior.',
  },
  {
    title: '6. Privacy and Data',
    body: 'Email content is transmitted to our backend for analysis and discarded immediately — we do not store email bodies, subjects, or sender contact details. Account data (email address, tier, usage count) is stored securely in Supabase. Full details are in our Privacy Policy at guardscope.io/privacy.',
  },
  {
    title: '7. No Warranty',
    body: 'GuardScope is provided "as is" without warranty of any kind. We do not guarantee that the service will detect all phishing attempts, be error-free, or be continuously available. Do not rely solely on GuardScope for critical security decisions.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'To the maximum extent permitted by law, GuardScope and its operators shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the service, including any loss resulting from a phishing attack not detected by the Extension.',
  },
  {
    title: '9. Changes to Terms',
    body: 'We may update these Terms at any time. Continued use of the Extension after changes constitutes acceptance. Material changes will be communicated via the Extension or email (if you have an account).',
  },
  {
    title: '10. Governing Law',
    body: 'These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be resolved in Nigerian courts, except where local consumer protection law mandates otherwise.',
  },
  {
    title: '11. Contact',
    body: 'Questions about these Terms: support@guardscope.io',
  },
]

export default function Terms() {
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
          }}>Legal · Terms</span>
          <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, color: C.white, marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 14, color: C.muted2 }}>Effective: {EFFECTIVE_DATE}</p>
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {TERMS.map((section) => (
            <div
              key={section.title}
              style={{
                background: 'rgba(10,35,56,0.4)',
                border: '1px solid rgba(57,182,255,0.1)',
                borderRadius: 16,
                padding: '24px 28px',
              }}
            >
              <h2 style={{
                fontSize: 16, fontWeight: 700, color: C.white,
                marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: C.cyan,
                  background: 'rgba(57,182,255,0.1)',
                  padding: '2px 8px', borderRadius: 6,
                  letterSpacing: '0.04em',
                }}>
                  {section.title.split('.')[0]}
                </span>
                {section.title.split('. ')[1]}
              </h2>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8 }}>
                {section.body}
              </p>
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
