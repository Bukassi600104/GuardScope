import type { Metadata } from 'next'
import { Footer } from '../components/Footer'
import { Navbar } from '../components/Navbar'

export const metadata: Metadata = {
  title: 'How It Works - GuardScope',
  description: 'How GuardScope performs user-triggered Gmail email threat analysis using AI-assisted review, sender authentication, URL intelligence, and domain checks.',
  alternates: { canonical: '/how-it-works' },
}

const C = {
  bg: '#f6faff',
  surface: '#ffffff',
  text: '#001e2f',
  body: '#535f74',
  muted: '#6e7882',
  border: '#bec8d2',
  cyan: '#0d8ec2',
  blue: '#39B6FF',
  green: '#1ED760',
  amber: '#FFB020',
  red: '#FF4D4F',
}

const steps = [
  {
    n: '01',
    title: 'Install the Chrome extension',
    desc: 'GuardScope adds a focused security panel to Gmail so users can analyze suspicious messages without leaving the inbox.',
    detail: 'The extension should request only the permissions needed for Gmail integration, local extension state, and calls to GuardScope services.',
  },
  {
    n: '02',
    title: 'Open a message in Gmail',
    desc: 'GuardScope detects the currently visible email and prepares the panel, but it does not submit email content until the user initiates a scan.',
    detail: 'The scan can include subject, body, sender, recipients visible in the message, headers available to the extension, URLs, and attachment names.',
  },
  {
    n: '03',
    title: 'Run a user-triggered scan',
    desc: 'When the user clicks analyze, GuardScope sends the needed message data to the backend for AI-assisted review and security checks.',
    detail: 'Email content is used to produce the requested report and is not stored in GuardScope databases after the response is produced.',
  },
  {
    n: '04',
    title: 'Review advisory results',
    desc: 'GuardScope returns a risk score, verdict, evidence, and suggested next steps so the user can decide whether to trust, verify, report, or avoid the email.',
    detail: 'Results are advisory. High-risk actions should still be verified through an independent channel.',
  },
]

const pipeline = [
  ['AI-assisted review', 'Urgency, impersonation, pressure, BEC patterns', C.blue],
  ['DNS authentication', 'SPF, DKIM, DMARC, MX, sender alignment', C.cyan],
  ['URL intelligence', 'Threat feeds and reputation checks', '#7C3AED'],
  ['Domain context', 'RDAP, domain age, registrar signals', C.amber],
  ['Header analysis', 'Return-path and sender anomalies', C.green],
  ['Similarity checks', 'Lookalikes, typosquatting, homograph clues', C.red],
]

const scores = [
  ['0-25', 'Low risk', C.green, 'Proceed with normal caution'],
  ['26-49', 'Watch', '#7BC67E', 'Review the sender and content carefully'],
  ['50-69', 'Medium', C.amber, 'Verify before clicking or replying'],
  ['70-84', 'High', '#FF8C00', 'Avoid links and verify externally'],
  ['85-100', 'Critical', C.red, 'Do not engage; report or delete'],
]

export default function HowItWorksPage() {
  return (
    <>
      <Navbar activePage="/how-it-works" />

      <section style={{ padding: '82px 24px 66px', background: '#fff', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 820, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cyan, marginBottom: 14 }}>How it works</p>
          <h1 style={{ fontSize: 'clamp(36px,5vw,62px)', lineHeight: 1.06, letterSpacing: '-0.02em', color: C.text, marginBottom: 18 }}>
            From Gmail message to advisory verdict.
          </h1>
          <p style={{ fontSize: 18, color: C.body, lineHeight: 1.75, maxWidth: 680, margin: '0 auto' }}>
            GuardScope processes only user-requested scans, combines multiple security signals, and returns a report designed for quick decisions.
          </p>
        </div>
      </section>

      <section style={{ padding: '72px 24px', background: C.bg }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: 18 }}>
          {steps.map((step) => (
            <article key={step.n} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr)', gap: 20, border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, padding: 24, boxShadow: '0 16px 42px rgba(0,30,47,0.05)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, display: 'grid', placeItems: 'center', background: C.text, color: '#fff', fontSize: 16, fontWeight: 820 }}>{step.n}</div>
              <div>
                <h2 style={{ fontSize: 21, color: C.text, lineHeight: 1.25, marginBottom: 8 }}>{step.title}</h2>
                <p style={{ fontSize: 15, color: C.body, lineHeight: 1.75, marginBottom: 12 }}>{step.desc}</p>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, border: `1px solid ${C.border}`, background: C.bg, borderRadius: 8, padding: '10px 12px' }}>{step.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ padding: '72px 24px', background: '#fff', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 34 }}>
            <p style={{ fontSize: 12, fontWeight: 820, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cyan, marginBottom: 12 }}>Analysis pipeline</p>
            <h2 style={{ fontSize: 'clamp(30px,4vw,48px)', color: C.text, lineHeight: 1.12, marginBottom: 12 }}>Multiple signals, one report.</h2>
            <p style={{ fontSize: 16, color: C.body, lineHeight: 1.7, maxWidth: 640, margin: '0 auto' }}>Provider results may vary, so GuardScope combines signals and presents advisory findings instead of absolute guarantees.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 14 }}>
            {pipeline.map(([label, sub, color]) => (
              <article key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', border: `1px solid ${C.border}`, borderLeft: `4px solid ${color}`, borderRadius: 8, background: C.surface, padding: 18 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 7, flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontSize: 15, color: C.text, marginBottom: 5 }}>{label}</h3>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{sub}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '72px 24px', background: C.bg }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 34 }}>
            <p style={{ fontSize: 12, fontWeight: 820, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cyan, marginBottom: 12 }}>Risk scoring</p>
            <h2 style={{ fontSize: 'clamp(30px,4vw,48px)', color: C.text, lineHeight: 1.12, marginBottom: 12 }}>Clear next steps, not panic copy.</h2>
            <p style={{ fontSize: 16, color: C.body, lineHeight: 1.7 }}>The score helps users decide what to do next, while keeping the final decision with the user.</p>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {scores.map(([range, level, color, action]) => (
              <article className="score-row-grid" key={range} style={{ display: 'grid', gridTemplateColumns: '78px 110px minmax(0,1fr)', gap: 14, alignItems: 'center', border: `1px solid ${C.border}`, borderLeft: `4px solid ${color}`, borderRadius: 8, background: C.surface, padding: '16px 18px' }}>
                <strong style={{ fontSize: 19, color }}>{range}</strong>
                <span style={{ fontSize: 11, fontWeight: 820, letterSpacing: '0.08em', textTransform: 'uppercase', color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 999, padding: '4px 10px', textAlign: 'center' }}>{level}</span>
                <span style={{ fontSize: 14, color: C.body }}>{action}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '72px 24px', background: C.text, textAlign: 'center' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(30px,4vw,44px)', color: '#fff', lineHeight: 1.15, marginBottom: 14 }}>Try the launch build.</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.74)', lineHeight: 1.7, marginBottom: 26 }}>Join the Chrome launch list and help verify GuardScope before public listing.</p>
          <a href="/#early-access" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#fff', color: C.text, padding: '13px 22px', fontSize: 15, fontWeight: 820 }}>Get early access</a>
        </div>
      </section>

      <Footer />
    </>
  )
}
