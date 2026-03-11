import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upgrade to Pro',
  description: 'Activate your GuardScope Pro access — unlimited email analyses, full AI + threat intel layers. Enter your early access promo code.',
  alternates: { canonical: '/upgrade' },
  openGraph: {
    url: '/upgrade',
    type: 'website',
    title: 'GuardScope Pro — Unlimited Email Security',
    description: 'Unlimited phishing analyses, full Mercury-2 AI, VirusTotal, and 4 threat intel feeds.',
  },
  robots: { index: true, follow: false },
}

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
