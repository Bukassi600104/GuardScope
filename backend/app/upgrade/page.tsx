'use client'

import type { ReactNode } from 'react'
import { GuardScopeLogo } from '../components/GuardScopeLogo'
import { CHROME_WEB_STORE_URL, QUOTAS, SUPPORT_EMAIL } from '../../lib/launch'

const C = {
  bg: '#f6faff',
  panel: '#ffffff',
  text: '#001e2f',
  body: '#526477',
  muted: '#6e7882',
  border: '#c8d4df',
  cyan: '#0d8ec2',
  success: '#168a45',
  danger: '#be3030',
  amber: '#ad6b00',
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Alert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  const color = tone === 'error' ? C.danger : tone === 'success' ? C.success : C.cyan
  const bg = tone === 'error' ? 'rgba(255,77,79,0.08)' : tone === 'success' ? 'rgba(30,215,96,0.08)' : 'rgba(57,182,255,0.09)'
  return (
    <div style={{ border: `1px solid ${color}33`, background: bg, borderRadius: 8, padding: '12px 14px', fontSize: 13, color, lineHeight: 1.55 }}>
      {children}
    </div>
  )
}

export default function UpgradePage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, padding: '28px 24px 54px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 44 }}>
          <a href="/" aria-label="GuardScope home"><GuardScopeLogo variant="dark" size={32} textSize={17} /></a>
          <a href="/signup" style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 760, color: C.text }}>Sign in</a>
        </nav>

        <div className="auth-shell-grid">
          <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: 'linear-gradient(180deg,#ffffff 0%,#edf8ff 100%)', padding: '34px', minHeight: 520 }}>
            <p style={{ fontSize: 12, fontWeight: 820, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cyan, marginBottom: 14 }}>Launch code program</p>
            <h1 style={{ fontSize: 'clamp(32px,5vw,58px)', lineHeight: 1.04, letterSpacing: '-0.02em', color: C.text, marginBottom: 16 }}>
              Activate GuardScope Pro for the Chrome launch window.
            </h1>
            <p style={{ fontSize: 16, color: C.body, lineHeight: 1.75, maxWidth: 540 }}>
              Launch codes give selected Chrome Web Store users temporary Pro access during the public launch period.
            </p>

            <div style={{ display: 'grid', gap: 12, marginTop: 30 }}>
              {[
                [`${QUOTAS.promoProDays} days Pro access`, 'The access period starts when your code is activated.'],
                ['No payment card required', 'Launch-code activation is separate from paid billing.'],
                ['One account per code', 'Codes are limited and protected against resale or duplicate activation.'],
              ].map(([heading, copy]) => (
                <div key={heading} style={{ display: 'flex', gap: 12, padding: '14px 0', borderTop: `1px solid ${C.border}` }}>
                  <span style={{ color: C.success, marginTop: 2 }}><CheckIcon /></span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{heading}</div>
                    <div style={{ fontSize: 13, color: C.body, lineHeight: 1.65 }}>{copy}</div>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: C.muted, marginTop: 28 }}>
              Need help with a code? Email <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.cyan, fontWeight: 700 }}>{SUPPORT_EMAIL}</a>.
            </p>
          </section>

          <section style={{ border: `1px solid ${C.border}`, borderRadius: 8, background: C.panel, padding: '32px', boxShadow: '0 24px 70px rgba(0,30,47,0.08)' }}>
            <h2 style={{ fontSize: 28, lineHeight: 1.15, color: C.text, marginBottom: 8 }}>
              Activate inside the extension
            </h2>
            <p style={{ fontSize: 14, color: C.body, lineHeight: 1.7, marginBottom: 24 }}>
              For account security, launch codes are redeemed only after you sign in through the GuardScope Chrome extension.
            </p>

            <div style={{ display: 'grid', gap: 16 }}>
              <Alert tone="info">If you received a code by email, keep that email open, then activate the code from the signed-in extension panel.</Alert>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  ['Install or open GuardScope', 'Use the public Chrome Web Store extension so activation happens from the trusted extension origin.'],
                  ['Sign in with the requesting email', 'Use the same GuardScope account email that requested the launch code.'],
                  ['Paste the launch code in the extension', 'Open the promo-code section and activate Pro from there.'],
                ].map(([heading, copy], index) => (
                  <div key={heading} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12, padding: '14px', border: `1px solid ${C.border}`, borderRadius: 8, background: index === 2 ? '#f1fbf6' : '#f7fbff' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', background: index === 2 ? 'rgba(22,138,69,0.13)' : 'rgba(13,142,194,0.12)', color: index === 2 ? C.success : C.cyan, fontSize: 13, fontWeight: 900 }}>{index + 1}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 820, color: C.text }}>{heading}</div>
                      <div style={{ marginTop: 3, fontSize: 13, lineHeight: 1.6, color: C.body }}>{copy}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                <a href={CHROME_WEB_STORE_URL} style={{ display: 'grid', placeItems: 'center', minHeight: 50, borderRadius: 8, background: C.text, color: '#fff', fontWeight: 820, fontSize: 14, textAlign: 'center' }}>Add to Chrome</a>
                <a href="/signup" style={{ display: 'grid', placeItems: 'center', minHeight: 48, borderRadius: 8, border: `1px solid ${C.border}`, color: C.text, fontWeight: 780, fontSize: 14, textAlign: 'center' }}>Create account or sign in</a>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${C.border}`, display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, color: C.muted }}>Launch access is limited and may be revoked for fraud, resale, or quota bypass attempts.</div>
              <a href="/terms" style={{ color: C.cyan, fontSize: 13, fontWeight: 760 }}>Read launch-code terms</a>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
