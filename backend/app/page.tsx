import type { Metadata } from 'next'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { CHROME_WEB_STORE_URL } from '../lib/launch'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/', type: 'website' },
}

const signals = [
  ['Sender authentication', 'SPF, DKIM, DMARC, reply-to and return-path alignment.'],
  ['Link reputation', 'Phishing and malware intelligence across every detected destination.'],
  ['Domain history', 'Age, registrar signals, lookalikes and suspicious infrastructure.'],
  ['Message intent', 'Impersonation, urgency, credential theft and payment pressure.'],
]

const faqs = [
  ['Does GuardScope store my email content?', 'No. The selected message is processed for the scan you request and its body is not stored in GuardScope databases.'],
  ['What happens after five trial scans?', 'Scanning pauses until the account has an active subscription. Your account and local results remain available.'],
  ['Why is an account required?', 'Your account keeps trial usage and subscription access synchronized between the website and Chrome extension.'],
  ['Is a low score a guarantee of safety?', 'No security product can provide that guarantee. GuardScope gives you evidence and a practical recommendation for a better-informed decision.'],
]

export default function Home() {
  return (
    <main className="premium-site">
      <Navbar activePage="/" />

      <section className="premium-hero">
        <div className="premium-shell hero-layout">
          <div className="hero-copy">
            <span className="premium-kicker">Email intelligence for Gmail</span>
            <h1>Read the risk.<br />Before the message.</h1>
            <p>GuardScope examines the signals behind a suspicious email and gives you a clear recommendation before you click, reply or pay.</p>
            <div className="premium-actions">
              <a className="premium-button primary" href="/signup">Create an account</a>
              <a className="premium-button secondary" href={CHROME_WEB_STORE_URL}>Install for Chrome <span aria-hidden="true">↗</span></a>
            </div>
            <p className="hero-note">Five complete scans to evaluate GuardScope. No card required.</p>
          </div>

          <div className="analysis-dossier" aria-label="Example GuardScope email analysis">
            <header><span>GuardScope assessment</span><span className="dossier-status">Analysis complete</span></header>
            <div className="dossier-subject">
              <span>Subject</span>
              <strong>Payment authorization required</strong>
              <small>billing-alert@secure-payments.example</small>
            </div>
            <div className="dossier-verdict">
              <div><span className="score">82</span><small>Risk score / 100</small></div>
              <div><span className="risk-label">High risk</span><p>Impersonation and payment pressure detected.</p></div>
            </div>
            <ul className="dossier-findings">
              <li><span>01</span><p>Sender authentication alignment failed</p><strong>Critical</strong></li>
              <li><span>02</span><p>Recently registered destination domain</p><strong>Elevated</strong></li>
              <li><span>03</span><p>Urgent financial request detected</p><strong>Elevated</strong></li>
            </ul>
            <footer><span>Recommended action</span><strong>Do not use links in this message.</strong></footer>
          </div>
        </div>
      </section>

      <section className="proof-strip">
        <div className="premium-shell proof-grid">
          <div><strong>01</strong><span>One click from Gmail</span></div>
          <div><strong>04</strong><span>Intelligence layers</span></div>
          <div><strong>00</strong><span>Email bodies stored</span></div>
          <div><strong>100</strong><span>Point risk scale</span></div>
        </div>
      </section>

      <section className="premium-section light">
        <div className="premium-shell split-heading">
          <div><span className="section-label">The evidence</span><h2>A warning is only useful when you know why.</h2></div>
          <p>GuardScope separates technical evidence from guesswork. Every assessment shows the signals that shaped it and the action worth taking next.</p>
        </div>
        <div className="premium-shell signal-grid">
          {signals.map(([title, copy], index) => (
            <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section className="premium-section process-section">
        <div className="premium-shell process-layout">
          <div className="process-copy"><span className="section-label">A deliberate workflow</span><h2>Inspect only when something feels wrong.</h2><p>GuardScope does not sit noisily between you and every email. You choose the message. GuardScope returns the evidence.</p></div>
          <ol className="process-list">
            <li><span>01</span><div><h3>Open a suspicious message</h3><p>Select the email you want to investigate inside Gmail.</p></div></li>
            <li><span>02</span><div><h3>Run the assessment</h3><p>GuardScope checks identity, infrastructure, links and intent.</p></div></li>
            <li><span>03</span><div><h3>Make the safer decision</h3><p>Review the score, supporting evidence and recommended action.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="premium-section trial-section">
        <div className="premium-shell trial-card">
          <div><span className="section-label">Evaluate it properly</span><h2>Five messages.<br />No reduced version.</h2><p>Use the complete GuardScope assessment on five real emails. One account keeps those scans synchronized with the extension.</p></div>
          <div className="trial-cta"><strong>05</strong><span>Complete lifetime trial scans</span><a className="premium-button inverted" href="/signup">Start your assessment</a><small>Billing remains unavailable until the Paystack rollout is ready.</small></div>
        </div>
      </section>

      <section id="faq" className="premium-section faq-section">
        <div className="premium-shell faq-layout"><div><span className="section-label">Clear answers</span><h2>Trust should begin with scrutiny.</h2></div><div className="faq-list">{faqs.map(([q, a], index) => <article key={q}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{q}</h3><p>{a}</p></div></article>)}</div></div>
      </section>

      <section className="closing-section"><div className="premium-shell"><span className="section-label">GuardScope for Gmail</span><h2>Inspect before you trust.</h2><p>Install the extension and put your next suspicious message under the scope.</p><div className="premium-actions centered"><a className="premium-button primary" href="/signup">Create an account</a><a className="premium-button secondary" href={CHROME_WEB_STORE_URL}>View Chrome listing <span aria-hidden="true">↗</span></a></div></div></section>
      <Footer />
    </main>
  )
}
