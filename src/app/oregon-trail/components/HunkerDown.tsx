'use client'

/**
 * Hunker Down Component - Vacation Rental Option During Travel
 *
 * Offers players a third option during trail travel:
 * Continue Trail / Hunt / Hunker Down at a vacation rental
 *
 * Links to real Airbnb listings based on game location.
 */

import React, { useState } from 'react'

interface HunkerDownProps {
  currentLandmark: string | null
  milesRemaining: number
  partySize: number
  onHunkerDown?: (days: number) => void
  graphicsTier?: string
}

interface RentalOption {
  name: string
  description: string
  pricePerNight: number
  sleeps: number
  airbnbUrl: string
  region: string
  features: string[]
}

// Map game landmarks to real-world regions with Airbnb listings
const RENTAL_REGIONS: Record<string, RentalOption[]> = {
  'independence': [
    {
      name: 'Missouri River Cabin',
      description: 'Cozy cabin near the trail head',
      pricePerNight: 89,
      sleeps: 4,
      airbnbUrl: 'https://airbnb.com/s/Independence--MO',
      region: 'Missouri',
      features: ['River view', 'Fire pit', 'Pet friendly']
    }
  ],
  'fort_kearny': [
    {
      name: 'Prairie Homestead',
      description: 'Authentic frontier experience',
      pricePerNight: 75,
      sleeps: 6,
      airbnbUrl: 'https://airbnb.com/s/Kearney--NE',
      region: 'Nebraska',
      features: ['Open plains view', 'Star gazing', 'BBQ']
    }
  ],
  'chimney_rock': [
    {
      name: 'Rock Vista Lodge',
      description: 'Views of the famous landmark',
      pricePerNight: 95,
      sleeps: 4,
      airbnbUrl: 'https://airbnb.com/s/Scottsbluff--NE',
      region: 'Nebraska',
      features: ['Landmark views', 'Hot tub', 'Kitchen']
    }
  ],
  'fort_laramie': [
    {
      name: 'Wyoming Ranch Stay',
      description: 'Working ranch experience',
      pricePerNight: 120,
      sleeps: 8,
      airbnbUrl: 'https://airbnb.com/s/Fort-Laramie--WY',
      region: 'Wyoming',
      features: ['Horse rides', 'Ranch meals', 'Campfire']
    }
  ],
  'south_pass': [
    {
      name: 'Mountain Pass Retreat',
      description: 'High altitude getaway',
      pricePerNight: 110,
      sleeps: 6,
      airbnbUrl: 'https://airbnb.com/s/Lander--WY',
      region: 'Wyoming',
      features: ['Mountain views', 'Hiking trails', 'Wildlife']
    }
  ],
  'raft_river': [
    {
      name: 'Snake River Homestead',
      description: 'Where the California Trail splits off',
      pricePerNight: 85,
      sleeps: 4,
      airbnbUrl: 'https://airbnb.com/s/Burley--ID',
      region: 'Idaho',
      features: ['River views', 'Historic crossroads', 'Quiet']
    }
  ],
  'city_of_rocks': [
    {
      name: 'Granite Spire Lodge',
      description: 'Among 2.5 billion year old formations',
      pricePerNight: 100,
      sleeps: 6,
      airbnbUrl: 'https://airbnb.com/s/Almo--ID',
      region: 'Idaho',
      features: ['Rock climbing', 'Star gazing', 'Historic carvings']
    }
  ],
  'humboldt_river': [
    {
      name: 'Great Basin Ranch',
      description: 'Alongside the emigrant lifeline',
      pricePerNight: 95,
      sleeps: 6,
      airbnbUrl: 'https://airbnb.com/s/Elko--NV',
      region: 'Nevada',
      features: ['Ranch experience', 'Open range', 'Desert sunsets']
    }
  ],
  'humboldt_sink': [
    {
      name: 'Desert Oasis Retreat',
      description: 'Where the river vanishes into sand',
      pricePerNight: 90,
      sleeps: 4,
      airbnbUrl: 'https://airbnb.com/s/Lovelock--NV',
      region: 'Nevada',
      features: ['Desert solitude', 'Hot springs nearby', 'Off-grid']
    }
  ],
  'forty_mile_desert': [
    {
      name: 'Emigrant Pass Cabin',
      description: 'Rest before the deadliest stretch',
      pricePerNight: 110,
      sleeps: 6,
      airbnbUrl: 'https://airbnb.com/s/Fernley--NV',
      region: 'Nevada',
      features: ['A/C (!)', 'Water supply', 'Desert views']
    }
  ],
  'truckee_pass': [
    {
      name: 'Donner Lake Lodge',
      description: 'Sierra Nevada mountain retreat',
      pricePerNight: 150,
      sleeps: 8,
      airbnbUrl: 'https://airbnb.com/s/Truckee--CA',
      region: 'California',
      features: ['Lake views', 'Skiing', 'Mountain trails', 'Fireplace']
    }
  ],
  'sacramento_valley': [
    {
      name: 'Gold Rush Farmhouse',
      description: 'The promised land at last',
      pricePerNight: 140,
      sleeps: 8,
      airbnbUrl: 'https://airbnb.com/s/Sacramento--CA',
      region: 'California',
      features: ['Farm fresh food', 'Historic area', 'Near Sacramento']
    }
  ],
  'west_point': [
    {
      name: "Cynthia's Mountain Cabin",
      description: 'Stay at the famous Back of Beyond',
      pricePerNight: 175,
      sleeps: 10,
      airbnbUrl: 'https://www.airbnb.com/rooms/30045739',
      region: 'California Gold Country',
      features: ['Mountain retreat', 'Gold panning', 'Ranch life', 'Special discount!']
    }
  ],
  // Gold Country - Back of Beyond Ranch featured
  'gold_country': [
    {
      name: 'Back of Beyond Ranch',
      description: 'Premium Gold Country retreat - YOUR destination!',
      pricePerNight: 200,
      sleeps: 10,
      airbnbUrl: 'https://www.airbnb.com/rooms/30045739',
      region: 'California Gold Country',
      features: ['Ranch experience', 'Gold panning', 'Historic', 'Special discount available!']
    },
    {
      name: 'Gold Rush Cabin',
      description: 'Rustic cabin in the Sierra foothills',
      pricePerNight: 125,
      sleeps: 6,
      airbnbUrl: 'https://airbnb.com/s/Grass-Valley--CA',
      region: 'California',
      features: ['Mining history', 'Hiking', 'Peaceful']
    }
  ]
}

