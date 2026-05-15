import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const promo = readFileSync(new URL('../lib/promo.ts', import.meta.url), 'utf8')
const validateRoute = readFileSync(new URL('../app/api/promo/validate/route.ts', import.meta.url), 'utf8')
const requestRoute = readFileSync(new URL('../app/api/promo/request/route.ts', import.meta.url), 'utf8')

test('promo assignment retries and guards concurrent claims', () => {
  assert.match(promo, /for \(let attempt = 0; attempt < 3; attempt\+\+\)/)
  assert.match(promo, /status=eq\.unused&requester_email=is\.null/)
})

test('promo redemption requires authenticated matching account', () => {
  assert.match(validateRoute, /decodeJwt\(token\)/)
  assert.match(validateRoute, /jwt\.email\.toLowerCase\(\) !== email\.toLowerCase\(\)/)
  assert.match(validateRoute, /status: 403/)
})

test('promo routes use guardscope.app support address', () => {
  assert.doesNotMatch(promo, /guardscope\.io/)
  assert.doesNotMatch(requestRoute, /guardscope\.io/)
  assert.match(promo, /support@guardscope\.app/)
})
