'use client'

import React, { useState, useEffect } from 'react'

interface TitleScreenProps {
  onStart: () => void
  hasSaves?: boolean
  onContinue?: () => void
}

export function TitleScreen({ onStart, hasSaves, onContinue }: TitleScreenProps) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [cloudOffset, setCloudOffset] = useState(0)
  const [horseFrame, setHorseFrame] = useState(0)

  // Animate clouds
  useEffect(() => {
    const interval = setInterval(() => {
      setCloudOffset(prev => (prev + 0.5) % 100)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // Animate horse
  useEffect(() => {
    const interval = setInterval(() => {
      setHorseFrame(prev => (prev + 1) % 4)
    }, 200)
    return () => clearInterval(interval)
  }, [])

  // Show prompt after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowPrompt(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Handle any key press (only when no saves — otherwise buttons are shown)
  useEffect(() => {
    if (hasSaves) return // Use buttons when saves exist
    const handleKeyPress = () => {
      if (showPrompt) onStart()
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showPrompt, onStart, hasSaves])

  return (
    <div
      className="min-h-screen relative overflow-hidden cursor-pointer"
      onClick={() => showPrompt && !hasSaves && onStart()}
    >
      {/* Sky gradient - dawn/dusk feel */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-orange-400 to-amber-300" />

      {/* Stars (visible in upper sky) */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 13) % 30}%`,
              opacity: 0.3 + (i % 3) * 0.2,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Clouds layer - parallax */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${((i * 25) + cloudOffset) % 120 - 20}%`,
              top: `${10 + i * 5}%`,
            }}
          >
            <Cloud size={60 + i * 20} opacity={0.6 - i * 0.1} />
          </div>
        ))}
      </div>

      {/* Distant mountains - purple/blue */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 100 30" className="w-full" preserveAspectRatio="none" style={{ height: '40vh' }}>
          <polygon
            points="0,30 10,15 20,20 35,8 50,18 65,5 80,15 90,10 100,20 100,30"
            fill="#3b2d5c"
          />
          <polygon
            points="0,30 15,20 30,12 45,22 60,10 75,18 85,14 100,22 100,30"
            fill="#4a3875"
          />
        </svg>
      </div>

      {/* Mid mountains - darker */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 100 25" className="w-full" preserveAspectRatio="none" style={{ height: '30vh' }}>
          <polygon
            points="0,25 8,18 18,22 28,12 40,20 55,8 70,16 82,12 95,18 100,15 100,25"
            fill="#2d4a3d"
          />
          {/* Snow caps */}
          <polygon points="55,8 52,11 58,11" fill="#e8e8e8" opacity="0.8" />
          <polygon points="28,12 25,15 31,15" fill="#e8e8e8" opacity="0.6" />
        </svg>
      </div>

      {/* Hills/prairie - golden */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 100 20" className="w-full" preserveAspectRatio="none" style={{ height: '25vh' }}>
          <polygon
            points="0,20 0,15 20,12 40,16 60,10 80,14 100,12 100,20"
            fill="#8b7355"
          />
          <polygon
            points="0,20 0,18 15,15 35,17 55,14 75,16 100,15 100,20"
            fill="#a08060"
          />
        </svg>
      </div>

      {/* Ground/foreground */}
      <div className="absolute bottom-0 left-0 right-0 h-[15vh] bg-gradient-to-t from-amber-900 to-amber-800" />

      {/* Ranch house - left side */}
      <div className="absolute bottom-[12vh] left-[10%]">
        <RanchHouse />
      </div>

      {/* Fence line */}
      <div className="absolute bottom-[10vh] left-[5%] right-[30%] flex">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className="w-1 h-6 bg-amber-700" />
            <div className="w-8 h-0.5 bg-amber-700 -mt-4" />
            <div className="w-8 h-0.5 bg-amber-700 mt-1" />
          </div>
        ))}
      </div>

      {/* Horses - right side */}
      <div className="absolute bottom-[12vh] right-[15%] flex gap-8">
        <Horse frame={horseFrame} delay={0} />
        <Horse frame={horseFrame} delay={1} />
        <Horse frame={horseFrame} delay={2} />
      </div>

      {/* Wagon on trail */}
      <div className="absolute bottom-[14vh] left-[45%]">
        <Wagon />
      </div>

      {/* Trail/path */}
      <div className="absolute bottom-0 left-0 right-0 h-[10vh]">
        <svg viewBox="0 0 100 10" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,8 Q25,5 50,7 T100,6"
            fill="none"
            stroke="#6b5a45"
            strokeWidth="3"
          />
          <path
            d="M0,8 Q25,5 50,7 T100,6"
            fill="none"
            stroke="#8b7355"
            strokeWidth="1"
            strokeDasharray="2,3"
          />
        </svg>
      </div>

      {/* Title text */}
      <div className="absolute inset-x-0 top-[15%] text-center z-10">
        <div className="inline-block bg-black/40 backdrop-blur-sm px-8 py-6 rounded-lg border-2 border-amber-600/50">
          <h1 className="font-pixel text-amber-200 text-4xl md:text-5xl mb-2 drop-shadow-lg tracking-wide">
            GOLDEN FROG TRAIL
          </h1>
          <h2 className="font-pixel text-amber-400 text-xl md:text-2xl mb-4">
            The Journey to Gold Country
          </h2>
          <div className="flex items-center justify-center gap-2 text-amber-500 text-sm">
            <span>The Emigrant Trail</span>
            <span className="text-amber-600">×</span>
            <span>Fallout</span>
            <span className="text-amber-600">×</span>
            <span>Carmen Sandiego</span>
          </div>
        </div>
      </div>

      {/* Subtitle / flavor text */}
      <div className="absolute inset-x-0 top-[42%] text-center z-10">
        <p className="text-amber-300/80 text-lg italic font-serif">
          "The year is 1849. Gold has been discovered in California..."
        </p>
      </div>

      {/* Start / Continue prompt */}
      {showPrompt && (
        <div className="absolute inset-x-0 bottom-[20vh] text-center z-10">
          <div className="inline-flex flex-col gap-3 items-center">
            {hasSaves && onContinue && (
              <button
                onClick={(e) => { e.stopPropagation(); onContinue(); }}
                className="bg-amber-700/90 hover:bg-amber-600 px-8 py-3 rounded border-2 border-amber-400/70 font-pixel text-amber-200 text-lg transition-colors"
              >
                Continue Game
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onStart(); }}
              className="bg-black/60 hover:bg-black/80 px-8 py-3 rounded border border-amber-500/50 font-pixel text-amber-400 text-lg animate-pulse transition-colors"
            >
              {hasSaves ? 'New Game' : 'Press any key to begin'}
            </button>
          </div>
        </div>
      )}

      {/* Copyright / credits */}
      <div className="absolute inset-x-0 bottom-4 text-center z-10">
        <p className="text-amber-600/60 text-xs">
          A Golden Frog Production • Inspired by the classics
        </p>
      </div>
    </div>
  )
}

