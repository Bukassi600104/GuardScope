/**
 * emailrep.io — Email Address Reputation API
 *
 * Checks if an email address has been seen in spam campaigns, is disposable,
 * blacklisted, or linked to malicious activity. Works without an API key for
 * 100 requests/day; free key (emailrep.io) gives 1000/day.
 *
 * API: GET https://emailrep.io/{email_address}
 * Headers: Key: {api_key} (optional)
 *
 * Response fields used:
 *   suspicious: boolean — emailrep flagged as suspicious
 *   blacklisted: boolean — in known malicious email lists
 *   credentials_leaked: boolean — appeared in data breaches
 *   spam: boolean — used for spam campaigns
 *   spoofing: boolean — known spoofing patterns
 *   disposable: boolean — temporary email address service
 *   free_provider: boolean — free email provider (gmail, yahoo, etc.)
 *   profiles: string[] — social/web profiles tied to this address
 */

import type { EmailRepResult } from './types'

export async function emailRepCheck(email: string): Promise<EmailRepResult> {
  const apiKey = process.env.EMAILREP_API_KEY

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'GuardScope/3.0',
    }
    if (apiKey) headers['Key'] = apiKey

    const res = await fetch(`https://emailrep.io/${encodeURIComponent(email)}`, {
      headers,
      signal: AbortSignal.timeout(3000),
    })

    if (res.status === 429) {
      return { suspicious: false, blacklisted: false, disposable: false, maliciousActivity: false, spoofing: false, error: 'rate_limited' }
    }
    if (!res.ok) {
      return { suspicious: false, blacklisted: false, disposable: false, maliciousActivity: false, spoofing: false, error: `HTTP ${res.status}` }
    }

    const data = await res.json() as {
      suspicious?: boolean
      blacklisted?: boolean
      credentials_leaked?: boolean
      spam?: boolean
      spoofing?: boolean
      disposable?: boolean
      free_provider?: boolean
      details?: {
        blacklisted?: boolean
        malicious_activity?: boolean
        malicious_activity_recent?: boolean
        credentials_leaked?: boolean
        credentials_leaked_recent?: boolean
        suspicious_tld?: boolean
        spam?: boolean
        spoofing?: boolean
        disposable?: boolean
      }
    }

    return {
      suspicious: !!(data.suspicious || data.details?.suspicious_tld),
      blacklisted: !!(data.blacklisted || data.details?.blacklisted),
      disposable: !!(data.disposable || data.details?.disposable),
      maliciousActivity: !!(data.details?.malicious_activity || data.details?.malicious_activity_recent),
      spoofing: !!(data.spoofing || data.details?.spoofing),
    }
  } catch (err) {
    return {
      suspicious: false,
      blacklisted: false,
      disposable: false,
      maliciousActivity: false,
      spoofing: false,
      error: err instanceof Error ? err.message : 'emailrep unavailable',
    }
  }
}
