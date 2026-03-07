import React, { useEffect, useState } from 'react'
import { tArray } from '../../utils/i18n'

export default function ProgressBar() {
  const STEPS = tArray('progressSteps')
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => { // 900ms/step → ~6.3s for all 7 steps, matching API duration
      setStep((s) => {
        const next = s + 1
        if (next >= STEPS.length) {
          clearInterval(interval)
          return s
        }
        return next
      })
    }, 900)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const targetProgress = Math.round(((step + 1) / STEPS.length) * 100)
    setProgress(targetProgress)
  }, [step])

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-gs-text mb-1">Analyzing Email</p>
        <p className="text-xs text-gs-muted">{progress}% complete</p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gs-surface rounded-full h-2">
        <div
          className="bg-gs-high h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Current step */}
      <p className="text-xs text-gs-muted text-center min-h-[2rem] flex items-center justify-center">
        {STEPS[step]}
      </p>

      {/* Step indicators */}
      <div className="flex justify-between">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              i <= step ? 'bg-gs-high' : 'bg-gs-surface'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
