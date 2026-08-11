import React from 'react'

export function GuardScopeMark({ size = 32 }: { size?: number }) {
  const gradientId = `guardscope-mark-${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="GuardScope">
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#72D8FF" /><stop offset="100%" stopColor="#1A8FFF" /></linearGradient></defs>
      <path d="M 32.26 30.50 A 13 13 0 1 1 32.26 17.50" stroke={`url(#${gradientId})`} strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="21" cy="24" r="3.5" fill={`url(#${gradientId})`} />
      <circle cx="37.38" cy="12.53" r="3" fill={`url(#${gradientId})`} />
    </svg>
  )
}
