import React from 'react'

type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface RiskScoreProps {
  score: number
  level: RiskLevel
}

const LEVEL_CONFIG: Record<RiskLevel, { color: string; hex: string; label: string; icon: string }> = {
  SAFE:     { color: 'text-gs-safe',     hex: '#22c55e', label: 'SAFE',        icon: '✅' },
  LOW:      { color: 'text-gs-low',      hex: '#84cc16', label: 'LOW RISK',    icon: '⚠️' },
  MEDIUM:   { color: 'text-gs-medium',   hex: '#f97316', label: 'MEDIUM RISK', icon: '⚠️' },
  HIGH:     { color: 'text-gs-high',     hex: '#ef4343', label: 'HIGH RISK',   icon: '🚨' },
  CRITICAL: { color: 'text-red-300',     hex: '#ef4343', label: 'CRITICAL',    icon: '🚨' },
}

// Exact Stitch design — conic gradient circular gauge
export default function RiskScore({ score, level }: RiskScoreProps) {
  const config = LEVEL_CONFIG[level]
  const clampedScore = Math.min(100, Math.max(0, score))

  // Conic gradient: score% filled with risk color, remainder dark
  // Matches Stitch .gauge-conic implementation
  const gaugeStyle: React.CSSProperties = {
    background: `conic-gradient(from 180deg at 50% 50%, ${config.hex} 0%, ${config.hex} ${clampedScore}%, #0a1e30 ${clampedScore}%, #0a1e30 100%)`,
  }

  return (
    <div className="flex flex-col items-center py-4">
      {/* Circular gauge */}
      <div className="relative w-32 h-32 rounded-full flex items-center justify-center" style={gaugeStyle}>
        {/* Inner circle (donut hole) */}
        <div className="absolute w-24 h-24 rounded-full bg-[#071c2c] flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold leading-none ${config.color}`}>{clampedScore}</span>
          <span className="text-xs text-[#64748b] mt-0.5">/ 100</span>
        </div>
      </div>

      {/* Risk label */}
      <div className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>

      {/* Subtitle */}
      <p className="text-xs text-[#64748b] mt-1">Risk Score</p>
    </div>
  )
}
