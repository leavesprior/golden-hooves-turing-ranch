'use client'
import { useState } from 'react'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'

type Location = {
  id: string
  name: string
  icon: string
  type: 'attraction' | 'food' | 'adventure' | 'nature' | 'ranch'
  description: string
  distance: string
  x: number
  y: number
}

const locations: Location[] = [
  { id: 'ranch', name: 'BOBR Ranch', icon: '🏠', type: 'ranch', description: 'Your base camp for adventure!', distance: 'You are here', x: 50, y: 50 },
  { id: 'kirkwood', name: 'Kirkwood Ski', icon: '⛷️', type: 'adventure', description: 'Epic ski slopes and snowboarding', distance: '25 min', x: 30, y: 25 },
  { id: 'bear-valley', name: 'Bear Valley', icon: '🐻', type: 'adventure', description: 'Family-friendly ski resort', distance: '35 min', x: 70, y: 20 },
  { id: 'wine-caves', name: 'Wine Caves', icon: '🍷', type: 'food', description: 'Underground wine tasting', distance: '20 min', x: 75, y: 60 },
  { id: 'gold-mine', name: 'Gold Mine Tours', icon: '⛏️', type: 'attraction', description: 'Historic gold rush tunnels', distance: '15 min', x: 25, y: 65 },
  { id: 'lake', name: 'Caples Lake', icon: '🏞️', type: 'nature', description: 'Pristine alpine lake fishing', distance: '30 min', x: 20, y: 35 },
  { id: 'brewery', name: 'Gold Country Brewery', icon: '🍺', type: 'food', description: 'Local craft beers', distance: '10 min', x: 60, y: 75 },
  { id: 'caves', name: 'Moaning Caverns', icon: '🦇', type: 'attraction', description: 'Massive underground cavern', distance: '40 min', x: 85, y: 40 },
  { id: 'rafting', name: 'River Rafting', icon: '🚣', type: 'adventure', description: 'White water adventure', distance: '45 min', x: 15, y: 80 },
  { id: 'hot-springs', name: 'Hot Springs', icon: '♨️', type: 'nature', description: 'Natural thermal pools', distance: '50 min', x: 40, y: 15 },
]

const typeColors = {
  ranch: 'var(--pixel-gold-light)',
  attraction: 'var(--pixel-fire-orange)',
  food: 'var(--pixel-forest-light)',
  adventure: 'var(--pixel-sky-light)',
  nature: 'var(--pixel-forest-mid)',
}

export default function ExplorePage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const filteredLocations = filter === 'all'
    ? locations
    : locations.filter(l => l.type === filter)

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg sm:text-xl text-center mb-2">
          🗺️ Gold Country Map
        </h1>
        <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] text-center mb-8">
          Click locations to discover adventures
        </p>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['all', 'adventure', 'food', 'attraction', 'nature'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`font-[var(--font-pixel)] text-[8px] px-3 py-2 border-2 transition-colors ${
                filter === type
                  ? 'bg-[var(--pixel-gold-mid)] border-[var(--pixel-gold-dark)] text-[var(--pixel-bg-dark)]'
                  : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:bg-[var(--pixel-bg-light)]'
              }`}
            >
              {type === 'all' ? '🌟 All' : type === 'adventure' ? '⚔️ Adventure' : type === 'food' ? '🍽️ Food' : type === 'attraction' ? '🎭 Attractions' : '🌲 Nature'}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <div className="relative bg-gradient-to-b from-[var(--pixel-forest-dark)] to-[var(--pixel-earth-dark)] border-4 border-[var(--pixel-ui-border)] aspect-[4/3] overflow-hidden">
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-10">
                {[...Array(10)].map((_, i) => (
                  <div key={`h-${i}`} className="absolute w-full h-px bg-[var(--pixel-ui-text)]" style={{ top: `${i * 10}%` }} />
                ))}
                {[...Array(10)].map((_, i) => (
                  <div key={`v-${i}`} className="absolute h-full w-px bg-[var(--pixel-ui-text)]" style={{ left: `${i * 10}%` }} />
                ))}
              </div>

              {/* Terrain features */}
              <svg className="absolute bottom-0 w-full h-1/3 fill-[var(--pixel-forest-mid)] opacity-30" viewBox="0 0 100 30">
                <polygon points="0,30 10,20 25,25 40,15 60,22 75,18 90,24 100,20 100,30" />
              </svg>

              {/* Location markers */}
              {filteredLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => setSelectedLocation(location)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-125 ${
                    selectedLocation?.id === location.id ? 'scale-125 z-20' : 'z-10'
                  }`}
                  style={{ left: `${location.x}%`, top: `${location.y}%` }}
                >
                  <div className="relative">
                    <span className="text-2xl sm:text-3xl drop-shadow-lg">{location.icon}</span>
                    {selectedLocation?.id === location.id && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--pixel-gold-light)] rounded-full animate-ping opacity-50" />
                    )}
                  </div>
                </button>
              ))}

              {/* Compass */}
              <div className="absolute top-4 right-4 font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
                <div className="text-center">N</div>
                <div className="flex">
                  <span>W</span>
                  <span className="mx-2">✦</span>
                  <span>E</span>
                </div>
                <div className="text-center">S</div>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div>
            {selectedLocation ? (
              <PixelCard title={`${selectedLocation.icon} ${selectedLocation.name}`}>
                <div className="space-y-4">
                  <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed">
                    {selectedLocation.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-forest-light)]">
                      📍 {selectedLocation.distance}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-[var(--font-pixel)] text-[8px] px-2 py-1 border-2"
                      style={{
                        borderColor: typeColors[selectedLocation.type],
                        color: typeColors[selectedLocation.type]
                      }}
                    >
                      {selectedLocation.type.toUpperCase()}
                    </span>
                  </div>
                  {selectedLocation.id !== 'ranch' && (
                    <PixelButton variant="green" size="sm">
                      Get Directions
                    </PixelButton>
                  )}
                </div>
              </PixelCard>
            ) : (
              <PixelCard title="📍 Select a Location">
                <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed">
                  Click on any icon on the map to learn more about that location and get directions.
                </p>
                <div className="mt-4 space-y-2">
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)]">Legend:</p>
                  <div className="grid grid-cols-2 gap-2 text-[8px] font-[var(--font-pixel)]">
                    <span>🏠 Ranch</span>
                    <span>⚔️ Adventure</span>
                    <span>🍽️ Food</span>
                    <span>🎭 Attraction</span>
                    <span>🌲 Nature</span>
                  </div>
                </div>
              </PixelCard>
            )}

            {/* Quick Links */}
            <div className="mt-6">
              <PixelCard title="🎯 Quick Actions">
                <div className="space-y-3">
                  <PixelButton href="/game" variant="gold" size="sm">
                    Start Treasure Hunt
                  </PixelButton>
                  <PixelButton href="/rentals" variant="orange" size="sm">
                    Book Your Stay
                  </PixelButton>
                </div>
              </PixelCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
