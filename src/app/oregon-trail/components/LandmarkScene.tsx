'use client'

import React, { useMemo } from 'react'
import { SmokeEffect, WaterEffect, SwayingTree, MountainSilhouette, WeatherParticles, type TimeOfDay, type WeatherType } from './Graphics64bit'

// Landmark types from oregonTrailContext.tsx
export type LandmarkType = 'town' | 'river' | 'fort' | 'landmark' | 'pass' | 'spring' | 'mountains' | 'destination'

// Configuration for each landmark type
interface LandmarkConfig {
  emoji: string
  title: string
  gradient: string
  accentColor: string
  features: string[]
}

const LANDMARK_CONFIGS: Record<LandmarkType, LandmarkConfig> = {
  town: {
    emoji: '🏘️',
    title: 'Town',
    gradient: 'from-amber-950 via-amber-900 to-amber-950',
    accentColor: 'amber',
    features: ['buildings', 'smoke', 'people'],
  },
  river: {
    emoji: '🌊',
    title: 'River Crossing',
    gradient: 'from-slate-900 via-blue-900 to-slate-950',
    accentColor: 'blue',
    features: ['water', 'trees', 'birds'],
  },
  fort: {
    emoji: '🏰',
    title: 'Fort',
    gradient: 'from-stone-900 via-stone-800 to-stone-950',
    accentColor: 'stone',
    features: ['walls', 'flag', 'soldiers'],
  },
  landmark: {
    emoji: '🗿',
    title: 'Landmark',
    gradient: 'from-orange-950 via-orange-900 to-amber-950',
    accentColor: 'orange',
    features: ['rocks', 'dust'],
  },
  pass: {
    emoji: '⛰️',
    title: 'Mountain Pass',
    gradient: 'from-slate-950 via-slate-800 to-gray-900',
    accentColor: 'slate',
    features: ['mountains', 'snow', 'wind'],
  },
  spring: {
    emoji: '♨️',
    title: 'Hot Spring',
    gradient: 'from-teal-950 via-emerald-900 to-teal-950',
    accentColor: 'emerald',
    features: ['steam', 'water', 'bubbles'],
  },
  mountains: {
    emoji: '🏔️',
    title: 'Mountains',
    gradient: 'from-indigo-950 via-purple-900 to-indigo-950',
    accentColor: 'purple',
    features: ['peaks', 'snow', 'pine'],
  },
  destination: {
    emoji: '🏆',
    title: 'Gold Country',
    gradient: 'from-yellow-900 via-amber-800 to-yellow-950',
    accentColor: 'yellow',
    features: ['gold', 'sparkles', 'celebration'],
  },
}

// Specific landmark overrides for unique locations
const SPECIFIC_LANDMARKS: Record<string, Partial<LandmarkConfig> & { customScene?: string }> = {
  'Independence, Missouri': {
    emoji: '🚂',
    title: 'Starting Point',
    customScene: 'independence',
  },
  'Kansas River Crossing': {
    emoji: '🛶',
    customScene: 'kansas_river',
  },
  'Fort Kearny': {
    emoji: '🏛️',
    customScene: 'fort_kearny',
  },
  'Chimney Rock': {
    emoji: '🪨',
    customScene: 'chimney_rock',
  },
  'Fort Laramie': {
    emoji: '⭐',
    customScene: 'fort_laramie',
  },
  'Independence Rock': {
    emoji: '📜',
    title: 'The Great Register',
    customScene: 'independence_rock',
  },
  'South Pass': {
    emoji: '🧭',
    title: 'Continental Divide',
    customScene: 'south_pass',
  },
  'Fort Bridger': {
    emoji: '🏕️',
    customScene: 'fort_bridger',
  },
  'Soda Springs': {
    emoji: '💨',
    customScene: 'soda_springs',
  },
  'Fort Hall': {
    emoji: '🏰',
    customScene: 'fort_hall',
  },
  'Snake River Crossing': {
    emoji: '🐍',
    customScene: 'snake_river',
  },
  'Fort Boise': {
    emoji: '🌲',
    customScene: 'fort_boise',
  },
  'Blue Mountains': {
    emoji: '🌄',
    customScene: 'blue_mountains',
  },
  'The Dalles': {
    emoji: '⚓',
    title: 'Trading Post',
    customScene: 'the_dalles',
  },
  'Sacramento Valley': {
    emoji: '🌻',
    customScene: 'sacramento',
  },
  'West Point': {
    emoji: '🏨',
    title: "Cynthia's Territory",
    gradient: 'from-emerald-950 via-emerald-900 to-teal-950',
    customScene: 'west_point',
  },
  'Gold Country': {
    emoji: '💰',
    customScene: 'gold_country',
  },
}

