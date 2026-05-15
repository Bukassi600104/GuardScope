import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { QUOTAS, SUPPORT_EMAIL } from '../lib/launch'

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
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'GuardScope',
    title: 'GuardScope - AI Email Security for Gmail',
    description: 'Inspect suspicious Gmail messages before you click.',
    url: '/',
    images: [
      {
        url: '/og-image.svg',
        width: 1536,
        height: 1024,
        alt: 'GuardScope for Gmail - AI-assisted phishing analysis before you click',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@guardscope',
    creator: '@guardscope',
    title: 'GuardScope - AI Email Security for Gmail',
    description: 'Inspect suspicious Gmail messages before you click.',
    images: ['/og-image.svg'],
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
  logo: `${SITE_URL}/logo.png`,
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
  screenshot: `${SITE_URL}/og-image.svg`,
  featureList: [
    'SPF, DKIM, and DMARC checks',
    'VirusTotal URL scanning',
    'Google Safe Browsing integration',
    'Mercury-2 AI analysis',
    'Domain age and RDAP lookup',
    'PhishTank and URLhaus threat intelligence',
    'Plain-English advisory risk reports',
  ],
  offers: [
    {
      '@type': 'Offer',
      name: 'Free Plan',
      price: '0',
      priceCurrency: 'USD',
      description: `${QUOTAS.anonymousDaily} anonymous analyses per day per IP and ${QUOTAS.signedInFreeMonthly} signed-in free analyses per month.`,
    },
    {
      '@type': 'Offer',
      name: 'Launch Promo',
      price: '0',
      priceCurrency: 'USD',
      description: `${QUOTAS.promoProDays} days of Pro access for eligible launch-code users.`,
    },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
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
