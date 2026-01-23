'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { type GraphicsTier } from '../oregonTrailContext'

// Time of day affects visuals
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

// Weather types
export type WeatherType = 'clear' | 'rain' | 'snow' | 'dust_storm' | 'fog'

// Get time of day based on game hours
export function getTimeOfDay(gameHour: number): TimeOfDay {
  if (gameHour >= 5 && gameHour < 8) return 'dawn'
  if (gameHour >= 8 && gameHour < 18) return 'day'
  if (gameHour >= 18 && gameHour < 21) return 'dusk'
  return 'night'
}

// Get sky colors based on time of day
function getSkyGradient(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'dawn':
      return 'linear-gradient(to bottom, #1a1a2e 0%, #4a3f6b 30%, #f4a460 70%, #ffd700 100%)'
    case 'day':
      return 'linear-gradient(to bottom, #1e3a5f 0%, #3b6ea5 50%, #87ceeb 100%)'
    case 'dusk':
      return 'linear-gradient(to bottom, #2d1b4e 0%, #8b4513 40%, #ff6347 70%, #ff8c00 100%)'
    case 'night':
      return 'linear-gradient(to bottom, #0a0a1a 0%, #1a1a3e 50%, #2a2a4e 100%)'
  }
}

// Get ambient light overlay
function getAmbientOverlay(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case 'dawn':
      return 'rgba(255, 200, 150, 0.15)'
    case 'day':
      return 'rgba(255, 255, 200, 0.05)'
    case 'dusk':
      return 'rgba(255, 100, 50, 0.2)'
    case 'night':
      return 'rgba(30, 30, 80, 0.4)'
  }
}

// Particle interface
interface Particle {
  id: number
  x: number
  y: number
  speed: number
  size: number
  opacity: number
  drift?: number
}

// Weather Particles Component
interface WeatherParticlesProps {
  weather: WeatherType
  intensity?: number
}

export function WeatherParticles({ weather, intensity = 1 }: WeatherParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const animationRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate particles based on weather
  const particleCount = useMemo(() => {
    switch (weather) {
      case 'rain': return Math.floor(100 * intensity)
      case 'snow': return Math.floor(50 * intensity)
      case 'dust_storm': return Math.floor(80 * intensity)
      case 'fog': return Math.floor(20 * intensity)
      default: return 0
    }
  }, [weather, intensity])

  // Initialize particles
  useEffect(() => {
    if (weather === 'clear') {
      setParticles([])
      return
    }

    const initialParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: weather === 'rain' ? 2 + Math.random() * 3
           : weather === 'snow' ? 0.3 + Math.random() * 0.7
           : weather === 'dust_storm' ? 1 + Math.random() * 2
           : 0.1 + Math.random() * 0.2,
      size: weather === 'rain' ? 1 + Math.random() * 2
          : weather === 'snow' ? 2 + Math.random() * 4
          : weather === 'dust_storm' ? 1 + Math.random() * 3
          : 20 + Math.random() * 40,
      opacity: weather === 'fog' ? 0.1 + Math.random() * 0.2
             : 0.4 + Math.random() * 0.4,
      drift: weather === 'snow' ? (Math.random() - 0.5) * 0.5
           : weather === 'dust_storm' ? 2 + Math.random() * 3
           : 0
    }))
    setParticles(initialParticles)
  }, [weather, particleCount])

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return

    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 16.67 // Normalize to ~60fps
      lastTime = currentTime

      setParticles(prev => prev.map(p => {
        let newY = p.y + p.speed * deltaTime
        let newX = p.x + (p.drift || 0) * deltaTime

        // Reset particles that go off screen
        if (newY > 100) {
          newY = -5
          newX = Math.random() * 100
        }
        if (newX > 100) newX = -5
        if (newX < -5) newX = 100

        return { ...p, x: newX, y: newY }
      }))

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [particles.length])

  if (weather === 'clear') return null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 20 }}
    >
      {particles.map(p => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          opacity: p.opacity,
        }

        if (weather === 'rain') {
          return (
            <div
              key={p.id}
              style={{
                ...style,
                width: '1px',
                height: `${p.size * 8}px`,
                background: 'linear-gradient(to bottom, transparent, rgba(150, 200, 255, 0.8))',
                transform: 'rotate(15deg)',
              }}
            />
          )
        }

        if (weather === 'snow') {
          return (
            <div
              key={p.id}
              style={{
                ...style,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,220,255,0.3) 100%)',
              }}
            />
          )
        }

        if (weather === 'dust_storm') {
          return (
            <div
              key={p.id}
              style={{
                ...style,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: '50%',
                background: 'rgba(139, 119, 101, 0.6)',
                filter: 'blur(1px)',
              }}
            />
          )
        }

        if (weather === 'fog') {
          return (
            <div
              key={p.id}
              style={{
                ...style,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(200,200,200,0.3) 0%, transparent 70%)',
                filter: 'blur(10px)',
              }}
            />
          )
        }

        return null
      })}
    </div>
  )
}

