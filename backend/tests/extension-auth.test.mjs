import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const signinRoute = readFileSync(new URL('../app/api/auth/signin/route.ts', import.meta.url), 'utf8')
const refreshRoute = readFileSync(new URL('../app/api/auth/refresh/route.ts', import.meta.url), 'utf8')
const websiteSessionRoute = readFileSync(new URL('../app/api/auth/session/route.ts', import.meta.url), 'utf8')
const cors = readFileSync(new URL('../lib/cors.ts', import.meta.url), 'utf8')

test('extension sign-in receives session fields and website sign-in creates secure cookies', () => {
  assert.match(signinRoute, /client\?: string/)
  assert.match(signinRoute, /body\.client === 'extension'/)
  assert.match(signinRoute, /isAllowedExtensionRequest\(req\)/)
  assert.match(signinRoute, /Extension sign-in is only available from the GuardScope extension/)
  assert.match(signinRoute, /access_token/)
  assert.match(signinRoute, /refresh_token/)
  assert.match(signinRoute, /getUserTier/)
  assert.match(signinRoute, /getAccountStatus/)
  assert.match(signinRoute, /response\.cookies\.set\(ACCESS_COOKIE/)
  assert.match(signinRoute, /response\.cookies\.set\(REFRESH_COOKIE/)
  assert.match(signinRoute, /return response/)
})

test('website session rotates secure cookie tokens', () => {
  assert.match(websiteSessionRoute, /grant_type=refresh_token/)
  assert.match(websiteSessionRoute, /req\.cookies\.get\(REFRESH_COOKIE\)/)
  assert.match(websiteSessionRoute, /response\.cookies\.set\(ACCESS_COOKIE/)
  assert.match(websiteSessionRoute, /response\.cookies\.set\(REFRESH_COOKIE/)
})

test('extension token refresh is proxied through backend', () => {
  assert.match(refreshRoute, /isAllowedExtensionRequest\(req\)/)
  assert.match(refreshRoute, /Session refresh is only available from the GuardScope extension/)
  assert.match(refreshRoute, /grant_type=refresh_token/)
  assert.match(refreshRoute, /refresh_token/)
  assert.match(refreshRoute, /getUserTier/)
  assert.match(refreshRoute, /getAccountStatus/)
  assert.match(refreshRoute, /Session expired/)
})

test('published extension origin is centralized and enforced in production', () => {
  assert.match(cors, /PUBLISHED_CHROME_EXTENSION_ORIGIN/)
  assert.match(cors, /chrome-extension:\/\/\$\{PUBLISHED_EXTENSION_ID\}/)
  assert.match(cors, /isAllowedExtensionRequest/)
  assert.match(cors, /allowedExtensionOrigins\(\)\.has\(origin\)/)
  assert.match(cors, /if \(!isProductionRuntime\(\)\) return true/)
})
