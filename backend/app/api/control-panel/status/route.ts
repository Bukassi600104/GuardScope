import { NextRequest, NextResponse } from 'next/server'
import { verifyControlPanelBearer } from '../../../../lib/controlPanelAuth'
import { CHROME_WEB_STORE_URL, CTA_LABEL, EXTENSION_STATUS, SUPPORT_EMAIL } from '../../../../lib/launch'
import { getOwnerOperationsSnapshot } from '../../../../lib/ownerOperations'

export const dynamic = 'force-dynamic'

type StatusCheck = {
  label: string
  status: 'ok' | 'watch' | 'missing'
  detail: string
}

async function checkUrl(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
    return { ok: res.ok, status: res.status }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unable to fetch URL',
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET(req: NextRequest) {
  const owner = await verifyControlPanelBearer(req.headers.get('authorization'))
  if (!owner) {
    return NextResponse.json({ error: 'Owner sign-in required.' }, { status: 401 })
  }

  const [site, listing, ownerOperations] = await Promise.all([
    checkUrl('https://guardscope.app/api/health'),
    checkUrl(CHROME_WEB_STORE_URL),
    getOwnerOperationsSnapshot(),
  ])

  const promoRemaining = ownerOperations.promoSummary.available
  const promoDetail = ownerOperations.promoSummary.warning
    ? ownerOperations.promoSummary.warning
    : `${promoRemaining} unclaimed launch codes available.`

  const checks: StatusCheck[] = [
    {
      label: 'Website API',
      status: site.ok ? 'ok' : 'watch',
      detail: site.ok ? `Health endpoint returned ${site.status}.` : `Health endpoint returned ${site.status || 'no response'}.`,
    },
    {
      label: 'Chrome Web Store',
      status: listing.ok ? 'ok' : 'watch',
      detail: listing.ok ? `Public listing returned ${listing.status}.` : `Listing check returned ${listing.status || 'no response'}.`,
    },
    {
      label: 'Website CTA',
      status: CTA_LABEL === 'Add to Chrome' && EXTENSION_STATUS === 'listed' ? 'ok' : 'watch',
      detail: `CTA is "${CTA_LABEL}" and extension status is "${EXTENSION_STATUS}".`,
    },
    {
      label: 'Promo inventory',
      status: ownerOperations.promoSummary.warning ? 'watch' : promoRemaining > 10 ? 'ok' : 'watch',
      detail: promoDetail,
    },
  ]

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    owner,
    listingUrl: CHROME_WEB_STORE_URL,
    websiteUrl: 'https://guardscope.app',
    supportEmail: SUPPORT_EMAIL,
    ownerOperations,
    marketplace: {
      installs: null,
      uninstalls: null,
      source: 'Chrome Web Store dashboard',
      status: 'not_connected',
      note: 'Chrome Web Store install and uninstall counts are not exposed to this website yet. The published extension was not changed.',
    },
    bugReports: {
      open: null,
      source: SUPPORT_EMAIL,
      status: 'support_inbox',
      note: 'Bug reports currently arrive through support email and store reviews unless a dedicated bug table or ticketing integration is added.',
    },
    checks,
  })
}
