import React, { useEffect, useState } from 'react'
import type { AccountStatus, AuthState } from '../utils/auth'
import { BACKEND_URL } from '../config'
import { GuardScopeMark } from '../components/GuardScopeMark'

const SIGNED_OUT: AuthState = {
  isAuthenticated: false,
  userId: null,
  email: null,
  tier: 'free',
  token: null,
  account: null,
}

function accountLabel(account?: AccountStatus | null) {
  if (!account) return 'ACCOUNT'
  if (account.accessPlan !== 'trial') return account.accessPlan.toUpperCase()
  return account.accessMode === 'legacy' ? 'ACTIVE' : 'TRIAL'
}

export default function Popup() {
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [isGmailTab, setIsGmailTab] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      setIsGmailTab((tabs[0]?.url ?? '').includes('mail.google.com'))
    })
    chrome.runtime.sendMessage({ type: 'GET_AUTH' }, (state: AuthState | undefined) => {
      setAuth(state?.isAuthenticated ? state : SIGNED_OUT)
      if (state?.isAuthenticated) refreshAccount()
    })
  }, [])

  function refreshAccount() {
    chrome.runtime.sendMessage(
      { type: 'REFRESH_ACCOUNT' },
      (response: { success?: boolean; account?: AccountStatus } | undefined) => {
        if (response?.success && response.account) {
          setAuth(previous => previous ? { ...previous, account: response.account } : previous)
        }
      },
    )
  }

  function openUrl(path: string) {
    chrome.tabs.create({ url: `${BACKEND_URL}${path}` })
    window.close()
  }

  function openGmail() {
    chrome.tabs.query({ url: 'https://mail.google.com/*' }, tabs => {
      if (tabs.length && tabs[0].id) {
        chrome.tabs.update(tabs[0].id, { active: true })
        if (tabs[0].windowId) chrome.windows.update(tabs[0].windowId, { focused: true })
      } else {
        chrome.tabs.create({ url: 'https://mail.google.com' })
      }
      window.close()
    })
  }

  function handleSignIn(event: React.FormEvent) {
    event.preventDefault()
    setSigningIn(true)
    setError('')
    chrome.runtime.sendMessage(
      { type: 'SIGN_IN', email, password },
      (response: { success?: boolean; error?: string } | undefined) => {
        setSigningIn(false)
        if (chrome.runtime.lastError || !response?.success) {
          setError(response?.error ?? 'Unable to sign in. Please try again.')
          return
        }
        chrome.runtime.sendMessage({ type: 'GET_AUTH' }, (state: AuthState | undefined) => {
          setAuth(state?.isAuthenticated ? state : SIGNED_OUT)
        })
      },
    )
  }

  function handleSignOut() {
    chrome.runtime.sendMessage({ type: 'SIGN_OUT' }, () => setAuth(SIGNED_OUT))
  }

  if (!auth) {
    return <div className="w-80 bg-[#06131f] px-5 py-10 text-center text-xs text-slate-400">Syncing account...</div>
  }

  const account = auth.account
  const isTrial = account?.accessPlan === 'trial' && account.accessMode !== 'legacy'
  const statusText = account?.entitled
    ? isTrial
      ? `${account.trialScansRemaining} of ${account.trialScanLimit} trial scans remaining`
      : account?.cancelAtPeriodEnd
        ? 'Active until the end of your billing period'
        : 'Protection active'
    : 'Subscription required to continue scanning'

  return (
    <main className="w-80 bg-[#06131f] text-slate-100">
      <header className="flex items-center gap-3 border-b border-sky-400/15 px-5 py-4">
        <GuardScopeMark size={32} />
        <div>
          <p className="text-sm font-semibold tracking-tight">GuardScope</p>
          <p className="text-[10px] text-slate-500">Email threat intelligence</p>
        </div>
        <span className="ml-auto rounded-full border border-sky-400/25 px-2 py-1 text-[9px] font-semibold tracking-widest text-sky-300">
          {accountLabel(account)}
        </span>
      </header>

      {!isGmailTab && (
        <section className="border-b border-sky-400/15 bg-sky-400/[0.04] px-5 py-4">
          <p className="text-xs font-semibold">GuardScope works inside Gmail</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Open an email in Gmail to inspect its sender, links, and risk signals.</p>
          <button onClick={openGmail} className="mt-3 w-full rounded-lg bg-sky-400 px-4 py-2 text-xs font-bold text-slate-950">Open Gmail</button>
        </section>
      )}

      {auth.isAuthenticated ? (
        <section className="space-y-4 px-5 py-5">
          <div>
            <p className="truncate text-xs font-medium">{auth.email}</p>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${account?.entitled !== false ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <p className="text-[11px] text-slate-300">{statusText}</p>
              </div>
              {isTrial && account && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.max(0, (account.trialScansRemaining / account.trialScanLimit) * 100)}%` }} />
                </div>
              )}
            </div>
          </div>

          <button onClick={() => openUrl('/account')} className="w-full rounded-lg bg-sky-400 px-4 py-2.5 text-xs font-bold text-slate-950">
            {account?.entitled === false ? 'Choose a plan' : 'Manage account'}
          </button>
          <button onClick={handleSignOut} className="w-full rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400">Sign out</button>
        </section>
      ) : (
        <section className="px-5 py-5">
          <div className="mb-4">
            <p className="text-sm font-semibold">Sign in to scan</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Your account keeps trial usage and subscription access synchronized across the website and extension.</p>
          </div>
          <form onSubmit={handleSignIn} className="space-y-2.5">
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" required className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs outline-none placeholder:text-slate-600 focus:border-sky-400/60" />
            <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" required className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs outline-none placeholder:text-slate-600 focus:border-sky-400/60" />
            {error && <p className="text-[10px] text-red-400">{error}</p>}
            <button type="submit" disabled={signingIn} className="w-full rounded-lg bg-sky-400 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-60">
              {signingIn ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <button onClick={() => openUrl('/signup')} className="mt-3 w-full text-center text-[11px] font-medium text-sky-300">Create an account and start your trial</button>
        </section>
      )}

      <footer className="border-t border-white/10 px-5 py-2.5 text-center text-[9px] tracking-wide text-slate-600">SECURE ACCOUNT SYNC</footer>
    </main>
  )
}
