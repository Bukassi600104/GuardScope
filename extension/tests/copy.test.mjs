import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const i18n = readFileSync(new URL('../src/utils/i18n.ts', import.meta.url), 'utf8')
const sidebar = readFileSync(new URL('../src/sidebar/App.tsx', import.meta.url), 'utf8')
const permissions = readFileSync(new URL('../PERMISSION_JUSTIFICATIONS.md', import.meta.url), 'utf8')
const mark = readFileSync(new URL('../src/components/GuardScopeMark.tsx', import.meta.url), 'utf8')

test('extension copy uses an account-required lifetime trial', () => {
  assert.match(i18n, /Trial complete/)
  assert.match(i18n, /five lifetime trial scans/)
  assert.match(sidebar, /Five lifetime trial scans per account/)
  assert.doesNotMatch(sidebar, /free today|free\/month|Free promo/i)
})

test('extension uses the approved GuardScope circle geometry', () => {
  assert.match(mark, /37\.38/)
  assert.match(mark, /12\.53/)
  assert.match(mark, /M 32\.26 30\.50 A 13 13 0 1 1 32\.26 17\.50/)
})

test('permission documentation matches current manifest model', () => {
  assert.match(permissions, /`storage`/)
  assert.match(permissions, /`clipboardWrite`/)
  assert.match(permissions, /`sidePanel`/)
  assert.match(permissions, /`tabs`/)
  assert.doesNotMatch(permissions, /`activeTab`/)
  assert.doesNotMatch(permissions, /`scripting`/)
})
