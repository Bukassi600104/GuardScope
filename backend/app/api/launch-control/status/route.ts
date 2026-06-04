import { NextResponse } from 'next/server'
import { CHROME_WEB_STORE_URL, CTA_LABEL, EXTENSION_STATUS, SUPPORT_EMAIL } from '../../../../lib/launch'
import { countRemainingCodes } from '../../../../lib/promo'

export const dynamic = 'force-dynamic'

type StatusCheck = {
  label: string
  status: 'ok' | 'watch' | 'missing'
  detail: string
}

async function checkUrl(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    return { ok: res.ok, status: res.status }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unable to fetch URL',
    }
  }
}

export async function POST(request: Request) {
  const configuredPassword = (process.env.LAUNCH_CONTROL_PASSWORD ?? '').trim()

  if (!configuredPassword) {
    return NextResponse.json(
      { error: 'Launch control is not configured. Set LAUNCH_CONTROL_PASSWORD in production.' },
      { status: 503 }
    )
  }

  let body: { password?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if ((body.password ?? '').trim() !== configuredPassword) {
    return NextResponse.json({ error: 'Invalid launch control password.' }, { status: 401 })
  }

  const [site, listing] = await Promise.all([
    checkUrl('https://guardscope.app/api/health'),
    checkUrl(CHROME_WEB_STORE_URL),
  ])

  let promoRemaining: number | null = null
  let promoDetail = 'Promo inventory unavailable.'
  try {
    promoRemaining = await countRemainingCodes()
    promoDetail = `${promoRemaining} unclaimed launch codes available.`
  } catch (error) {
    promoDetail = error instanceof Error ? error.message : promoDetail
  }

  const checks: StatusCheck[] = [
    {
      label: 'Website health',
      status: site.ok ? 'ok' : 'watch',
      detail: site.ok ? `Health endpoint returned ${site.status}.` : `Health endpoint returned ${site.status || 'no response'}.`,
    },
    {
      label: 'Chrome Web Store listing',
      status: listing.ok ? 'ok' : 'watch',
      detail: listing.ok ? `Public listing returned ${listing.status}.` : `Listing check returned ${listing.status || 'no response'}.`,
    },
    {
      label: 'Primary CTA state',
      status: CTA_LABEL === 'Add to Chrome' && EXTENSION_STATUS === 'listed' ? 'ok' : 'watch',
      detail: `CTA is "${CTA_LABEL}" and extension status is "${EXTENSION_STATUS}".`,
    },
    {
      label: 'Promo-code inventory',
      status: promoRemaining === null ? 'watch' : promoRemaining > 10 ? 'ok' : 'watch',
      detail: promoDetail,
    },
    {
      label: 'Enhanced Safe Browsing notice',
      status: 'watch',
      detail: 'Expected for some users while a new publisher reputation matures. Track reports, but do not ask users to disable Safe Browsing.',
    },
    {
      label: 'Chrome Web Store search',
      status: 'watch',
      detail: 'New listings may take time to index and rank. Use the direct listing URL during launch.',
    },
  ]

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    listingUrl: CHROME_WEB_STORE_URL,
    websiteUrl: 'https://guardscope.app',
    supportEmail: SUPPORT_EMAIL,
    checks,
    watchTerms: ['GuardScope', 'GuardScope Email Security', 'GuardScope Gmail', 'Gmail phishing', 'email threat analysis'],
  })
}
