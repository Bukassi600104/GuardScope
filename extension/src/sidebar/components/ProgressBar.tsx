import React, { useEffect, useRef, useState } from 'react'
import { tArray } from '../../utils/i18n'

// Gauge geometry — semicircle from left (0%) to right (100%)
// Center: (100, 100), Radius: 76
// At 0%:   angle 180° → point (24, 100)
// At 35%:  angle 117° → point (65.6, 32.3)
// At 65%:  angle 63°  → point (134.4, 32.3)
// At 100%: angle 0°   → point (176, 100)

const CX = 100, CY = 100, R = 76

function polarToXY(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: CX + R * Math.cos(rad),
    y: CY - R * Math.sin(rad),   // SVG y-axis is inverted
  }
}

const P_START = polarToXY(180)   // left  = 0%
const P_35    = polarToXY(117)   // 35%
const P_65    = polarToXY(63)    // 65%
const P_END   = polarToXY(0)     // right = 100%

function gaugePath(from: {x:number;y:number}, to: {x:number;y:number}) {
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} A ${R} ${R} 0 0 1 ${to.x.toFixed(1)} ${to.y.toFixed(1)}`
}

export default function ProgressBar() {
  const STEPS = tArray('progressSteps')
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [gaugeVal, setGaugeVal] = useState(0)
  const tRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  // Advance steps every 900ms
  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => {
        const next = s + 1
        if (next >= STEPS.length) { clearInterval(interval); return s }
        return next
      })
    }, 900)
    return () => clearInterval(interval)
  }, [STEPS.length])

  // Smooth progress
  useEffect(() => {
    setProgress(Math.round(((step + 1) / STEPS.length) * 100))
  }, [step, STEPS.length])

  // Animated gauge needle — jitters around a rising base as scan progresses
  useEffect(() => {
    const animate = () => {
      tRef.current += 0.025
      const t = tRef.current
      // Base drifts from ~5 → ~72 as progress goes 0 → 100
      const base = 5 + (progress / 100) * 67
      // Compound jitter — two sine waves at different frequencies
      const jitter = Math.sin(t * 8) * 9 + Math.sin(t * 19) * 4
      setGaugeVal(Math.max(0, Math.min(100, base + jitter)))
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [progress])

  // Circular ring
  const ringRadius = 58
  const circumference = 2 * Math.PI * ringRadius
  const filled = (progress / 100) * circumference

  // Needle rotation: -90° = left (0%), +90° = right (100%)
  const needleAngle = -90 + (gaugeVal / 100) * 180
  const needleColor = gaugeVal < 35 ? '#22c55e' : gaugeVal < 65 ? '#f97316' : '#ef4444'

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-5 py-6"
      style={{ minHeight: 420 }}>

      {/* ── Circular progress ring ── */}
      <div className="relative flex items-center justify-center">
        <svg width="148" height="148" viewBox="0 0 148 148">
          {/* Outer glow ring */}
          <circle cx="74" cy="74" r={ringRadius + 8} fill="none"
            stroke="rgba(239,68,68,0.06)" strokeWidth="16" />
          {/* Track */}
          <circle cx="74" cy="74" r={ringRadius} fill="none"
            stroke="#1a1d27" strokeWidth="7" />
          {/* Rotating fill — start at top (-90deg) */}
          <circle cx="74" cy="74" r={ringRadius} fill="none"
            stroke="#ef4444" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            transform="rotate(-90 74 74)"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
          {/* Pulse dot at leading edge */}
          {progress > 0 && progress < 100 && (() => {
            const angle = -90 + (progress / 100) * 360
            const rad = (angle * Math.PI) / 180
            const dx = 74 + ringRadius * Math.cos(rad)
            const dy = 74 + ringRadius * Math.sin(rad)
            return <circle cx={dx} cy={dy} r="4.5" fill="#ef4444" />
          })()}
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center gap-0.5">
          <span className="text-3xl font-black text-white leading-none">{progress}</span>
          <span className="text-[9px] text-[#475569] font-semibold uppercase tracking-widest">scanning</span>
        </div>
      </div>

      {/* ── Current step message ── */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
          <p className="text-xs text-[#94a3b8] font-medium">{STEPS[step]}</p>
        </div>
        <p className="text-[10px] text-[#475569]">Step {step + 1} of {STEPS.length}</p>
      </div>

      {/* ── Animated risk gauge ── */}
      <div className="flex flex-col items-center gap-2 w-full">
        <p className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">
          Determining Risk Score
        </p>

        <svg width="200" height="112" viewBox="0 0 200 112" style={{ overflow: 'visible' }}>
          {/* Track */}
          <path d={gaugePath(P_START, P_END)} fill="none"
            stroke="#1a1d27" strokeWidth="13" strokeLinecap="round" />

          {/* Safe zone (0–35%) */}
          <path d={gaugePath(P_START, P_35)} fill="none"
            stroke="#22c55e" strokeWidth="13" strokeLinecap="round" opacity="0.35" />

          {/* Medium zone (35–65%) */}
          <path d={gaugePath(P_35, P_65)} fill="none"
            stroke="#f97316" strokeWidth="13" strokeLinecap="round" opacity="0.35" />

          {/* High zone (65–100%) */}
          <path d={gaugePath(P_65, P_END)} fill="none"
            stroke="#ef4444" strokeWidth="13" strokeLinecap="round" opacity="0.35" />

          {/* Zone labels */}
          <text x="18" y="116" fill="#22c55e" fontSize="8.5" opacity="0.7" fontFamily="Inter,sans-serif">SAFE</text>
          <text x="85" y="18" fill="#f97316" fontSize="8.5" opacity="0.7" fontFamily="Inter,sans-serif">MEDIUM</text>
          <text x="163" y="116" fill="#ef4444" fontSize="8.5" opacity="0.7" fontFamily="Inter,sans-serif">HIGH</text>

          {/* Needle pivot glow */}
          <circle cx={CX} cy={CY} r="10" fill={needleColor} opacity="0.12" />

          {/* Needle */}
          <g transform={`translate(${CX}, ${CY}) rotate(${needleAngle})`}>
            {/* Shadow */}
            <line x1="0" y1="4" x2="0" y2="-64" stroke="rgba(0,0,0,0.4)" strokeWidth="3" strokeLinecap="round" />
            {/* Needle body */}
            <line x1="0" y1="4" x2="0" y2="-64" stroke={needleColor} strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Center cap */}
          <circle cx={CX} cy={CY} r="5.5" fill="#0f1117" stroke={needleColor} strokeWidth="2" />
        </svg>

        <p className="text-[10px] text-[#334155]">Final score calculated after scan completes</p>
      </div>

      {/* ── Step dots ── */}
      <div className="flex gap-1.5 items-center">
        {Array.from({ length: STEPS.length }).map((_, i) => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            i < step ? 'w-2 h-2 bg-[#ef4444]' :
            i === step ? 'w-3 h-3 bg-[#ef4444] animate-pulse' :
            'w-2 h-2 bg-[#1a1d27]'
          }`} />
        ))}
      </div>
    </div>
  )
}
