import type { Metadata } from 'next'
import { LegalPage } from '../components/LegalPage'
import { PRIVACY_EMAIL, QUOTAS, SUPPORT_EMAIL } from '../../lib/launch'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'GuardScope Privacy Policy: user-triggered Gmail analysis, no email storage, subprocessors, retention, and user rights.',
  alternates: { canonical: '/privacy' },
  openGraph: { url: '/privacy', type: 'website' },
}

const EFFECTIVE_DATE = 'May 15, 2026'

const sections = [
  {
    title: '1. Scope and summary',
    body: 'GuardScope is a Chrome extension and web service that helps Gmail users analyze suspicious emails for phishing and social-engineering signals. This policy explains the information we process, what we do not store, the third-party services involved, retention practices, and how to contact us about privacy requests.',
  },
  {
    title: '2. User-triggered scans only',
    body: 'GuardScope analyzes an email only when you choose to run a scan. The extension reads the currently open Gmail message for the purpose of producing that requested risk report. GuardScope does not continuously monitor your inbox, read unrelated Gmail messages, or collect browsing history outside the extension purpose.',
  },
  {
    title: '3. Information processed during a scan',
    bullets: [
      '<strong>Email fields:</strong> message body, subject, visible sender information, recipients visible in the message, headers available to the extension, URLs, and attachment names may be transmitted to the GuardScope backend for the scan you request.',
      '<strong>Security signals:</strong> sender authentication, domain and URL reputation, domain age, DNS/RDAP data, threat-intelligence results, and AI-assisted assessment.',
      '<strong>Usage metadata:</strong> scan count, account tier, timestamps, request identifiers, and abuse-prevention signals needed for quota enforcement, diagnostics, and service reliability.',
      '<strong>Account data:</strong> email address and authentication data when you create an account, handled through Supabase Auth.',
      '<strong>Promo and billing data:</strong> launch-code status, subscription status, payment status, and support records needed to operate the service.',
    ],
  },
  {
    title: '4. What GuardScope does not store',
    highlight: true,
    bullets: [
      '<strong>Email bodies, subjects, sender details, recipients, and headers</strong> are not stored in GuardScope databases after the analysis response is produced.',
      '<strong>Extracted email URLs</strong> may be checked during analysis but are not retained as email content.',
      '<strong>Gmail passwords, address books, contact lists, and full inbox contents</strong> are not collected by GuardScope.',
      '<strong>Browsing history outside Gmail</strong> is not collected.',
      '<strong>Full payment card numbers</strong> are not handled by GuardScope; payment processors handle payment details.',
    ],
  },
  {
    title: '5. Purpose of processing',
    bullets: [
      'Provide user-requested Gmail email threat analysis and advisory results.',
      'Enforce anonymous, free, promo, and paid quotas.',
      'Prevent abuse, fraud, API scraping, and attempts to bypass service limits.',
      'Operate accounts, promo codes, subscriptions, support, and diagnostics.',
      'Improve reliability and security without storing user email content.',
    ],
  },
  {
    title: '6. Subprocessors and third-party services',
    preamble: 'GuardScope uses third-party services only where needed to provide analysis, authentication, hosting, payment, or support:',
    bullets: [
      '<strong>InceptionLabs Mercury-2:</strong> receives email text needed for AI-assisted threat analysis.',
      '<strong>VirusTotal, Google Safe Browsing, PhishTank, URLhaus, and SpamHaus:</strong> receive URLs or domains needed for threat-intelligence checks.',
      '<strong>Cloudflare DNS and RDAP providers:</strong> receive domains needed for sender authentication, DNS, and domain-age checks.',
      '<strong>Supabase:</strong> provides authentication and database services for accounts, quotas, promo codes, and subscription state.',
      '<strong>Paystack:</strong> processes payments and returns billing status to GuardScope when paid plans are enabled.',
      '<strong>Vercel:</strong> hosts the website and backend API.',
      '<strong>Resend:</strong> may send transactional email such as promo codes, account messages, or support responses.',
    ],
  },
  {
    title: '7. Retention',
    bullets: [
      `Anonymous usage counters support the ${QUOTAS.anonymousDaily}-messages-per-day quota and abuse prevention.`,
      `Signed-in free-account counters support the ${QUOTAS.signedInFreeMonthly}-messages-per-month quota and account operation.`,
      `Promo records support the ${QUOTAS.promoProDays}-day launch-code program and may be retained for support, fraud prevention, and audit purposes.`,
      'Account and subscription records are retained while your account is active and as needed for legal, tax, fraud-prevention, dispute-resolution, or security reasons.',
      'Email content submitted for analysis is not retained in GuardScope databases after the analysis response is produced.',
    ],
  },
  {
    title: '8. Chrome Web Store Limited Use disclosure',
    body: 'GuardScope uses information received from Chrome extension functionality and Google-related surfaces only to provide Gmail email threat analysis, quota enforcement, account operation, security, and user-requested support. GuardScope does not sell this data or use it for advertising. GuardScope will use information received from Google APIs in accordance with the Chrome Web Store User Data Policy, including the Limited Use requirements.',
  },
  {
    title: '9. Cookies, analytics, and marketing',
    body: 'The Chrome extension does not use advertising cookies. The website may use essential cookies or equivalent storage for authentication and service operation. GuardScope does not use third-party advertising pixels on the launch website. If analytics are added later, they should be limited to product and site reliability metrics and disclosed here.',
  },
  {
    title: '10. Your choices and rights',
    bullets: [
      '<strong>Access:</strong> request a copy of account, quota, promo, or subscription records associated with your account.',
      '<strong>Deletion:</strong> request account deletion and removal of associated account records, subject to legal, security, fraud-prevention, and dispute-resolution retention obligations.',
      '<strong>Correction:</strong> ask us to correct inaccurate account or promo records.',
      '<strong>Opt out:</strong> uninstall the extension or stop using the service at any time.',
    ],
    footer: `Email privacy requests to ${PRIVACY_EMAIL}.`,
  },
  {
    title: '11. Regional privacy notes',
    body: 'GuardScope is designed around data minimization and user-triggered processing. Users may have rights under privacy laws such as the Nigeria Data Protection Act, GDPR, UK GDPR, or state privacy laws depending on location and circumstances. Nothing in this policy limits mandatory rights available under applicable law.',
  },
  {
    title: '12. Children',
    body: 'GuardScope is not directed to children under 13, and we do not knowingly collect data from children.',
  },
  {
    title: '13. Contact',
    body: `Privacy questions: ${PRIVACY_EMAIL}\nGeneral support: ${SUPPORT_EMAIL}`,
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal / Privacy"
      title="Privacy Policy"
      description="A plain-English privacy policy for GuardScope's user-triggered Gmail analysis, no email-content storage posture, subprocessors, retention, and Chrome Web Store disclosures."
      effectiveDate={EFFECTIVE_DATE}
      sections={sections}
    />
  )
}
