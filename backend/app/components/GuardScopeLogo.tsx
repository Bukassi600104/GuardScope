import Image from 'next/image'

interface LogoProps {
  size?: number
  showText?: boolean
  textSize?: number
  variant?: 'color' | 'white' | 'dark'
}

const ASSET_WIDTH = 811
const ASSET_HEIGHT = 224
const ICON_WIDTH = 226

/** Renders the original GuardScope artwork from public/logo.png after background extraction. */
export function GuardScopeLogo({ size = 40, showText = true, textSize, variant = 'color' }: LogoProps) {
  const iconOnly = !showText || textSize === 0
  const renderedWidth = Math.round(size * (ASSET_WIDTH / ASSET_HEIGHT))
  const cropWidth = Math.round(size * (ICON_WIDTH / ASSET_HEIGHT))

  return (
    <span
      className={`guardscope-logo guardscope-logo-${variant}${iconOnly ? ' guardscope-logo-icon' : ''}`}
      style={{ width: iconOnly ? cropWidth : renderedWidth, height: size }}
    >
      <Image
        src="/logo-transparent.png"
        alt="GuardScope"
        width={ASSET_WIDTH}
        height={ASSET_HEIGHT}
        priority={size >= 34}
        style={{ width: renderedWidth, height: size, maxWidth: 'none' }}
      />
    </span>
  )
}

export default GuardScopeLogo
