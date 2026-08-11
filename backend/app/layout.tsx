import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SUPPORT_EMAIL } from '../lib/launch'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guardscope.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'GuardScope - AI Email Security for Gmail',
    template: '%s | GuardScope',
  },
  description: 'GuardScope helps Gmail users inspect suspicious emails with AI-assisted phishing analysis, URL intelligence, sender checks, and privacy-first processing.',
  keywords: [
    'phishing detection',
    'email security',
    'Gmail security',
    'Chrome extension',
    'AI email analysis',
    'phishing protection',
    'email fraud detection',
    'cybersecurity',
  ],
  authors: [{ name: 'GuardScope', url: SITE_URL }],
  creator: 'GuardScope',
  publisher: 'GuardScope',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo-icon-transparent.png',
    shortcut: '/logo-icon-transparent.png',
    apple: '/logo-icon-transparent.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'GuardScope',
    title: 'GuardScope - AI Email Security for Gmail',
    description: 'Inspect suspicious Gmail messages before you click.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@guardscope',
    creator: '@guardscope',
    title: 'GuardScope - AI Email Security for Gmail',
    description: 'Inspect suspicious Gmail messages before you click.',
  },
  alternates: {
    canonical: '/',
  },
  category: 'technology',
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GuardScope',
  url: SITE_URL,
  logo: `${SITE_URL}/logo-transparent.png`,
  description: 'AI-assisted email phishing analysis for Gmail.',
  email: SUPPORT_EMAIL,
  foundingDate: '2026',
  sameAs: [],
}

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'GuardScope',
  applicationCategory: 'SecurityApplication',
  applicationSubCategory: 'Email Security',
  operatingSystem: 'Chrome',
  browserRequirements: 'Requires Google Chrome',
  url: SITE_URL,
  description: 'AI-assisted phishing analysis Chrome extension for Gmail. Analyzes sender authentication, domain age, URLs, and email content to help users inspect suspicious emails before they click.',
  featureList: [
    'SPF, DKIM, and DMARC checks',
    'VirusTotal URL scanning',
    'Google Safe Browsing integration',
    'Mercury-2 AI analysis',
    'Domain age and RDAP lookup',
    'PhishTank and URLhaus threat intelligence',
    'Plain-English advisory risk reports',
  ],
  offers: {
    '@type': 'Offer',
    name: 'GuardScope trial',
    price: '0',
    priceCurrency: 'NGN',
    description: 'Five lifetime scans before a paid Paystack subscription is required.',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
