import type { Metadata } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { CTA_HREF, CTA_LABEL, QUOTAS } from '../lib/launch'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/', type: 'website' },
}

const C = {
  bg: '#f7fbff',
  ink: '#061b2b',
  text: '#10273a',
  body: '#4f6275',
  muted: '#738293',
  border: '#cdd8e3',
  surface: '#ffffff',
  cyan: '#1aa7d9',
  cyanDark: '#006493',
  green: '#18a957',
  amber: '#d88b00',
  red: '#d94444',
  violet: '#6d5dfc',
}

const s = {
  wrap: { width: 'min(1180px, calc(100% - 48px))', margin: '0 auto' } as CSSProperties,
  section: { padding: '92px 0' } as CSSProperties,
  h1: {
    fontSize: 'clamp(42px, 7vw, 82px)',
    lineHeight: 0.98,
    letterSpacing: '-0.02em',
    fontWeight: 800,
    color: C.ink,
  } as CSSProperties,
  h2: {
    fontSize: 'clamp(30px, 4vw, 52px)',
    lineHeight: 1.05,
    letterSpacing: '-0.015em',
    fontWeight: 780,
    color: C.ink,
  } as CSSProperties,
  lead: { fontSize: 18, lineHeight: 1.75, color: C.body } as CSSProperties,
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.11em',
    textTransform: 'uppercase' as const,
    color: C.cyanDark,
  } as CSSProperties,
  buttonPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 48,
    padding: '0 22px',
    borderRadius: 8,
    background: C.ink,
    color: '#fff',
    fontSize: 15,
    fontWeight: 760,
    boxShadow: '0 16px 34px rgba(6,27,43,0.18)',
  } as CSSProperties,
  buttonSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    padding: '0 22px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: 'rgba(255,255,255,0.74)',
    color: C.ink,
    fontSize: 15,
    fontWeight: 720,
  } as CSSProperties,
  panel: {
    background: 'rgba(255,255,255,0.82)',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    boxShadow: '0 24px 80px rgba(16,39,58,0.12)',
  } as CSSProperties,
}

function ArrowIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon({ color = C.green }: { color?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.12" />
      <path d="M7 12.5l3.2 3.2L17 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SignalIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l8 4.4v5.1c0 4.7-3.3 8.9-8 10-4.7-1.1-8-5.3-8-10V7.4L12 3z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 12.2l2.3 2.3 4.8-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Pill({ children, color = C.cyanDark }: { children: ReactNode; color?: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: 28,
      padding: '0 10px',
      borderRadius: 8,
      background: `${color}12`,
      color,
      border: `1px solid ${color}26`,
      fontSize: 12,
      fontWeight: 760,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

function ProductDemo() {
  const flags = [
    { label: 'Sender domain is newly registered', color: C.red },
    { label: 'SPF and DMARC alignment need review', color: C.amber },
    { label: 'Payment urgency language detected', color: C.red },
    { label: 'Threat feeds checked against extracted links', color: C.cyanDark },
  ]

  return (
    <div style={{
      ...s.panel,
      position: 'relative',
      overflow: 'hidden',
      padding: 14,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(238,248,255,0.82))',
      backdropFilter: 'blur(22px)',
    }}>
      <div className="product-demo-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.85fr)',
        gap: 14,
        alignItems: 'stretch',
      }}>
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ height: 46, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ea4335' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbc04' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34a853' }} />
            <span style={{ marginLeft: 10, fontSize: 12, color: C.muted, fontWeight: 650 }}>mail.google.com</span>
          </div>
          <div className="gmail-demo-grid" style={{ display: 'grid', gridTemplateColumns: '170px minmax(0, 1fr)' }}>
            <div className="gmail-demo-sidebar" style={{ borderRight: `1px solid ${C.border}`, padding: 14, background: '#f8fafc', minHeight: 390 }}>
              {['Inbox', 'Starred', 'Sent', 'Security alerts'].map((item, index) => (
                <div key={item} style={{
                  height: 34,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px',
                  marginBottom: 5,
                  fontSize: 12,
                  fontWeight: index === 0 ? 760 : 620,
                  color: index === 0 ? C.ink : C.muted,
                  background: index === 0 ? '#eaf4ff' : 'transparent',
                }}>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>From: billing-alert@secure-payments.example</div>
                  <h3 style={{ fontSize: 20, lineHeight: 1.25, color: C.ink, margin: 0 }}>Action required: payment verification</h3>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
                {[
                  'Dear customer, your account will be suspended today unless you verify your payment profile.',
                  'Please use the secure link below to avoid service interruption.',
                  'This message was sent by the billing team.',
                ].map((line) => (
                  <div key={line} style={{ height: 15, borderRadius: 999, background: '#edf3f8', width: line.length > 70 ? '100%' : '82%' }} />
                ))}
              </div>
              <div style={{
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                background: '#fbfdff',
              }}>
                <div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Link found</div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 720 }}>secure-payments-login.example</div>
                </div>
                <span style={{ width: 34, height: 34, borderRadius: 8, background: '#fff0f0', display: 'grid', placeItems: 'center' }}>
                  <SignalIcon color={C.red} />
                </span>
              </div>
            </div>
          </div>
        </div>

        <aside style={{
          background: 'rgba(6,27,43,0.96)',
          color: '#fff',
          borderRadius: 8,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', marginBottom: 4 }}>GuardScope verdict</div>
              <div style={{ fontSize: 18, fontWeight: 780 }}>High risk</div>
            </div>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              border: `5px solid ${C.red}`,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(217,68,68,0.12)',
              color: '#ff8a8a',
              fontSize: 25,
              fontWeight: 820,
            }}>
              82
            </div>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.72)' }}>
            GuardScope analyzes the message when you ask it to scan. The report highlights why the email deserves caution without storing the email content.
          </p>
          <div style={{ display: 'grid', gap: 9 }}>
            {flags.map((flag) => (
              <div key={flag.label} style={{
                display: 'flex',
                gap: 9,
                alignItems: 'flex-start',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '10px 11px',
                background: 'rgba(255,255,255,0.045)',
              }}>
                <span style={{ width: 8, height: 8, marginTop: 6, borderRadius: '50%', background: flag.color, boxShadow: `0 0 0 4px ${flag.color}20` }} />
                <span style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.78)' }}>{flag.label}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 'auto',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 14,
            display: 'flex',
            justifyContent: 'space-between',
            color: 'rgba(255,255,255,0.58)',
            fontSize: 11,
          }}>
            <span>Mercury-2 AI</span>
            <span>Advisory result</span>
          </div>
        </aside>
      </div>
    </div>
  )
}

