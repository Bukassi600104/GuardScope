import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const homepage = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
const logo = readFileSync(new URL('../app/components/GuardScopeLogo.tsx', import.meta.url), 'utf8')
const extractor = readFileSync(new URL('../scripts/extract-logo.mjs', import.meta.url), 'utf8')

test('premium website avoids decorative gradients and generated imagery', () => {
  assert.doesNotMatch(styles, /linear-gradient|radial-gradient/i)
  assert.doesNotMatch(homepage, /<img|backgroundImage|imagegen/i)
  assert.match(homepage, /Read the risk/)
})

test('website uses the original GuardScope artwork rather than a recreated mark', () => {
  assert.match(logo, /src="\/logo-transparent\.png"/)
  assert.doesNotMatch(logo, /<svg|<path|<circle/)
  assert.match(extractor, /public\/logo\.png/)
  assert.match(extractor, /const background = \[9, 22, 40\]/)
})
