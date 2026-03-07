const s = {
  // Layout
  section: { padding: '80px 24px', maxWidth: 1100, margin: '0 auto' } as React.CSSProperties,
  sectionSmall: { padding: '60px 24px', maxWidth: 1100, margin: '0 auto' } as React.CSSProperties,
  // Typography
  label: { fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#ef4444', marginBottom: 12 },
  h1: { fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#fff', marginBottom: 20 },
  h2: { fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', marginBottom: 16 },
  h3: { fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 },
  lead: { fontSize: 18, color: '#94a3b8', lineHeight: 1.7, maxWidth: 560 },
  body: { fontSize: 15, color: '#94a3b8', lineHeight: 1.7 },
  // Containers
  card: { background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 16, padding: 28 } as React.CSSProperties,
  cardRed: { background: '#1a0d0d', border: '1px solid #ef4444', borderRadius: 16, padding: 32 } as React.CSSProperties,
  // Grid
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 32 } as React.CSSProperties,
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 } as React.CSSProperties,
  grid5: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 } as React.CSSProperties,
  // Buttons
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 12, transition: 'background .2s' } as React.CSSProperties,
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'transparent', color: '#e2e8f0', fontWeight: 600, fontSize: 15, borderRadius: 12, border: '1px solid #2a2d3a' } as React.CSSProperties,
  // Misc
  divider: { height: 1, background: '#2a2d3a', margin: '0 24px' } as React.CSSProperties,
  badge: { display: 'inline-block', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' } as React.CSSProperties,
}

function ShieldLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill="#ef4444"/>
      <path d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="white"/>
    </svg>
  )
}

