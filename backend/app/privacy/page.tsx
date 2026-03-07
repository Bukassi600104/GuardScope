export const metadata = {
  title: 'Privacy Policy — GuardScope',
  description: 'GuardScope Privacy Policy — what we collect, what we never store, and your rights.',
}

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif', color: '#1a1a2e', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#555', marginBottom: 32 }}>Effective date: March 7, 2026 · Last updated: March 7, 2026</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>1. Overview</h2>
        <p>
          GuardScope is a Chrome extension that analyzes emails in Gmail for phishing and social engineering threats.
          We are committed to your privacy. This policy explains exactly what data we collect, what we do not collect,
          how we use data, and your rights.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>2. What We DO Collect</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Account data:</strong> Your email address and hashed password when you create an account (stored in Supabase Auth).</li>
          <li><strong>Usage counts:</strong> The number of analyses you run each month (not the content — just the count).</li>
          <li><strong>Account tier:</strong> Free, Pro, or Team.</li>
          <li><strong>Timestamps:</strong> When your account was created and when you last signed in.</li>
          <li><strong>Payment data:</strong> Handled entirely by Stripe or Paystack. We store only your subscription status — never card numbers.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32, background: '#f0fdf4', padding: '16px 20px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: '#166534' }}>3. What We Do NOT Collect or Store</h2>
        <ul style={{ paddingLeft: 20, color: '#166534' }}>
          <li><strong>Email content:</strong> The body, subject, and headers of emails you analyze are NEVER stored. They are sent to our AI analysis service and discarded immediately after the analysis is complete.</li>
          <li><strong>Email addresses of your contacts</strong> (senders or recipients)</li>
          <li><strong>URLs extracted from emails</strong> — only checked against threat databases, never persisted</li>
          <li><strong>Browsing history</strong> or any data outside of Gmail</li>
          <li><strong>Gmail credentials</strong> — we use Gmail&apos;s own DOM (not your password or API tokens)</li>
          <li><strong>Attachment content</strong> — only filename and type are noted (never uploaded)</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>4. Third-Party Services</h2>
        <p>To provide security analysis, we use the following third-party services. Each receives only the minimum data required:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>InceptionLabs Mercury-2 AI:</strong> Receives sanitized email content for analysis. Does not retain data per our API agreement.</li>
          <li><strong>VirusTotal:</strong> Receives URLs (not email content) to check against malware databases.</li>
          <li><strong>Google Safe Browsing:</strong> Receives URLs to check against Google&apos;s threat database.</li>
          <li><strong>PhishTank / URLhaus (Abuse.ch):</strong> Receives URLs to check against phishing databases.</li>
          <li><strong>Cloudflare DNS:</strong> Receives sender domain for DNS record lookup (SPF/DKIM/DMARC).</li>
          <li><strong>RDAP (rdap.org):</strong> Receives sender domain to check registration age.</li>
          <li><strong>Supabase:</strong> Hosts our database (account and usage data only). Located in the EU.</li>
          <li><strong>Stripe / Paystack:</strong> Process payments. We never see your full card number.</li>
          <li><strong>Vercel:</strong> Hosts our analysis API. Located in the US.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>5. Data Retention</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>Usage counts are retained for 13 months (to support monthly limit tracking).</li>
          <li>Account data is retained until you delete your account.</li>
          <li>Email analysis data is never retained — not even for 1 second after the analysis response is returned.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Access:</strong> Request a copy of your account data (email, tier, usage count).</li>
          <li><strong>Deletion:</strong> Delete your account at any time. All associated data is permanently deleted within 30 days.</li>
          <li><strong>Correction:</strong> Update your email address or account information.</li>
          <li><strong>Portability:</strong> Export your account data in JSON format on request.</li>
        </ul>
        <p>To exercise these rights, email us at <strong>privacy@guardscope.io</strong>.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>7. NDPR 2023 Compliance (Nigeria)</h2>
        <p>
          GuardScope complies with the Nigeria Data Protection Regulation (NDPR) 2023 and the Nigeria Data Protection Act.
          As a data controller, we process your personal data lawfully, fairly, and transparently.
          Nigerian users may lodge complaints with the Nigeria Data Protection Commission (NDPC) at ndpc.gov.ng.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>8. GDPR Compliance (EU/EEA)</h2>
        <p>
          For users in the European Union and EEA, our legal basis for processing is your explicit consent (given during onboarding)
          and the performance of our service contract. You may withdraw consent at any time by deleting your account.
          Our data processor (Supabase) is hosted in the EU and has signed a Data Processing Agreement.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>9. Cookies</h2>
        <p>
          The GuardScope Chrome extension does not use cookies. Our website may use minimal session cookies for authentication.
          We do not use third-party advertising cookies or tracking pixels.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>10. Children</h2>
        <p>GuardScope is not directed to children under 13. We do not knowingly collect data from children.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>11. Changes to This Policy</h2>
        <p>
          We will notify you of material changes via email. Continued use of GuardScope after the effective date constitutes acceptance.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>12. Contact</h2>
        <p>
          Questions about this policy: <strong>privacy@guardscope.io</strong><br />
          General support: <strong>support@guardscope.io</strong>
        </p>
      </section>

      <p style={{ color: '#888', fontSize: 13, marginTop: 48, borderTop: '1px solid #eee', paddingTop: 16 }}>
        © 2026 GuardScope. All rights reserved.
      </p>
    </main>
  )
}
