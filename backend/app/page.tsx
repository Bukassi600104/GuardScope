import type { Metadata, CSSProperties } from 'next'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guardscope.app'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/', type: 'website' },
}

// ── Design tokens ──────────────────────────────────────────────
const C = {
  bg:      '#f6faff',
  bgHero:  '#ebf5ff',
  surface: '#ffffff',
  primary: '#001e2f',
  accent:  '#39B6FF',
  accent2: '#006493',
  text:    '#001e2f',
  body:    '#535f74',
  muted:   '#6e7882',
  border:  '#bec8d2',
  success: '#1ED760',
  warning: '#FFB020',
  danger:  '#FF4D4F',
}

const s = {
  wrap:    { maxWidth: 1200, margin: '0 auto', padding: '0 24px' } as CSSProperties,
  section: { padding: '96px 24px' } as CSSProperties,
  label:   { fontSize: 12, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase' as const, color: C.accent2, marginBottom: 14, display: 'block' },
  h1:      { fontSize: 'clamp(44px,6vw,76px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.03em', color: C.text, marginBottom: 24 } as CSSProperties,
  h2:      { fontSize: 'clamp(30px,4vw,50px)', fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.02em', color: C.text, marginBottom: 16 } as CSSProperties,
  h3:      { fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 8 } as CSSProperties,
  lead:    { fontSize: 18, color: C.body, lineHeight: 1.75, maxWidth: 560 } as CSSProperties,
  body:    { fontSize: 15, color: C.body, lineHeight: 1.75 } as CSSProperties,

  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    padding: 28,
    boxShadow: '0 2px 20px rgba(0,30,47,0.06)',
  } as CSSProperties,

  cardGlass: {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    padding: 28,
    boxShadow: '0 4px 32px rgba(0,30,47,0.08)',
  } as CSSProperties,

  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '13px 28px', fontSize: 15, fontWeight: 700,
    background: C.primary, color: '#fff', borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,30,47,0.2)',
    transition: 'all .2s',
  } as CSSProperties,

  btnOutline: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '13px 28px', fontSize: 15, fontWeight: 600,
    background: '#fff', color: C.text, borderRadius: 12,
    border: `1.5px solid ${C.border}`,
    transition: 'all .2s',
  } as CSSProperties,

  divider: { height: 1, background: C.border, opacity: 0.5 } as CSSProperties,
}

