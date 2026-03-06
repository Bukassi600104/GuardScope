import type { RdapResult } from './types'

const TIMEOUT_MS = 8000

function calcRiskLevel(ageInDays: number | null): RdapResult['riskLevel'] {
  if (ageInDays === null) return 'UNKNOWN'
  if (ageInDays < 30) return 'HIGH'
  if (ageInDays < 90) return 'MEDIUM'
  return 'LOW'
}

export async function rdapLookup(domain: string): Promise<RdapResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal,
    })

    if (!res.ok) {
      return { registrationDate: null, ageInDays: null, riskLevel: 'UNKNOWN', registrar: null, error: `HTTP ${res.status}` }
    }

    const data = await res.json() as {
      events?: Array<{ eventAction: string; eventDate: string }>
      entities?: Array<{ roles: string[]; vcardArray?: unknown[] }>
    }

    const regEvent = data.events?.find((e) => e.eventAction === 'registration')
    const registrationDate = regEvent?.eventDate ?? null

    let ageInDays: number | null = null
    if (registrationDate) {
      const ms = Date.now() - new Date(registrationDate).getTime()
      ageInDays = Math.floor(ms / 86400000)
    }

    const registrarEntity = data.entities?.find((e) => e.roles.includes('registrar'))
    let registrar: string | null = null
    if (registrarEntity?.vcardArray) {
      const vcard = registrarEntity.vcardArray as [string, unknown[]][]
      const fnEntry = vcard.flat().find((item) => Array.isArray(item) && item[0] === 'fn') as string[] | undefined
      registrar = fnEntry?.[3] ?? null
    }

    return {
      registrationDate,
      ageInDays,
      riskLevel: calcRiskLevel(ageInDays),
      registrar,
    }
  } catch (err) {
    return { registrationDate: null, ageInDays: null, riskLevel: 'UNKNOWN', registrar: null, error: String(err) }
  } finally {
    clearTimeout(timer)
  }
}
