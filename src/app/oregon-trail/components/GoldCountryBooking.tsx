'use client'

/**
 * Gold Country Booking Component
 *
 * When players arrive at Gold Country, offer them the chance to book
 * a real stay at Back of Beyond Ranch with a unique discount code.
 *
 * This creates a bridge between the game experience and real-world booking.
 */

import React, { useState, useEffect } from 'react'

interface GoldCountryBookingProps {
  playerName: string
  partySize: number
  karmaScore: number
  outlawsCaught: number
  daysOnTrail: number
  onClose?: () => void
  onBookingIntent?: (code: string) => void
  graphicsTier?: string
}

interface DiscountTier {
  minKarma: number
  minOutlaws: number
  discountPercent: number
  tierName: string
  description: string
}

const DISCOUNT_TIERS: DiscountTier[] = [
  {
    minKarma: 500,
    minOutlaws: 5,
    discountPercent: 20,
    tierName: 'LEGENDARY LAWMAN',
    description: "You've achieved legendary status! The finest discount awaits."
  },
  {
    minKarma: 300,
    minOutlaws: 3,
    discountPercent: 15,
    tierName: 'RENOWNED RANGER',
    description: "Your reputation precedes you. A generous discount is earned."
  },
  {
    minKarma: 100,
    minOutlaws: 1,
    discountPercent: 10,
    tierName: 'TRAIL VETERAN',
    description: "You've proven yourself on the trail. Enjoy a modest discount."
  },
  {
    minKarma: 0,
    minOutlaws: 0,
    discountPercent: 5,
    tierName: 'TRAIL SURVIVOR',
    description: "You made it! That alone deserves a small reward."
  }
]