// Parallax Layer Component
interface ParallaxLayerProps {
  children: React.ReactNode
  speed: number  // 0 = fixed, 1 = normal scroll, >1 = faster
  offset?: number
  className?: string
}

export function ParallaxLayer({ children, speed, offset = 0, className = '' }: ParallaxLayerProps) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        transform: `translateY(${scrollY * speed + offset}px)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}

// Mountain silhouette SVG for parallax backgrounds
interface MountainSilhouetteProps {
  layer: 'far' | 'mid' | 'near'
  timeOfDay: TimeOfDay
}

export function MountainSilhouette({ layer, timeOfDay }: MountainSilhouetteProps) {
  const getColor = () => {
    const colors = {
      far: {
        dawn: '#4a3f6b',
        day: '#6b8cae',
        dusk: '#4a2c4a',
        night: '#1a1a3e',
      },
      mid: {
        dawn: '#3a2f5b',
        day: '#4a6c8e',
        dusk: '#3a1c3a',
        night: '#0f0f2e',
      },
      near: {
        dawn: '#2a1f4b',
        day: '#2a4c6e',
        dusk: '#2a0c2a',
        night: '#05051e',
      },
    }
    return colors[layer][timeOfDay]
  }

  const paths = {
    far: 'M0,100 L0,70 Q50,30 100,60 Q150,40 200,55 Q250,35 300,50 L300,100 Z',
    mid: 'M0,100 L0,75 Q30,50 60,65 Q90,45 120,60 Q150,35 180,55 Q210,45 240,60 Q270,50 300,70 L300,100 Z',
    near: 'M0,100 L0,80 Q20,60 50,75 Q80,55 110,70 Q140,50 170,65 Q200,55 230,70 Q260,60 300,85 L300,100 Z',
  }

  return (
    <svg
      viewBox="0 0 300 100"
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      <path d={paths[layer]} fill={getColor()} />
    </svg>
  )
}

// Animated smoke for chimneys/campfires
interface SmokeEffectProps {
  x: number  // percentage
  y: number  // percentage
  scale?: number
}

export function SmokeEffect({ x, y, scale = 1 }: SmokeEffectProps) {
  const [puffs, setPuffs] = useState<Array<{ id: number; offset: number; opacity: number; size: number }>>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setPuffs(prev => {
        const updated = prev
          .map(p => ({ ...p, offset: p.offset + 1, opacity: p.opacity - 0.02, size: p.size + 0.5 }))
          .filter(p => p.opacity > 0)

        if (updated.length < 8 && Math.random() > 0.5) {
          updated.push({
            id: Date.now(),
            offset: 0,
            opacity: 0.4,
            size: 8 * scale,
          })
        }

        return updated
      })
    }, 100)

    return () => clearInterval(interval)
  }, [scale])

  return (
    <div className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%` }}>
      {puffs.map(puff => (
        <div
          key={puff.id}
          className="absolute rounded-full"
          style={{
            width: `${puff.size}px`,
            height: `${puff.size}px`,
            background: 'rgba(180, 180, 180, 0.5)',
            opacity: puff.opacity,
            transform: `translate(-50%, -${puff.offset * 5}px) scale(${1 + puff.offset * 0.1})`,
            filter: 'blur(4px)',
          }}
        />
      ))}
    </div>
  )
}

// Animated water/river effect
interface WaterEffectProps {
  width?: string
  height?: string
  className?: string
}

