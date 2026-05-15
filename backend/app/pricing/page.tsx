import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { CTA_HREF, CTA_LABEL, QUOTAS } from '../../lib/launch'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'GuardScope launch pricing: anonymous daily scans, signed-in free scans, and limited free launch-code Pro access.',
  alternates: { canonical: '/pricing' },
}

const C = {
  bg: '#f7fbff',
  surface: '#ffffff',
  primary: '#061b2b',
  accent: '#1aa7d9',
  text: '#061b2b',
  body: '#4f6275',
  muted: '#738293',
  border: '#cdd8e3',
  success: '#18a957',
}

const s = {
  wrap: { width: 'min(1100px, calc(100% - 48px))', margin: '0 auto' } as CSSProperties,
  section: { padding: '84px 0' } as CSSProperties,
  h1: { fontSize: 'clamp(38px,5vw,64px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em', color: C.text } as CSSProperties,
  h2: { fontSize: 'clamp(28px,4vw,46px)', fontWeight: 780, lineHeight: 1.1, color: C.text } as CSSProperties,
  lead: { fontSize: 18, color: C.body, lineHeight: 1.75 } as CSSProperties,
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28 } as CSSProperties,
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill={C.success} fillOpacity="0.12" />
      <path d="M7 12.5l3.2 3.2L17 9" stroke={C.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PLANS = [
  {
    name: 'Anonymous',
    price: '$0',
    description: 'Start scanning without an account.',
    features: [
      `${QUOTAS.anonymousDaily} analyses per day per IP`,
      'User-triggered Gmail scans',
      'AI, URL, DNS, and domain checks',
      'No email bodies stored by GuardScope',
    ],
  },
  {
    name: 'Free account',
    price: '$0',
    description: 'Keep account access and upgrade later.',
    features: [
      `${QUOTAS.signedInFreeMonthly} analyses per month per account`,
      'Account-based quota tracking',
      'Subscription and promo-code support',
      'Same advisory scan report',
    ],
  },
  {
    name: 'Launch Pro',
    price: 'Free code',
    description: 'Limited launch access for early users.',
    features: [
      `${QUOTAS.promoProDays} days of Pro access from activation`,
      'Unlimited analyses during the promo window',
      'No credit card required for the launch code',
      'Codes are limited and abuse-protected',
    ],
    featured: true,
  },
]

const FAQS = [
  { q: 'Why are anonymous and signed-in quotas different?', a: 'Anonymous quota is daily and IP-based so new users can try GuardScope quickly. Signed-in free quota is account-based and currently monthly unless upgraded or using a promo code.' },
  { q: 'When will the Chrome Web Store link be live?', a: 'The site uses early-access CTAs until the listing is approved. Once approved, the same CTA slot can point directly to the Chrome Web Store URL.' },
  { q: 'Do launch promo codes require payment?', a: 'No. Launch codes provide temporary Pro access without requiring a credit card.' },
  { q: 'Are scan results definitive?', a: 'No. GuardScope provides advisory threat analysis and should be used alongside normal security judgment.' },
]

export default function PricingPage() {
  return (
    <>
      <Navbar activePage="/pricing" />

      <section style={{ padding: '84px 0 68px', background: `linear-gradient(180deg, ${C.bg} 0%, #fff 100%)`, textAlign: 'center' }}>
        <div style={{ ...s.wrap, maxWidth: 760 }}>
          <h1 style={s.h1}>Launch pricing for GuardScope</h1>
          <p style={{ ...s.lead, margin: '20px auto 0' }}>
            Start with free advisory email scans. Claim a limited launch code for temporary Pro access while the Chrome Web Store launch is finalized.
          </p>
        </div>
      </section>

      <section style={{ ...s.section, background: '#fff' }}>
        <div style={s.wrap}>
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {PLANS.map((plan) => (
              <article key={plan.name} style={{
                ...s.card,
                background: plan.featured ? '#f0f9ff' : '#fff',
                borderColor: plan.featured ? '#9bdcf4' : C.border,
                boxShadow: plan.featured ? '0 18px 46px rgba(26,167,217,0.14)' : 'none',
              }}>
                <h2 style={{ fontSize: 20, color: C.text, marginBottom: 8 }}>{plan.name}</h2>
                <div style={{ fontSize: 38, fontWeight: 820, color: C.text, marginBottom: 10 }}>{plan.price}</div>
                <p style={{ color: C.body, fontSize: 14, lineHeight: 1.65, minHeight: 46 }}>{plan.description}</p>
                <div style={{ display: 'grid', gap: 12, margin: '26px 0' }}>
                  {plan.features.map((feature) => (
                    <div key={feature} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <CheckIcon />
                      <span style={{ color: C.body, fontSize: 14, lineHeight: 1.55 }}>{feature}</span>
                    </div>
                  ))}
                </div>
                <a href={plan.featured ? CTA_HREF : '/#early-access'} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  minHeight: 46,
                  borderRadius: 8,
                  background: plan.featured ? C.primary : C.bg,
                  color: plan.featured ? '#fff' : C.text,
                  border: plan.featured ? 'none' : `1px solid ${C.border}`,
                  fontSize: 15,
                  fontWeight: 760,
                }}>
                  {plan.featured ? CTA_LABEL : 'Start free'}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...s.section, background: C.bg }}>
        <div style={{ ...s.wrap, display: 'grid', gridTemplateColumns: '0.65fr 1fr', gap: 48 }} className="two-col-grid">
          <div>
            <h2 style={s.h2}>Pricing questions</h2>
            <p style={{ ...s.lead, marginTop: 16 }}>Clear quota language matters for users and reviewers.</p>
          </div>
          <div>
            {FAQS.map((faq) => (
              <div key={faq.q} style={{ padding: '22px 0', borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ color: C.text, fontSize: 16, marginBottom: 8 }}>{faq.q}</h3>
                <p style={{ color: C.body, fontSize: 14, lineHeight: 1.75 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