function CheckIcon({ color = '#22c55e' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M18 6L6 18M6 6L18 18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

const FEATURES = [
  { icon: '🔐', title: 'Email Authentication', desc: 'Instantly checks SPF, DKIM, and DMARC records to verify the sender is who they claim to be.' },
  { icon: '🕵️', title: 'AI Deep Analysis', desc: 'Mercury-2 reads the email and reasons through every signal — urgency manipulation, impersonation, domain deception.' },
  { icon: '🌐', title: 'Link Safety Scan', desc: 'All URLs scanned against VirusTotal, Google Safe Browsing, PhishTank, and URLhaus simultaneously.' },
  { icon: '📅', title: 'Domain Age Intel', desc: 'New domains registered days before an attack are a major red flag. We catch them via RDAP lookup.' },
  { icon: '🇳🇬', title: 'Nigeria-Aware', desc: 'Trained on EFCC/CBN fraud patterns, BVN phishing, advance-fee scams, and local fintech impersonation.' },
]

const STEPS = [
  { n: 1, title: 'Open any email in Gmail', desc: 'GuardScope detects the email and a security panel slides in on the right side of your inbox.' },
  { n: 2, title: 'Click "Analyze This Email"', desc: 'Scans run in parallel — DNS auth, domain age, all links, and Mercury-2 AI — in 5–8 seconds.' },
  { n: 3, title: 'Read your verdict', desc: 'Get a clear risk score (0–100), plain-English verdict, and specific flags explaining exactly what looks suspicious.' },
]

const FAQS = [
  { q: 'Does GuardScope read or store my emails?', a: 'Never. Email content is sent to our backend for analysis and discarded immediately after. We never log or store your email body, subject, or sender details.' },
  { q: 'Does it work with all Gmail accounts?', a: 'Yes — personal Gmail and Google Workspace (GSuite) accounts. It works anywhere you access Gmail in Chrome.' },
  { q: 'What if I\'m not a technical person?', a: 'That\'s exactly who we designed it for. Everything is explained in plain English — no cybersecurity knowledge required.' },
  { q: 'Is it free?', a: 'Yes — 5 free analyses per month, forever. Pro gives you unlimited scans for $4.99/month.' },
  { q: 'Which AI model does it use?', a: 'Mercury-2 by InceptionLabs — a reasoning model purpose-built for structured analysis tasks. It writes a chain of thought before reaching its verdict.' },
  { q: 'Is my data private?', a: 'Completely. We comply with NDPR 2023 (Nigeria), GDPR, and use Supabase EU-hosted infrastructure. Read our Privacy Policy for details.' },
]

export default function Home() {
  return (
    <>
      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,17,23,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2a2d3a', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, height: 60 }}>
          <ShieldLogo />
          <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>GuardScope</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#how-it-works" style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>How it works</a>
            <a href="#pricing" style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Pricing</a>
            <a href="#faq" style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>FAQ</a>
            <a href="https://chromewebstore.google.com" target="_blank" rel="noopener noreferrer" style={{ ...s.btnPrimary, padding: '8px 18px', fontSize: 13 }}>
              Install Free
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ ...s.section, paddingTop: 120, paddingBottom: 100, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 999, marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Free to install — 5 analyses/month, no credit card</span>
          </div>
          <h1 style={s.h1}>
            Stop Phishing<br />
            <span style={{ color: '#ef4444' }}>Before It Stops You</span>
          </h1>
          <p style={{ ...s.lead, margin: '0 auto 36px' }}>
            GuardScope sits inside Gmail and analyzes every email with AI, DNS authentication checks, and real-time threat intelligence — in under 8 seconds.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://chromewebstore.google.com" target="_blank" rel="noopener noreferrer" style={s.btnPrimary}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/><circle cx="12" cy="12" r="3.5" fill="white"/></svg>
              Add to Chrome — It&apos;s Free
            </a>
            <a href="#how-it-works" style={s.btnSecondary}>See how it works</a>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: '#475569' }}>
            Works with Gmail personal + Google Workspace · Chrome only
          </p>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── Problem Section ── */}
      <section style={s.sectionSmall}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={s.label}>The Problem</p>
          <h2 style={s.h2}>Email phishing costs Africa <span style={{ color: '#ef4444' }}>billions</span> every year</h2>
          <p style={{ ...s.lead, margin: '0 auto' }}>Phishing attacks are sophisticated, fast-moving, and specifically target people who don&apos;t have security training. Your inbox is the front door — GuardScope guards it.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {[
            { stat: '91%', desc: 'of cyberattacks start with a phishing email' },
            { stat: '$17,700', desc: 'lost per minute to phishing attacks globally' },
            { stat: '3.4B', desc: 'phishing emails sent every day worldwide' },
            { stat: '97%', desc: 'of people cannot identify a sophisticated phishing email' },
          ].map((item) => (
            <div key={item.stat} style={{ ...s.card, textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#ef4444', marginBottom: 8 }}>{item.stat}</div>
              <p style={{ fontSize: 14, color: '#94a3b8' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={s.divider} />

      {/* ── Features ── */}
      <section id="features" style={s.section}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={s.label}>What GuardScope checks</p>
          <h2 style={s.h2}>5 layers of protection<br />on every email</h2>
        </div>
        <div style={s.grid5}>
          {FEATURES.map((f) => (
            <div key={f.title} style={s.card}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={s.h3}>{f.title}</h3>
              <p style={{ ...s.body, fontSize: 14 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={s.divider} />

      {/* ── How It Works ── */}
      <section id="how-it-works" style={s.section}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={s.label}>How it works</p>
          <h2 style={s.h2}>3 steps, 8 seconds</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, position: 'relative' }}>
          {STEPS.map((step) => (
            <div key={step.n} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: '#fff' }}>
                {step.n}
              </div>
              <div>
                <h3 style={s.h3}>{step.title}</h3>
                <p style={s.body}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mock analysis card */}
        <div style={{ marginTop: 64, ...s.card, maxWidth: 480, background: '#13151f' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>CRITICAL — Score 88/100</span>
          </div>
          <p style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 16, lineHeight: 1.6 }}>
            This email impersonates GTBank using a lookalike domain registered 3 days ago. All links lead to a credential-harvesting page flagged by VirusTotal (7/88 engines) and PhishTank.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'SPF: Failed — sender not authorized',
              'Domain registered 3 days ago',
              'VirusTotal: 7/88 engines flagged',
              'PhishTank: confirmed phishing URL',
            ].map((flag) => (
              <div key={flag} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <XIcon />
                <span style={{ fontSize: 13, color: '#fca5a5' }}>{flag}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #2a2d3a', fontSize: 11, color: '#475569' }}>
            Mercury-2 AI deep scan · 5.8s
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── Privacy ── */}
      <section style={s.sectionSmall}>
        <div style={{ ...s.card, background: '#0d1f14', border: '1px solid rgba(34,197,94,0.2)', maxWidth: 720, margin: '0 auto' }}>
          <p style={{ ...s.label, color: '#22c55e', marginBottom: 20 }}>Privacy first</p>
          <h2 style={{ ...s.h2, fontSize: 28, marginBottom: 24 }}>Your email content stays private</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { text: 'Email body discarded immediately after analysis', green: true },
              { text: 'Zero email content stored — ever', green: true },
              { text: 'NDPR 2023 & GDPR compliant', green: true },
              { text: 'Supabase EU infrastructure', green: true },
              { text: 'Your contacts or address book', green: false },
              { text: 'Your Gmail password or OAuth token', green: false },
              { text: 'Browsing history outside Gmail', green: false },
              { text: 'Email content in any database', green: false },
            ].map((item) => (
              <div key={item.text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {item.green ? <CheckIcon /> : <XIcon />}
                <span style={{ fontSize: 14, color: item.green ? '#86efac' : '#fca5a5' }}>{item.text}</span>
              </div>
            ))}
          </div>
          <a href="/privacy" style={{ display: 'inline-block', marginTop: 20, fontSize: 13, color: '#22c55e', textDecoration: 'underline' }}>
            Read our full Privacy Policy →
          </a>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── Pricing ── */}
      <section id="pricing" style={s.section}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={s.label}>Pricing</p>
          <h2 style={s.h2}>Start free, upgrade when you need more</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 720, margin: '0 auto' }}>

          {/* Free */}
          <div style={s.card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Free Forever</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', marginBottom: 4 }}>$0</div>
            <div style={{ fontSize: 14, color: '#475569', marginBottom: 28 }}>per month, always</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {[
                '5 email analyses per month',
                'Full Mercury-2 AI analysis',
                'All 5 security modules',
                'VirusTotal + Safe Browsing + PhishTank',
                'Analysis history (last 20)',
              ].map((f) => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <CheckIcon />
                  <span style={{ fontSize: 14, color: '#cbd5e1' }}>{f}</span>
                </div>
              ))}
            </div>
            <a href="https://chromewebstore.google.com" target="_blank" rel="noopener noreferrer" style={{ ...s.btnSecondary, justifyContent: 'center', width: '100%', textAlign: 'center' as const }}>
              Install Free
            </a>
          </div>

          {/* Pro */}
          <div style={{ ...s.cardRed, position: 'relative' as const }}>
            <div style={{ position: 'absolute' as const, top: -13, left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999, letterSpacing: '0.05em' }}>
              MOST POPULAR
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 8 }}>Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: '#fff' }}>$4.99</span>
              <span style={{ fontSize: 14, color: '#fca5a5' }}>/month</span>
            </div>
            <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 4 }}>or ₦7,500/month (Paystack)</div>
            <div style={{ fontSize: 14, color: '#475569', marginBottom: 28 }}>billed monthly, cancel anytime</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {[
                'Unlimited email analyses',
                'Full Mercury-2 AI analysis',
                'All 5 security modules',
                'VirusTotal + Safe Browsing + PhishTank + URLhaus',
                'Priority analysis queue',
                'Email support',
              ].map((f) => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <CheckIcon color="#ef4444" />
                  <span style={{ fontSize: 14, color: '#fecaca' }}>{f}</span>
                </div>
              ))}
            </div>
            <a href="https://guardscope.io/upgrade" style={{ ...s.btnPrimary, justifyContent: 'center', width: '100%', textAlign: 'center' as const }}>
              Upgrade to Pro
            </a>
          </div>
        </div>
      </section>

      <div style={s.divider} />

      {/* ── FAQ ── */}
      <section id="faq" style={s.section}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={s.label}>FAQ</p>
          <h2 style={s.h2}>Common questions</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 20, maxWidth: 960, margin: '0 auto' }}>
          {FAQS.map((faq) => (
            <div key={faq.q} style={s.card}>
              <h3 style={{ ...s.h3, fontSize: 15, marginBottom: 10 }}>{faq.q}</h3>
              <p style={{ ...s.body, fontSize: 14 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={s.divider} />

      {/* ── CTA ── */}
      <section style={{ ...s.sectionSmall, textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill="#ef4444"/>
                <path d="M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="white"/>
              </svg>
            </div>
            <h2 style={{ ...s.h2, marginBottom: 16 }}>Protect your inbox today</h2>
            <p style={{ ...s.lead, margin: '0 auto 32px', fontSize: 16 }}>
              Install GuardScope for free. No account required to get started.
            </p>
            <a href="https://chromewebstore.google.com" target="_blank" rel="noopener noreferrer" style={{ ...s.btnPrimary, fontSize: 18, padding: '16px 36px' }}>
              Add to Chrome — Free
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #2a2d3a', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldLogo />
            <span style={{ fontWeight: 700, color: '#fff' }}>GuardScope</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <a href="/privacy" style={{ fontSize: 14, color: '#64748b' }}>Privacy Policy</a>
            <a href="/terms" style={{ fontSize: 14, color: '#64748b' }}>Terms of Service</a>
            <a href="mailto:support@guardscope.io" style={{ fontSize: 14, color: '#64748b' }}>Contact</a>
          </div>
          <p style={{ fontSize: 13, color: '#475569' }}>© 2026 GuardScope. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
