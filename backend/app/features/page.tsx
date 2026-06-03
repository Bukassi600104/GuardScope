import type { Metadata } from 'next'
import { Footer } from '../components/Footer'
import { Navbar } from '../components/Navbar'
import { CTA_HREF, CTA_LABEL } from '../../lib/launch'

export const metadata: Metadata = {
  title: 'Features - GuardScope',
  description: 'GuardScope features for Gmail phishing and email threat analysis: AI review, URL intelligence, sender authentication, domain checks, and privacy-first controls.',
  alternates: { canonical: '/features' },
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

const layers = [
  {
    title: 'AI-assisted message review',
    color: C.blue,
    copy: 'Reviews the message for urgency pressure, impersonation, social engineering, business-email-compromise signals, and suspicious instructions.',
    bullets: ['Structured reasoning summary', 'BEC and authority-pressure patterns', 'Stable low-temperature model settings'],
  },
  {
    title: 'Sender authentication',
    color: C.cyan,
    copy: 'Checks SPF, DKIM, DMARC, MX, and sender-alignment signals to help identify spoofing or misconfigured sender infrastructure.',
    bullets: ['SPF alignment', 'DKIM selector probing', 'DMARC policy checks'],
  },
  {
    title: 'URL intelligence',
    color: '#7C3AED',
    copy: 'Extracts visible and plain-text URLs from the email and checks them against threat-intelligence sources for phishing, malware, and reputation signals.',
    bullets: ['VirusTotal and Safe Browsing', 'PhishTank and URLhaus', 'SpamHaus DBL checks'],
  },
  {
    title: 'Domain and registrar context',
    color: C.amber,
    copy: 'Uses DNS and RDAP context to flag newly registered domains, suspicious registrar patterns, and lookalike infrastructure.',
    bullets: ['Domain-age checks', 'Registrar context', 'New-domain risk flags'],
  },
  {
    title: 'Impersonation detection',
    color: C.green,
    copy: 'Compares sender, display name, domain, and message content against brand, executive, legal, government, and payment-pressure patterns.',
    bullets: ['Brand impersonation', 'Display-name spoofing', 'Free-provider authority mismatch'],
  },
  {
    title: 'Regional threat context',
    color: C.red,
    copy: 'Adds context for common Africa-focused threat patterns such as EFCC/CBN impersonation, BVN phishing, advance-fee pressure, and fintech lookalikes.',
    bullets: ['EFCC/CBN patterns', 'BVN and fintech phishing', 'FR and EN analysis support'],
  },
]

const security = [
  ['No email storage', 'Email bodies, subjects, recipients, headers, and extracted URLs are not stored in GuardScope databases after analysis.'],
  ['Server-side quotas', 'Anonymous and signed-in limits are enforced by the backend, not only by extension UI.'],
  ['No secrets in extension', 'Provider keys and sensitive service credentials stay on the backend.'],
  ['Prompt-injection hardening', 'Suspicious instruction patterns are filtered and email content is isolated before AI-assisted analysis.'],
  ['JWT-protected account routes', 'Authenticated account endpoints validate user identity server-side.'],
  ['Supabase RLS', 'Database access is scoped by row-level security policies where user-owned records are stored.'],
]

export default function FeaturesPage() {
  return (
    <>
      <Navbar activePage="/features" />

      <section style={{ padding: '82px 24px 66px', background: '#fff', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 820, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cyan, marginBottom: 14 }}>Features</p>
          <h1 style={{ fontSize: 'clamp(36px,5vw,62px)', lineHeight: 1.06, letterSpacing: '-0.02em', color: C.text, marginBottom: 18 }}>
            Email threat analysis before users click.
          </h1>
          <p style={{ fontSize: 18, color: C.body, lineHeight: 1.75, maxWidth: 680, margin: '0 auto' }}>
            GuardScope combines AI-assisted review, URL intelligence, sender authentication, and domain context into a structured advisory report for Gmail.
          </p>
        </div>
      </section>

      <section style={{ padding: '72px 24px', background: C.bg }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 18 }}>
          {layers.map((layer, index) => (
            <article className="feature-layer-grid" key={layer.title} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,0.85fr) minmax(260px,0.65fr)', gap: 28, border: `1px solid ${C.border}`, borderLeft: `4px solid ${layer.color}`, borderRadius: 8, background: C.surface, padding: 26, boxShadow: '0 16px 42px rgba(0,30,47,0.05)' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 820, letterSpacing: '0.12em', textTransform: 'uppercase', color: layer.color, marginBottom: 8 }}>Layer {String(index + 1).padStart(2, '0')}</p>
                <h2 style={{ fontSize: 22, lineHeight: 1.25, color: C.text, marginBottom: 10 }}>{layer.title}</h2>
                <p style={{ fontSize: 15, color: C.body, lineHeight: 1.75 }}>{layer.copy}</p>
              </div>
              <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                {layer.bullets.map((bullet) => (
                  <div key={bullet} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: C.body, fontSize: 14 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: layer.color, marginTop: 7, flexShrink: 0 }} />
                    {bullet}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="security" style={{ padding: '72px 24px', background: '#fff', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 38 }}>
            <p style={{ fontSize: 12, fontWeight: 820, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cyan, marginBottom: 12 }}>Security architecture</p>
            <h2 style={{ fontSize: 'clamp(30px,4vw,48px)', lineHeight: 1.12, color: C.text, marginBottom: 12 }}>Built for a cautious launch posture.</h2>
            <p style={{ fontSize: 16, color: C.body, lineHeight: 1.7, maxWidth: 640, margin: '0 auto' }}>The product is structured around user-triggered scans, backend enforcement, and no GuardScope email-content storage.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {security.map(([title, copy]) => (
              <article key={title} style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, padding: 22 }}>
                <h3 style={{ fontSize: 16, color: C.text, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{copy}</p>
              </article>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <a href="/security" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: C.text, color: '#fff', padding: '12px 18px', fontSize: 14, fontWeight: 780 }}>Read security documentation</a>
          </div>
        </div>
      </section>

      <section style={{ padding: '72px 24px', background: C.text, textAlign: 'center' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(30px,4vw,44px)', color: '#fff', lineHeight: 1.15, marginBottom: 14 }}>Add GuardScope to Chrome.</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.74)', lineHeight: 1.7, marginBottom: 26 }}>Install the public Chrome Web Store release and keep launch-code access as an optional Pro upgrade.</p>
          <a href={CTA_HREF} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#fff', color: C.text, padding: '13px 22px', fontSize: 15, fontWeight: 820 }}>{CTA_LABEL}</a>
        </div>
      </section>

      <Footer />
    </>
  )
}
