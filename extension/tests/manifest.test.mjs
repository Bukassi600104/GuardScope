import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'))

test('manifest uses current production domain and MV3', () => {
  assert.equal(manifest.manifest_version, 3)
  assert.equal(manifest.homepage_url, 'https://guardscope.app')
  assert.ok(manifest.host_permissions.includes('https://guardscope.app/*'))
})

test('manifest permissions match documented launch set', () => {
  assert.deepEqual([...manifest.permissions].sort(), ['clipboardWrite', 'sidePanel', 'storage', 'tabs'].sort())
})

test('extension CSP blocks remote scripts and objects', () => {
  const csp = manifest.content_security_policy.extension_pages
  assert.match(csp, /script-src 'self'/)
  assert.match(csp, /object-src 'none'/)
  const scriptDirective = csp.split(';').find((part) => part.trim().startsWith('script-src')) ?? ''
  assert.doesNotMatch(scriptDirective, /https?:\/\//)
})