interface LandmarkSceneProps {
  landmarkName: string
  landmarkType: LandmarkType
  timeOfDay?: TimeOfDay
  weather?: WeatherType
  className?: string
}

// Deterministic positions for scene elements
const TREE_POSITIONS = [
  { x: 5, y: 82, height: 35, variant: 'pine' as const },
  { x: 12, y: 85, height: 28, variant: 'pine' as const },
  { x: 88, y: 83, height: 32, variant: 'oak' as const },
  { x: 95, y: 86, height: 25, variant: 'pine' as const },
]

const BUILDING_POSITIONS = [
  { x: 20, width: 60, height: 35 },
  { x: 45, width: 80, height: 45 },
  { x: 70, width: 55, height: 30 },
]

export function LandmarkScene({
  landmarkName,
  landmarkType,
  timeOfDay = 'day',
  weather = 'clear',
  className = '',
}: LandmarkSceneProps) {
  const baseConfig = LANDMARK_CONFIGS[landmarkType]
  const specificConfig = SPECIFIC_LANDMARKS[landmarkName]

  const config = useMemo(() => ({
    ...baseConfig,
    ...specificConfig,
  }), [baseConfig, specificConfig])

  const renderScene = () => {
    const scene = specificConfig?.customScene || landmarkType

    switch (scene) {
      case 'independence':
        return <IndependenceScene timeOfDay={timeOfDay} />
      case 'kansas_river':
      case 'snake_river':
        return <RiverCrossingScene timeOfDay={timeOfDay} name={landmarkName} />
      case 'chimney_rock':
        return <ChimneyRockScene timeOfDay={timeOfDay} />
      case 'independence_rock':
        return <IndependenceRockScene timeOfDay={timeOfDay} />
      case 'south_pass':
        return <MountainPassScene timeOfDay={timeOfDay} />
      case 'soda_springs':
        return <SodaSpringsScene timeOfDay={timeOfDay} />
      case 'blue_mountains':
        return <BlueMountainsScene timeOfDay={timeOfDay} />
      case 'west_point':
        return <WestPointScene timeOfDay={timeOfDay} />
      case 'gold_country':
        return <GoldCountryScene timeOfDay={timeOfDay} />
      case 'fort_kearny':
      case 'fort_laramie':
      case 'fort_bridger':
      case 'fort_hall':
      case 'fort_boise':
        return <FortScene timeOfDay={timeOfDay} fortName={landmarkName} />
      case 'the_dalles':
        return <TradingPostScene timeOfDay={timeOfDay} />
      case 'sacramento':
        return <SacramentoScene timeOfDay={timeOfDay} />
      default:
        return <GenericTownScene timeOfDay={timeOfDay} type={landmarkType} />
    }
  }

  return (
    <div className={`relative w-full h-48 md:h-64 overflow-hidden rounded-lg border-2 border-${config.accentColor}-600 ${className}`}>
      {/* Sky gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${config.gradient}`}
        style={{ zIndex: 0 }}
      />

      {/* Weather effects */}
      {weather !== 'clear' && (
        <WeatherParticles weather={weather} intensity={0.5} />
      )}

      {/* Scene content */}
      <div className="relative h-full" style={{ zIndex: 10 }}>
        {renderScene()}
      </div>

      {/* Location label */}
      <div className="absolute bottom-2 left-2 right-2 text-center" style={{ zIndex: 30 }}>
        <span className="text-4xl">{config.emoji}</span>
      </div>
    </div>
  )
}

