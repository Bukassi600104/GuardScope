import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const repositoryRoot = resolve(import.meta.dirname, '..', '..')

test('tracked source contains only the canonical guardscope.app domain', () => {
  const trackedFiles = execFileSync('git', ['ls-files', '-z'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  }).split('\0').filter(Boolean)

  const invalidDomain = /guardscope(?:[-_.]?update|\.io)/i
  const violations = []

  for (const relativePath of trackedFiles) {
    if (/\.(?:docx|ico|png|zip)$/i.test(relativePath)) continue

    const contents = readFileSync(resolve(repositoryRoot, relativePath), 'utf8')
    if (invalidDomain.test(contents)) violations.push(relativePath)
  }

  assert.deepEqual(violations, [])
})
