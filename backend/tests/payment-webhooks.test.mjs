import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const paystackWebhook = readFileSync(new URL('../app/api/paystack/webhook/route.ts', import.meta.url), 'utf8')
const subscriptionMigration = readFileSync(new URL('../supabase/migrations/20260811160000_subscription_foundation.sql', import.meta.url), 'utf8')

test('Paystack subscription webhooks clear promo expiry state', () => {
  assert.match(paystackWebhook, /pro_expires_at: null/)
  assert.match(paystackWebhook, /subscription\.create/)
  assert.match(paystackWebhook, /subscription\.not_renew/)
  assert.match(paystackWebhook, /invoice\.payment_failed/)
  assert.match(paystackWebhook, /timingSafeEqual/)
  assert.match(paystackWebhook, /processing_status !== 'failed'/)
  assert.match(paystackWebhook, /Webhook storage unavailable/)
  assert.match(paystackWebhook, /Webhook processing failed/)
})

test('subscription foundation is constrained and trial consumption is atomic', () => {
  assert.match(subscriptionMigration, /subscription_status in \('trialing', 'active'/)
  assert.match(subscriptionMigration, /for update/)
  assert.match(subscriptionMigration, /consume_trial_scan/)
  assert.match(subscriptionMigration, /payment_webhook_events/)
})
