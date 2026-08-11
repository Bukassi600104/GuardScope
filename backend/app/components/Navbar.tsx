import { GuardScopeLogo } from './GuardScopeLogo'
import { CTA_HREF, CTA_LABEL } from '../../lib/launch'

const C = {
  text: '#001e2f',
  body: '#535f74',
  primary: '#001e2f',
  border: '#bec8d2',
}

export function Navbar({ activePage = '' }: { activePage?: string }) {
  const links = [
    { label: 'Features', href: '/features' },
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/#faq' },
  ]

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(247,251,255,0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        height: 68,
        gap: 18,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center' }} aria-label="GuardScope home">
          <GuardScopeLogo size={32} textSize={17} variant="dark" />
        </a>

        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}>
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: 14,
                fontWeight: 560,
                color: C.body,
                padding: '6px 12px',
                borderRadius: 8,
                background: activePage === link.href ? 'rgba(57,182,255,0.11)' : 'transparent',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <a
            className="nav-signin"
            href="/account"
            style={{
              fontSize: 14,
              fontWeight: 650,
              color: C.text,
              padding: '8px 18px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: '#fff',
            }}
          >
            Account
          </a>
          <a
            className="nav-cta"
            href={CTA_HREF}
            style={{
              fontSize: 14,
              fontWeight: 760,
              color: '#fff',
              padding: '9px 18px',
              borderRadius: 8,
              background: C.primary,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {CTA_LABEL}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 17L17 7M17 7H7M17 7v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </nav>
  )
}
