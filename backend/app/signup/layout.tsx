import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your free GuardScope account. Start with 5 anonymous email phishing analyses per day - no credit card required.',
  alternates: { canonical: '/signup' },
  openGraph: {
    url: '/signup',
    type: 'website',
    title: 'Create your GuardScope account',
    description: 'Start with 5 anonymous phishing analyses per day. Inspect suspicious Gmail messages before you click.',
  },
  robots: { index: true, follow: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
