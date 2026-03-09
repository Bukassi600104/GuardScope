// GuardScope SVG Logo — matches brand image exactly
// Arc gap at upper-right (330°–30°) | inner center dot | outer detection dot at 315°
// Gradient: #72D8FF → #1A8FFF at 135°

interface LogoProps {
  size?: number
  showText?: boolean
  textSize?: number
  variant?: 'color' | 'white' | 'dark'
}

export function GuardScopeIcon({ size = 40, variant = 'color' }: { size?: number; variant?: 'color' | 'white' | 'dark' }) {
  const gradId = `gs-g-${size}-${variant}`

  // Arc geometry (fixed in 48×48 viewBox, scaled via width/height)
  // Circle center (cx,cy), radius r
  const cx = 21, cy = 24, r = 13, sw = 3.2

  // Arc gap at upper-right: gap from 330° to 30° (60° gap)
  // Arc draws FROM 30° (lower-right) 300° clockwise TO 330° (upper-right)
  // SVG angles: clockwise from east, y-axis down
  // cos/sin with standard JS Math (anticlockwise from east) → in SVG y-down, sin is inverted for y
  const toR = (d: number) => (d * Math.PI) / 180
  const ax1 = cx + r * Math.cos(toR(30))    // 32.26
  const ay1 = cy + r * Math.sin(toR(30))    // 30.50  (lower-right, SVG y-down)
  const ax2 = cx + r * Math.cos(toR(-30))   // 32.26
  const ay2 = cy + r * Math.sin(toR(-30))   // 17.50  (upper-right, SVG y-down)

  // Outer detection dot: 310° SVG (= -50° standard = 1-o'clock upper-right)
  // od large enough to clear arc stroke: gap = od - r - sw/2 - dot_r ≥ 3px
  const od = r + 8   // 21 — clearly outside arc
  const ox = cx + od * Math.cos(toR(-50))
  const oy = cy + od * Math.sin(toR(-50))

  const dotFill   = variant === 'white' ? '#FFFFFF' : variant === 'dark' ? '#071C2C' : `url(#${gradId})`
  const arcStroke = variant === 'white' ? '#FFFFFF' : variant === 'dark' ? '#071C2C' : `url(#${gradId})`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {variant === 'color' && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#72D8FF" />
            <stop offset="100%" stopColor="#1A8FFF" />
          </linearGradient>
        </defs>
      )}

      {/* Scanning arc — 300° clockwise, gap at upper-right */}
      <path
        d={`M ${ax1.toFixed(2)} ${ay1.toFixed(2)} A ${r} ${r} 0 1 1 ${ax2.toFixed(2)} ${ay2.toFixed(2)}`}
        stroke={arcStroke}
        strokeWidth={sw}
        strokeLinecap="round"
        fill="none"
      />

      {/* Inner center node — detected threat */}
      <circle cx={cx} cy={cy} r={3.5} fill={dotFill} />

      {/* Outer detection signal node */}
      <circle cx={ox.toFixed(2)} cy={oy.toFixed(2)} r={3.0} fill={dotFill} />
    </svg>
  )
}

export function GuardScopeLogo({ size = 40, showText = true, textSize, variant = 'color' }: LogoProps) {
  const ts = textSize ?? Math.round(size * 0.52)
  const gap = Math.round(size * 0.18)

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap, userSelect: 'none' }}>
      <GuardScopeIcon size={size} variant={variant} />
      {showText && (
        <span style={{
          fontSize: ts,
          fontWeight: 600,
          letterSpacing: '0.01em',
          lineHeight: 1,
          fontFamily: 'Sora, Inter, sans-serif',
        }}>
          <span style={{ color: variant === 'color' ? '#E7EEF4' : variant === 'white' ? '#fff' : '#071C2C' }}>Guard</span>
          <span style={{ color: variant === 'color' ? '#39B6FF' : variant === 'white' ? '#fff' : '#39B6FF' }}>Scope</span>
        </span>
      )}
    </div>
  )
}

export default GuardScopeLogo
