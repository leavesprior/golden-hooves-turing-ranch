'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  getRandomObservation,
  getTimePhase,
  type TerrainType,
  type WeatherMood,
  type TravelObservation
} from '../data/travelObservations'

interface TravelObservationsProps {
  terrain: TerrainType
  weather: WeatherMood
  daysTraveled: number
  nearLandmark?: string
  gameHour?: number
  isMoving?: boolean
  className?: string
}

const MOOD_STYLES: Record<TravelObservation['mood'], { icon: string; border: string; text: string; bg: string }> = {
  witty: {
    icon: '🎭',
    border: 'border-amber-500',
    text: 'text-amber-200',
    bg: 'bg-amber-900/60',
  },
  philosophical: {
    icon: '💭',
    border: 'border-purple-500',
    text: 'text-purple-200',
    bg: 'bg-purple-900/60',
  },
  ominous: {
    icon: '⚠️',
    border: 'border-red-500',
    text: 'text-red-200',
    bg: 'bg-red-900/60',
  },
  hopeful: {
    icon: '🌟',
    border: 'border-green-500',
    text: 'text-green-200',
    bg: 'bg-green-900/60',
  },
  weary: {
    icon: '😮‍💨',
    border: 'border-gray-500',
    text: 'text-gray-200',
    bg: 'bg-gray-900/60',
  },
  observant: {
    icon: '👁️',
    border: 'border-cyan-500',
    text: 'text-cyan-200',
    bg: 'bg-cyan-900/60',
  },
}

export function TravelObservations({
  terrain,
  weather,
  daysTraveled,
  nearLandmark,
  gameHour = 12,
  isMoving = true,
  className = '',
}: TravelObservationsProps) {
  const [currentObservation, setCurrentObservation] = useState<TravelObservation | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [displayedText, setDisplayedText] = useState('')

  const timePhase = getTimePhase(gameHour)

  // Get a new observation
  const refreshObservation = useCallback(() => {
    const obs = getRandomObservation(terrain, timePhase, weather, nearLandmark, daysTraveled)
    setCurrentObservation(obs)
    setDisplayedText('')
    setIsTyping(true)
    setIsVisible(true)
  }, [terrain, timePhase, weather, nearLandmark, daysTraveled])

  // Initial observation
  useEffect(() => {
    refreshObservation()
  }, []) // Only on mount

  // Refresh when major conditions change (terrain, weather, landmark)
  useEffect(() => {
    refreshObservation()
  }, [terrain, weather, nearLandmark])

  // Auto-refresh every 30-60 seconds while moving
  useEffect(() => {
    if (!isMoving) return

    const interval = setInterval(() => {
      // Fade out, then get new observation
      setIsVisible(false)
      setTimeout(() => {
        refreshObservation()
      }, 500)
    }, 30000 + Math.random() * 30000)

    return () => clearInterval(interval)
  }, [isMoving, refreshObservation])

  // Typewriter effect
  useEffect(() => {
    if (!currentObservation || !isTyping) return

    const text = currentObservation.text
    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1))
      }, 25)
      return () => clearTimeout(timer)
    } else {
      setIsTyping(false)
    }
  }, [currentObservation, displayedText, isTyping])

  if (!currentObservation) return null

  const style = MOOD_STYLES[currentObservation.mood]

  return (
    <div
      className={`
        transition-all duration-500
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        ${className}
      `}
    >
      <div className={`
        ${style.bg} border-l-4 ${style.border} rounded-r-lg p-4
        backdrop-blur-sm shadow-lg
      `}>
        {/* Header with mood icon */}
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">{style.icon}</span>
          <div className="flex-1 min-w-0">
            {/* The observation text with typewriter effect */}
            <p className={`${style.text} text-sm italic leading-relaxed font-serif`}>
              {displayedText}
              {isTyping && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              )}
            </p>

            {/* Terrain/weather context (subtle) */}
            <div className="flex items-center gap-2 mt-2 text-xs opacity-60">
              <span className={style.text}>
                {terrain.charAt(0).toUpperCase() + terrain.slice(1)} •{' '}
                {timePhase.charAt(0).toUpperCase() + timePhase.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Click to refresh hint */}
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(refreshObservation, 300)
        }}
        className="mt-1 text-xs text-amber-500/50 hover:text-amber-400/80 transition-colors"
      >
        ↻ New thought
      </button>
    </div>
  )
}

// Compact version for the travel HUD
export function TravelObservationsCompact({
  terrain,
  weather,
  daysTraveled,
  nearLandmark,
  gameHour = 12,
}: Omit<TravelObservationsProps, 'isMoving' | 'className'>) {
  const [observation, setObservation] = useState<TravelObservation | null>(null)
  const timePhase = getTimePhase(gameHour)

  useEffect(() => {
    setObservation(getRandomObservation(terrain, timePhase, weather, nearLandmark, daysTraveled))
  }, [terrain, timePhase, weather, nearLandmark, daysTraveled])

  useEffect(() => {
    const interval = setInterval(() => {
      setObservation(getRandomObservation(terrain, timePhase, weather, nearLandmark, daysTraveled))
    }, 45000)
    return () => clearInterval(interval)
  }, [terrain, timePhase, weather, nearLandmark, daysTraveled])

  if (!observation) return null

  const style = MOOD_STYLES[observation.mood]

  return (
    <div className={`${style.bg} border ${style.border} rounded px-3 py-2`}>
      <p className={`${style.text} text-xs italic`}>
        <span className="mr-2">{style.icon}</span>
        {observation.text}
      </p>
    </div>
  )
}

export default TravelObservations
