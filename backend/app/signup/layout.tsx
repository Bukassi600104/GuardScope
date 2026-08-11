import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your GuardScope account and start five complete lifetime email threat-analysis scans.',
  alternates: { canonical: '/signup' },
  openGraph: {
    url: '/signup',
    type: 'website',
    title: 'Create your GuardScope account',
    description: 'Start with five complete lifetime scans. Inspect suspicious Gmail messages before you click.',
  },
  robots: { index: true, follow: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
