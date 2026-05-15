import { GuardScopeLogo } from './GuardScopeLogo'
import { CTA_HREF, CTA_LABEL, SUPPORT_EMAIL } from '../../lib/launch'

const C = {
  text: '#001e2f',
  body: '#535f74',
  muted: '#6e7882',
  border: '#bec8d2',
}

export function Footer() {
  const productLinks = [
    { label: 'Features', href: '/features' },
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Early access', href: '/#early-access' },
    { label: 'FAQ', href: '/#faq' },
  ]

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Security', href: '/features#security' },
  ]

  const supportLinks = [
    { label: 'Sign in', href: '/signup' },
    { label: CTA_LABEL, href: CTA_HREF },
    { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
  ]

  return (
    <footer style={{
      borderTop: `1px solid ${C.border}`,
      background: '#fff',
      padding: '64px 24px 32px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 44,
          marginBottom: 54,
        }}>
          <div>
            <GuardScopeLogo size={30} textSize={16} variant="dark" />
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.75, marginTop: 14, maxWidth: 250 }}>
              Gmail phishing and email threat analysis with user-triggered scans and no GuardScope email-content storage.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 18,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(30,215,96,0.08)',
              border: '1px solid rgba(30,215,96,0.25)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1ED760' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#148a3f' }}>Privacy-first launch posture</span>
            </div>
          </div>

          {[
            { heading: 'Product', links: productLinks },
            { heading: 'Legal', links: legalLinks },
            { heading: 'Support', links: supportLinks },
          ].map((group) => (
            <div key={group.heading}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: C.muted, textTransform: 'uppercase', marginBottom: 18 }}>
                {group.heading}
              </div>
              {group.links.map((link) => (
                <a key={link.label} href={link.href} style={{ display: 'block', fontSize: 13, color: C.body, marginBottom: 10, wordBreak: 'break-word' }}>
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div style={{
          borderTop: `1px solid ${C.border}`,
          paddingTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <p style={{ fontSize: 12, color: C.muted }}>Copyright 2026 GuardScope. All rights reserved.</p>
          <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>Inspect before you trust.</p>
        </div>
      </div>
    </footer>
  )
}
