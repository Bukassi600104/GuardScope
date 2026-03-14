import React, { useEffect, useRef, useState } from 'react'
import { tArray } from '../../utils/i18n'

const CX = 100, CY = 100, R = 76

function polarToXY(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CX + R * Math.cos(rad), y: CY - R * Math.sin(rad) }
}

const P_START = polarToXY(180)
const P_35    = polarToXY(117)
const P_65    = polarToXY(63)
const P_END   = polarToXY(0)

function gaugePath(from: {x:number;y:number}, to: {x:number;y:number}) {
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} A ${R} ${R} 0 0 1 ${to.x.toFixed(1)} ${to.y.toFixed(1)}`
}

interface Props {
  /** When set, the gauge animates to this score and stops jitter — called just before result transition */
  finalScore?: number
}

export default function ProgressBar({ finalScore }: Props) {
  const STEPS = tArray('progressSteps')
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [gaugeVal, setGaugeVal] = useState(0)
  const tRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const settledRef = useRef(false)

  // Advance steps every 900ms (stops once finalScore arrives)
  useEffect(() => {
    if (finalScore !== undefined) return
    const interval = setInterval(() => {
      setStep(s => {
        const next = s + 1
        if (next >= STEPS.length) { clearInterval(interval); return s }
        return next
      })
    }, 900)
    return () => clearInterval(interval)
  }, [STEPS.length, finalScore])

  useEffect(() => {
    setProgress(Math.round(((step + 1) / STEPS.length) * 100))
  }, [step, STEPS.length])

  // Animated gauge — jitter while scanning, settle to finalScore when complete
  useEffect(() => {
    if (finalScore !== undefined && !settledRef.current) {
      // Stop jitter, animate to actual score
      settledRef.current = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      const startVal = gaugeVal
      const endVal = finalScore
      const duration = 1000 // 1s settle animation
      const startTime = performance.now()

      const settle = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(1, elapsed / duration)
        // Ease out cubic
        const ease = 1 - Math.pow(1 - t, 3)
        setGaugeVal(startVal + (endVal - startVal) * ease)
        if (t < 1) rafRef.current = requestAnimationFrame(settle)
      }
      rafRef.current = requestAnimationFrame(settle)
      return
    }

    if (finalScore !== undefined) return // already settled

    // Normal jitter animation during scanning
    const animate = () => {
      tRef.current += 0.025
      const t = tRef.current
      const base = 5 + (progress / 100) * 67
      const jitter = Math.sin(t * 8) * 9 + Math.sin(t * 19) * 4
      setGaugeVal(Math.max(0, Math.min(100, base + jitter)))
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, finalScore])

  // Circular ring
  const ringRadius = 58
  const circumference = 2 * Math.PI * ringRadius
  const filled = finalScore !== undefined
    ? (finalScore / 100) * circumference
    : (progress / 100) * circumference

  const needleAngle = -90 + (gaugeVal / 100) * 180
  const needleColor = gaugeVal < 35 ? '#22c55e' : gaugeVal < 65 ? '#f97316' : '#ef4444'
  const ringColor = finalScore !== undefined
    ? (finalScore <= 25 ? '#22c55e' : finalScore <= 49 ? '#FFB020' : finalScore <= 69 ? '#f97316' : '#ef4444')
    : '#ef4444'

  const isSettled = finalScore !== undefined

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-5 py-6"
      style={{ minHeight: 420 }}>

      {/* Circular ring */}
      <div className="relative flex items-center justify-center">
        <svg width="148" height="148" viewBox="0 0 148 148">
          <circle cx="74" cy="74" r={ringRadius + 8} fill="none"
            stroke={`${ringColor}0f`} strokeWidth="16" />
          <circle cx="74" cy="74" r={ringRadius} fill="none"
            stroke="#0a2338" strokeWidth="7" />
          <circle cx="74" cy="74" r={ringRadius} fill="none"
            stroke={ringColor} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            transform="rotate(-90 74 74)"
            style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.4s ease' }}
          />
          {!isSettled && progress > 0 && progress < 100 && (() => {
            const angle = -90 + (progress / 100) * 360
            const rad = (angle * Math.PI) / 180
            const dx = 74 + ringRadius * Math.cos(rad)
            const dy = 74 + ringRadius * Math.sin(rad)
            return <circle cx={dx} cy={dy} r="4.5" fill={ringColor} />
          })()}
        </svg>
        <div className="absolute flex flex-col items-center gap-0.5">
          {isSettled ? (
            <>
              <span className="text-3xl font-black leading-none" style={{ color: ringColor }}>
                {finalScore}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: ringColor }}>
                {finalScore <= 25 ? 'SAFE' : finalScore <= 49 ? 'LOW' : finalScore <= 69 ? 'MEDIUM' : finalScore <= 84 ? 'HIGH' : 'CRITICAL'}
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl font-black text-white leading-none">{progress}</span>
              <span className="text-[9px] text-[#475569] font-semibold uppercase tracking-widest">scanning</span>
            </>
          )}
        </div>
      </div>

      {/* Step / complete message */}
      <div className="text-center space-y-1">
        {isSettled ? (
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ringColor }} />
            <p className="text-xs font-medium" style={{ color: ringColor }}>Analysis complete</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39B6FF] animate-pulse" />
              <p className="text-xs text-[#94a3b8] font-medium">{STEPS[step]}</p>
            </div>
            <p className="text-[10px] text-[#475569]">Step {step + 1} of {STEPS.length}</p>
          </>
        )}
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center gap-2 w-full">
        <p className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">
          {isSettled ? 'Risk Score' : 'Determining Risk Score'}
        </p>

        <svg width="200" height="120" viewBox="0 0 200 120" style={{ overflow: 'visible' }}>
          {/* Track */}
          <path d={gaugePath(P_START, P_END)} fill="none"
            stroke="#0a2338" strokeWidth="13" strokeLinecap="round" />
          {/* Safe zone */}
          <path d={gaugePath(P_START, P_35)} fill="none"
            stroke="#22c55e" strokeWidth="13" strokeLinecap="round" opacity="0.35" />
          {/* Medium zone */}
          <path d={gaugePath(P_35, P_65)} fill="none"
            stroke="#f97316" strokeWidth="13" strokeLinecap="round" opacity="0.35" />
          {/* High zone */}
          <path d={gaugePath(P_65, P_END)} fill="none"
            stroke="#ef4444" strokeWidth="13" strokeLinecap="round" opacity="0.35" />

          {/* Zone labels — positioned OUTSIDE the arc, clear of stroke */}
          <text x="18" y="118" fill="#22c55e" fontSize="8.5" opacity="0.7" fontFamily="Inter,sans-serif">SAFE</text>
          <text x="100" y="6" fill="#f97316" fontSize="8.5" opacity="0.7" fontFamily="Inter,sans-serif" textAnchor="middle">MEDIUM</text>
          <text x="182" y="118" fill="#ef4444" fontSize="8.5" opacity="0.7" fontFamily="Inter,sans-serif" textAnchor="end">HIGH</text>

          {/* Needle pivot glow */}
          <circle cx={CX} cy={CY} r="10" fill={needleColor} opacity="0.12" />
          {/* Needle */}
          <g transform={`translate(${CX}, ${CY}) rotate(${needleAngle})`}>
            <line x1="0" y1="4" x2="0" y2="-64" stroke="rgba(0,0,0,0.4)" strokeWidth="3" strokeLinecap="round" />
            <line x1="0" y1="4" x2="0" y2="-64" stroke={needleColor} strokeWidth="2.5" strokeLinecap="round"
              style={{ transition: isSettled ? 'none' : undefined }} />
          </g>
          <circle cx={CX} cy={CY} r="5.5" fill="#071C2C" stroke={needleColor} strokeWidth="2" />
        </svg>

        <p className="text-[10px] text-[#334155]">
          {isSettled ? 'Loading full report...' : 'Final score calculated after scan completes'}
        </p>
      </div>

      {/* Step dots */}
      {!isSettled && (
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: STEPS.length }).map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${
              i < step ? 'w-2 h-2 bg-[#39B6FF]' :
              i === step ? 'w-3 h-3 bg-[#39B6FF] animate-pulse' :
              'w-2 h-2 bg-[#0a2338]'
            }`} />
          ))}
        </div>
      )}
    </div>
  )
}