// Cloud component
function Cloud({ size, opacity }: { size: number; opacity: number }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 100 50" style={{ opacity }}>
      <ellipse cx="30" cy="35" rx="25" ry="15" fill="white" />
      <ellipse cx="50" cy="30" rx="30" ry="20" fill="white" />
      <ellipse cx="75" cy="35" rx="22" ry="15" fill="white" />
      <ellipse cx="50" cy="38" rx="35" ry="12" fill="white" />
    </svg>
  )
}

// Ranch house component - pixel art style
function RanchHouse() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80">
      {/* Main structure */}
      <rect x="20" y="35" width="80" height="45" fill="#8B4513" />
      <rect x="22" y="37" width="76" height="41" fill="#A0522D" />

      {/* Roof */}
      <polygon points="10,35 60,5 110,35" fill="#4a3728" />
      <polygon points="15,35 60,10 105,35" fill="#5c4433" />

      {/* Chimney */}
      <rect x="80" y="8" width="12" height="20" fill="#654321" />
      <rect x="78" y="5" width="16" height="5" fill="#543210" />

      {/* Door */}
      <rect x="50" y="50" width="20" height="30" fill="#3d2817" />
      <circle cx="65" cy="65" r="2" fill="#c9a227" />

      {/* Windows */}
      <rect x="28" y="45" width="15" height="15" fill="#87CEEB" opacity="0.7" />
      <rect x="77" y="45" width="15" height="15" fill="#87CEEB" opacity="0.7" />
      <line x1="35.5" y1="45" x2="35.5" y2="60" stroke="#5c4433" strokeWidth="1" />
      <line x1="28" y1="52.5" x2="43" y2="52.5" stroke="#5c4433" strokeWidth="1" />
      <line x1="84.5" y1="45" x2="84.5" y2="60" stroke="#5c4433" strokeWidth="1" />
      <line x1="77" y1="52.5" x2="92" y2="52.5" stroke="#5c4433" strokeWidth="1" />

      {/* Porch */}
      <rect x="15" y="75" width="90" height="5" fill="#654321" />
      <rect x="20" y="65" width="5" height="15" fill="#654321" />
      <rect x="95" y="65" width="5" height="15" fill="#654321" />
    </svg>
  )
}

