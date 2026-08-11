import { GuardScopeLogo } from './GuardScopeLogo'

export function Navbar({ activePage = '' }: { activePage?: string }) {
  const links = [
    ['Product', '/features'],
    ['How it works', '/how-it-works'],
    ['Pricing', '/pricing'],
    ['Security', '/security'],
  ]
  return (
    <nav className="premium-nav">
      <div className="premium-shell nav-inner">
        <a href="/" aria-label="GuardScope home"><GuardScopeLogo size={34} textSize={18} variant="color" /></a>
        <div className="nav-links">
          {links.map(([label, href]) => <a className={activePage === href ? 'active' : ''} key={href} href={href}>{label}</a>)}
        </div>
        <div className="nav-actions"><a className="account-link" href="/account">Sign in</a><a className="nav-trial" href="/signup">Start trial</a></div>
      </div>
    </nav>
  )
}
