import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const homepage = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
const logo = readFileSync(new URL('../app/components/GuardScopeLogo.tsx', import.meta.url), 'utf8')

test('premium website avoids decorative gradients and generated imagery', () => {
  assert.doesNotMatch(styles, /linear-gradient|radial-gradient/i)
  assert.doesNotMatch(homepage, /<img|backgroundImage|imagegen/i)
  assert.match(homepage, /Know what is hiding in your inbox/)
})

test('website mark uses the approved GuardScope circle geometry', () => {
  assert.match(logo, /const ox = 37\.38/)
  assert.match(logo, /const oy = 12\.53/)
  assert.match(logo, /A \$\{r\} \$\{r\} 0 1 1/)
})