// Horse component - simple pixel art with animation frames
function Horse({ frame, delay }: { frame: number; delay: number }) {
  const actualFrame = (frame + delay) % 4
  const legOffset = [0, 2, 0, -2][actualFrame]
  const headOffset = [0, 1, 0, -1][actualFrame]

  return (
    <svg width="50" height="45" viewBox="0 0 50 45">
      {/* Body */}
      <ellipse cx="25" cy="25" rx="15" ry="10" fill="#8B4513" />

      {/* Neck */}
      <polygon points="35,20 42,8 38,8 32,18" fill="#8B4513" />

      {/* Head */}
      <ellipse cx={43 + headOffset} cy="8" rx="7" ry="5" fill="#8B4513" />
      <circle cx={46 + headOffset} cy="6" r="1" fill="#000" /> {/* Eye */}

      {/* Ears */}
      <polygon points={`${41 + headOffset},3 ${43 + headOffset},0 ${45 + headOffset},3`} fill="#8B4513" />

      {/* Mane */}
      <path d="M35,15 Q38,10 36,5" stroke="#3d2817" strokeWidth="3" fill="none" />

      {/* Tail */}
      <path d="M10,25 Q5,30 8,38" stroke="#3d2817" strokeWidth="3" fill="none" />

      {/* Legs */}
      <rect x="15" y="32" width="4" height={12 + legOffset} fill="#6b4423" />
      <rect x="22" y="32" width="4" height={12 - legOffset} fill="#6b4423" />
      <rect x="28" y="32" width="4" height={12 + legOffset} fill="#6b4423" />
      <rect x="35" y="32" width="4" height={12 - legOffset} fill="#6b4423" />
    </svg>
  )
}

// Wagon component
function Wagon() {
  return (
    <svg width="80" height="50" viewBox="0 0 80 50">
      {/* Wagon cover (white canvas) */}
      <ellipse cx="40" cy="15" rx="30" ry="12" fill="#f5f5dc" />
      <ellipse cx="40" cy="15" rx="28" ry="10" fill="#fffef0" />

      {/* Wagon body */}
      <rect x="12" y="22" width="56" height="18" fill="#8B4513" />
      <rect x="14" y="24" width="52" height="14" fill="#A0522D" />

      {/* Wheels */}
      <circle cx="20" cy="42" r="8" fill="#4a3728" />
      <circle cx="20" cy="42" r="6" fill="#5c4433" />
      <circle cx="20" cy="42" r="2" fill="#3d2817" />

      <circle cx="60" cy="42" r="8" fill="#4a3728" />
      <circle cx="60" cy="42" r="6" fill="#5c4433" />
      <circle cx="60" cy="42" r="2" fill="#3d2817" />

      {/* Wheel spokes */}
      {[0, 45, 90, 135].map(angle => (
        <g key={angle}>
          <line
            x1={20 + Math.cos(angle * Math.PI / 180) * 2}
            y1={42 + Math.sin(angle * Math.PI / 180) * 2}
            x2={20 + Math.cos(angle * Math.PI / 180) * 6}
            y2={42 + Math.sin(angle * Math.PI / 180) * 6}
            stroke="#3d2817"
            strokeWidth="1"
          />
          <line
            x1={60 + Math.cos(angle * Math.PI / 180) * 2}
            y1={42 + Math.sin(angle * Math.PI / 180) * 2}
            x2={60 + Math.cos(angle * Math.PI / 180) * 6}
            y2={42 + Math.sin(angle * Math.PI / 180) * 6}
            stroke="#3d2817"
            strokeWidth="1"
          />
        </g>
      ))}

      {/* Tongue/hitch */}
      <line x1="68" y1="35" x2="80" y2="40" stroke="#654321" strokeWidth="3" />
    </svg>
  )
}

export default TitleScreen
