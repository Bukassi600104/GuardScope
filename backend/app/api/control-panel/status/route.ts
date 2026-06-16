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
  const issueWarning = ownerOperations.issueSummary.warning
  const issueDetail = issueWarning
    ? issueWarning
    : `${ownerOperations.issueSummary.open} open operational events, ${ownerOperations.issueSummary.critical} critical.`
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
    {
      label: 'Operational issues',
      status: issueWarning ? 'watch' : ownerOperations.issueSummary.critical > 0 ? 'missing' : ownerOperations.issueSummary.open > 0 ? 'watch' : 'ok',
      detail: issueDetail,
    },
    {
      label: 'Scan telemetry',
      status: ownerOperations.analysisSummary.warning ? 'watch' : 'ok',
      detail: ownerOperations.analysisSummary.warning ?? `${ownerOperations.analysisSummary.last24h} scans in the last 24 hours.`,
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
      installs: ownerOperations.extensionSummary.installs,
      uninstalls: ownerOperations.extensionSummary.uninstalls,
      activeApproximate: ownerOperations.extensionSummary.activeApproximate,
      source: 'GuardScope extension lifecycle telemetry',
      status: ownerOperations.extensionSummary.warning ? 'not_configured' : 'connected',
      note: ownerOperations.extensionSummary.warning
        ? `${ownerOperations.extensionSummary.warning}. Chrome Web Store dashboard remains the source of truth for historical install totals.`
        : 'Counts begin after users receive the extension version that sends lifecycle events. Chrome Web Store remains the source of truth for historical install totals.',
    },
    bugReports: {
      open: ownerOperations.issueSummary.open,
      source: 'operational_events',
      status: ownerOperations.issueSummary.warning ? 'not_configured' : 'connected',
      note: ownerOperations.issueSummary.warning
        ? 'Apply migration 007_operational_events.sql to capture backend failures in the Control Center. Support email and store reviews still need manual review.'
        : `Capturing backend operational events. Continue checking ${SUPPORT_EMAIL} and Chrome Web Store reviews for user-submitted issues.`,
    },
    checks,
  })
}