// === Individual Scene Components ===

function IndependenceScene({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  return (
    <div className="relative h-full">
      {/* Train station building */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48">
        <svg viewBox="0 0 200 100" className="w-full">
          {/* Main station building */}
          <rect x="30" y="30" width="140" height="70" fill="#8B4513" />
          <rect x="35" y="35" width="130" height="60" fill="#A0522D" />
          {/* Roof */}
          <polygon points="25,30 100,5 175,30" fill="#654321" />
          {/* Windows */}
          <rect x="50" y="50" width="20" height="25" fill="#FFE4B5" opacity="0.8" />
          <rect x="90" y="50" width="20" height="25" fill="#FFE4B5" opacity="0.8" />
          <rect x="130" y="50" width="20" height="25" fill="#FFE4B5" opacity="0.8" />
          {/* Door */}
          <rect x="85" y="60" width="30" height="35" fill="#4a3728" />
          {/* Clock tower */}
          <rect x="90" y="5" width="20" height="25" fill="#8B4513" />
          <circle cx="100" cy="15" r="8" fill="#FFE4B5" />
        </svg>
      </div>
      <SmokeEffect x={52} y={15} scale={0.8} />

      {/* Wagons waiting */}
      <div className="absolute bottom-4 left-8">
        <span className="text-2xl">🛒</span>
      </div>
      <div className="absolute bottom-4 right-8">
        <span className="text-2xl">🐎</span>
      </div>
    </div>
  )
}

function RiverCrossingScene({ timeOfDay, name }: { timeOfDay: TimeOfDay; name: string }) {
  const isSnakeRiver = name.includes('Snake')

  return (
    <div className="relative h-full">
      {/* Far bank with trees */}
      <div className="absolute top-12 left-0 right-0 h-16 bg-gradient-to-b from-green-900 to-green-800 rounded-t-lg" />

      {/* River */}
      <div className="absolute top-28 md:top-32 left-0 right-0">
        <WaterEffect height="60px" />
      </div>

      {/* Near bank */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-amber-900 to-amber-800" />

      {/* Ferry or ford */}
      {isSnakeRiver ? (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <span className="text-3xl">🛶</span>
        </div>
      ) : (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <span className="text-3xl">⛵</span>
        </div>
      )}

      {/* Trees on far bank */}
      {[15, 30, 70, 85].map((x, i) => (
        <SwayingTree key={i} x={x} y={20} height={25} variant="pine" />
      ))}

      {/* Danger indicator for Snake River */}
      {isSnakeRiver && (
        <div className="absolute top-2 right-2 text-xs text-red-400 bg-red-900/50 px-2 py-1 rounded">
          ⚠️ Dangerous Current
        </div>
      )}
    </div>
  )
}

function ChimneyRockScene({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  return (
    <div className="relative h-full">
      {/* Desert floor */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-orange-800 to-orange-700" />

      {/* Chimney Rock formation */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
        <svg viewBox="0 0 80 120" className="w-20 h-32">
          {/* Base mound */}
          <ellipse cx="40" cy="110" rx="35" ry="10" fill="#8B6914" />
          <polygon points="5,110 40,50 75,110" fill="#9A7B0A" />
          {/* Chimney spire */}
          <rect x="35" y="20" width="10" height="30" fill="#A08020" />
          <polygon points="35,20 40,5 45,20" fill="#B8960F" />
        </svg>
      </div>

      {/* Dust particles */}
      {[20, 40, 60, 80].map((x, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-orange-300/30 rounded-full animate-pulse"
          style={{ left: `${x}%`, top: `${30 + i * 10}%`, animationDelay: `${i * 0.5}s` }}
        />
      ))}

      {/* Trail marker */}
      <div className="absolute bottom-2 left-4 text-xs text-orange-300">
        Mile 554 - A beacon for travelers
      </div>
    </div>
  )
}

function IndependenceRockScene({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  return (
    <div className="relative h-full">
      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-stone-800 to-stone-700" />

      {/* The rock - massive granite dome */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64">
        <svg viewBox="0 0 200 80" className="w-full">
          {/* Main rock body */}
          <ellipse cx="100" cy="70" rx="95" ry="25" fill="#6B6B6B" />
          <ellipse cx="100" cy="50" rx="85" ry="35" fill="#7A7A7A" />
          <ellipse cx="100" cy="40" rx="70" ry="30" fill="#8A8A8A" />
          {/* Names carved into rock */}
          <text x="50" y="45" fill="#555" fontSize="6" fontFamily="serif">J.Smith 1847</text>
          <text x="100" y="55" fill="#555" fontSize="5" fontFamily="serif">Oregon or Bust</text>
          <text x="130" y="40" fill="#555" fontSize="6" fontFamily="serif">★ M.W.</text>
        </svg>
      </div>

      {/* Info text */}
      <div className="absolute top-2 left-2 text-xs text-stone-400 bg-stone-900/70 px-2 py-1 rounded">
        "The Great Register of the Desert"
      </div>
    </div>
  )
}

function MountainPassScene({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  return (
    <div className="relative h-full">
      {/* Mountain layers */}
      <div className="absolute inset-0">
        <MountainSilhouette layer="far" timeOfDay={timeOfDay} />
      </div>
      <div className="absolute inset-0 top-8">
        <MountainSilhouette layer="mid" timeOfDay={timeOfDay} />
      </div>

      {/* Snow on peaks */}
      <div className="absolute top-4 left-1/4 w-20 h-6 bg-white/30 rounded-full blur-sm" />
      <div className="absolute top-6 right-1/4 w-16 h-5 bg-white/20 rounded-full blur-sm" />

      {/* Pass path */}
      <div className="absolute bottom-0 left-0 right-0 h-20">
        <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,50 Q50,30 100,25 Q150,30 200,50" fill="#4A5568" />
          <path d="M80,35 L120,35" stroke="#8B7355" strokeWidth="3" strokeDasharray="5,5" />
        </svg>
      </div>

      {/* Continental divide marker */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-300 bg-slate-800/80 px-2 py-1 rounded">
        Continental Divide - 7,550 ft
      </div>

      {/* Wind effect */}
      <WeatherParticles weather="dust_storm" intensity={0.3} />
    </div>
  )
}

function SodaSpringsScene({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  return (
    <div className="relative h-full">
      {/* Ground with mineral deposits */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-teal-900 to-emerald-800" />

      {/* Hot spring pools */}
      {[
        { x: 25, y: 70, size: 40 },
        { x: 60, y: 75, size: 55 },
        { x: 85, y: 72, size: 35 },
      ].map((pool, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-gradient-radial from-teal-400/40 to-teal-600/20"
          style={{
            left: `${pool.x}%`,
            top: `${pool.y}%`,
            width: `${pool.size}px`,
            height: `${pool.size * 0.6}px`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Steam effects */}
      <SmokeEffect x={30} y={55} scale={1.2} />
      <SmokeEffect x={62} y={58} scale={1.5} />
      <SmokeEffect x={82} y={56} scale={1} />

      {/* Bubbles */}
      {[30, 45, 65, 80].map((x, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white/40 rounded-full animate-bounce"
          style={{
            left: `${x}%`,
            bottom: '25%',
            animationDelay: `${i * 0.3}s`,
            animationDuration: '1.5s'
          }}
        />
      ))}

      {/* Info */}
      <div className="absolute top-2 right-2 text-xs text-emerald-300 bg-emerald-900/70 px-2 py-1 rounded">
        Natural Mineral Springs
      </div>
    </div>
  )
}

function BlueMountainsScene({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  return (
    <div className="relative h-full overflow-hidden">
      {/* Mountain layers with blue tint */}
      <div className="absolute inset-0" style={{ filter: 'hue-rotate(-20deg)' }}>
        <MountainSilhouette layer="far" timeOfDay={timeOfDay} />
      </div>
      <div className="absolute inset-0 top-6" style={{ filter: 'hue-rotate(-30deg)' }}>
        <MountainSilhouette layer="mid" timeOfDay={timeOfDay} />
      </div>
      <div className="absolute inset-0 top-12" style={{ filter: 'hue-rotate(-40deg)' }}>
        <MountainSilhouette layer="near" timeOfDay={timeOfDay} />
      </div>

      {/* Pine forest at base */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-950 to-green-900/80" />
      {[8, 18, 28, 42, 55, 68, 78, 88].map((x, i) => (
        <SwayingTree key={i} x={x} y={75 + (i % 3) * 3} height={22 + (i % 4) * 5} variant="pine" />
      ))}

      {/* Mist effect */}
      <div className="absolute bottom-12 left-0 right-0 h-8 bg-gradient-to-t from-purple-200/20 to-transparent" />

      {/* Difficulty warning */}
      <div className="absolute top-2 left-2 text-xs text-purple-300 bg-purple-900/70 px-2 py-1 rounded">
        ⛰️ Steep Terrain Ahead
      </div>
    </div>
  )
}

function WestPointScene({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  return (
    <div className="relative h-full">
      {/* Lush green background */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-emerald-900 to-emerald-800" />

      {/* Cynthia's Inn building */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-52">
        <svg viewBox="0 0 200 90" className="w-full">
          {/* Main building */}
          <rect x="30" y="30" width="140" height="60" fill="#2D4A3E" />
          {/* Roof */}
          <polygon points="20,30 100,5 180,30" fill="#1A332A" />
          {/* Porch */}
          <rect x="25" y="70" width="150" height="20" fill="#3D5A4E" />
          {/* Columns */}
          <rect x="40" y="50" width="6" height="40" fill="#4A6A5E" />
          <rect x="80" y="50" width="6" height="40" fill="#4A6A5E" />
          <rect x="114" y="50" width="6" height="40" fill="#4A6A5E" />
          <rect x="154" y="50" width="6" height="40" fill="#4A6A5E" />
          {/* Windows with warm glow */}
          <rect x="50" y="40" width="25" height="20" fill="#FFD700" opacity="0.8" />
          <rect x="88" y="40" width="25" height="20" fill="#FFD700" opacity="0.8" />
          <rect x="126" y="40" width="25" height="20" fill="#FFD700" opacity="0.8" />
          {/* Sign */}
          <rect x="70" y="12" width="60" height="15" fill="#8B4513" />
          <text x="100" y="23" fill="#FFD700" fontSize="8" textAnchor="middle">CYNTHIA'S</text>
        </svg>
      </div>

      <SmokeEffect x={52} y={10} scale={0.7} />

      {/* Decorative trees */}
      <SwayingTree x={10} y={75} height={30} variant="oak" />
      <SwayingTree x={90} y={77} height={28} variant="oak" />

      {/* Special marker */}
      <div className="absolute top-2 right-2 text-xs text-emerald-300 bg-emerald-900/70 px-2 py-1 rounded flex items-center gap-1">
        <span>✨</span> A Familiar Place
      </div>
    </div>
  )
}

function GoldCountryScene({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  return (
    <div className="relative h-full overflow-hidden">
      {/* Golden hills */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-yellow-800 to-amber-700" />

      {/* Mining camp */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
        <svg viewBox="0 0 180 60" className="w-44">
          {/* Tents */}
          <polygon points="20,60 40,30 60,60" fill="#D2691E" />
          <polygon points="70,60 90,35 110,60" fill="#CD853F" />
          <polygon points="120,60 140,32 160,60" fill="#D2691E" />
          {/* Mine entrance */}
          <rect x="75" y="45" width="30" height="15" fill="#1a1a1a" />
          <rect x="80" y="42" width="20" height="5" fill="#8B4513" />
        </svg>
      </div>

      {/* Gold sparkles */}
      {[15, 30, 45, 55, 70, 85].map((x, i) => (
        <div
          key={i}
          className="absolute text-yellow-400 animate-pulse"
          style={{
            left: `${x}%`,
            top: `${50 + (i % 3) * 10}%`,
            animationDelay: `${i * 0.2}s`,
            fontSize: '10px',
          }}
        >
          ✦
        </div>
      ))}

      {/* River with gold */}
      <div className="absolute bottom-8 left-10 right-10">
        <WaterEffect height="20px" />
      </div>

      {/* Pan icon */}
      <div className="absolute bottom-2 right-4 text-2xl">🥘</div>

      {/* Victory banner */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-sm text-yellow-300 bg-yellow-900/80 px-3 py-1 rounded-full font-bold">
        🏆 EUREKA! 🏆
      </div>
    </div>
  )
}

function FortScene({ timeOfDay, fortName }: { timeOfDay: TimeOfDay; fortName: string }) {
  // Different fort configurations
  const fortConfigs: Record<string, { flag: string; extra: string }> = {
    'Fort Kearny': { flag: '🇺🇸', extra: 'Military Outpost' },
    'Fort Laramie': { flag: '⭐', extra: 'Trading Hub' },
    'Fort Bridger': { flag: '🏕️', extra: 'Mountain Man Territory' },
    'Fort Hall': { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', extra: 'British Trading Post' },
    'Fort Boise': { flag: '🌲', extra: 'Western Outpost' },
  }

  const config = fortConfigs[fortName] || { flag: '🏳️', extra: 'Frontier Fort' }

  return (
    <div className="relative h-full">
      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-stone-800 to-stone-700" />

      {/* Fort structure */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-56">
        <svg viewBox="0 0 220 80" className="w-full">
          {/* Walls */}
          <rect x="10" y="30" width="200" height="50" fill="#6B5344" />
          {/* Wall texture */}
          <rect x="15" y="35" width="190" height="40" fill="#7A6354" />
          {/* Gate */}
          <rect x="90" y="45" width="40" height="35" fill="#3a2a1a" />
          <rect x="95" y="50" width="30" height="25" fill="#4a3a2a" />
          {/* Guard towers */}
          <rect x="10" y="10" width="30" height="70" fill="#5B4334" />
          <rect x="180" y="10" width="30" height="70" fill="#5B4334" />
          {/* Tower roofs */}
          <polygon points="10,10 25,0 40,10" fill="#4A3324" />
          <polygon points="180,10 195,0 210,10" fill="#4A3324" />
          {/* Flag */}
          <line x1="25" y1="0" x2="25" y2="-15" stroke="#8B4513" strokeWidth="2" />
        </svg>
      </div>

      {/* Flag (emoji) */}
      <div className="absolute" style={{ top: '12%', left: 'calc(50% - 75px)' }}>
        <span className="text-lg">{config.flag}</span>
      </div>

      <SmokeEffect x={30} y={35} scale={0.6} />
      <SmokeEffect x={72} y={35} scale={0.6} />

      {/* Fort info */}
      <div className="absolute top-2 left-2 text-xs text-stone-300 bg-stone-900/70 px-2 py-1 rounded">
        {config.extra}
      </div>
    </div>
  )
}

function TradingPostScene({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  return (
    <div className="relative h-full">
      {/* Water in background (Columbia River) */}
      <div className="absolute top-8 left-0 right-0 h-20">
        <WaterEffect height="80px" />
      </div>

      {/* Dock/wharf */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-amber-900 to-amber-800" />

      {/* Trading post building */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48">
        <svg viewBox="0 0 180 70" className="w-full">
          {/* Main building */}
          <rect x="20" y="25" width="140" height="45" fill="#8B4513" />
          {/* Roof */}
          <polygon points="15,25 90,5 165,25" fill="#654321" />
          {/* Porch overhang */}
          <rect x="15" y="55" width="150" height="5" fill="#7A5533" />
          {/* Windows */}
          <rect x="35" y="35" width="20" height="20" fill="#FFE4B5" opacity="0.7" />
          <rect x="80" y="35" width="20" height="20" fill="#FFE4B5" opacity="0.7" />
          <rect x="125" y="35" width="20" height="20" fill="#FFE4B5" opacity="0.7" />
          {/* Door */}
          <rect x="65" y="40" width="25" height="30" fill="#4a3728" />
          {/* Sign */}
          <rect x="55" y="10" width="70" height="12" fill="#5a4333" />
          <text x="90" y="19" fill="#FFD700" fontSize="7" textAnchor="middle">TRADING POST</text>
        </svg>
      </div>

      <SmokeEffect x={52} y={12} scale={0.7} />

      {/* Boats */}
      <div className="absolute top-16 left-8 text-xl">⛵</div>
      <div className="absolute top-14 right-12 text-lg">🚣</div>

      {/* Columbia River label */}
      <div className="absolute top-2 right-2 text-xs text-blue-300 bg-blue-900/70 px-2 py-1 rounded">
        Columbia River
      </div>
    </div>
  )
}

function SacramentoScene({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  return (
    <div className="relative h-full">
      {/* Valley floor - fertile land */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-800 to-lime-700" />

      {/* Distant mountains */}
      <div className="absolute top-0 left-0 right-0 h-16 opacity-60">
        <MountainSilhouette layer="far" timeOfDay={timeOfDay} />
      </div>

      {/* Fields/orchards */}
      <div className="absolute bottom-24 left-0 right-0 h-12">
        <svg viewBox="0 0 200 30" className="w-full h-full" preserveAspectRatio="none">
          {/* Crop rows */}
          {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="30" stroke="#4a7c23" strokeWidth="8" />
          ))}
        </svg>
      </div>

      {/* Sunflowers */}
      {[20, 35, 65, 80].map((x, i) => (
        <div
          key={i}
          className="absolute text-2xl"
          style={{ left: `${x}%`, bottom: '30%' }}
        >
          🌻
        </div>
      ))}

      {/* Farmhouse */}
      <div className="absolute bottom-16 right-8">
        <span className="text-2xl">🏡</span>
      </div>

      {/* Almost there! */}
      <div className="absolute top-2 left-2 text-xs text-lime-300 bg-green-900/70 px-2 py-1 rounded">
        🌾 Fertile Valley - Almost There!
      </div>
    </div>
  )
}

function GenericTownScene({ timeOfDay, type }: { timeOfDay: TimeOfDay; type: LandmarkType }) {
  return (
    <div className="relative h-full">
      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-900 to-amber-800" />

      {/* Simple buildings */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-4">
        {BUILDING_POSITIONS.map((pos, i) => (
          <div
            key={i}
            className="bg-amber-800 border-2 border-amber-700"
            style={{ width: `${pos.width}px`, height: `${pos.height}px` }}
          >
            {/* Window */}
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-4 bg-yellow-200/60"
            />
          </div>
        ))}
      </div>

      {/* Trees */}
      {TREE_POSITIONS.slice(0, 2).map((tree, i) => (
        <SwayingTree key={i} x={tree.x} y={tree.y} height={tree.height} variant={tree.variant} />
      ))}

      <SmokeEffect x={50} y={40} scale={0.5} />
    </div>
  )
}

export default LandmarkScene
