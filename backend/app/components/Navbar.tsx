import { GuardScopeLogo } from './GuardScopeLogo'
import type { CSSProperties } from 'react'

const C = {
  text:    '#001e2f',
  body:    '#535f74',
  accent:  '#39B6FF',
  primary: '#001e2f',
  border:  '#bec8d2',
}

export function Navbar({ activePage = '' }: { activePage?: string }) {
  const links = [
    { label: 'Features',     href: '/features' },
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Pricing',      href: '/pricing' },
    { label: 'FAQ',          href: '/#faq' },
  ]

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(246,250,255,0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'center', height: 68,
      }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <GuardScopeLogo size={32} textSize={17} variant="dark" />
        </a>

        {/* Nav links — center */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          margin: '0 auto',
        }}>
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              style={{
                fontSize: 14, fontWeight: 500, color: C.body,
                padding: '6px 14px', borderRadius: 8,
                background: activePage === l.href ? 'rgba(57,182,255,0.1)' : 'transparent',
                transition: 'all .15s',
              }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Auth buttons — right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <a
            href="/signup"
            style={{
              fontSize: 14, fontWeight: 600, color: C.text,
              padding: '8px 20px', borderRadius: 10,
              border: `1.5px solid ${C.border}`,
              background: '#fff',
              transition: 'all .15s',
            }}
          >
            Login
          </a>
          <a
            href="/signup?tab=signup"
            style={{
              fontSize: 14, fontWeight: 700, color: '#fff',
              padding: '9px 22px', borderRadius: 10,
              background: C.primary,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all .15s',
            }}
          >
            Get Started
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M7 17L17 7M17 7H7M17 7v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </nav>
  )
}
