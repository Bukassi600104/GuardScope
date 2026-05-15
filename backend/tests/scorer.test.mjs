import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const scorer = readFileSync(new URL('../lib/scorer.ts', import.meta.url), 'utf8')

test('scoreToLevel uses launch-approved risk thresholds', () => {
  assert.match(scorer, /if \(score <= 25\) return 'SAFE'/)
  assert.match(scorer, /if \(score <= 49\) return 'LOW'/)
  assert.match(scorer, /if \(score <= 69\) return 'MEDIUM'/)
  assert.match(scorer, /if \(score <= 84\) return 'HIGH'/)
  assert.match(scorer, /return 'CRITICAL'/)
})

test('threat-intel hits force critical minimum score', () => {
  assert.match(scorer, /anyThreatHit[\s\S]*Math\.max\(finalScore, 85\)/)
})

test('trusted domains are capped only without threat hits and free-provider trust', () => {
  assert.match(scorer, /intel\.trustHint && !anyThreatHit && !intel\.freeProvider/)
  assert.match(scorer, /Math\.min\(finalScore, 40\)/)
})
