import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GuardScope — AI Email Security for Gmail',
  description: 'Stop phishing before it stops you. GuardScope analyzes every email in seconds — SPF/DKIM/DMARC, VirusTotal, domain age, and Mercury-2 AI — all in a Chrome sidebar.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'GuardScope — AI Email Security for Gmail',
    description: 'Inspect before you trust. AI-powered phishing detection inside Gmail.',
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
