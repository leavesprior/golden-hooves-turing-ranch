'use client'

/**
 * River Animation Component
 *
 * Retro pixel-style animated water for river crossings.
 * Shows flowing water, shore, and crossing outcomes.
 */

import React, { useEffect, useState, useMemo } from 'react'

interface RiverAnimationProps {
  riverCondition: 'low' | 'normal' | 'high' | 'flood'
  weather: 'clear' | 'rain' | 'storm'
  isCrossing: boolean
  crossingMethod?: 'ford' | 'caulk' | 'ferry' | 'bridge' | 'wait'
  crossingProgress?: number  // 0-100
  crossingSuccess?: boolean | null  // null = in progress
}

// Pixel water patterns (using CSS animations)
const WATER_COLORS = {
  low: ['#1e40af', '#1d4ed8', '#2563eb'],
  normal: ['#1e3a8a', '#1e40af', '#1d4ed8'],
  high: ['#172554', '#1e3a8a', '#1e40af'],
  flood: ['#0f172a', '#172554', '#1e3a8a'],
}

const SHORE_COLOR = '#92400e'
const SAND_COLOR = '#d97706'

export function RiverAnimation({
  riverCondition,
  weather,
  isCrossing,
  crossingMethod,
  crossingProgress = 0,
  crossingSuccess,
}: RiverAnimationProps) {
  const [waveOffset, setWaveOffset] = useState(0)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; speed: number }>>([])

  // Animate water flow
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveOffset(prev => (prev + 1) % 32)
    }, riverCondition === 'flood' ? 50 : riverCondition === 'high' ? 75 : 100)

    return () => clearInterval(interval)
  }, [riverCondition])

  // Generate floating particles (debris, leaves)
  useEffect(() => {
    const newParticles = Array.from({ length: riverCondition === 'flood' ? 15 : 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 20 + Math.random() * 40,
      speed: 0.5 + Math.random() * 1.5,
    }))
    setParticles(newParticles)
  }, [riverCondition])

  // Move particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => ({
          ...p,
          x: (p.x + p.speed) % 110,
        }))
      )
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const waterColors = WATER_COLORS[riverCondition]
  const riverSpeed = riverCondition === 'flood' ? 'fast' : riverCondition === 'high' ? 'medium' : 'slow'

  // Calculate wagon position during crossing
  const wagonX = isCrossing ? crossingProgress : 0
  const wagonY = useMemo(() => {
    if (!isCrossing) return 50
    // Bobbing effect in water
    const baseY = 45
    const bob = Math.sin((crossingProgress / 10) * Math.PI) * 3
    const riverEffect = riverCondition === 'flood' ? 5 : riverCondition === 'high' ? 3 : 1
    return baseY + bob * riverEffect
  }, [isCrossing, crossingProgress, riverCondition])

  return (
    <div className="relative w-full h-48 overflow-hidden rounded-lg border-4 border-amber-800">
      {/* Sky */}
      <div
        className={`absolute inset-0 transition-colors duration-1000 ${
          weather === 'storm'
            ? 'bg-gradient-to-b from-slate-800 to-slate-700'
            : weather === 'rain'
            ? 'bg-gradient-to-b from-slate-600 to-slate-500'
            : 'bg-gradient-to-b from-cyan-400 to-cyan-300'
        }`}
      />

      {/* Rain particles */}
      {(weather === 'rain' || weather === 'storm') && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: weather === 'storm' ? 50 : 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-3 bg-blue-200/40"
              style={{
                left: `${(i * 4 + waveOffset * 2) % 100}%`,
                top: `${(i * 7 + waveOffset * 3) % 80}%`,
                animation: `fall ${weather === 'storm' ? '0.3s' : '0.5s'} linear infinite`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Far Shore */}
      <div
        className="absolute top-1/4 left-0 right-0 h-6"
        style={{ backgroundColor: SHORE_COLOR }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-2"
          style={{ backgroundColor: SAND_COLOR }}
        />
        {/* Trees on far shore */}
        {[10, 25, 40, 60, 75, 90].map((x, i) => (
          <div
            key={i}
            className="absolute bottom-4 w-3 h-8"
            style={{
              left: `${x}%`,
              backgroundColor: '#166534',
              borderRadius: '50% 50% 0 0',
            }}
          />
        ))}
      </div>

      {/* River */}
      <div className="absolute top-[30%] left-0 right-0 h-[45%] overflow-hidden">
        {/* Water layers with animation */}
        {waterColors.map((color, layer) => (
          <div
            key={layer}
            className="absolute inset-0"
            style={{
              backgroundColor: color,
              transform: `translateX(${(waveOffset * (layer + 1) * 0.5) % 10 - 5}px)`,
              opacity: 1 - layer * 0.15,
            }}
          />
        ))}

        {/* Wave pattern overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 8px,
              rgba(255,255,255,0.2) 8px,
              rgba(255,255,255,0.2) 16px
            )`,
            transform: `translateX(${-waveOffset}px)`,
          }}
        />

        {/* Floating debris */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute w-2 h-1 rounded"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              backgroundColor: p.id % 3 === 0 ? '#8b5cf6' : '#78350f',
              transform: `rotate(${p.x * 10}deg)`,
            }}
          />
        ))}

        {/* Current lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              ${riverCondition === 'flood' ? '95deg' : '90deg'},
              transparent,
              transparent 20px,
              rgba(255,255,255,0.1) 20px,
              rgba(255,255,255,0.1) 22px
            )`,
            animation: `flow ${riverSpeed === 'fast' ? '0.5s' : riverSpeed === 'medium' ? '1s' : '2s'} linear infinite`,
          }}
        />

        {/* Wagon during crossing */}
        {isCrossing && (
          <div
            className="absolute transition-all duration-200"
            style={{
              left: `${wagonX}%`,
              top: `${wagonY}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Wagon body */}
            <div className="relative">
              {/* Canvas top */}
              {crossingMethod === 'caulk' && (
                <div className="absolute -top-4 left-1 w-8 h-4 bg-amber-100 rounded-t-full border-2 border-amber-700" />
              )}
              {/* Wagon base */}
              <div className="w-10 h-4 bg-amber-700 rounded border border-amber-900" />
              {/* Wheels */}
              <div className="absolute -bottom-2 left-0 w-3 h-3 bg-amber-900 rounded-full border border-amber-950" />
              <div className="absolute -bottom-2 right-0 w-3 h-3 bg-amber-900 rounded-full border border-amber-950" />
              {/* Water splash effect */}
              {riverCondition !== 'low' && (
                <>
                  <div
                    className="absolute -left-2 bottom-0 w-2 h-2 bg-blue-300 rounded-full opacity-60"
                    style={{ animation: 'splash 0.5s ease-out infinite' }}
                  />
                  <div
                    className="absolute -right-2 bottom-0 w-2 h-2 bg-blue-300 rounded-full opacity-60"
                    style={{ animation: 'splash 0.5s ease-out infinite', animationDelay: '0.25s' }}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Ferry if that method is chosen */}
        {crossingMethod === 'ferry' && isCrossing && (
          <div
            className="absolute w-16 h-6 bg-amber-800 border-2 border-amber-900 rounded"
            style={{
              left: `${wagonX - 5}%`,
              top: '40%',
            }}
          >
            <div className="absolute -top-8 left-1/2 w-1 h-8 bg-amber-700" />
            <div className="absolute -top-6 left-1/2 w-6 h-4 bg-white/80 rounded-sm" style={{ transform: 'translateX(-50%)' }} />
          </div>
        )}
      </div>

      {/* Near Shore */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8"
        style={{ backgroundColor: SHORE_COLOR }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ backgroundColor: SAND_COLOR }}
        />
        {/* Grass tufts */}
        {[5, 15, 30, 50, 70, 85, 95].map((x, i) => (
          <div
            key={i}
            className="absolute top-0 w-2 h-3"
            style={{
              left: `${x}%`,
              backgroundColor: '#22c55e',
              borderRadius: '50% 50% 0 0',
              transform: 'translateY(-100%)',
            }}
          />
        ))}

        {/* Waiting wagon if not crossing */}
        {!isCrossing && (
          <div className="absolute bottom-4 left-4">
            <div className="w-10 h-4 bg-amber-700 rounded border border-amber-900" />
            <div className="absolute -bottom-2 left-0 w-3 h-3 bg-amber-900 rounded-full border border-amber-950" />
            <div className="absolute -bottom-2 right-0 w-3 h-3 bg-amber-900 rounded-full border border-amber-950" />
          </div>
        )}
      </div>

      {/* Result overlay */}
      {crossingSuccess !== null && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${
            crossingSuccess
              ? 'bg-green-500/30'
              : 'bg-red-500/30'
          }`}
        >
          <div
            className={`text-4xl font-bold ${
              crossingSuccess ? 'text-green-300' : 'text-red-300'
            }`}
          >
            {crossingSuccess ? 'SAFE!' : 'TROUBLE!'}
          </div>
        </div>
      )}

      {/* River condition indicator */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs">
        <span className={`
          ${riverCondition === 'low' ? 'text-green-400' : ''}
          ${riverCondition === 'normal' ? 'text-blue-400' : ''}
          ${riverCondition === 'high' ? 'text-yellow-400' : ''}
          ${riverCondition === 'flood' ? 'text-red-400' : ''}
        `}>
          {riverCondition.toUpperCase()}
        </span>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes flow {
          from { background-position-x: 0; }
          to { background-position-x: 100px; }
        }
        @keyframes fall {
          from { transform: translateY(-10px); }
          to { transform: translateY(200px); }
        }
        @keyframes splash {
          0% { transform: scale(0); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default RiverAnimation
