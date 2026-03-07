import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' })
  }
  return _stripe
}

// Price IDs — set these in Stripe dashboard + Vercel env
export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRO_PRICE_ID ?? '',
} as const
