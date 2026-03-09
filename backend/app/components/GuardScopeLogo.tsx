// GuardScope SVG Logo — matches brand spec exactly
// Arc: scanning scope | Inner dot: detected threat | Outer dot: detection signal
// Colors: #39B6FF (cyan) + gradient to #1F8DFF | Background: #071C2C

interface LogoProps {
  size?: number       // icon diameter in px
  showText?: boolean  // show wordmark
  textSize?: number   // font-size for wordmark
  variant?: 'color' | 'white' | 'dark'  // monochrome variants
}

export function GuardScopeIcon({ size = 40, variant = 'color' }: { size?: number; variant?: 'color' | 'white' | 'dark' }) {
  const id = `gs-grad-${size}`
  const cx = size * 0.44   // circle center x
  const cy = size * 0.52   // circle center y
  const r = size * 0.295   // arc radius
  const sw = size * 0.085  // stroke width (≈12% of diameter)

  // Arc: 300° open at lower-right (gap ~30° to 90° clockwise from east)
  // Start at 90° (bottom), end at 30° (lower-right), going the long 300° way counterclockwise
  const toRad = (d: number) => (d * Math.PI) / 180
  const arcX1 = cx + r * Math.cos(toRad(90))
  const arcY1 = cy + r * Math.sin(toRad(90))
  const arcX2 = cx + r * Math.cos(toRad(30))
  const arcY2 = cy + r * Math.sin(toRad(30))

  // Outer detection node at 315° (upper-right), 6% of diameter outside circle
  const outerDist = r + size * 0.06 + size * 0.04
  const outX = cx + outerDist * Math.cos(toRad(-45))  // 315° std = -45°
  const outY = cy + outerDist * Math.sin(toRad(-45))
  const outerR = size * 0.08

  // Inner node
  const innerR = size * 0.09

  const color = variant === 'white' ? '#FFFFFF' : variant === 'dark' ? '#071C2C' : '#39B6FF'
  const strokeColor = variant === 'color' ? `url(#${id})` : color

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {variant === 'color' && (
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(135, 0.5, 0.5)">
            <stop offset="0%" stopColor="#6DD5FA" />
            <stop offset="100%" stopColor="#1F8DFF" />
          </linearGradient>
        </defs>
      )}

      {/* Scanning arc — 300° open at lower-right */}
      <path
        d={`M ${arcX1.toFixed(2)} ${arcY1.toFixed(2)} A ${r} ${r} 0 1 0 ${arcX2.toFixed(2)} ${arcY2.toFixed(2)}`}
        stroke={strokeColor}
        strokeWidth={sw}
        strokeLinecap="round"
        fill="none"
      />

      {/* Inner center node — detected threat */}
      <circle cx={cx} cy={cy} r={innerR} fill={strokeColor} />

      {/* Outer detection signal node */}
      <circle cx={outX.toFixed(2)} cy={outY.toFixed(2)} r={outerR} fill={strokeColor} />
    </svg>
  )
}

export function GuardScopeLogo({ size = 40, showText = true, textSize, variant = 'color' }: LogoProps) {
  const ts = textSize ?? size * 0.55
  const gap = size * 0.22

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap, userSelect: 'none' }}>
      <GuardScopeIcon size={size} variant={variant} />
      {showText && (
        <span
          style={{
            fontSize: ts,
            fontWeight: 600,
            letterSpacing: '0.01em',
            lineHeight: 1,
            fontFamily: 'Sora, Inter, sans-serif',
          }}
        >
          <span style={{ color: variant === 'color' ? '#E7EEF4' : variant === 'white' ? '#fff' : '#071C2C' }}>Guard</span>
          <span style={{ color: variant === 'color' ? '#39B6FF' : variant === 'white' ? '#fff' : '#39B6FF' }}>Scope</span>
        </span>
      )}
    </div>
  )
}

export default GuardScopeLogo
