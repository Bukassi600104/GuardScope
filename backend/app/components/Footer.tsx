import { GuardScopeLogo } from './GuardScopeLogo'

const C = {
  text:   '#001e2f',
  body:   '#535f74',
  muted:  '#6e7882',
  border: '#bec8d2',
  accent: '#39B6FF',
  bg:     '#f6faff',
}

export function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${C.border}`,
      background: '#fff',
      padding: '64px 24px 32px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Top grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 48,
          marginBottom: 56,
        }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <GuardScopeLogo size={30} textSize={16} variant="dark" />
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.75, marginTop: 14, maxWidth: 210 }}>
              AI-powered phishing detection inside Gmail. Built for the global threat landscape.
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 18, padding: '5px 12px', borderRadius: 999,
              background: 'rgba(30,215,96,0.08)',
              border: '1px solid rgba(30,215,96,0.25)',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#1ED760" fillOpacity="0.3" stroke="#1ED760" strokeWidth="1.5"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1ED760', letterSpacing: '0.04em' }}>NDPR & GDPR Compliant</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.muted, textTransform: 'uppercase', marginBottom: 18 }}>Product</div>
            {[
              { label: 'Features', href: '/features' },
              { label: 'How it Works', href: '/how-it-works' },
              { label: 'Pricing', href: '/pricing' },
              { label: 'Early Access', href: '/#early-access' },
              { label: 'FAQ', href: '/#faq' },
            ].map((l) => (
              <a key={l.label} href={l.href} style={{ display: 'block', fontSize: 13, color: C.body, marginBottom: 10, transition: 'color .15s' }}>{l.label}</a>
            ))}
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.muted, textTransform: 'uppercase', marginBottom: 18 }}>Company</div>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Security', href: '/features#security' },
            ].map((l) => (
              <a key={l.label} href={l.href} style={{ display: 'block', fontSize: 13, color: C.body, marginBottom: 10 }}>{l.label}</a>
            ))}
          </div>

          {/* Support */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.muted, textTransform: 'uppercase', marginBottom: 18 }}>Support</div>
            {[
              { label: 'Sign In', href: '/signup' },
              { label: 'Sign Up', href: '/signup?tab=signup' },
              { label: 'support@guardscope.app', href: 'mailto:support@guardscope.app' },
            ].map((l) => (
              <a key={l.label} href={l.href} style={{ display: 'block', fontSize: 13, color: C.body, marginBottom: 10, wordBreak: 'break-all' }}>{l.label}</a>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: `1px solid ${C.border}`,
          paddingTop: 24,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ fontSize: 12, color: C.muted }}>© 2026 GuardScope. All rights reserved.</p>
          <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>Inspect before you trust.</p>
        </div>
      </div>
    </footer>
  )
}
