import type { Metadata } from 'next'
import { LegalPage } from '../components/LegalPage'
import { PRIVACY_EMAIL, QUOTAS, SUPPORT_EMAIL } from '../../lib/launch'

export const metadata: Metadata = {
  title: 'Security',
  description: 'GuardScope security documentation covering architecture, data minimization, extension permissions, abuse prevention, and responsible disclosure.',
  alternates: { canonical: '/security' },
  openGraph: { url: '/security', type: 'website' },
}

const EFFECTIVE_DATE = 'May 15, 2026'

const sections = [
  {
    title: '1. Security posture',
    body: 'GuardScope is designed as a user-triggered Gmail analysis tool with a conservative data posture. The core security principle is to process only the email data needed to produce a requested scan, return advisory results, and avoid storing email content in GuardScope databases.',
  },
  {
    title: '2. Data minimization controls',
    highlight: true,
    bullets: [
      'Scans run only when the user initiates analysis from the extension.',
      'Email content is transmitted for analysis and is not stored in GuardScope databases after the response is produced.',
      'Anonymous access is limited to reduce abuse while keeping the launch experience usable.',
      'Account, quota, promo, subscription, and diagnostic metadata are separated from email content.',
      'Public website copy avoids guaranteed-protection claims and presents results as advisory.',
    ],
  },
  {
    title: '3. Chrome extension boundaries',
    bullets: [
      'The extension purpose is Gmail email threat analysis before users click or respond.',
      'Gmail content is accessed only to analyze the currently selected message.',
      'The extension should request only permissions needed for Gmail page integration, storage, network calls to GuardScope, and user-requested functionality.',
      'The Chrome Web Store listing, privacy policy, and permission justifications should describe the same single purpose.',
    ],
  },
  {
    title: '4. Backend and API protections',
    bullets: [
      'Rate limits are applied to anonymous analysis, signup, promo-code validation, and other sensitive routes where abuse risk exists.',
      'The backend enforces quota rules independently of website copy or extension UI.',
      `Anonymous users receive ${QUOTAS.anonymousDaily} messages per day; signed-in free users receive ${QUOTAS.signedInFreeMonthly} messages per month unless changed in backend constants.`,
      'Promo-code redemption is server-side and should remain tied to account or email identity to reduce resale and duplicate redemption.',
      'Sensitive provider keys must remain server-side and never ship in the extension bundle.',
    ],
  },
  {
    title: '5. Third-party provider risk management',
    body: 'GuardScope uses specialist providers for AI-assisted analysis, threat intelligence, hosting, authentication, payments, DNS/RDAP, and email delivery. Provider results can be incomplete or delayed, so GuardScope combines signals and presents advisory findings instead of absolute guarantees.',
  },
  {
    title: '6. Logging and diagnostics',
    body: 'Operational logs should avoid storing email bodies, subjects, recipients, headers, and extracted email content. Logs may include request identifiers, status codes, timing, account tier, quota events, and error information needed for security monitoring and support.',
  },
  {
    title: '7. Account and password security',
    bullets: [
      'New account passwords must be at least 12 characters.',
      'Reset-password flows require a valid recovery token.',
      'Users are responsible for securing their own email account and GuardScope credentials.',
      'Users should report suspected account compromise to support immediately.',
    ],
  },
  {
    title: '8. Responsible disclosure',
    body: `If you believe you found a vulnerability in GuardScope, email ${SUPPORT_EMAIL} with a clear description, reproduction steps, affected URLs or extension versions, and potential impact. Please do not access another user's data, run destructive tests, degrade service availability, or publicly disclose the issue before we have had a reasonable opportunity to investigate.`,
  },
  {
    title: '9. User security guidance',
    bullets: [
      'Treat GuardScope as an advisory layer, not a replacement for good judgment or organizational security controls.',
      'Do not click links, open attachments, or send money solely because one tool appears to mark a message as safe.',
      'For high-risk emails, verify through an independent channel before responding or taking action.',
      'Report suspicious emails to your organization, email provider, or relevant abuse contact where appropriate.',
    ],
  },
  {
    title: '10. Contact',
    body: `Security reports: ${SUPPORT_EMAIL}\nPrivacy requests: ${PRIVACY_EMAIL}`,
  },
]

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="Trust / Security"
      title="Security Documentation"
      description="A launch-ready overview of how GuardScope limits email-content handling, protects quota and promo flows, documents extension boundaries, and receives vulnerability reports."
      effectiveDate={EFFECTIVE_DATE}
      sections={sections}
    />
  )
}
