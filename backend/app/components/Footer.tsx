import { GuardScopeLogo } from './GuardScopeLogo'
import { CHROME_WEB_STORE_URL, SUPPORT_EMAIL } from '../../lib/launch'

export function Footer() {
  return (
    <footer className="premium-footer">
      <div className="premium-shell footer-grid">
        <div className="footer-brand"><GuardScopeLogo size={34} textSize={18} variant="color" /><p>Evidence-led phishing and email threat intelligence, built directly into Gmail.</p><span><i /> Systems operational</span></div>
        <div><strong>Product</strong><a href="/features">Features</a><a href="/how-it-works">How it works</a><a href="/pricing">Pricing</a><a href={CHROME_WEB_STORE_URL}>Chrome extension</a></div>
        <div><strong>Trust</strong><a href="/security">Security</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
        <div><strong>Account</strong><a href="/signup">Create account</a><a href="/account">Sign in</a><a href={`mailto:${SUPPORT_EMAIL}`}>Support</a></div>
      </div>
      <div className="premium-shell footer-bottom"><span>© 2026 GuardScope</span><span>Inspect before you trust.</span></div>
    </footer>
  )
}