const PRIVACY_POINTS = [
  'No email bodies stored',
  'User-triggered scans only',
  'Results are advisory',
]

const WORKFLOW = [
  {
    title: 'Open a suspicious Gmail message',
    body: 'GuardScope works inside Gmail in Chrome and keeps the analysis focused on the email you choose to inspect.',
  },
  {
    title: 'Click analyze',
    body: 'The backend checks sender authentication, links, domain signals, threat feeds, and AI reasoning in one request.',
  },
  {
    title: 'Review the verdict',
    body: 'You get a 0-100 risk score, plain-English reasoning, red and green flags, and suggested next steps.',
  },
]

const LAYERS = [
  { title: 'AI reasoning', body: 'Mercury-2 reviews tone, urgency, impersonation cues, and social-engineering patterns.', color: C.violet },
  { title: 'URL intelligence', body: 'Extracted links are checked against malware and phishing intelligence providers.', color: C.cyan },
  { title: 'Sender authentication', body: 'SPF, DKIM, DMARC, DNS, and domain signals help explain sender trust.', color: C.green },
  { title: 'Domain context', body: 'RDAP and lookalike checks help surface newly registered or suspicious domains.', color: C.amber },
]

const FAQS = [
  {
    q: 'Does GuardScope store my emails?',
    a: 'No. Email content is processed for the scan you request and is not stored in GuardScope databases.',
  },
  {
    q: 'What is the free quota?',
    a: `Anonymous users receive ${QUOTAS.anonymousDaily} analyses per day per IP. Signed-in free accounts include ${QUOTAS.signedInFreeMonthly} analyses per month unless upgraded or using a promo code.`,
  },
  {
    q: 'Why does the extension need Gmail access?',
    a: 'GuardScope needs access to Gmail pages so it can read the currently open email only when you ask it to analyze that message.',
  },
  {
    q: 'Are the results definitive?',
    a: 'No security tool can detect every threat. GuardScope provides advisory analysis so you can make a more informed decision.',
  },
  {
    q: 'What happens with launch promo codes?',
    a: `The first launch users can request a code for ${QUOTAS.promoProDays} days of Pro access. Codes are limited and can be revoked if abused.`,
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar activePage="/" />

      <section style={{
        padding: '88px 0 74px',
        overflow: 'hidden',
        background: `
          radial-gradient(circle at 12% 18%, rgba(26,167,217,0.16), transparent 28%),
          radial-gradient(circle at 88% 8%, rgba(24,169,87,0.12), transparent 25%),
          linear-gradient(180deg, #f7fbff 0%, #eef7ff 58%, #fff 100%)
        `,
      }}>
        <div className="home-hero-grid" style={{ ...s.wrap }}>
          <div>
            <h1 style={s.h1}>GuardScope for Gmail</h1>
            <p style={{ ...s.lead, margin: '24px 0 30px', maxWidth: 560 }}>
              AI-assisted phishing and email threat analysis before you click. Inspect suspicious Gmail messages with a clear risk score, evidence-backed flags, and privacy-first processing.
            </p>
            <div className="hero-cta-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <a href={CTA_HREF} style={s.buttonPrimary}>
                {CTA_LABEL}
                <ArrowIcon />
              </a>
              <a href="/privacy" style={s.buttonSecondary}>Read privacy policy</a>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {PRIVACY_POINTS.map((point) => (
                <Pill key={point} color={point.includes('advisory') ? C.amber : C.green}>{point}</Pill>
              ))}
            </div>
          </div>
          <ProductDemo />
        </div>
      </section>

      <section style={{ padding: '28px 0', background: '#fff', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="stat-strip-grid" style={{ ...s.wrap }}>
          {[
            { value: `${QUOTAS.anonymousDaily}/day`, label: 'Anonymous launch quota per IP' },
            { value: '0', label: 'Email bodies stored by GuardScope' },
            { value: `${QUOTAS.promoProDays} days`, label: 'Pro access with launch code' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <strong style={{ color: C.ink, fontSize: 28, lineHeight: 1 }}>{item.value}</strong>
              <span style={{ color: C.body, fontSize: 13, lineHeight: 1.45 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" style={{ ...s.section, background: '#fff' }}>
        <div style={s.wrap}>
          <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '0.75fr 1fr', gap: 58, alignItems: 'start' }}>
            <div>
              <span style={s.eyebrow}>How it works</span>
              <h2 style={{ ...s.h2, margin: '12px 0 18px' }}>A narrow, review-safe extension purpose.</h2>
              <p style={{ ...s.lead, maxWidth: 490 }}>
                GuardScope is built for one job: helping Gmail users investigate suspicious emails before they act.
              </p>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {WORKFLOW.map((step, index) => (
                <div key={step.title} style={{ display: 'grid', gridTemplateColumns: '54px 1fr', gap: 18, alignItems: 'start', padding: '22px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ width: 42, height: 42, borderRadius: 8, display: 'grid', placeItems: 'center', background: '#eef8ff', color: C.cyanDark, fontWeight: 820 }}>{index + 1}</span>
                  <div>
                    <h3 style={{ color: C.ink, fontSize: 18, marginBottom: 6 }}>{step.title}</h3>
                    <p style={{ color: C.body, fontSize: 15, lineHeight: 1.7 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" style={{ ...s.section, background: C.bg }}>
        <div style={s.wrap}>
          <div style={{ maxWidth: 720, marginBottom: 42 }}>
            <span style={s.eyebrow}>Detection layers</span>
            <h2 style={{ ...s.h2, margin: '12px 0 18px' }}>Signals users can understand.</h2>
            <p style={s.lead}>
              Each scan combines AI, sender authentication, URL intelligence, and domain context into a plain-English report.
            </p>
          </div>
          <div className="layers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {LAYERS.map((layer) => (
              <div key={layer.title} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: 22, minHeight: 220 }}>
                <span style={{ width: 42, height: 42, borderRadius: 8, display: 'grid', placeItems: 'center', background: `${layer.color}13`, color: layer.color, marginBottom: 20 }}>
                  <SignalIcon color={layer.color} />
                </span>
                <h3 style={{ color: C.ink, fontSize: 17, marginBottom: 10 }}>{layer.title}</h3>
                <p style={{ color: C.body, fontSize: 14, lineHeight: 1.7 }}>{layer.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...s.section, background: '#fff' }}>
        <div className="two-col-grid" style={{ ...s.wrap, display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 44, alignItems: 'center' }}>
          <div>
            <span style={s.eyebrow}>Privacy promise</span>
            <h2 style={{ ...s.h2, margin: '12px 0 18px' }}>Built to minimize sensitive data.</h2>
            <p style={s.lead}>
              The website, extension, and Chrome Web Store disclosures should tell the same story: GuardScope analyzes user-selected Gmail messages and does not keep email content.
            </p>
          </div>
          <div style={{ ...s.panel, padding: 24 }}>
            {[
              'Email content is processed only for the scan the user starts.',
              'Email bodies, subjects, headers, sender details, and extracted URLs are not stored in GuardScope databases.',
              'Account, quota, billing, promo, and abuse-prevention metadata may be retained where needed to operate the service.',
              'Google API and Chrome extension user data use is limited to GuardScope email threat analysis.',
            ].map((point) => (
              <div key={point} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
                <CheckIcon />
                <p style={{ color: C.body, fontSize: 14, lineHeight: 1.65 }}>{point}</p>
              </div>
            ))}
            <a href="/privacy" style={{ ...s.buttonSecondary, marginTop: 20 }}>View legal details</a>
          </div>
        </div>
      </section>

      <section id="early-access" style={{ ...s.section, background: C.ink, color: '#fff' }}>
        <div className="two-col-grid" style={{ ...s.wrap, display: 'grid', gridTemplateColumns: '0.9fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <span style={{ ...s.eyebrow, color: '#78d7ff' }}>Launch access</span>
            <h2 style={{ ...s.h2, color: '#fff', margin: '12px 0 18px' }}>Claim one of the first 100 free codes.</h2>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: 'rgba(255,255,255,0.72)' }}>
              Chrome Web Store users can claim {QUOTAS.promoProDays} days of Pro access during the launch window. No credit card is required for the code.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: 24 }}>
            <form action="/api/promo/request" method="POST" style={{ display: 'grid', gap: 14 }}>
              {[
                { name: 'name', type: 'text', label: 'Full name', placeholder: 'Tony Adebayo' },
                { name: 'email', type: 'email', label: 'Email address', placeholder: 'tony@example.com' },
              ].map((field) => (
                <label key={field.name} style={{ display: 'grid', gap: 7, fontSize: 12, fontWeight: 760, color: 'rgba(255,255,255,0.72)' }}>
                  {field.label}
                  <input
                    type={field.type}
                    name={field.name}
                    required
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      border: '1px solid rgba(255,255,255,0.16)',
                      borderRadius: 8,
                      minHeight: 46,
                      padding: '0 13px',
                      color: '#fff',
                      background: 'rgba(255,255,255,0.08)',
                      font: 'inherit',
                      outline: 'none',
                    }}
                  />
                </label>
              ))}
              <button type="submit" style={{ ...s.buttonPrimary, background: '#fff', color: C.ink, marginTop: 4 }}>
                Claim a launch code
                <ArrowIcon />
              </button>
            </form>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', marginTop: 14 }}>
              We use this email only to deliver and support your promo code.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" style={{ ...s.section, background: '#fff' }}>
        <div style={s.wrap}>
          <div style={{ maxWidth: 700, marginBottom: 36 }}>
            <span style={s.eyebrow}>Pricing</span>
            <h2 style={{ ...s.h2, margin: '12px 0 18px' }}>Free to inspect. Pro access for launch users.</h2>
          </div>
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { name: 'Anonymous', price: '$0', copy: `${QUOTAS.anonymousDaily} analyses per day per IP. No account required to start.` },
              { name: 'Free account', price: '$0', copy: `${QUOTAS.signedInFreeMonthly} analyses per month per account with account-based history and settings.` },
              { name: 'Launch Pro', price: 'Free code', copy: `${QUOTAS.promoProDays} days of Pro access for early users. Paid Pro is planned after launch.` },
            ].map((plan) => (
              <div key={plan.name} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, background: plan.name === 'Launch Pro' ? '#f1f9ff' : '#fff' }}>
                <h3 style={{ fontSize: 17, color: C.ink, marginBottom: 8 }}>{plan.name}</h3>
                <div style={{ color: C.ink, fontSize: 31, fontWeight: 820, marginBottom: 12 }}>{plan.price}</div>
                <p style={{ color: C.body, fontSize: 14, lineHeight: 1.65 }}>{plan.copy}</p>
              </div>
            ))}
          </div>
          <a href="/pricing" style={{ ...s.buttonSecondary, marginTop: 24 }}>Full pricing details</a>
        </div>
      </section>

      <section id="faq" style={{ ...s.section, background: C.bg }}>
        <div className="two-col-grid" style={{ ...s.wrap, display: 'grid', gridTemplateColumns: '0.65fr 1fr', gap: 52 }}>
          <div>
            <span style={s.eyebrow}>FAQ</span>
            <h2 style={{ ...s.h2, marginTop: 12 }}>Chrome launch questions.</h2>
          </div>
          <div>
            {FAQS.map((faq) => (
              <div key={faq.q} style={{ padding: '24px 0', borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ color: C.ink, fontSize: 17, marginBottom: 8 }}>{faq.q}</h3>
                <p style={{ color: C.body, fontSize: 14.5, lineHeight: 1.72 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '86px 0', background: '#fff' }}>
        <div style={{ ...s.wrap, textAlign: 'center', maxWidth: 760 }}>
          <h2 style={s.h2}>Inspect before you trust.</h2>
          <p style={{ ...s.lead, margin: '18px auto 28px' }}>
            Install GuardScope from the Chrome Web Store and keep a launch code available for temporary Pro access.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a href={CTA_HREF} style={s.buttonPrimary}>{CTA_LABEL}</a>
            <a href="/terms" style={s.buttonSecondary}>View terms</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
