import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — GuardScope',
}

const EFFECTIVE_DATE = 'March 7, 2026'

export default function Terms() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#64748b', marginBottom: 40 }}>
        ← Back to home
      </a>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 48 }}>Effective: {EFFECTIVE_DATE}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        {[
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
            body: 'The Free tier provides 5 email analyses per calendar month at no cost. The Pro tier ($4.99/month USD or ₦7,500/month NGN) provides unlimited analyses and is billed monthly via Stripe or Paystack. Subscriptions renew automatically until cancelled. Refunds are not provided for partial months, but you may cancel at any time and retain access until the period ends.',
          },
          {
            title: '4. Acceptable Use',
            body: 'You may use GuardScope only for lawful purposes: analyzing emails you have legitimate access to. You may not: reverse-engineer or copy the Extension; attempt to circumvent rate limits or quotas; use the service to process emails on behalf of others without their consent; submit intentionally malformed inputs to probe backend behavior.',
          },
          {
            title: '5. Privacy and Data',
            body: 'Email content is transmitted to our backend for analysis and discarded immediately — we do not store email bodies, subjects, or sender contact details. Account data (email address, tier, usage count) is stored securely in Supabase. Full details are in our Privacy Policy at guardscope.io/privacy.',
          },
          {
            title: '6. No Warranty',
            body: 'GuardScope is provided "as is" without warranty of any kind. We do not guarantee that the service will detect all phishing attempts, be error-free, or be continuously available. Do not rely solely on GuardScope for critical security decisions.',
          },
          {
            title: '7. Limitation of Liability',
            body: 'To the maximum extent permitted by law, GuardScope and its operators shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the service, including any loss resulting from a phishing attack not detected by the Extension.',
          },
          {
            title: '8. Changes to Terms',
            body: 'We may update these Terms at any time. Continued use of the Extension after changes constitutes acceptance. Material changes will be communicated via the Extension or email (if you have an account).',
          },
          {
            title: '9. Governing Law',
            body: 'These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be resolved in Nigerian courts, except where local consumer protection law mandates otherwise.',
          },
          {
            title: '10. Contact',
            body: 'Questions about these Terms: support@guardscope.io',
          },
        ].map((section) => (
          <div key={section.title}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>{section.title}</h2>
            <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.75 }}>{section.body}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
