// Run with: node scripts/generate-icons.mjs
// Generates minimal valid PNG placeholder icons for Phase 1

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Minimal 1x1 red pixel PNG (base64)
// This is a valid PNG: 1x1 red pixel
const MINIMAL_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=='

const sizes = [16, 48, 128]
const iconsDir = join(__dirname, '..', 'public', 'icons')

mkdirSync(iconsDir, { recursive: true })

for (const size of sizes) {
  const filename = join(iconsDir, `icon${size}.png`)
  writeFileSync(filename, Buffer.from(MINIMAL_PNG_BASE64, 'base64'))
  console.log(`Created ${filename}`)
}

console.log('Icons generated. Replace with real icons before production.')
