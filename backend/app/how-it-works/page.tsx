import type { Metadata, CSSProperties } from 'next'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

export const metadata: Metadata = {
  title: 'How It Works — GuardScope',
  description: 'See exactly how GuardScope scans your Gmail emails in under 8 seconds using AI, DNS authentication, and 5 threat intelligence sources.',
  alternates: { canonical: '/how-it-works' },
}

const C = {
  bg: '#f6faff', surface: '#ffffff', primary: '#001e2f',
  accent: '#39B6FF', accent2: '#006493', text: '#001e2f',
  body: '#535f74', muted: '#6e7882', border: '#bec8d2',
  success: '#1ED760', warning: '#FFB020', danger: '#FF4D4F',
}

const s = {
  wrap:    { maxWidth: 1200, margin: '0 auto', padding: '0 24px' } as CSSProperties,
  section: { padding: '96px 24px' } as CSSProperties,
  label:   { fontSize: 12, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase' as const, color: C.accent2, marginBottom: 14, display: 'block' },
  h2:      { fontSize: 'clamp(30px,4vw,50px)', fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.02em', color: C.text, marginBottom: 16 } as CSSProperties,
  h3:      { fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 8 } as CSSProperties,
  lead:    { fontSize: 18, color: C.body, lineHeight: 1.75, maxWidth: 560 } as CSSProperties,
  body:    { fontSize: 15, color: C.body, lineHeight: 1.75 } as CSSProperties,
  card:    { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, boxShadow: '0 2px 20px rgba(0,30,47,0.06)' } as CSSProperties,
  divider: { height: 1, background: C.border, opacity: 0.5 } as CSSProperties,
}

const STEPS = [
  {
    n: '01', color: C.accent2,
    title: 'Install the Chrome Extension',
    desc: 'Add GuardScope to Chrome from the Web Store. The extension injects a secure sidebar panel into Gmail using Shadow DOM isolation — no interference with your existing Gmail experience.',
    detail: 'First-run consent screen explains exactly what data is accessed. No OAuth token, no Gmail API — pure DOM scraping of the visible email.',
  },
  {
    n: '02', color: C.accent,
    title: 'Open Any Email in Gmail',
    desc: 'GuardScope automatically detects when you open an email in Gmail. The security panel slides in from the right side of your inbox, ready to analyse — it does nothing until you ask it to.',
    detail: 'The extension extracts email headers, body text, URLs, attachment signals, Gmail warnings, and return-path data from the DOM.',
  },
  {
    n: '03', color: '#7C3AED',
    title: 'Click "Analyze This Email"',
    desc: 'One click triggers all six parallel scans simultaneously. No waiting for one to finish before the next starts — they all run at once.',
    detail: 'Mercury-2 AI, DNS lookups, VirusTotal, Google Safe Browsing, PhishTank, URLhaus, SpamHaus, RDAP, header analysis, and domain similarity — all in one Promise.allSettled().',
  },
  {
    n: '04', color: C.success,
    title: 'Read Your Verdict in 8 Seconds',
    desc: 'A structured security report appears: a 0–100 risk score, a plain-English verdict, specific threat flags with evidence, and a recommended action. No jargon, no security expertise needed.',
    detail: 'Scores: 0–25 SAFE · 26–49 LOW · 50–69 MEDIUM · 70–84 HIGH · 85–100 CRITICAL',
  },
]

const PIPELINE = [
  { label: 'Mercury-2 AI', sub: 'Chain-of-thought reasoning', color: C.accent },
  { label: 'DNS: SPF/DKIM/DMARC', sub: 'Cloudflare DoH · 20-selector probe', color: '#006493' },
  { label: 'VirusTotal v3', sub: '90+ antivirus engines', color: '#4285F4' },
  { label: 'Google Safe Browsing', sub: 'Real-time URL check', color: '#34A853' },
  { label: 'PhishTank + URLhaus', sub: 'Confirmed phishing URLs', color: '#E55A2B' },
  { label: 'SpamHaus DBL', sub: 'Sender domain blocklist', color: '#EF4444' },
  { label: 'RDAP Domain Intel', sub: 'Registration date + registrar', color: '#F59E0B' },
  { label: 'Header Analysis', sub: '200+ brands + BEC patterns', color: '#7C3AED' },
  { label: 'Domain Similarity', sub: 'Typosquatting + homograph', color: '#1ED760' },
]

const SCORING = [
  { range: '0 – 25',  level: 'SAFE',     color: C.success, action: 'Safe to proceed' },
  { range: '26 – 49', level: 'LOW',      color: '#7BC67E', action: 'Proceed with awareness' },
  { range: '50 – 69', level: 'MEDIUM',   color: C.warning, action: 'Verify sender before acting' },
  { range: '70 – 84', level: 'HIGH',     color: '#FF8C00', action: 'Do not click links or reply' },
  { range: '85 – 100',level: 'CRITICAL', color: C.danger,  action: 'PHISHING DETECTED — Do not engage' },
]

export default function HowItWorksPage() {
  return (
    <>
      <Navbar activePage="/how-it-works" />

      {/* Hero */}
      <section style={{ padding: '80px 24px 64px', background: `linear-gradient(180deg, #ebf5ff 0%, #f6faff 100%)`, textAlign: 'center' }}>
        <div style={{ ...s.wrap, maxWidth: 760 }}>
          <span style={s.label}>How It Works</span>
          <h1 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.text, marginBottom: 20 }}>
            From email open to<br />
            <span style={{ background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              verdict in 8 seconds.
            </span>
          </h1>
          <p style={{ ...s.lead, margin: '0 auto' }}>
            Nine intelligence sources run in parallel the moment you click Analyze. Here's exactly what happens under the hood.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section style={{ ...s.section, background: '#fff' }}>
        <div style={{ ...s.wrap }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 860, margin: '0 auto' }}>
            {STEPS.map((step, i) => (
              <div key={step.n} style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `linear-gradient(135deg, ${C.accent2} 0%, ${C.accent} 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, color: '#fff',
                    boxShadow: `0 4px 20px rgba(57,182,255,0.3)`,
                  }}>
                    {step.n}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 2, height: 40, background: `linear-gradient(to bottom, ${C.accent}60, transparent)`, margin: '8px 0' }} />
                  )}
                </div>
                <div style={{ ...s.card, flex: 1 }}>
                  <h3 style={{ ...s.h3, fontSize: 18 }}>{step.title}</h3>
                  <p style={{ ...s.body, marginBottom: 12 }}>{step.desc}</p>
                  <div style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: C.bg, border: `1px solid ${C.border}`,
                    fontSize: 13, color: C.muted, fontStyle: 'italic',
                  }}>
                    {step.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* Parallel pipeline */}
      <section style={{ ...s.section, background: C.bg }}>
        <div style={{ ...s.wrap }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={s.label}>The Engine</span>
            <h2 style={s.h2}>9 sources. All parallel.</h2>
            <p style={{ ...s.lead, margin: '0 auto' }}>All nine intelligence sources fire simultaneously via Promise.allSettled — if one is slow or down, the others still deliver.</p>
          </div>

          <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto' }}>
            {/* Center label */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 28px', borderRadius: 14,
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent2} 100%)`,
                boxShadow: '0 4px 24px rgba(0,30,47,0.2)',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="white" strokeWidth="1.8"/><path d="M12 3v4M12 17v4M8 3v2M16 3v2M8 19v2M16 19v2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Promise.allSettled() — all 9 run simultaneously</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
              {PIPELINE.map((p) => (
                <div key={p.label} style={{
                  ...s.card, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderLeft: `3px solid ${p.color}`,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: `0 0 8px ${p.color}80` }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* Scoring */}
      <section style={{ ...s.section, background: '#fff' }}>
        <div style={{ ...s.wrap }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={s.label}>Risk Scoring</span>
            <h2 style={s.h2}>What the score means</h2>
            <p style={{ ...s.lead, margin: '0 auto' }}>Hybrid scoring: rule_score × 0.35 + mercury_score × 0.65, then hard overrides applied for known-bad signals.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 680, margin: '0 auto' }}>
            {SCORING.map((row) => (
              <div key={row.level} style={{
                ...s.card, padding: '18px 24px',
                display: 'flex', alignItems: 'center', gap: 20,
                borderLeft: `4px solid ${row.color}`,
              }}>
                <div style={{ minWidth: 72, fontSize: 22, fontWeight: 800, color: row.color }}>{row.range}</div>
                <div style={{
                  padding: '3px 12px', borderRadius: 999,
                  background: `${row.color}14`, border: `1px solid ${row.color}40`,
                  fontSize: 11, fontWeight: 700, color: row.color, letterSpacing: '0.08em',
                  flexShrink: 0,
                }}>
                  {row.level}
                </div>
                <p style={{ fontSize: 14, color: C.body, margin: 0 }}>{row.action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent2} 100%)`, textAlign: 'center' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>See it in action on your inbox</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 32 }}>Free — 5 analyses per day, no credit card needed.</p>
          <a href="/#early-access" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', fontSize: 16, fontWeight: 700, background: '#fff', color: C.primary, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            Get Early Access
          </a>
        </div>
      </section>

      <Footer />
    </>
  )
}
