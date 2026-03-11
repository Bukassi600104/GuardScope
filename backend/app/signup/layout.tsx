import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your free GuardScope account. Get 5 email phishing analyses per day — no credit card required.',
  alternates: { canonical: '/signup' },
  openGraph: {
    url: '/signup',
    type: 'website',
    title: 'Create your GuardScope account',
    description: 'Get 5 free phishing analyses per day. Protect your inbox in seconds.',
  },
  robots: { index: true, follow: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
