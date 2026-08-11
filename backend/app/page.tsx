import type { Metadata } from 'next'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { CHROME_WEB_STORE_URL } from '../lib/launch'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/', type: 'website' },
}

const signals = [
  ['Sender identity', 'SPF, DKIM, DMARC, reply-to and return-path alignment.'],
  ['Link intelligence', 'Reputation checks across multiple phishing and malware sources.'],
  ['Domain context', 'Domain age, lookalikes, registrar signals, and suspicious infrastructure.'],
  ['Social engineering', 'Urgency, impersonation, credential theft, and payment pressure.'],
]

const faqs = [
  ['Does GuardScope store my email content?', 'No. Message content is processed only for the scan you request and is not stored in GuardScope databases.'],
  ['What happens after the five trial scans?', 'Scanning pauses until the account has an active subscription. Your account and previous local results remain available.'],
  ['Do I need an account?', 'Yes. Accounts keep trial usage and subscription access synchronized between the website and Chrome extension.'],
  ['Is GuardScope a guarantee that an email is safe?', 'No security product can guarantee that. GuardScope provides evidence-backed advisory findings to support a better decision.'],
]

export default function Home() {
  return (
    <main className="premium-site">
      <Navbar activePage="/" />

      <section className="premium-hero">
        <div className="premium-shell hero-layout">
          <div className="hero-copy">
            <span className="premium-kicker"><i /> Email threat intelligence for Gmail</span>
            <h1>Know what is hiding in your inbox.</h1>
            <p>GuardScope turns suspicious Gmail messages into clear, evidence-backed security decisions—before you click, reply, or pay.</p>
            <div className="premium-actions">
              <a className="premium-button primary" href="/signup">Start your 5-scan trial</a>
              <a className="premium-button secondary" href={CHROME_WEB_STORE_URL}>Add to Chrome</a>
            </div>
            <div className="trust-row">
              <span>No card for trial</span><span>Account synchronized</span><span>No email bodies stored</span>
            </div>
          </div>

          <div className="threat-console" aria-label="Example GuardScope email analysis">
            <div className="console-topbar"><span>guardscope / live analysis</span><b>Complete</b></div>
            <div className="console-grid">
              <div className="message-preview">
                <span className="micro-label">MESSAGE UNDER REVIEW</span>
                <h2>Payment authorization required</h2>
                <p className="message-sender">billing-alert@secure-payments.example</p>
                <div className="message-lines"><i /><i /><i /><i /></div>
                <div className="link-chip">secure-payments-login.example <strong>Unverified</strong></div>
              </div>
              <div className="verdict-preview">
                <div className="risk-orbit"><span>82</span><small>HIGH RISK</small></div>
                <p>Impersonation and payment pressure detected.</p>
                <ul><li>Newly registered sender domain</li><li>Authentication alignment failed</li><li>Urgent financial request</li></ul>
                <div className="verdict-action">Do not use links in this email.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="proof-strip">
        <div className="premium-shell proof-grid">
          <div><strong>4</strong><span>intelligence layers</span></div>
          <div><strong>0–100</strong><span>plain-language risk score</span></div>
          <div><strong>0</strong><span>email bodies stored</span></div>
          <div><strong>1 click</strong><span>from Gmail to verdict</span></div>
        </div>
      </section>

      <section className="premium-section light">
        <div className="premium-shell split-heading">
          <div><span className="section-label">WHY GUARDSCOPE</span><h2>Security evidence you can actually use.</h2></div>
          <p>Most inbox warnings stop at “be careful.” GuardScope shows the technical and behavioral signals behind the warning, then gives you a practical next step.</p>
        </div>
        <div className="premium-shell signal-grid">
          {signals.map(([title, copy], index) => (
            <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section className="premium-section process-section">
        <div className="premium-shell process-layout">
          <div className="process-copy"><span className="section-label">ONE CONTROLLED WORKFLOW</span><h2>From suspicion to a clear next move.</h2><p>GuardScope scans only when you ask. The result stays focused, understandable, and tied to the message in front of you.</p></div>
          <ol className="process-list">
            <li><span>01</span><div><h3>Open the message</h3><p>Select a suspicious email in Gmail.</p></div></li>
            <li><span>02</span><div><h3>Run GuardScope</h3><p>The extension securely sends the chosen message for analysis.</p></div></li>
            <li><span>03</span><div><h3>Act on evidence</h3><p>Review the score, reasons, and recommended response.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="premium-section trial-section">
        <div className="premium-shell trial-card">
          <div><span className="section-label">START WITH CONFIDENCE</span><h2>Five real scans. The complete product.</h2><p>Create one account and use five lifetime trial scans across the extension. Subscribe only when GuardScope has proved its value in your own inbox.</p></div>
          <div className="trial-cta"><strong>5</strong><span>lifetime trial scans</span><a className="premium-button primary" href="/signup">Create your account</a><small>Paystack checkout will appear when billing opens.</small></div>
        </div>
      </section>

      <section id="faq" className="premium-section faq-section">
        <div className="premium-shell faq-layout"><div><span className="section-label">STRAIGHT ANSWERS</span><h2>Before you trust us with an inbox decision.</h2></div><div className="faq-list">{faqs.map(([q, a]) => <article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></div>
      </section>

      <section className="closing-section"><div className="premium-shell"><span className="section-label">GUARDSCOPE FOR GMAIL</span><h2>Pause before the risky click.</h2><p>Install the extension, create your account, and put your first suspicious message under the scope.</p><div className="premium-actions centered"><a className="premium-button primary" href="/signup">Start your trial</a><a className="premium-button dark" href={CHROME_WEB_STORE_URL}>View Chrome listing</a></div></div></section>
      <Footer />
    </main>
  )
}
