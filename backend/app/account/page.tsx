import type { Metadata } from 'next'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { AccountDashboard } from './AccountDashboard'

export const metadata: Metadata = {
  title: 'Account',
  description: 'Manage your GuardScope trial, protection plan, and billing status.',
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return (
    <>
      <Navbar activePage="/account" />
      <main className="account-page-shell">
        <AccountDashboard />
      </main>
      <Footer />
    </>
  )
}
