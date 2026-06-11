import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const config = readFileSync(new URL('../src/config.ts', import.meta.url), 'utf8')
const background = readFileSync(new URL('../src/background.ts', import.meta.url), 'utf8')
const popup = readFileSync(new URL('../src/popup/Popup.tsx', import.meta.url), 'utf8')
const sidebar = readFileSync(new URL('../src/sidebar/App.tsx', import.meta.url), 'utf8')

test('extension has a fixed production website URL', () => {
  assert.match(config, /BACKEND_URL = 'https:\/\/guardscope\.app'/)
  assert.doesNotMatch(background, /import\.meta\.env\.VITE_BACKEND_URL/)
  assert.doesNotMatch(popup, /import\.meta\.env\.VITE_BACKEND_URL/)
  assert.doesNotMatch(sidebar, /import\.meta\.env\.VITE_BACKEND_URL/)
})

test('extension auth goes through guardscope.app backend only', () => {
  assert.match(background, /\/api\/auth\/signin/)
  assert.match(background, /client: 'extension'/)
  assert.match(background, /\/api\/auth\/refresh/)
  assert.doesNotMatch(background, /VITE_SUPABASE/)
  assert.doesNotMatch(background, /auth\/v1\/token/)
})
