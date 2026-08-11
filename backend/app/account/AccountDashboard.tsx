'use client'

import { useEffect, useState } from 'react'

interface AccountStatus {
  email: string | null
  accessPlan: 'trial' | 'pro' | 'team'
  subscriptionStatus: string
  trialScansUsed: number
  trialScanLimit: number
  trialScansRemaining: number
  paymentReady: boolean
  currentPeriodEnd: string | null
  nextPaymentAt: string | null
  cancelAtPeriodEnd: boolean
}

export function AccountDashboard() {
  const [status, setStatus] = useState<AccountStatus | null>(null)
  const [error, setError] = useState('')
  const [billingLoading, setBillingLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/session', { method: 'POST', cache: 'no-store' })
      .then(() => fetch('/api/account/status', { cache: 'no-store' }))
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = '/signup'
          return null
        }
        if (!res.ok) throw new Error('Account status is temporarily unavailable.')
        return res.json() as Promise<AccountStatus>
      })
      .then((data) => data && setStatus(data))
      .catch((reason: Error) => setError(reason.message))
  }, [])

  async function startCheckout(interval: 'monthly' | 'annual') {
    setBillingLoading(true)
    setError('')
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      })
      const data = await res.json() as { url?: string; message?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.message ?? data.error ?? 'Billing is not available yet.')
      window.location.href = data.url
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Billing is not available yet.')
      setBillingLoading(false)
    }
  }

  async function manageBilling() {
    setBillingLoading(true)
    setError('')
    try {
      const res = await fetch('/api/paystack/manage', { method: 'POST' })
      const data = await res.json() as { url?: string; message?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.message ?? data.error ?? 'Unable to open billing management.')
      window.location.href = data.url
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to open billing management.')
      setBillingLoading(false)
    }
  }

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  if (!status && !error) return <div className="account-loading">Loading your protection status…</div>

  return (
    <div className="account-dashboard">
      {error && <div className="account-alert">{error}</div>}
      {status && (
        <>
          <section className="account-hero-card">
            <div>
              <span className="section-kicker">Protection account</span>
              <h1>{status.accessPlan === 'trial' ? 'Your GuardScope trial' : 'GuardScope Pro is active'}</h1>
              <p>{status.email}</p>
            </div>
            <span className={`status-pill status-${status.subscriptionStatus}`}>{status.subscriptionStatus.replace('_', ' ')}</span>
          </section>

          <section className="account-metric-grid">
            <article className="account-metric">
              <span>Plan</span><strong>{status.accessPlan === 'trial' ? '5-scan trial' : status.accessPlan.toUpperCase()}</strong>
            </article>
            <article className="account-metric">
              <span>Trial scans remaining</span><strong>{status.trialScansRemaining}</strong>
              <small>{status.trialScansUsed} of {status.trialScanLimit} used</small>
            </article>
            <article className="account-metric">
              <span>Next billing date</span><strong>{status.nextPaymentAt ? new Date(status.nextPaymentAt).toLocaleDateString() : '—'}</strong>
            </article>
          </section>

          <section className="account-billing-card">
            <div>
              <span className="section-kicker">Billing</span>
              <h2>{status.paymentReady ? 'Choose your protection plan' : 'Paystack connection pending'}</h2>
              <p>{status.paymentReady ? 'Secure recurring billing managed by Paystack.' : 'Your account and trial are ready. Subscription checkout will unlock automatically when the live Paystack details are connected.'}</p>
            </div>
            <div className="account-actions">
              {status.accessPlan === 'trial' ? (
                <>
                  <button disabled={!status.paymentReady || billingLoading} onClick={() => startCheckout('monthly')}>Subscribe monthly</button>
                  <button className="secondary" disabled={!status.paymentReady || billingLoading} onClick={() => startCheckout('annual')}>Subscribe annually</button>
                </>
              ) : (
                <button disabled={!status.paymentReady || billingLoading} onClick={manageBilling}>Manage subscription</button>
              )}
              <button className="text-button" onClick={signOut}>Sign out</button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
