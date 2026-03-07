import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% of transactions for performance
  environment: process.env.VERCEL_ENV ?? 'development',
  enabled: !!process.env.SENTRY_DSN,  // disabled if DSN not configured
})