export function WaterEffect({ width = '100%', height = '30px', className = '' }: WaterEffectProps) {
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <div
        className="w-[200%] h-full animate-water-flow"
        style={{
          background: 'repeating-linear-gradient(90deg, rgba(100,150,200,0.3) 0px, rgba(150,200,230,0.5) 10px, rgba(100,150,200,0.3) 20px)',
          animation: 'waterFlow 2s linear infinite',
        }}
      />
      <style jsx>{`
        @keyframes waterFlow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

// Swaying tree effect
interface SwayingTreeProps {
  x: number
  y: number
  height?: number
  variant?: 'pine' | 'oak' | 'dead'
}

export function SwayingTree({ x, y, height = 40, variant = 'pine' }: SwayingTreeProps) {
  const treeStyles = {
    pine: {
      trunk: 'bg-amber-900',
      foliage: 'border-l-transparent border-r-transparent border-b-green-800',
    },
    oak: {
      trunk: 'bg-amber-800',
      foliage: 'rounded-full bg-green-700',
    },
    dead: {
      trunk: 'bg-gray-700',
      foliage: '',
    },
  }

  const style = treeStyles[variant]

  return (
    <div
      className="absolute origin-bottom"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: 'treeSway 4s ease-in-out infinite',
        animationDelay: `${Math.random() * 2}s`,
      }}
    >
      {/* Trunk */}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${style.trunk}`}
        style={{ width: `${height * 0.1}px`, height: `${height * 0.4}px` }}
      />

      {/* Foliage */}
      {variant === 'pine' && (
        <div
          className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: `${height * 0.25}px solid transparent`,
            borderRight: `${height * 0.25}px solid transparent`,
            borderBottom: `${height * 0.7}px solid #2d5a3d`,
          }}
        />
      )}

      {variant === 'oak' && (
        <div
          className={`absolute bottom-[30%] left-1/2 -translate-x-1/2 ${style.foliage}`}
          style={{ width: `${height * 0.6}px`, height: `${height * 0.5}px` }}
        />
      )}

      <style jsx>{`
        @keyframes treeSway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
      `}</style>
    </div>
  )
}

// Stars for night sky
interface StarsProps {
  count?: number
}

