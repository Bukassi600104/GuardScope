import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upgrade to Pro',
  description: 'Manage your GuardScope trial and Pro subscription from one synchronized account.',
  alternates: { canonical: '/upgrade' },
  openGraph: {
    url: '/upgrade',
    type: 'website',
    title: 'GuardScope Pro - Unlimited Email Security',
    description: 'Unlimited phishing analyses, full Mercury-2 AI, VirusTotal, and 4 threat intel feeds.',
  },
  robots: { index: true, follow: false },
}

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