// Default fallback rentals
const DEFAULT_RENTALS: RentalOption[] = [
  {
    name: 'Trailside Rest Stop',
    description: 'A comfortable place to rest your party',
    pricePerNight: 80,
    sleeps: 6,
    airbnbUrl: 'https://airbnb.com/s/vacation-rentals',
    region: 'Along the Trail',
    features: ['Rest', 'Supplies nearby', 'Safe']
  }
]

export default function HunkerDown({
  currentLandmark,
  milesRemaining,
  partySize,
  onHunkerDown,
  graphicsTier = 'retro_4bit'
}: HunkerDownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRental, setSelectedRental] = useState<RentalOption | null>(null)
  const [nights, setNights] = useState(1)

  // Get rentals for current location
  const getRentalsForLocation = (): RentalOption[] => {
    if (!currentLandmark) return DEFAULT_RENTALS

    const landmark = currentLandmark.toLowerCase().replace(/\s+/g, '_')

    // Check exact match
    if (RENTAL_REGIONS[landmark]) {
      return RENTAL_REGIONS[landmark]
    }

    // Check if near gold country (end game)
    if (milesRemaining < 200) {
      return RENTAL_REGIONS['gold_country'] || DEFAULT_RENTALS
    }

    // Check partial matches
    for (const [key, rentals] of Object.entries(RENTAL_REGIONS)) {
      if (landmark.includes(key) || key.includes(landmark)) {
        return rentals
      }
    }

    return DEFAULT_RENTALS
  }

  const rentals = getRentalsForLocation()
  const isGoldCountry = milesRemaining < 200 || currentLandmark?.toLowerCase().includes('gold')

  // Filter by party size
  const suitableRentals = rentals.filter(r => r.sleeps >= partySize)

  const handleBookNow = (rental: RentalOption) => {
    // Open Airbnb in new tab
    window.open(rental.airbnbUrl, '_blank', 'noopener,noreferrer')

    // Optionally trigger game effect
    if (onHunkerDown) {
      onHunkerDown(nights)
    }
  }

  // Retro pixel styling based on graphics tier
  const getButtonStyle = () => {
    const baseStyle = "px-4 py-2 font-bold transition-all"
    switch (graphicsTier) {
      case 'retro_4bit':
        return `${baseStyle} bg-amber-800 text-amber-200 border-2 border-amber-600 hover:bg-amber-700`
      case 'classic_8bit':
        return `${baseStyle} bg-amber-700 text-amber-100 border-2 border-amber-500 hover:bg-amber-600`
      default:
        return `${baseStyle} bg-amber-600 text-white rounded hover:bg-amber-500`
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`${getButtonStyle()} flex items-center gap-2`}
        title="Rest at a vacation rental"
      >
        <span>🏠</span>
        <span>Hunker Down</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-amber-900 border-4 border-amber-600 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-amber-800 p-4 border-b-2 border-amber-600 flex justify-between items-center">
          <h2 className="text-xl font-bold text-amber-200">
            {isGoldCountry ? '🏆 Gold Country Lodging' : '🏠 Hunker Down'}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-amber-400 hover:text-amber-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-amber-200 text-sm">
            {isGoldCountry
              ? "You've nearly made it! Celebrate your journey with a stay at one of these Gold Country retreats."
              : "Rest your weary party at a comfortable vacation rental. Real places you can actually book!"}
          </p>

          {/* Party size note */}
          <p className="text-amber-400 text-xs">
            Your party: {partySize} travelers
          </p>

          {/* Rental options */}
          <div className="space-y-3">
            {suitableRentals.map((rental, index) => (
              <div
                key={index}
                className={`border-2 p-3 cursor-pointer transition-all ${
                  selectedRental === rental
                    ? 'border-amber-400 bg-amber-800/50'
                    : 'border-amber-700 bg-amber-800/30 hover:border-amber-500'
                } ${rental.name === 'Back of Beyond Ranch' ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => setSelectedRental(rental)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-amber-200">
                      {rental.name}
                      {rental.name === 'Back of Beyond Ranch' && (
                        <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded">
                          FEATURED
                        </span>
                      )}
                    </h3>
                    <p className="text-amber-400 text-sm">{rental.description}</p>
                    <p className="text-amber-500 text-xs mt-1">{rental.region}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-200 font-bold">${rental.pricePerNight}/night</p>
                    <p className="text-amber-500 text-xs">Sleeps {rental.sleeps}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {rental.features.map((feature, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-0.5 ${
                        feature.includes('discount')
                          ? 'bg-yellow-500 text-black'
                          : 'bg-amber-700 text-amber-200'
                      }`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Booking section */}
          {selectedRental && (
            <div className="border-t-2 border-amber-600 pt-4 mt-4">
              <div className="flex items-center gap-4 mb-4">
                <label className="text-amber-200">
                  Nights to stay:
                  <select
                    value={nights}
                    onChange={(e) => setNights(parseInt(e.target.value))}
                    className="ml-2 bg-amber-800 border border-amber-600 text-amber-200 px-2 py-1"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <span className="text-amber-400">
                  Total: ${selectedRental.pricePerNight * nights}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleBookNow(selectedRental)}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 transition-all"
                >
                  🔗 View on Airbnb
                </button>
                <button
                  onClick={() => {
                    if (onHunkerDown) onHunkerDown(nights)
                    setIsOpen(false)
                  }}
                  className="flex-1 bg-amber-800 hover:bg-amber-700 text-amber-200 font-bold py-2 px-4 border-2 border-amber-600 transition-all"
                >
                  Rest {nights} Day{nights > 1 ? 's' : ''} (In-Game)
                </button>
              </div>

              <p className="text-amber-500 text-xs mt-2 text-center">
                Clicking "View on Airbnb" opens in a new tab. Booking is separate from the game.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-amber-800 p-3 border-t-2 border-amber-600 text-center">
          <p className="text-amber-400 text-xs">
            Real vacation rentals along the historic trail route
          </p>
        </div>
      </div>
    </div>
  )
}