export function Stars({ count = 50 }: StarsProps) {
  const stars = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 60,
      size: 1 + Math.random() * 2,
      twinkleDelay: Math.random() * 3,
    })),
    [count]
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `twinkle 2s ease-in-out infinite`,
            animationDelay: `${star.twinkleDelay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// Main 64-bit graphics wrapper
interface Graphics64bitWrapperProps {
  tier: GraphicsTier
  timeOfDay: TimeOfDay
  weather: WeatherType
  children: React.ReactNode
  showLandmarks?: boolean
  currentLandmark?: string
}

export function Graphics64bitWrapper({
  tier,
  timeOfDay,
  weather,
  children,
  showLandmarks = false,
  currentLandmark
}: Graphics64bitWrapperProps) {
  // Only show enhanced graphics for 64-bit tier
  if (tier !== 'ultra_64bit') {
    return <div className="relative">{children}</div>
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Sky gradient background */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: getSkyGradient(timeOfDay), zIndex: 0 }}
      />

      {/* Stars (night only) */}
      {timeOfDay === 'night' && <Stars count={80} />}

      {/* Far mountain layer - moves slowest */}
      <ParallaxLayer speed={0.1} className="h-[30vh] bottom-0 top-auto">
        <MountainSilhouette layer="far" timeOfDay={timeOfDay} />
      </ParallaxLayer>

      {/* Mid mountain layer */}
      <ParallaxLayer speed={0.3} className="h-[35vh] bottom-0 top-auto">
        <MountainSilhouette layer="mid" timeOfDay={timeOfDay} />
      </ParallaxLayer>

      {/* Near mountain layer - moves fastest */}
      <ParallaxLayer speed={0.5} className="h-[40vh] bottom-0 top-auto">
        <MountainSilhouette layer="near" timeOfDay={timeOfDay} />
      </ParallaxLayer>

      {/* Ambient light overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{ background: getAmbientOverlay(timeOfDay), zIndex: 15 }}
      />

      {/* Weather particles */}
      <WeatherParticles weather={weather} intensity={1.5} />

      {/* Landmark-specific decorations */}
      {showLandmarks && currentLandmark && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          {/* Trees scattered around */}
          <SwayingTree x={5} y={70} height={30} variant="pine" />
          <SwayingTree x={15} y={75} height={25} variant="oak" />
          <SwayingTree x={90} y={72} height={35} variant="pine" />
          <SwayingTree x={85} y={78} height={20} variant="dead" />

          {/* Smoke from town/fort */}
          {(currentLandmark.includes('Fort') || currentLandmark.includes('Town')) && (
            <>
              <SmokeEffect x={50} y={55} scale={1.2} />
              <SmokeEffect x={55} y={58} scale={0.8} />
            </>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="relative" style={{ zIndex: 25 }}>
        {children}
      </div>

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          zIndex: 30,
        }}
      />
    </div>
  )
}

// Traveling scene with animated wagon
interface TravelingSceneProps {
  tier: GraphicsTier
  timeOfDay: TimeOfDay
  weather: WeatherType
  progress: number  // 0-100 distance to next landmark
  terrain?: 'plains' | 'mountains' | 'desert' | 'forest' | 'river'
}

export function TravelingScene({
  tier,
  timeOfDay,
  weather,
  progress,
  terrain = 'plains'
}: TravelingSceneProps) {
  const [wagonBob, setWagonBob] = useState(0)

  // Animate wagon bobbing
  useEffect(() => {
    if (tier !== 'ultra_64bit') return

    const interval = setInterval(() => {
      setWagonBob(prev => (prev + 1) % 360)
    }, 50)

    return () => clearInterval(interval)
  }, [tier])

  if (tier !== 'ultra_64bit') {
    return (
      <div className="h-32 bg-amber-100 relative">
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-4xl">
          {getWagonEmoji(tier)}
        </div>
      </div>
    )
  }

  const terrainColors = {
    plains: '#8B7355',
    mountains: '#6B5344',
    desert: '#D2B48C',
    forest: '#4A5D23',
    river: '#4A6FA5',
  }

  return (
    <div className="relative h-48 overflow-hidden">
      {/* Ground */}
      <div
        className="absolute bottom-0 w-full h-16"
        style={{ background: terrainColors[terrain] }}
      />

      {/* Trail dust/tracks */}
      <div
        className="absolute bottom-4 w-full h-2"
        style={{
          background: 'repeating-linear-gradient(90deg, transparent 0px, rgba(139,115,85,0.5) 10px, transparent 20px)',
          animation: 'trailScroll 1s linear infinite',
        }}
      />

      {/* Animated wagon */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-5xl transition-transform"
        style={{
          transform: `translateX(-50%) translateY(${Math.sin(wagonBob * Math.PI / 180) * 3}px)`,
        }}
      >
        <span className="drop-shadow-lg">
          {terrain === 'river' ? '\u{1F6F6}' : '\u{1F6D2}'}
        </span>
      </div>

      {/* Terrain-specific elements */}
      {terrain === 'forest' && (
        <>
          <SwayingTree x={10} y={60} height={50} variant="pine" />
          <SwayingTree x={25} y={55} height={60} variant="pine" />
          <SwayingTree x={75} y={58} height={55} variant="oak" />
          <SwayingTree x={90} y={62} height={45} variant="pine" />
        </>
      )}

      {terrain === 'river' && (
        <WaterEffect className="absolute bottom-0" height="40px" />
      )}

      {/* Distance marker */}
      <div className="absolute top-2 right-4 bg-black/50 px-2 py-1 rounded text-xs text-white">
        {progress}% to landmark
      </div>

      <style jsx>{`
        @keyframes trailScroll {
          0% { background-position: 0 0; }
          100% { background-position: -20px 0; }
        }
      `}</style>
    </div>
  )
}

// Helper to get wagon emoji based on tier
function getWagonEmoji(tier: GraphicsTier): string {
  switch (tier) {
    case 'retro_4bit': return 'W'
    case 'classic_8bit': return '\u{1F6D2}'
    case 'enhanced_16bit': return '\u{1F6D2}'
    case 'modern_32bit': return '\u{1F6D2}'
    case 'ultra_64bit': return '\u{1F6D2}'
    default: return '\u{1F6D2}'
  }
}

// CSS filter based on graphics tier
export function getTierFilter(tier: GraphicsTier): string {
  switch (tier) {
    case 'retro_4bit':
      return 'grayscale(0.7) contrast(1.2) brightness(0.9)'
    case 'classic_8bit':
      return 'saturate(0.8) contrast(1.1)'
    case 'enhanced_16bit':
      return 'saturate(1.1) contrast(1.05)'
    case 'modern_32bit':
      return 'saturate(1.2) contrast(1)'
    case 'ultra_64bit':
      return 'saturate(1.3) contrast(1.05) brightness(1.05)'
    default:
      return 'none'
  }
}

// Glow effect for interactive elements (16-bit+)
export function InteractiveGlow({ children, tier, active = false }: {
  children: React.ReactNode
  tier: GraphicsTier
  active?: boolean
}) {
  const shouldGlow = ['enhanced_16bit', 'modern_32bit', 'ultra_64bit'].includes(tier)

  if (!shouldGlow || !active) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div
        className="absolute inset-0 rounded-lg animate-pulse"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.3) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
      {children}
    </div>
  )
}

export default Graphics64bitWrapper
