import type { Metadata, CSSProperties } from 'next'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

export const metadata: Metadata = {
  title: 'Features — GuardScope',
  description: 'Every layer of GuardScope\'s AI-powered phishing detection engine — Mercury-2, DNS auth, VirusTotal, domain age, BEC detection, and more.',
  alternates: { canonical: '/features' },
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

const LAYERS = [
  {
    num: '01', color: '#39B6FF', title: 'Mercury-2 AI Deep Scan',
    desc: 'A reasoning AI writes a full chain-of-thought before reaching its verdict. It detects urgency manipulation, impersonation, social engineering, and psychological pressure tactics. Temperature locked to 0 for 100% deterministic results.',
    bullets: ['Chain-of-thought reasoning per email', 'Detects 9 threat modules including BEC', 'Temperature=0 — zero hallucination risk', '6,000 character body analysis window'],
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="#39B6FF" strokeWidth="1.8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="#39B6FF" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  {
    num: '02', color: '#006493', title: 'DNS Authentication (SPF / DKIM / DMARC)',
    desc: 'All three email authentication protocols verified against Cloudflare DNS over HTTPS. A 20-selector DKIM probe catches misconfigured selectors that basic tools miss. Results framed with full semantic accuracy.',
    bullets: ['SPF alignment — is the sender authorised?', '20-selector DKIM probe via Cloudflare DoH', 'DMARC policy enforcement check', 'MX record validation'],
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#006493" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#006493" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  {
    num: '03', color: '#7C3AED', title: 'Link Safety Scan — 5 Sources in Parallel',
    desc: 'Every URL in the email is extracted — including plain-text URLs not in anchor tags — and checked against five threat intelligence databases simultaneously. Results arrive in seconds, not minutes.',
    bullets: ['VirusTotal v3 — 90+ antivirus engines', 'Google Safe Browsing v4 — real-time', 'PhishTank — confirmed phishing database', 'URLhaus — live malware URL feed', 'SpamHaus DBL — sender domain blocklist'],
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    num: '04', color: '#F59E0B', title: 'Domain Age & Registrar Intel',
    desc: "Attackers register lookalike domains days or hours before a campaign. RDAP protocol lookup reveals registration date, registrar, and risk classification — catching brand-new threat infrastructure that reputation databases haven't catalogued yet.",
    bullets: ['RDAP protocol — no API key needed', 'Domain age in days/hours', 'Registrar risk classification', 'Instant flag for domains < 30 days old'],
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#F59E0B" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="15" r="2" fill="#F59E0B" fillOpacity="0.5"/></svg>,
  },
  {
    num: '05', color: '#1ED760', title: 'BEC & Authority Impersonation Detection',
    desc: '200+ brand list and 45 executive authority patterns catch Business Email Compromise — CFO wire transfer requests, fake lawyer threats, government impersonation, and C-suite fraud. Combined with freeProvider detection to catch Gmail-based BEC.',
    bullets: ['200+ brand impersonation patterns', '45 BEC authority roles (executive/legal/govt)', 'Display name spoofing detection', 'Free email provider + authority = instant escalation'],
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="#1ED760" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  },
  {
    num: '06', color: '#FF4D4F', title: 'Nigeria & Africa Threat Context',
    desc: 'The engine is specifically calibrated for the African threat landscape — EFCC/CBN fraud patterns, BVN phishing, advance-fee 419 scams, and Nigerian fintech impersonation attacks. Plus NDPR 2023 and GDPR compliance built in.',
    bullets: ['EFCC/CBN impersonation patterns', 'BVN phishing detection', 'Advance-fee (419) content classifier', 'Côte d\'Ivoire / Senegal threat patterns', 'FR + EN bilingual analysis'],
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#FF4D4F" strokeWidth="1.8"/><path d="M12 8v4l3 3" stroke="#FF4D4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
]

const SECURITY = [
  { title: 'Zero Email Storage', desc: 'Email body, headers, and URLs are never persisted. analysis_history stores only the sender domain — never content.' },
  { title: 'Zero Secrets in Extension', desc: 'All API calls go through the backend. The Chrome extension contains no API keys, tokens, or secrets of any kind.' },
  { title: 'Rate Limiting', desc: 'Upstash Redis rate limiting: 10/min + 50/hr for authenticated users. 5/min + 5/day for anonymous users. Hard quotas enforced server-side.' },
  { title: 'Prompt Injection Defense', desc: '9 regex patterns strip prompt injection attempts before any text reaches Mercury-2. XML tag wrapping adds another layer of separation.' },
  { title: 'JWT Auth on All Endpoints', desc: 'Every authenticated endpoint validates JWT server-side. The promo validate endpoint additionally checks that JWT email matches request email.' },
  { title: 'Supabase RLS', desc: 'Row-Level Security on all Supabase tables. Users can only read their own data. Tier escalation and quota manipulation vectors removed in migration 004.' },
]

function CheckIcon({ color = C.success }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.12"/>
      <path d="M7 12.5L10.5 16L17 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function FeaturesPage() {
  return (
    <>
      <Navbar activePage="/features" />

      {/* Hero */}
      <section style={{ padding: '80px 24px 64px', background: `linear-gradient(180deg, #ebf5ff 0%, #f6faff 100%)`, textAlign: 'center' }}>
        <div style={{ ...s.wrap, maxWidth: 760 }}>
          <span style={s.label}>Features</span>
          <h1 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.025em', color: C.text, marginBottom: 20 }}>
            6 layers of protection.<br />
            <span style={{ background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Every email. Every time.
            </span>
          </h1>
          <p style={{ ...s.lead, margin: '0 auto 36px' }}>
            GuardScope runs all six layers in parallel — you get a complete intelligence report in under 8 seconds.
          </p>
          <a href="/#early-access" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', fontSize: 15, fontWeight: 700,
            background: C.primary, color: '#fff', borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,30,47,0.2)',
          }}>
            Get Early Access — Free
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
      </section>

      {/* Feature layers */}
      <section style={{ ...s.section, background: '#fff' }}>
        <div style={{ ...s.wrap }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {LAYERS.map((layer) => (
              <div key={layer.num} style={{
                ...s.card,
                borderLeft: `4px solid ${layer.color}`,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 40,
                alignItems: 'start',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                      background: `${layer.color}14`, border: `1px solid ${layer.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {layer.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: layer.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Layer {layer.num}</div>
                      <h3 style={{ ...s.h3, marginBottom: 0 }}>{layer.title}</h3>
                    </div>
                  </div>
                  <p style={{ ...s.body, fontSize: 15 }}>{layer.desc}</p>
                </div>
                <div style={{ paddingTop: 4 }}>
                  {layer.bullets.map((b) => (
                    <div key={b} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                      <CheckIcon color={layer.color} />
                      <span style={{ fontSize: 14, color: C.body }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* Security architecture */}
      <section id="security" style={{ ...s.section, background: C.bg }}>
        <div style={{ ...s.wrap }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={s.label}>Security Architecture</span>
            <h2 style={s.h2}>Built secure from the ground up</h2>
            <p style={{ ...s.lead, margin: '0 auto' }}>Six layers of security architecture protecting both your data and the platform itself.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {SECURITY.map((item) => (
              <div key={item.title} style={s.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.success, boxShadow: `0 0 6px ${C.success}` }} />
                  <h3 style={{ ...s.h3, fontSize: 15, marginBottom: 0 }}>{item.title}</h3>
                </div>
                <p style={{ ...s.body, fontSize: 13 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent2} 100%)`, textAlign: 'center' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>Ready to guard your inbox?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 32 }}>Start free — 5 analyses per day, no credit card needed.</p>
          <a href="/#early-access" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', fontSize: 16, fontWeight: 700, background: '#fff', color: C.primary, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            Get Early Access
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
      </section>

      <Footer />
    </>
  )
}
