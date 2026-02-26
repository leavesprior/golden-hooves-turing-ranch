'use client'

import React, { useEffect, useState } from 'react'

interface FloatingNumberProps {
  value: number
  emoji?: string       // e.g. '🌮', '🍪', 'XP'
  type?: 'gain' | 'cost' | 'karma' | 'special'
}

const TYPE_COLORS: Record<string, string> = {
  gain: 'text-green-400',
  cost: 'text-red-400',
  karma: 'text-yellow-400',
  special: 'text-purple-400',
}

export function FloatingNumber({ value, emoji = '', type = value >= 0 ? 'gain' : 'cost' }: FloatingNumberProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  const sign = value >= 0 ? '+' : ''
  const color = TYPE_COLORS[type] || TYPE_COLORS.gain

  return (
    <span
      className={`absolute pointer-events-none font-bold text-sm font-mono animate-float-up ${color}`}
      style={{ top: '-4px', right: '0' }}
    >
      {sign}{value}{emoji}
    </span>
  )
}
