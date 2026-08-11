import type { Metadata } from 'next'
import { LegalPage } from '../components/LegalPage'
import { QUOTAS, SUPPORT_EMAIL } from '../../lib/launch'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'GuardScope Terms of Service: usage rules, acceptable use, quotas, promo codes, advisory results, and account deletion.',
  alternates: { canonical: '/terms' },
  openGraph: { url: '/terms', type: 'website' },
}

const EFFECTIVE_DATE = 'May 15, 2026'

const sections = [
  {
    title: '1. Acceptance',
    body: 'By installing, accessing, or using GuardScope, you agree to these Terms. If you do not agree, do not use the extension, website, APIs, or related services.',
  },
  {
    title: '2. Service purpose',
    body: 'GuardScope is a Chrome extension and web service for Gmail phishing and email threat analysis. The extension helps users inspect emails they choose to scan and returns advisory risk signals, explanations, and suggested next steps.',
  },
  {
    title: '3. Advisory security results',
    body: 'GuardScope results are informational and advisory. No security product can detect every phishing attempt, malicious link, impersonation, or business email compromise attempt. You remain responsible for decisions you make after reviewing a report, including whether to click a link, open an attachment, reply to an email, make a payment, or report a message.',
  },
  {
    title: '4. Access tiers and quotas',
    bullets: [
      `Anonymous users receive ${QUOTAS.anonymousDaily} analyses per day per IP or equivalent abuse-prevention identifier.`,
      `Signed-in free accounts include ${QUOTAS.signedInFreeMonthly} analyses per month unless upgraded or otherwise changed in the product.`,
      `Launch promo codes provide ${QUOTAS.promoProDays} days of Pro access from activation unless a specific offer states otherwise.`,
      'Paid Pro access is offered through Paystack when subscription checkout is enabled.',
      'Quotas, pricing, and feature availability may change as the service evolves, but we will not intentionally misrepresent the quota shown in the product.',
    ],
  },
  {
    title: '5. Promo-code and launch-code rules',
    body: 'Promo codes are limited, issued at our discretion, and intended for individual early-access users. Codes may not be sold, transferred, automated, shared publicly for mass redemption, or used to create multiple accounts to bypass limits. We may revoke a code, downgrade access, or suspend an account if we detect fraud, resale, abuse, or attempts to bypass service limits.',
  },
  {
    title: '6. Acceptable use',
    bullets: [
      'Use GuardScope only for lawful analysis of emails you are authorized to access.',
      'Do not reverse engineer, scrape, overload, attack, or probe the service outside ordinary product use.',
      'Do not bypass quotas, authentication, billing, rate limits, or promo-code limits.',
      'Do not submit payloads intended to exploit GuardScope, its providers, or other users.',
      'Do not process another person\'s email without appropriate permission.',
      'Do not resell GuardScope access unless we provide written authorization.',
    ],
  },
  {
    title: '7. Privacy and data',
    body: 'Email content is transmitted for user-triggered analysis and is not stored in GuardScope databases after the analysis response is produced. Account, quota, subscription, promo, diagnostic, and abuse-prevention metadata may be stored where needed to operate the service. See the Privacy Policy at guardscope.app/privacy for details.',
  },
  {
    title: '8. Accounts and security',
    body: `You are responsible for keeping your account credentials secure and for activity under your account. If you believe your account or promo code has been compromised, contact ${SUPPORT_EMAIL}. We may suspend or restrict accounts where needed to protect users, the service, or third-party providers.`,
  },
  {
    title: '9. Account deletion',
    body: `You may request account deletion by using available product controls or contacting ${SUPPORT_EMAIL}. Some records may be retained where required for legal, tax, security, fraud-prevention, abuse-prevention, or dispute-resolution reasons.`,
  },
  {
    title: '10. Payments',
    body: 'If paid subscriptions are enabled, subscriptions renew automatically until cancelled. Payment processors handle card and payment details. Unless required by law or stated in a separate offer, partial-month refunds are not guaranteed. Taxes, bank fees, chargebacks, and currency conversion fees may be handled by the relevant payment processor or financial institution.',
  },
  {
    title: '11. Service changes and availability',
    body: 'We may change, suspend, or discontinue features, quotas, promo campaigns, providers, pricing, or access to beta functionality. We aim to keep GuardScope available, but we do not guarantee uninterrupted or error-free operation.',
  },
  {
    title: '12. Third-party services',
    body: 'GuardScope relies on third-party services for hosting, authentication, AI-assisted analysis, threat intelligence, DNS/RDAP lookups, payment processing, and email delivery. Third-party outages, rate limits, policy changes, or inaccurate results may affect GuardScope output or availability.',
  },
  {
    title: '13. No warranty',
    body: 'GuardScope is provided "as is" and "as available" without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, uninterrupted operation, or complete threat detection.',
  },
  {
    title: '14. Limitation of liability',
    body: 'To the maximum extent permitted by law, GuardScope and its operators will not be liable for indirect, incidental, consequential, special, punitive, or exemplary damages, including losses from undetected phishing, fraud, data loss, business interruption, payment scams, reputational harm, or reliance on analysis results.',
  },
  {
    title: '15. Governing law',
    body: 'These Terms are governed by the laws of the Federal Republic of Nigeria, except where mandatory local consumer protection law provides otherwise.',
  },
  {
    title: '16. Contact',
    body: `Questions about these Terms: ${SUPPORT_EMAIL}`,
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal / Terms"
      title="Terms of Service"
      description="The rules for using GuardScope, including advisory security results, quotas, launch codes, acceptable use, account deletion, and payment terms."
      effectiveDate={EFFECTIVE_DATE}
      sections={sections}
    />
  )
}
