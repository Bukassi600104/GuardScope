import { Footer } from './Footer'
import { GuardScopeLogo } from './GuardScopeLogo'
import { Navbar } from './Navbar'

type LegalSection = {
  title: string
  body?: string
  preamble?: string
  bullets?: string[]
  footer?: string
  highlight?: boolean
}

const C = {
  bg: '#f6faff',
  panel: '#ffffff',
  text: '#001e2f',
  body: '#4f6072',
  muted: '#6e7882',
  border: '#c9d5df',
  cyan: '#0d8ec2',
  success: '#158a46',
}

export function LegalPage({
  eyebrow,
  title,
  description,
  effectiveDate,
  sections,
}: {
  eyebrow: string
  title: string
  description: string
  effectiveDate: string
  sections: LegalSection[]
}) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Navbar />

      <header style={{ padding: '72px 24px 44px', borderBottom: `1px solid ${C.border}`, background: '#fff' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cyan, marginBottom: 12 }}>
            {eyebrow}
          </p>
          <h1 style={{ fontSize: 'clamp(34px,5vw,58px)', fontWeight: 820, color: C.text, marginBottom: 14, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            {title}
          </h1>
          <p style={{ fontSize: 17, color: C.body, lineHeight: 1.75, maxWidth: 760 }}>
            {description}
          </p>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 18 }}>Effective: {effectiveDate} / Last updated: {effectiveDate}</p>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '44px 24px 86px' }}>
        <div style={{ display: 'grid', gap: 14 }}>
          {sections.map((section) => (
            <section
              key={section.title}
              style={{
                background: section.highlight ? 'rgba(30,215,96,0.08)' : C.panel,
                border: `1px solid ${section.highlight ? 'rgba(21,138,70,0.22)' : C.border}`,
                borderRadius: 8,
                padding: '26px 28px',
                boxShadow: section.highlight ? 'none' : '0 16px 42px rgba(0,30,47,0.05)',
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 780, color: C.text, marginBottom: 12, lineHeight: 1.3 }}>{section.title}</h2>
              {section.preamble && <p style={{ fontSize: 14, color: C.body, lineHeight: 1.75, marginBottom: 12 }}>{section.preamble}</p>}
              {section.body && <p style={{ fontSize: 14, color: C.body, lineHeight: 1.85, whiteSpace: 'pre-line' }}>{section.body}</p>}
              {section.bullets && (
                <ul style={{ listStyle: 'none', display: 'grid', gap: 10 }}>
                  {section.bullets.map((bullet) => (
                    <li key={bullet} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: '50%', background: section.highlight ? C.success : C.cyan, marginTop: 8 }} />
                      <span style={{ fontSize: 14, color: C.body, lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: bullet }} />
                    </li>
                  ))}
                </ul>
              )}
              {section.footer && <p style={{ fontSize: 13, color: C.cyan, marginTop: 16, fontWeight: 700 }}>{section.footer}</p>}
            </section>
          ))}
        </div>

        <div style={{ marginTop: 44, padding: '20px 22px', border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <GuardScopeLogo size={26} textSize={14} variant="dark" />
          <p style={{ fontSize: 13, color: C.muted }}>These documents should be reviewed by qualified counsel before launch.</p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
