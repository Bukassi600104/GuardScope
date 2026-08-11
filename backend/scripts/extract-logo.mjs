import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const input = fileURLToPath(new URL('../public/logo.png', import.meta.url))
const output = fileURLToPath(new URL('../public/logo-transparent.png', import.meta.url))
const iconOutput = fileURLToPath(new URL('../public/logo-icon-transparent.png', import.meta.url))
const background = [9, 22, 40]

const source = sharp(input)
const metadata = await source.metadata()
const pixels = await source.raw().toBuffer()
const rgba = Buffer.alloc(metadata.width * metadata.height * 4)

for (let sourceOffset = 0, targetOffset = 0; sourceOffset < pixels.length; sourceOffset += 3, targetOffset += 4) {
  const red = pixels[sourceOffset]
  const green = pixels[sourceOffset + 1]
  const blue = pixels[sourceOffset + 2]
  const distance = Math.hypot(red - background[0], green - background[1], blue - background[2])

  const alpha = distance <= 18 ? 0 : distance >= 36 ? 255 : Math.round(((distance - 18) / 18) * 255)
  rgba[targetOffset] = alpha === 0 ? 0 : red
  rgba[targetOffset + 1] = alpha === 0 ? 0 : green
  rgba[targetOffset + 2] = alpha === 0 ? 0 : blue
  rgba[targetOffset + 3] = alpha
}

await sharp(rgba, {
  raw: { width: metadata.width, height: metadata.height, channels: 4 },
})
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(output)

const result = await sharp(output).metadata()
await sharp(output)
  .extract({ left: 0, top: 0, width: result.height, height: result.height })
  .png({ compressionLevel: 9 })
  .toFile(iconOutput)
console.log(`Created logo-transparent.png (${result.width}x${result.height}, alpha: ${result.hasAlpha})`)
