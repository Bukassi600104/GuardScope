import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const i18n = readFileSync(new URL('../src/utils/i18n.ts', import.meta.url), 'utf8')
const sidebar = readFileSync(new URL('../src/sidebar/App.tsx', import.meta.url), 'utf8')
const permissions = readFileSync(new URL('../PERMISSION_JUSTIFICATIONS.md', import.meta.url), 'utf8')

test('anonymous quota copy is daily, not monthly', () => {
  assert.match(i18n, /Daily limit reached/)
  assert.match(i18n, /5 free analyses today/)
  assert.match(sidebar, /5 free today/)
})

test('permission documentation matches current manifest model', () => {
  assert.match(permissions, /`storage`/)
  assert.match(permissions, /`clipboardWrite`/)
  assert.match(permissions, /`sidePanel`/)
  assert.match(permissions, /`tabs`/)
  assert.doesNotMatch(permissions, /`activeTab`/)
  assert.doesNotMatch(permissions, /`scripting`/)
})
