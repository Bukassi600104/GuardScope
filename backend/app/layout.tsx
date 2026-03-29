import './globals.css'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guardscope.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'GuardScope — AI Email Security for Gmail',
    template: '%s | GuardScope',
  },
  description: 'Stop phishing before it stops you. GuardScope analyzes every Gmail in seconds — SPF/DKIM/DMARC, VirusTotal, domain age, and Mercury-2 AI — all in a Chrome sidebar.',
  keywords: [
    'phishing detection', 'email security', 'Gmail security', 'Chrome extension',
    'AI email analysis', 'phishing protection', 'spam detection', 'email phishing',
    'cybersecurity', 'Nigeria email scam', 'email fraud detection',
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
    title: 'GuardScope — AI Email Security for Gmail',
    description: 'Inspect before you trust. AI-powered phishing detection inside Gmail.',
    url: '/',
    images: [
      {
        url: '/logo.png',
        width: 1536,
        height: 1024,
        alt: 'GuardScope — AI Email Security for Gmail',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@guardscope',
    creator: '@guardscope',
    title: 'GuardScope — AI Email Security for Gmail',
    description: 'Inspect before you trust. AI-powered phishing detection inside Gmail.',
    images: ['/logo.png'],
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
  description: 'AI-powered email phishing detection for Gmail.',
  email: 'support@guardscope.app',
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
  description: 'AI-powered phishing detection Chrome extension for Gmail. Analyzes sender authentication, domain age, URLs, and email content to detect phishing attacks in seconds.',
  screenshot: `${SITE_URL}/logo.png`,
  featureList: [
    'SPF, DKIM, DMARC authentication checks',
    'VirusTotal URL scanning',
    'Google Safe Browsing integration',
    'Mercury-2 AI deep analysis',
    'Domain age and RDAP lookup',
    'PhishTank and URLhaus threat intelligence',
    'Real-time phishing detection',
    'French and English language support',
  ],
  offers: [
    {
      '@type': 'Offer',
      name: 'Free Plan',
      price: '0',
      priceCurrency: 'USD',
      description: '5 email analyses per day, forever free.',
    },
    {
      '@type': 'Offer',
      name: 'Pro Plan',
      price: '4.99',
      priceCurrency: 'USD',
      description: 'Unlimited analyses, full AI + threat intel layers.',
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
