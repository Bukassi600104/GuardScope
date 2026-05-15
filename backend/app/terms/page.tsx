import type { Metadata } from 'next'
import { GuardScopeLogo } from '../components/GuardScopeLogo'
import { QUOTAS, SUPPORT_EMAIL } from '../../lib/launch'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'GuardScope Terms of Service: usage rules, acceptable use, quotas, promo codes, advisory results, and account deletion.',
  alternates: { canonical: '/terms' },
  openGraph: { url: '/terms', type: 'website' },
}

const EFFECTIVE_DATE = 'May 15, 2026'

const C = {
  navy: '#071C2C',
  cyan: '#39B6FF',
  white: '#E7EEF4',
  muted: '#9bb0c2',
  muted2: '#6f879b',
  border: 'rgba(57,182,255,0.14)',
}

const TERMS = [
  {
    title: '1. Acceptance',
    body: 'By installing, accessing, or using GuardScope, you agree to these Terms. If you do not agree, do not use the extension or website.',
  },
  {
    title: '2. Service purpose',
    body: 'GuardScope is a Chrome extension and web service for Gmail phishing and email threat analysis. The extension helps users inspect emails they choose to scan and returns advisory risk signals, explanations, and suggested next steps.',
  },
  {
    title: '3. Advisory security results',
    body: 'GuardScope results are informational and advisory. No security product can detect every phishing attempt, malicious link, impersonation, or business email compromise attack. You remain responsible for decisions you make after reviewing a report.',
  },
  {
    title: '4. Free, promo, and paid access',
    body: `Anonymous users receive ${QUOTAS.anonymousDaily} analyses per day per IP. Signed-in free accounts include ${QUOTAS.signedInFreeMonthly} analyses per month unless upgraded. Launch promo codes provide ${QUOTAS.promoProDays} days of Pro access from activation. Paid Pro access may be offered through Stripe or Paystack after launch.`,
  },
  {
    title: '5. Promo-code rules',
    body: 'Promo codes are limited, issued at our discretion, and intended for individual early-access users. Codes may not be sold, transferred, automated, or abused. We may revoke a code or account benefit if we detect fraud, resale, abuse, or attempts to bypass limits.',
  },
  {
    title: '6. Acceptable use',
    body: 'You may use GuardScope only for lawful analysis of emails you are authorized to access. You may not reverse engineer the service, attack or overload the backend, bypass quotas, scrape APIs, submit malicious test payloads outside normal use, sell access, or process another person\'s email without appropriate permission.',
  },
  {
    title: '7. Privacy and data',
    body: 'Email content is transmitted for user-triggered analysis and is not stored in GuardScope databases. Account, quota, subscription, promo, diagnostic, and abuse-prevention metadata may be stored where needed to operate the service. See the Privacy Policy at guardscope.app/privacy for details.',
  },
  {
    title: '8. Accounts and deletion',
    body: `You are responsible for keeping your account secure. You may request account deletion by using available product controls or contacting ${SUPPORT_EMAIL}. Some records may be retained where required for legal, tax, security, fraud-prevention, or dispute-resolution reasons.`,
  },
  {
    title: '9. Payments',
    body: 'If paid subscriptions are enabled, subscriptions renew automatically until cancelled. Payment processors handle card and payment details. Unless required by law or stated in a separate offer, partial-month refunds are not guaranteed.',
  },
  {
    title: '10. Service changes and availability',
    body: 'We may change, suspend, or discontinue features, quotas, promo campaigns, providers, or pricing. We aim to keep GuardScope available, but we do not guarantee uninterrupted or error-free operation.',
  },
  {
    title: '11. No warranty',
    body: 'GuardScope is provided "as is" and "as available" without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.',
  },
  {
    title: '12. Limitation of liability',
    body: 'To the maximum extent permitted by law, GuardScope and its operators will not be liable for indirect, incidental, consequential, special, punitive, or exemplary damages, including losses from undetected phishing, fraud, data loss, business interruption, or reliance on analysis results.',
  },
  {
    title: '13. Governing law',
    body: 'These Terms are governed by the laws of the Federal Republic of Nigeria, except where mandatory local consumer protection law provides otherwise.',
  },
  {
    title: '14. Contact',
    body: `Questions about these Terms: ${SUPPORT_EMAIL}`,
  },
]

export default function Terms() {
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
            Legal / Terms
          </p>
          <h1 style={{ fontSize: 'clamp(32px,5vw,54px)', fontWeight: 800, color: C.white, marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.08 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 14, color: C.muted2 }}>Effective: {EFFECTIVE_DATE}</p>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '58px 24px 100px' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          {TERMS.map((section) => (
            <section
              key={section.title}
              style={{
                background: 'rgba(10,35,56,0.42)',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '24px 28px',
              }}
            >
              <h2 style={{ fontSize: 17, fontWeight: 760, color: C.white, marginBottom: 12, lineHeight: 1.3 }}>{section.title}</h2>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8 }}>{section.body}</p>
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
