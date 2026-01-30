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
  weather: 'clear' | 'rain' | 'storm' | 'fair' | 'snow'  // Accepts all game Weather types
  isCrossing: boolean
  crossingMethod?: 'ford' | 'caulk' | 'ferry' | 'bridge' | 'wait' | 'guide'  // All crossing methods
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
            <div className="relative flex items-end" style={{ gap: '1px' }}>
              {/* === Oxen Team (2 pair) === */}
              <div className="relative flex items-end" style={{ gap: '2px', marginRight: '2px' }}>
                {/* Lead pair of oxen */}
                {[0, 1].map((ox) => (
                  <div key={`lead-${ox}`} className="relative" style={{ width: '6px', height: '8px' }}>
                    {/* Ox head */}
                    <div
                      className="absolute rounded-sm"
                      style={{
                        width: '3px', height: '3px',
                        top: '0px', left: '0px',
                        backgroundColor: '#78350f',
                      }}
                    />
                    {/* Ox horns */}
                    <div
                      className="absolute"
                      style={{
                        width: '5px', height: '1px',
                        top: '-1px', left: '-1px',
                        backgroundColor: '#d6d3d1',
                        borderRadius: '1px',
                      }}
                    />
                    {/* Ox body */}
                    <div
                      className="absolute rounded-sm"
                      style={{
                        width: '6px', height: '4px',
                        top: '2px', left: '0px',
                        backgroundColor: '#92400e',
                        borderTop: '1px solid #78350f',
                      }}
                    />
                    {/* Ox legs (front and back) */}
                    <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '0px', backgroundColor: '#6b3a10' }} />
                    <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '2px', backgroundColor: '#6b3a10' }} />
                    <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '4px', backgroundColor: '#6b3a10' }} />
                    <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '5px', backgroundColor: '#6b3a10' }} />
                  </div>
                ))}
                {/* Rear pair of oxen */}
                {[0, 1].map((ox) => (
                  <div key={`rear-${ox}`} className="relative" style={{ width: '6px', height: '8px' }}>
                    {/* Ox head */}
                    <div
                      className="absolute rounded-sm"
                      style={{
                        width: '3px', height: '3px',
                        top: '0px', left: '0px',
                        backgroundColor: '#78350f',
                      }}
                    />
                    {/* Ox horns */}
                    <div
                      className="absolute"
                      style={{
                        width: '5px', height: '1px',
                        top: '-1px', left: '-1px',
                        backgroundColor: '#d6d3d1',
                        borderRadius: '1px',
                      }}
                    />
                    {/* Ox body */}
                    <div
                      className="absolute rounded-sm"
                      style={{
                        width: '6px', height: '4px',
                        top: '2px', left: '0px',
                        backgroundColor: '#7c2d12',
                        borderTop: '1px solid #6b3a10',
                      }}
                    />
                    {/* Ox legs */}
                    <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '0px', backgroundColor: '#5c2d0e' }} />
                    <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '2px', backgroundColor: '#5c2d0e' }} />
                    <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '4px', backgroundColor: '#5c2d0e' }} />
                    <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '5px', backgroundColor: '#5c2d0e' }} />
                  </div>
                ))}
                {/* Yoke / harness line connecting oxen to wagon */}
                <div
                  className="absolute"
                  style={{
                    width: '8px', height: '1px',
                    bottom: '4px', right: '-9px',
                    backgroundColor: '#78350f',
                  }}
                />
              </div>

              {/* === Covered Wagon === */}
              <div className="relative" style={{ width: '16px' }}>
                {/* Canvas cover - prairie schooner arch */}
                <div
                  className="absolute"
                  style={{
                    width: '16px', height: '9px',
                    top: '-12px', left: '0px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px 8px 0 0',
                    border: '1px solid #d6d3d1',
                    borderBottom: 'none',
                  }}
                />
                {/* Canvas hoop ribs (3 ribs across the arch) */}
                <div
                  className="absolute"
                  style={{
                    width: '1px', height: '8px',
                    top: '-11px', left: '4px',
                    backgroundColor: '#a8a29e',
                    borderRadius: '50%',
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    width: '1px', height: '9px',
                    top: '-12px', left: '8px',
                    backgroundColor: '#a8a29e',
                    borderRadius: '50%',
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    width: '1px', height: '8px',
                    top: '-11px', left: '12px',
                    backgroundColor: '#a8a29e',
                    borderRadius: '50%',
                  }}
                />
                {/* Wagon bed */}
                <div
                  style={{
                    width: '16px', height: '5px',
                    backgroundColor: '#92400e',
                    border: '1px solid #78350f',
                    borderRadius: '1px',
                  }}
                />
                {/* Side boards (taller on sides) */}
                <div
                  className="absolute"
                  style={{
                    width: '1px', height: '7px',
                    top: '-3px', left: '0px',
                    backgroundColor: '#78350f',
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    width: '1px', height: '7px',
                    top: '-3px', right: '0px',
                    backgroundColor: '#78350f',
                  }}
                />
                {/* Wood slat detail on wagon bed */}
                <div
                  className="absolute"
                  style={{
                    width: '14px', height: '1px',
                    top: '2px', left: '1px',
                    backgroundColor: '#78350f',
                    opacity: 0.5,
                  }}
                />
                {/* Front wheel - spoked style */}
                <div
                  className="absolute"
                  style={{
                    width: '6px', height: '6px',
                    bottom: '-4px', left: '-1px',
                    borderRadius: '50%',
                    border: '2px solid #78350f',
                    backgroundColor: 'transparent',
                    boxShadow: 'inset 0 0 0 1px #92400e',
                  }}
                />
                {/* Rear wheel - spoked style */}
                <div
                  className="absolute"
                  style={{
                    width: '6px', height: '6px',
                    bottom: '-4px', right: '-1px',
                    borderRadius: '50%',
                    border: '2px solid #78350f',
                    backgroundColor: 'transparent',
                    boxShadow: 'inset 0 0 0 1px #92400e',
                  }}
                />
              </div>

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
            className="absolute rounded"
            style={{
              left: `${wagonX - 5}%`,
              top: '35%',
              width: '64px',
              height: '10px',
              backgroundColor: '#92400e',
              border: '2px solid #78350f',
            }}
          >
            {/* Ferry pole */}
            <div className="absolute" style={{ width: '2px', height: '16px', top: '-16px', left: '50%', backgroundColor: '#78350f' }} />
            {/* Ferry sail/flag */}
            <div className="absolute" style={{ width: '10px', height: '6px', top: '-14px', left: 'calc(50% + 2px)', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '1px' }} />
            {/* Mini wagon on raft */}
            <div className="absolute flex items-end" style={{ bottom: '4px', left: '10px', gap: '1px' }}>
              {/* Mini oxen pair */}
              {[0, 1].map((ox) => (
                <div key={`ferry-ox-${ox}`} className="relative" style={{ width: '4px', height: '5px' }}>
                  <div className="absolute rounded-sm" style={{ width: '4px', height: '3px', top: '0px', backgroundColor: '#92400e' }} />
                  <div className="absolute" style={{ width: '1px', height: '2px', top: '3px', left: '0px', backgroundColor: '#6b3a10' }} />
                  <div className="absolute" style={{ width: '1px', height: '2px', top: '3px', left: '3px', backgroundColor: '#6b3a10' }} />
                </div>
              ))}
              {/* Mini yoke */}
              <div className="absolute" style={{ width: '3px', height: '1px', bottom: '2px', left: '9px', backgroundColor: '#78350f' }} />
              {/* Mini wagon */}
              <div className="relative" style={{ width: '12px', marginLeft: '2px' }}>
                {/* Mini canvas cover */}
                <div
                  className="absolute"
                  style={{
                    width: '12px', height: '6px',
                    top: '-7px', left: '0px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '6px 6px 0 0',
                    border: '1px solid #d6d3d1',
                    borderBottom: 'none',
                  }}
                />
                {/* Mini wagon bed */}
                <div style={{ width: '12px', height: '3px', backgroundColor: '#92400e', border: '1px solid #78350f', borderRadius: '1px' }} />
                {/* Mini wheels */}
                <div className="absolute" style={{ width: '4px', height: '4px', bottom: '-2px', left: '-1px', borderRadius: '50%', border: '1px solid #78350f' }} />
                <div className="absolute" style={{ width: '4px', height: '4px', bottom: '-2px', right: '-1px', borderRadius: '50%', border: '1px solid #78350f' }} />
              </div>
            </div>
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
          <div className="absolute bottom-4 left-4 flex items-end" style={{ gap: '1px' }}>
            {/* === Oxen Team (waiting on shore) === */}
            <div className="relative flex items-end" style={{ gap: '2px', marginRight: '2px' }}>
              {/* Lead pair of oxen */}
              {[0, 1].map((ox) => (
                <div key={`wait-lead-${ox}`} className="relative" style={{ width: '6px', height: '8px' }}>
                  {/* Ox head */}
                  <div
                    className="absolute rounded-sm"
                    style={{
                      width: '3px', height: '3px',
                      top: '0px', left: '0px',
                      backgroundColor: '#78350f',
                    }}
                  />
                  {/* Ox horns */}
                  <div
                    className="absolute"
                    style={{
                      width: '5px', height: '1px',
                      top: '-1px', left: '-1px',
                      backgroundColor: '#d6d3d1',
                      borderRadius: '1px',
                    }}
                  />
                  {/* Ox body */}
                  <div
                    className="absolute rounded-sm"
                    style={{
                      width: '6px', height: '4px',
                      top: '2px', left: '0px',
                      backgroundColor: '#92400e',
                      borderTop: '1px solid #78350f',
                    }}
                  />
                  {/* Ox legs */}
                  <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '0px', backgroundColor: '#6b3a10' }} />
                  <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '2px', backgroundColor: '#6b3a10' }} />
                  <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '4px', backgroundColor: '#6b3a10' }} />
                  <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '5px', backgroundColor: '#6b3a10' }} />
                </div>
              ))}
              {/* Rear pair of oxen */}
              {[0, 1].map((ox) => (
                <div key={`wait-rear-${ox}`} className="relative" style={{ width: '6px', height: '8px' }}>
                  {/* Ox head */}
                  <div
                    className="absolute rounded-sm"
                    style={{
                      width: '3px', height: '3px',
                      top: '0px', left: '0px',
                      backgroundColor: '#78350f',
                    }}
                  />
                  {/* Ox horns */}
                  <div
                    className="absolute"
                    style={{
                      width: '5px', height: '1px',
                      top: '-1px', left: '-1px',
                      backgroundColor: '#d6d3d1',
                      borderRadius: '1px',
                    }}
                  />
                  {/* Ox body */}
                  <div
                    className="absolute rounded-sm"
                    style={{
                      width: '6px', height: '4px',
                      top: '2px', left: '0px',
                      backgroundColor: '#7c2d12',
                      borderTop: '1px solid #6b3a10',
                    }}
                  />
                  {/* Ox legs */}
                  <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '0px', backgroundColor: '#5c2d0e' }} />
                  <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '2px', backgroundColor: '#5c2d0e' }} />
                  <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '4px', backgroundColor: '#5c2d0e' }} />
                  <div className="absolute" style={{ width: '1px', height: '3px', top: '6px', left: '5px', backgroundColor: '#5c2d0e' }} />
                </div>
              ))}
              {/* Yoke / harness line connecting oxen to wagon */}
              <div
                className="absolute"
                style={{
                  width: '8px', height: '1px',
                  bottom: '4px', right: '-9px',
                  backgroundColor: '#78350f',
                }}
              />
            </div>

            {/* === Covered Wagon (waiting) === */}
            <div className="relative" style={{ width: '16px' }}>
              {/* Canvas cover - prairie schooner arch */}
              <div
                className="absolute"
                style={{
                  width: '16px', height: '9px',
                  top: '-12px', left: '0px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px 8px 0 0',
                  border: '1px solid #d6d3d1',
                  borderBottom: 'none',
                }}
              />
              {/* Canvas hoop ribs */}
              <div className="absolute" style={{ width: '1px', height: '8px', top: '-11px', left: '4px', backgroundColor: '#a8a29e', borderRadius: '50%' }} />
              <div className="absolute" style={{ width: '1px', height: '9px', top: '-12px', left: '8px', backgroundColor: '#a8a29e', borderRadius: '50%' }} />
              <div className="absolute" style={{ width: '1px', height: '8px', top: '-11px', left: '12px', backgroundColor: '#a8a29e', borderRadius: '50%' }} />
              {/* Wagon bed */}
              <div
                style={{
                  width: '16px', height: '5px',
                  backgroundColor: '#92400e',
                  border: '1px solid #78350f',
                  borderRadius: '1px',
                }}
              />
              {/* Side boards */}
              <div className="absolute" style={{ width: '1px', height: '7px', top: '-3px', left: '0px', backgroundColor: '#78350f' }} />
              <div className="absolute" style={{ width: '1px', height: '7px', top: '-3px', right: '0px', backgroundColor: '#78350f' }} />
              {/* Wood slat detail */}
              <div className="absolute" style={{ width: '14px', height: '1px', top: '2px', left: '1px', backgroundColor: '#78350f', opacity: 0.5 }} />
              {/* Front wheel - spoked style */}
              <div
                className="absolute"
                style={{
                  width: '6px', height: '6px',
                  bottom: '-4px', left: '-1px',
                  borderRadius: '50%',
                  border: '2px solid #78350f',
                  backgroundColor: 'transparent',
                  boxShadow: 'inset 0 0 0 1px #92400e',
                }}
              />
              {/* Rear wheel - spoked style */}
              <div
                className="absolute"
                style={{
                  width: '6px', height: '6px',
                  bottom: '-4px', right: '-1px',
                  borderRadius: '50%',
                  border: '2px solid #78350f',
                  backgroundColor: 'transparent',
                  boxShadow: 'inset 0 0 0 1px #92400e',
                }}
              />
            </div>
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