// Generate a unique discount code based on player stats
function generateDiscountCode(
  playerName: string,
  karmaScore: number,
  outlawsCaught: number
): string {
  const date = new Date()
  const dateCode = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`
  const nameCode = playerName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
  const karmaCode = Math.floor(karmaScore / 10).toString(16).toUpperCase().padStart(2, '0')
  const outlawCode = outlawsCaught.toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()

  return `BOBR-${nameCode}${karmaCode}-${outlawCode}${random}-${dateCode}`
}

// Determine discount tier based on player achievements
function getDiscountTier(karmaScore: number, outlawsCaught: number): DiscountTier {
  for (const tier of DISCOUNT_TIERS) {
    if (karmaScore >= tier.minKarma && outlawsCaught >= tier.minOutlaws) {
      return tier
    }
  }
  return DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1]
}

export default function GoldCountryBooking({
  playerName,
  partySize,
  karmaScore,
  outlawsCaught,
  daysOnTrail,
  onClose,
  onBookingIntent,
  graphicsTier = 'retro_4bit'
}: GoldCountryBookingProps) {
  const [discountCode, setDiscountCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const discountTier = getDiscountTier(karmaScore, outlawsCaught)

  useEffect(() => {
    // Generate code on mount
    setDiscountCode(generateDiscountCode(playerName, karmaScore, outlawsCaught))
  }, [playerName, karmaScore, outlawsCaught])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(discountCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = discountCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleBookNow = () => {
    if (onBookingIntent) {
      onBookingIntent(discountCode)
    }
    // Copy discount code to clipboard so user can paste it in Airbnb message
    try {
      navigator.clipboard.writeText(
        `Hi! I played the Golden Frog Trail game and earned discount code: ${discountCode} (${discountTier.discountPercent}% off - ${discountTier.tierName}). I'd love to book a stay!`
      )
    } catch { /* clipboard may fail on some browsers */ }
    // Open Airbnb listing for Back of Beyond Ranch
    window.open(
      'https://www.airbnb.com/rooms/30045739',
      '_blank',
      'noopener,noreferrer'
    )
  }

  // Style based on graphics tier
  const containerStyle = graphicsTier === 'retro_4bit'
    ? 'bg-amber-950 border-4 border-yellow-600'
    : graphicsTier === 'classic_8bit'
      ? 'bg-gradient-to-b from-amber-900 to-amber-950 border-4 border-yellow-500'
      : 'bg-gradient-to-b from-amber-800 to-amber-950 rounded-lg border-2 border-yellow-400 shadow-xl'

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className={`${containerStyle} max-w-xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Golden Header */}
        <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 p-4 text-center">
          <h1 className="text-2xl font-bold text-black">🏆 GOLD COUNTRY AWAITS 🏆</h1>
          <p className="text-yellow-900 text-sm">Your Journey Has Earned You a Reward</p>
        </div>

        {/* Achievement Summary */}
        <div className="p-4 border-b-2 border-yellow-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-yellow-500 text-xs">DAYS ON TRAIL</p>
              <p className="text-2xl font-bold text-yellow-300">{daysOnTrail}</p>
            </div>
            <div>
              <p className="text-yellow-500 text-xs">KARMA EARNED</p>
              <p className="text-2xl font-bold text-yellow-300">{karmaScore}</p>
            </div>
            <div>
              <p className="text-yellow-500 text-xs">OUTLAWS CAUGHT</p>
              <p className="text-2xl font-bold text-yellow-300">{outlawsCaught}</p>
            </div>
          </div>
        </div>

        {/* Discount Tier */}
        <div className="p-4 bg-yellow-900/30">
          <div className="text-center mb-3">
            <span className="inline-block bg-yellow-500 text-black font-bold px-4 py-1 text-lg">
              {discountTier.tierName}
            </span>
          </div>
          <p className="text-yellow-200 text-center text-sm">
            {discountTier.description}
          </p>
          <div className="text-center mt-3">
            <span className="text-4xl font-bold text-yellow-400">
              {discountTier.discountPercent}% OFF
            </span>
            <p className="text-yellow-500 text-xs">at Back of Beyond Ranch</p>
          </div>
        </div>

        {/* Ranch Info */}
        <div className="p-4 border-y-2 border-yellow-700">
          <h2 className="font-bold text-yellow-300 text-lg mb-2">
            🏠 Back of Beyond Ranch
          </h2>
          <p className="text-yellow-200 text-sm mb-3">
            Complete your Gold Country adventure with a real stay at our featured ranch.
            Experience authentic California Gold Country hospitality.
          </p>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-yellow-400 text-sm underline hover:text-yellow-300"
          >
            {showDetails ? 'Hide details' : 'Show ranch details'}
          </button>

          {showDetails && (
            <div className="mt-3 bg-yellow-900/20 p-3 text-sm space-y-2">
              <p className="text-yellow-200">
                <strong>Location:</strong> California Gold Country
              </p>
              <p className="text-yellow-200">
                <strong>Sleeps:</strong> Up to 10 guests
              </p>
              <p className="text-yellow-200">
                <strong>Features:</strong> Ranch experience, historic area, stunning views
              </p>
              <p className="text-yellow-200">
                <strong>Perfect for:</strong> Groups of {partySize} like yours!
              </p>
            </div>
          )}
        </div>

        {/* Discount Code */}
        <div className="p-4">
          <p className="text-yellow-400 text-sm text-center mb-2">
            Your Personal Discount Code:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={discountCode}
              readOnly
              className="flex-1 bg-black/50 border-2 border-yellow-600 text-yellow-300 font-mono text-lg p-3 text-center"
            />
            <button
              onClick={handleCopyCode}
              className={`px-4 py-3 font-bold transition-all ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-500 text-black'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-yellow-600 text-xs text-center mt-2">
            Mention this code when booking for your discount
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="p-4 space-y-2">
          <button
            onClick={handleBookNow}
            className="w-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 hover:from-yellow-400 hover:via-yellow-300 hover:to-yellow-400 text-black font-bold py-4 text-lg transition-all"
          >
            Save {discountTier.discountPercent}% at Back of Beyond Ranch
          </button>
          <p className="text-yellow-600 text-xs text-center">
            Your discount code will be copied to clipboard
          </p>

          <button
            onClick={onClose}
            className="w-full bg-amber-800 hover:bg-amber-700 text-yellow-200 font-bold py-3 border-2 border-yellow-700 transition-all"
          >
            Continue to Settlement
          </button>
        </div>

        {/* Footer */}
        <div className="bg-yellow-900/30 p-3 text-center">
          <p className="text-yellow-600 text-xs">
            🎮 Thank you for playing Golden Hooves!
          </p>
          <p className="text-yellow-700 text-xs mt-1">
            Discount valid for 30 days • Real booking, real adventure
          </p>
        </div>
      </div>
    </div>
  )
}
