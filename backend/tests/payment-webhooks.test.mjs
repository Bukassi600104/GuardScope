import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const paystackWebhook = readFileSync(new URL('../app/api/paystack/webhook/route.ts', import.meta.url), 'utf8')
const stripeWebhook = readFileSync(new URL('../app/api/stripe/webhook/route.ts', import.meta.url), 'utf8')

test('paid subscription webhooks clear promo expiry state', () => {
  assert.match(paystackWebhook, /pro_expires_at: null/)
  assert.match(stripeWebhook, /pro_expires_at: null/)
  assert.match(paystackWebhook, /tier: 'free' \| 'pro'/)
  assert.match(stripeWebhook, /tier: 'free' \| 'pro'/)
})
