import type { Metadata, CSSProperties } from 'next'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

export const metadata: Metadata = {
  title: 'Pricing — GuardScope',
  description: 'GuardScope is free forever with 5 analyses per day. Upgrade to Pro for unlimited AI-powered phishing detection in Gmail.',
  alternates: { canonical: '/pricing' },
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
  card:    { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 32, boxShadow: '0 2px 20px rgba(0,30,47,0.06)' } as CSSProperties,
  divider: { height: 1, background: C.border, opacity: 0.5 } as CSSProperties,
}

function CheckIcon({ color = C.success }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.12"/>
      <path d="M7 12.5L10.5 16L17 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="12" cy="12" r="10" fill={C.muted} fillOpacity="0.1"/>
      <path d="M15 9L9 15M9 9L15 15" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const COMPARISON = [
  { feature: 'Email analyses per day',       free: '5 / day',    pro: 'Unlimited' },
  { feature: 'Mercury-2 AI deep scan',       free: true,         pro: true },
  { feature: 'DNS: SPF / DKIM / DMARC',     free: true,         pro: true },
  { feature: 'VirusTotal (90+ engines)',      free: true,         pro: true },
  { feature: 'Google Safe Browsing',          free: true,         pro: true },
  { feature: 'PhishTank + URLhaus',           free: true,         pro: true },
  { feature: 'SpamHaus DBL',                  free: true,         pro: true },
  { feature: 'BEC authority detection',       free: true,         pro: true },
  { feature: 'Domain similarity (80+ brands)',free: true,         pro: true },
  { feature: 'Analysis history',             free: 'Last 20',    pro: 'Last 30' },
  { feature: 'Priority analysis queue',       free: false,        pro: true },
  { feature: 'Extended history (cloud)',      free: false,        pro: true },
]

const FAQS = [
  { q: 'When will payments go live?', a: 'Payments are currently suspended during our beta period. Early Access Pro users receive free unlimited access for 30 days. We\'ll notify you before paid billing begins.' },
  { q: 'Will my promo code expire?', a: 'Promo codes grant 30 days of Pro access from the moment you redeem them. They don\'t expire before you use them.' },
  { q: 'Is there a team plan?', a: 'A Team tier ($14.99/mo) is planned for Phase 6, including shared history and team admin dashboard. Sign up for early access to be notified first.' },
  { q: 'What happens when my 5 free analyses run out?', a: 'The counter resets every day at midnight UTC. You always get 5 free analyses per day — even without an account.' },
  { q: 'Do I need a credit card to try Pro?', a: 'No. Our Early Access promo codes give you 30 days of Pro access with zero payment required.' },
]

export default function PricingPage() {
  return (
    <>
      <Navbar activePage="/pricing" />

      {/* Hero */}
      <section style={{ padding: '80px 24px 64px', background: `linear-gradient(180deg, #ebf5ff 0%, #f6faff 100%)`, textAlign: 'center' }}>
        <div style={{ ...s.wrap, maxWidth: 680 }}>
          <span style={s.label}>Pricing</span>
          <h1 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.text, marginBottom: 20 }}>
            Simple. Transparent.<br />
            <span style={{ background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Free to start.
            </span>
          </h1>
          <p style={{ ...s.lead, margin: '0 auto' }}>
            5 analyses per day, forever free. No credit card. No account required to get started.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section style={{ ...s.section, background: '#fff' }}>
        <div style={{ ...s.wrap }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 820, margin: '0 auto' }}>

            {/* Free */}
            <div style={s.card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Free Forever</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 56, fontWeight: 800, color: C.text, lineHeight: 1 }}>$0</span>
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 32 }}>Always free · No card needed</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {['5 email analyses per day', 'Full Mercury-2 AI analysis', 'All 6 security layers', 'VirusTotal + Safe Browsing + PhishTank + URLhaus', 'Local history (last 20)'].map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <CheckIcon color={C.accent} />
                    <span style={{ fontSize: 14, color: C.body }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="/#early-access" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '13px 24px', fontSize: 15, fontWeight: 600,
                background: C.bg, color: C.text, borderRadius: 12,
                border: `1.5px solid ${C.border}`, width: '100%',
              }}>
                Get Started Free
              </a>
            </div>

            {/* Pro */}
            <div style={{ ...s.card, borderTop: `3px solid ${C.accent}`, position: 'relative' as const, boxShadow: '0 8px 48px rgba(57,182,255,0.12)' }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 999, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                EARLY ACCESS — 100 SPOTS
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.accent2, marginBottom: 12 }}>Pro</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 56, fontWeight: 800, color: C.text, lineHeight: 1 }}>Free</span>
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>30 days with promo code</div>
              <div style={{
                fontSize: 12, color: C.accent2, marginBottom: 28,
                background: 'rgba(57,182,255,0.08)',
                padding: '5px 12px', borderRadius: 8, display: 'inline-block',
              }}>
                $4.99/mo after launch · ₦7,500/mo (NGN)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {['Unlimited email analyses — no cap', 'Full Mercury-2 AI analysis', 'All 6 security layers', 'Priority analysis queue', 'Extended cloud history (30 entries)'].map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <CheckIcon color={C.accent} />
                    <span style={{ fontSize: 14, color: C.body }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="/#early-access" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 24px', fontSize: 15, fontWeight: 700,
                background: C.primary, color: '#fff', borderRadius: 12,
                width: '100%', boxShadow: '0 4px 20px rgba(0,30,47,0.2)',
              }}>
                Get Your Promo Code
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* Comparison table */}
      <section style={{ ...s.section, background: C.bg }}>
        <div style={{ ...s.wrap }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={s.label}>Compare Plans</span>
            <h2 style={s.h2}>Full feature comparison</h2>
          </div>
          <div style={{ maxWidth: 760, margin: '0 auto', borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 2px 20px rgba(0,30,47,0.06)' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', background: C.primary }}>
              <div style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Feature</div>
              <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>Free</div>
              <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 14, fontWeight: 700, color: C.accent }}>Pro</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.feature} style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 140px',
                background: i % 2 === 0 ? '#fff' : C.bg,
                borderTop: `1px solid ${C.border}`,
              }}>
                <div style={{ padding: '14px 24px', fontSize: 14, color: C.body }}>{row.feature}</div>
                <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {typeof row.free === 'boolean'
                    ? (row.free ? <CheckIcon color={C.success} /> : <XIcon />)
                    : <span style={{ fontSize: 13, fontWeight: 600, color: C.body }}>{row.free}</span>}
                </div>
                <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {typeof row.pro === 'boolean'
                    ? (row.pro ? <CheckIcon color={C.accent} /> : <XIcon />)
                    : <span style={{ fontSize: 13, fontWeight: 600, color: C.accent2 }}>{row.pro}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* FAQ */}
      <section id="faq" style={{ ...s.section, background: '#fff' }}>
        <div style={{ ...s.wrap }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={s.label}>FAQ</span>
            <h2 style={s.h2}>Pricing questions answered</h2>
          </div>
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            {FAQS.map((faq, i) => (
              <div key={faq.q} style={{ borderBottom: `1px solid ${C.border}`, padding: '24px 0' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>{faq.q}</h3>
                <p style={{ ...s.body, fontSize: 14, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent2} 100%)`, textAlign: 'center' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Start free today.</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 32 }}>No credit card. No account required. 5 free analyses per day, always.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/#early-access" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', fontSize: 16, fontWeight: 700, background: '#fff', color: C.primary, borderRadius: 12 }}>
              Get Early Access
            </a>
            <a href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', fontSize: 16, fontWeight: 600, background: 'transparent', color: '#fff', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.4)' }}>
              Sign In
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