// ── Floating threat icon bubbles ────────────────────────────────
function FloatingBubble({ style, icon, color, anim }: {
  style: CSSProperties
  icon: React.ReactNode
  color: string
  anim: string
}) {
  return (
    <div style={{
      position: 'absolute',
      width: 64, height: 64,
      borderRadius: 18,
      background: '#fff',
      boxShadow: `0 8px 32px rgba(0,30,47,0.12), 0 0 0 1px rgba(0,30,47,0.06)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: `${anim} 4s ease-in-out infinite`,
      ...style,
    }}>
      <div style={{ color, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
    </div>
  )
}

// ── Extension mock ──────────────────────────────────────────────
function ExtensionMock() {
  return (
    <div style={{
      width: '100%', maxWidth: 360,
      background: '#fff',
      borderRadius: 20,
      boxShadow: '0 24px 80px rgba(0,30,47,0.16)',
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      fontFamily: 'Sora, sans-serif',
    }}>
      {/* Header */}
      <div style={{ background: '#001e2f', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.danger, boxShadow: `0 0 8px ${C.danger}` }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>CRITICAL THREAT</span>
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, color: C.danger }}>88</span>
      </div>

      <div style={{ padding: 18 }}>
        {/* Score ring */}
        <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            width: 90, height: 90, borderRadius: '50%',
            background: 'rgba(255,77,79,0.08)',
            border: `3px solid ${C.danger}`,
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: C.danger }}>88</span>
            <span style={{ fontSize: 9, color: C.danger, fontWeight: 600, letterSpacing: '0.08em' }}>RISK</span>
          </div>
        </div>

        <p style={{ fontSize: 12, color: C.body, lineHeight: 1.6, marginBottom: 14 }}>
          This email impersonates <strong style={{ color: C.text }}>GTBank</strong> using a lookalike domain registered <strong style={{ color: C.danger }}>3 days ago</strong>.
        </p>

        {/* Flags */}
        {[
          { label: 'SPF: Failed — sender not authorized', color: C.danger },
          { label: 'Domain registered 3 days ago', color: C.danger },
          { label: 'VirusTotal: 7/90 engines flagged', color: C.warning },
          { label: 'PhishTank: confirmed phishing URL', color: C.danger },
        ].map((f) => (
          <div key={f.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="10" fill={f.color} fillOpacity="0.12"/>
              <path d="M15 9L9 15M9 9L15 15" stroke={f.color} strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 11, color: C.body }}>{f.label}</span>
          </div>
        ))}

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: C.muted }}>Mercury-2 AI · 5.8s</span>
          <span style={{ fontSize: 10, color: C.muted }}>GuardScope v3</span>
        </div>
      </div>
    </div>
  )
}

// ── Check / X icons ─────────────────────────────────────────────
function Check({ color = C.success }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.12"/>
      <path d="M7 12.5L10.5 16L17 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Page data ───────────────────────────────────────────────────
const STATS = [
  { stat: '91%',    desc: 'of cyberattacks begin with a phishing email' },
  { stat: '$17.7K', desc: 'lost every minute to phishing globally' },
  { stat: '3.4B',   desc: 'phishing emails sent every single day' },
  { stat: '8s',     desc: 'for GuardScope to run a full deep scan' },
]

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="#39B6FF" strokeWidth="1.8"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="#39B6FF" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    color: '#39B6FF',
    title: 'Mercury-2 AI Engine',
    desc: 'A reasoning AI writes a chain-of-thought before reaching its verdict — detecting urgency manipulation, impersonation, and social engineering.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#006493" strokeWidth="1.8"/>
        <path d="M7 11V7a5 5 0 0110 0v4" stroke="#006493" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    color: '#006493',
    title: 'DNS Authentication',
    desc: 'SPF, DKIM, and DMARC verified against Cloudflare DNS using a 20-selector DKIM probe — confirms the sender is exactly who they claim.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#7C3AED',
    title: 'Link Safety Scan',
    desc: 'Every URL checked against VirusTotal (90+ engines), Google Safe Browsing, PhishTank, and URLhaus — all in parallel, in seconds.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#F59E0B" strokeWidth="1.8"/>
        <path d="M3 9h18M8 2v4M16 2v4" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="15" r="2" fill="#F59E0B" fillOpacity="0.5"/>
      </svg>
    ),
    color: '#F59E0B',
    title: 'Domain Age Intel',
    desc: 'Domains registered days before an attack are a classic red flag. RDAP lookup catches brand-new threat infrastructure instantly.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="#1ED760" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#1ED760',
    title: 'BEC & Impersonation',
    desc: '200+ brand list + 45 executive authority patterns detect Business Email Compromise — CFO wire fraud, legal threats, government impersonation.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#FF4D4F" strokeWidth="1.8"/>
        <path d="M12 8v4l3 3" stroke="#FF4D4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#FF4D4F',
    title: 'Nigeria-Aware Engine',
    desc: 'Trained on EFCC/CBN fraud patterns, BVN phishing, advance-fee scams, and fintech impersonation attacks. Built for the African threat landscape.',
  },
]

const STEPS = [
  { n: '01', title: 'Open any email in Gmail', desc: 'GuardScope detects the open email and a security panel slides in from the right side of your inbox automatically.' },
  { n: '02', title: 'Click "Analyze This Email"', desc: 'Six parallel scans run — DNS auth, domain age, all links, PhishTank, SpamHaus, and Mercury-2 AI — completing in under 8 seconds.' },
  { n: '03', title: 'Read your verdict', desc: 'A clear 0–100 risk score, plain-English verdict, and specific flags explaining exactly what is suspicious — and why.' },
]

const PARTNERS = [
  { name: 'VirusTotal',         sub: '90+ scan engines',   color: '#4285F4' },
  { name: 'Google Safe Browsing', sub: 'Real-time URLs',   color: '#34A853' },
  { name: 'Cloudflare DoH',     sub: 'DNS over HTTPS',     color: '#F6821F' },
  { name: 'PhishTank',          sub: 'Phishing database',  color: '#E55A2B' },
  { name: 'URLhaus',            sub: 'Malware URLs',       color: '#A855F7' },
  { name: 'SpamHaus DBL',       sub: 'Domain blocklist',   color: '#EF4444' },
  { name: 'Mercury-2 AI',       sub: 'InceptionLabs',      color: '#39B6FF' },
]

const FAQS = [
  { q: 'Does GuardScope read or store my emails?', a: 'Never. Email content is sent to our backend for analysis and discarded immediately after. We never log or store your email body, subject, or sender details.' },
  { q: 'Does it work with all Gmail accounts?', a: 'Yes — personal Gmail and Google Workspace accounts. It works anywhere you access Gmail in Chrome.' },
  { q: 'What if I\'m not a technical person?', a: 'That\'s exactly who we designed it for. Everything is explained in plain English — no cybersecurity knowledge required.' },
  { q: 'Is there a free tier?', a: 'Yes — 5 free email analyses per day, forever. No credit card required to get started.' },
  { q: 'Which AI model powers the analysis?', a: 'Mercury-2 by InceptionLabs — a reasoning model that writes a chain-of-thought before reaching its verdict.' },
  { q: 'Is my data private?', a: 'Completely. We comply with NDPR 2023 (Nigeria) and GDPR, using Supabase EU-hosted infrastructure. Read our Privacy Policy for full details.' },
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

// ── Page ────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar activePage="/" />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(180deg, ${C.bgHero} 0%, ${C.bg} 60%, #fff 100%)`,
        padding: '100px 24px 80px',
      }}>
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(57,182,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(57,182,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        {/* Floating threat icons */}
        <FloatingBubble
          style={{ top: '18%', left: '8%' }}
          anim="float1"
          color={C.danger}
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="13" rx="4.5" ry="5.5"/><circle cx="12" cy="6.5" r="2.8"/><line x1="10.5" y1="4.2" x2="8" y2="1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="13.5" y1="4.2" x2="16" y2="1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}
        />
        <FloatingBubble
          style={{ top: '10%', right: '10%' }}
          anim="float2"
          color={C.success}
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round"/></svg>}
        />
        <FloatingBubble
          style={{ top: '45%', left: '4%' }}
          anim="float3"
          color={C.warning}
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.12" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>}
        />
        <FloatingBubble
          style={{ top: '30%', right: '6%' }}
          anim="float4"
          color={C.accent}
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        />
        <FloatingBubble
          style={{ bottom: '20%', right: '9%' }}
          anim="float1"
          color="#7C3AED"
          icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
        />

        {/* Center content */}
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999,
            background: 'rgba(57,182,255,0.1)',
            border: '1px solid rgba(57,182,255,0.25)',
            marginBottom: 32,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="#39B6FF" strokeWidth="2" fill="#39B6FF" fillOpacity="0.2" strokeLinejoin="round"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.accent2, letterSpacing: '0.02em' }}>AI-Powered · Mercury-2 Engine · Free to Start</span>
          </div>

          <h1 style={s.h1}>
            Scan Every Email.<br />
            <span style={{
              background: `linear-gradient(135deg, ${C.accent2} 0%, ${C.accent} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Trust Nothing Blindly.
            </span>
          </h1>

          <p style={{ ...s.lead, margin: '0 auto 44px', fontSize: 19 }}>
            GuardScope sits inside Gmail and scans every email with AI, DNS authentication,
            and 7 real-time threat intelligence sources — in under 8 seconds.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <a href="#early-access" style={{ ...s.btnPrimary, fontSize: 16, padding: '15px 32px' }}>
              Get Early Access — Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <a href="/how-it-works" style={{ ...s.btnOutline, fontSize: 16, padding: '15px 32px' }}>
              See How It Works
            </a>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>Works with Gmail personal & Google Workspace · Chrome browser only</p>

          {/* Extension mock */}
          <div style={{ marginTop: 64, display: 'flex', justifyContent: 'center' }}>
            <ExtensionMock />
          </div>
        </div>
      </section>

      {/* ── TRUST / PARTNERS ── */}
      <section style={{ padding: '56px 24px', background: '#fff', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ ...s.wrap, textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 28 }}>
            Powered by enterprise-grade threat intelligence
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            {PARTNERS.map((p) => (
              <div key={p.name} style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                padding: '12px 22px', borderRadius: 14,
                background: C.bg,
                border: `1px solid ${C.border}`,
                minWidth: 120,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, marginBottom: 8, boxShadow: `0 0 8px ${p.color}80` }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.name}</span>
                <span style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{p.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ ...s.section, background: C.bg }}>
        <div style={{ ...s.wrap }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={s.label}>The Threat</span>
            <h2 style={s.h2}>Email phishing costs Africa <span style={{ color: C.danger }}>billions</span> every year</h2>
            <p style={{ ...s.lead, margin: '0 auto' }}>Attacks are sophisticated, fast-moving, and specifically designed to fool people without security training.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {STATS.map((item) => (
              <div key={item.stat} style={{ ...s.card, textAlign: 'center' }}>
                <div style={{
                  fontSize: 40, fontWeight: 800, marginBottom: 10,
                  background: `linear-gradient(135deg, ${C.accent2} 0%, ${C.accent} 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{item.stat}</div>
                <p style={{ fontSize: 14, color: C.body }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── FEATURES ── */}
      <section id="features" style={{ ...s.section, background: '#fff' }}>
        <div style={{ ...s.wrap }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={s.label}>Protection layers</span>
            <h2 style={s.h2}>6 layers of analysis on every email</h2>
            <p style={{ ...s.lead, margin: '0 auto' }}>Each scan runs in parallel — you get every layer of intelligence in a single 8-second result.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: `${f.color}14`,
                  border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.icon}
                </div>
                <div>
                  <h3 style={s.h3}>{f.title}</h3>
                  <p style={{ ...s.body, fontSize: 14 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href="/features" style={{ ...s.btnOutline }}>
              Explore All Features
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ ...s.section, background: C.bg }}>
        <div style={{ ...s.wrap }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span style={s.label}>How it works</span>
            <h2 style={s.h2}>3 steps. 8 seconds. Full verdict.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {STEPS.map((step, i) => (
              <div key={step.n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: `linear-gradient(135deg, ${C.accent2} 0%, ${C.accent} 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: '#fff',
                  boxShadow: `0 4px 20px rgba(57,182,255,0.3)`,
                }}>
                  {step.n}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ ...s.h3, fontSize: 16 }}>{step.title}</h3>
                  <p style={{ ...s.body, fontSize: 14 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <a href="/how-it-works" style={{ ...s.btnOutline }}>
              Full Walkthrough
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── PRIVACY ── */}
      <section style={{ ...s.section, background: '#fff' }}>
        <div style={{ ...s.wrap }}>
          <div style={{ ...s.card, maxWidth: 800, margin: '0 auto', borderTop: `3px solid ${C.success}`, position: 'relative' as const }}>
            <span style={{ ...s.label, color: C.success }}>Privacy First</span>
            <h2 style={{ ...s.h2, fontSize: 28, marginBottom: 28 }}>Your email content stays private. Always.</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {['Email body discarded immediately after analysis', 'Zero email content stored — ever', 'NDPR 2023 & GDPR compliant', 'Supabase EU infrastructure'].map((text) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Check color={C.success} />
                  <span style={{ fontSize: 14, color: C.body }}>{text}</span>
                </div>
              ))}
              {['Your contacts or address book', 'Your Gmail password or OAuth token', 'Browsing history outside Gmail', 'Email content in any database'].map((text) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <circle cx="12" cy="12" r="10" fill={C.danger} fillOpacity="0.1"/>
                    <path d="M15 9L9 15M9 9L15 15" stroke={C.danger} strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: 14, color: C.body }}>{text}</span>
                </div>
              ))}
            </div>
            <a href="/privacy" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 24, fontSize: 13, color: C.success, fontWeight: 600 }}>
              Read our full Privacy Policy →
            </a>
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── EARLY ACCESS / PROMO ── */}
      <section id="early-access" style={{
        padding: '96px 24px',
        background: `linear-gradient(135deg, ${C.bgHero} 0%, #fff 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(57,182,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(57,182,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
        <div style={{ ...s.wrap, maxWidth: 600, textAlign: 'center', position: 'relative' as const }}>
          <span style={s.label}>Limited Beta — 100 Spots</span>
          <h2 style={s.h2}>
            Get 30 Days of Pro Access,{' '}
            <span style={{ background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Free
            </span>
          </h2>
          <p style={{ ...s.lead, margin: '0 auto 48px', fontSize: 16 }}>
            We're giving 100 users full Pro access for 30 days — no credit card, no commitment. Fill out the form and we'll email your personal promo code within minutes.
          </p>

          <div style={{ ...s.cardGlass, textAlign: 'left' as const, maxWidth: 480, margin: '0 auto' }}>
            <h3 style={{ ...s.h3, fontSize: 16, marginBottom: 4 }}>Request your promo code</h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>We'll email your code. Valid for 30 days.</p>
            <form action="/api/promo/request" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { name: 'name', type: 'text', label: 'FULL NAME', placeholder: 'Tony Adebayo' },
                { name: 'email', type: 'email', label: 'EMAIL ADDRESS', placeholder: 'tony@example.com' },
              ].map((field) => (
                <div key={field.name}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type} name={field.name} required placeholder={field.placeholder}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: C.bg, border: `1px solid ${C.border}`,
                      borderRadius: 10, color: C.text, fontSize: 14,
                      fontFamily: 'Sora, sans-serif', outline: 'none',
                    }}
                  />
                </div>
              ))}
              <button type="submit" style={{ ...s.btnPrimary, justifyContent: 'center', width: '100%', marginTop: 4 }}>
                Send My Promo Code
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </form>
            <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 14 }}>No spam. No credit card. Code arrives within 5 minutes.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 36, flexWrap: 'wrap' }}>
            {[{ val: '100', label: 'Pro Spots' }, { val: '30', label: 'Days Free' }, { val: '5/day', label: 'Free Forever' }].map((item) => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.accent2 }}>{item.val}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── PRICING TEASER ── */}
      <section id="pricing" style={{ ...s.section, background: '#fff' }}>
        <div style={{ ...s.wrap }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={s.label}>Pricing</span>
            <h2 style={s.h2}>Start free, always</h2>
            <p style={{ ...s.lead, margin: '0 auto' }}>5 analyses per day, free forever. Upgrade to Pro for unlimited access.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 760, margin: '0 auto' }}>
            {/* Free */}
            <div style={s.card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 10 }}>Free Forever</div>
              <div style={{ fontSize: 52, fontWeight: 800, color: C.text, marginBottom: 6, lineHeight: 1 }}>$0</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>Always free · No card needed</div>
              {['5 email analyses per day', 'Full Mercury-2 AI analysis', 'All 6 security modules', 'VirusTotal + Safe Browsing + PhishTank', 'Local history (last 20)'].map((f) => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                  <Check color={C.accent} />
                  <span style={{ fontSize: 14, color: C.body }}>{f}</span>
                </div>
              ))}
              <a href="#early-access" style={{ ...s.btnOutline, justifyContent: 'center', width: '100%', marginTop: 8, textAlign: 'center' as const }}>
                Get Started Free
              </a>
            </div>

            {/* Pro */}
            <div style={{ ...s.cardGlass, position: 'relative' as const, borderTop: `3px solid ${C.accent}` }}>
              <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 999, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                EARLY ACCESS — LIMITED SPOTS
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.accent2, marginBottom: 10 }}>Pro · Beta</div>
              <div style={{ fontSize: 52, fontWeight: 800, color: C.text, marginBottom: 6, lineHeight: 1 }}>Free</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>30 days with promo code</div>
              <div style={{ fontSize: 12, color: C.accent2, marginBottom: 24, background: 'rgba(57,182,255,0.08)', padding: '5px 12px', borderRadius: 8, display: 'inline-block' }}>
                $4.99/mo after launch
              </div>
              {['Unlimited email analyses', 'Full Mercury-2 AI analysis', 'All 6 security modules', 'Priority analysis queue', 'Extended history (30 entries)'].map((f) => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                  <Check color={C.accent} />
                  <span style={{ fontSize: 14, color: C.body }}>{f}</span>
                </div>
              ))}
              <a href="#early-access" style={{ ...s.btnPrimary, justifyContent: 'center', width: '100%', marginTop: 8, textAlign: 'center' as const }}>
                Get Your Promo Code
              </a>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <a href="/pricing" style={{ fontSize: 14, color: C.accent2, fontWeight: 600 }}>View full pricing & feature comparison →</a>
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── TESTIMONIALS ── */}
      <section style={{ ...s.section, background: C.bg }}>
        <div style={{ ...s.wrap }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={s.label}>Why it matters</span>
            <h2 style={s.h2}>Built for the threats targeting <span style={{ color: C.accent2 }}>your inbox right now</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { quote: '"I almost clicked a link pretending to be my bank. GuardScope flagged it CRITICAL in 6 seconds — the domain was registered 2 days prior."', name: 'Early Beta User', flag: '🇳🇬', country: 'Nigeria' },
              { quote: '"The AI doesn\'t just say suspicious — it explains exactly what\'s wrong. SPF failed, domain lookalike, urgency manipulation. That context is everything."', name: 'Early Beta User', flag: '🇬🇧', country: 'United Kingdom' },
              { quote: '"Our team receives dozens of BEC attempts per week. GuardScope running on every email my staff opens completely changes our risk posture."', name: 'Early Beta User', flag: '🇰🇪', country: 'Kenya' },
            ].map((t, i) => (
              <div key={i} style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={C.warning}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>
                  ))}
                </div>
                <p style={{ fontSize: 14, color: C.body, lineHeight: 1.75, fontStyle: 'italic', flex: 1 }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{t.flag}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{t.country}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── FAQ ── */}
      <section id="faq" style={{ ...s.section, background: '#fff' }}>
        <div style={{ ...s.wrap }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={s.label}>FAQ</span>
            <h2 style={s.h2}>Common questions</h2>
          </div>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FAQS.map((faq, i) => (
              <div key={faq.q} style={{
                borderBottom: `1px solid ${C.border}`,
                padding: '28px 0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 10, lineHeight: 1.4 }}>{faq.q}</h3>
                    <p style={{ ...s.body, fontSize: 14, margin: 0 }}>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <a href="/features#faq" style={{ fontSize: 14, color: C.accent2, fontWeight: 600 }}>See more questions →</a>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        padding: '100px 24px',
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent2} 100%)`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ ...s.h2, color: '#fff', marginBottom: 18, fontSize: 'clamp(28px,4vw,46px)' as any }}>
            Inspect before you trust.
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, marginBottom: 40 }}>
            Install GuardScope free today. No account required to get started.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#early-access" style={{
              ...s.btnPrimary,
              background: '#fff',
              color: C.primary,
              fontSize: 16, padding: '15px 32px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}>
              Claim Early Access
            </a>
            <a href="/signup" style={{
              ...s.btnOutline,
              background: 'transparent',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.4)',
              fontSize: 16, padding: '15px 32px',
            }}>
              Sign In
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
