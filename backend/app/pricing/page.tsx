import type { Metadata } from 'next'
import { Footer } from '../components/Footer'
import { Navbar } from '../components/Navbar'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Start GuardScope with five lifetime trial scans, then continue with a Paystack-managed Pro subscription.',
  alternates: { canonical: '/pricing' },
}

const proFeatures = ['Continuous Gmail threat analysis', 'Complete sender, link, domain, and AI checks', 'Synchronized website and extension access', 'Secure recurring billing through Paystack', 'Subscription management from your account']

export default function PricingPage() {
  return (
    <main className="premium-site">
      <Navbar activePage="/pricing" />
      <section className="pricing-hero"><div className="premium-shell"><span className="premium-kicker"><i /> SIMPLE ACCESS</span><h1>Try the full intelligence.<br />Subscribe when it earns your trust.</h1><p>One account follows you from the website into Gmail. Trial use and subscription access remain synchronized automatically.</p></div></section>
      <section className="pricing-section">
        <div className="premium-shell pricing-cards">
          <article className="plan-card trial-plan"><span className="section-label">TRIAL</span><h2>Five scans</h2><p className="plan-price">₦0 <small>to evaluate</small></p><p>Use the complete GuardScope analysis on five real emails. No payment card is needed to begin.</p><ul><li>Five lifetime scans</li><li>Full risk report</li><li>One synchronized account</li><li>No reduced-feature demo</li></ul><a className="premium-button secondary" href="/signup">Start trial</a></article>
          <article className="plan-card pro-plan"><div className="recommended">RECOMMENDED</div><span className="section-label">PRO</span><h2>Continuous protection</h2><p className="plan-price">Pricing soon <small>monthly or annual</small></p><p>Keep GuardScope active after your trial with a recurring plan billed securely in naira through Paystack.</p><ul>{proFeatures.map(feature => <li key={feature}>{feature}</li>)}</ul><a className="premium-button primary" href="/account">View account status</a><small className="billing-note">Checkout unlocks automatically when live billing opens.</small></article>
        </div>
      </section>
      <section className="premium-section pricing-notes"><div className="premium-shell split-heading"><div><span className="section-label">CLEAR BY DESIGN</span><h2>No anonymous access. No permanent free tier.</h2></div><div className="pricing-points"><p><strong>Five means five.</strong> Trial scans are lifetime account usage, not a monthly reset.</p><p><strong>Paystack only.</strong> Subscription checkout and renewal are designed for a Nigerian business account.</p><p><strong>Safe rollout.</strong> Billing stays unavailable until the live key and both recurring plan codes are verified.</p></div></div></section>
      <Footer />
    </main>
  )
}
