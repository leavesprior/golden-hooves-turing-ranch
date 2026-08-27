'use client'

/**
 * Gold Country Booking Component
 *
 * When players arrive at Gold Country, offer them the chance to request
 * a host-verified reward for a real stay at Back of Beyond Ranch.
 *
 * This creates a bridge between the game experience and real-world booking.
 */

import React, { useEffect, useState } from 'react'
import {
  AIRBNB_CONTACT_HOST_URL,
  airbnbDiscountMessage,
  voucherLines,
} from '@/lib/airbnbContact'

interface GoldCountryBookingProps {
  playerName: string
  partySize: number
  karmaScore: number
  outlawsCaught: number
  daysOnTrail: number
  onClose?: () => void
  onBookingIntent?: () => void
  graphicsTier?: string
  /** 1 = trail, 2 = Gold Country cases, 3 = warrant hunt. Display only. */
  level?: 1 | 2 | 3
  /** Floor the shown percent (L2 finish). Host still verifies. */
  minPercent?: number
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
  graphicsTier = 'retro_4bit',
  level = 1,
  minPercent = 0,
}: GoldCountryBookingProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const baseTier = getDiscountTier(karmaScore, outlawsCaught)
  const discountPercent = Math.max(baseTier.discountPercent, minPercent)
  const discountTier = discountPercent === baseTier.discountPercent
    ? baseTier
    : { ...baseTier, discountPercent }

  const voucher = {
    playerName: playerName || 'Traveler',
    percent: discountTier.discountPercent,
    tierName: discountTier.tierName,
    level,
  }
  const verificationMessage = airbnbDiscountMessage(voucher)
  const qrPayload = voucherLines(voucher)

  useEffect(() => {
    let cancelled = false
    // @ts-expect-error qrcode has no type declarations (same as DonationPanel)
    import('qrcode')
      .then((QR: { toDataURL?: (t: string, o: object) => Promise<string>; default?: { toDataURL?: (t: string, o: object) => Promise<string> } }) => {
        const toDataURL = QR.toDataURL || QR.default?.toDataURL
        if (!toDataURL) return Promise.reject(new Error('qrcode'))
        return toDataURL(qrPayload, { margin: 1, width: 280, errorCorrectionLevel: 'M' })
      })
      .then((url) => { if (!cancelled) setQrDataUrl(url) })
      .catch(() => { if (!cancelled) setQrDataUrl(null) })
    return () => { cancelled = true }
  }, [qrPayload])

  const copyVoucher = () => {
    try {
      navigator.clipboard.writeText(verificationMessage)
    } catch { /* clipboard may fail on some browsers */ }
  }

  const handleBookNow = () => {
    if (onBookingIntent) {
      onBookingIntent()
    }
    copyVoucher()
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

        {/* QR voucher — screenshot this into the Airbnb thread */}
        <div className="p-4 border-b-2 border-yellow-700">
          <p className="text-yellow-400 text-sm text-center mb-3">
            Scan or screenshot this QR. It is the {discountTier.discountPercent}% voucher for your stay.
          </p>
          <div className="flex justify-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`${discountTier.discountPercent} percent stay voucher QR`}
                width={180}
                height={180}
                className="bg-white p-2 rounded"
              />
            ) : (
              <div className="w-[180px] h-[180px] bg-black/50 border border-yellow-700 flex items-center justify-center text-yellow-500 text-xs">
                Drawing voucher QR…
              </div>
            )}
          </div>
          <p className="text-yellow-500 text-xs text-center mt-2 font-mono whitespace-pre-line">
            {discountTier.tierName} · {discountTier.discountPercent}% · listing 30045739
          </p>
        </div>

        {/* Host Verification */}
        <div className="p-4">
          <p className="text-yellow-400 text-sm text-center mb-2">
            Redeem by messaging the Airbnb listing
          </p>
          <div className="bg-black/50 border-2 border-yellow-600 text-yellow-300 p-3 text-center">
            <p className="font-bold text-sm">The host provides the discount. This is not a self-apply coupon.</p>
            <p className="text-yellow-500 text-xs mt-2">
              Send a message on Airbnb when requesting to book. Paste the copied voucher or attach the QR screenshot.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="p-4 space-y-2">
          <a
            href={AIRBNB_CONTACT_HOST_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleBookNow}
            className="block w-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 hover:from-yellow-400 hover:via-yellow-300 hover:to-yellow-400 text-black font-bold py-4 text-lg text-center transition-all"
          >
            Message Airbnb with the {discountTier.discountPercent}% QR
          </a>
          <p className="text-yellow-600 text-xs text-center">
            Opens the Hot Tub Hideaway host thread and copies the voucher text
          </p>

          <button
            type="button"
            onClick={copyVoucher}
            className="w-full bg-amber-900 hover:bg-amber-800 text-yellow-200 font-bold py-3 border-2 border-yellow-700 transition-all"
          >
            Copy voucher text
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full bg-amber-800 hover:bg-amber-700 text-yellow-200 font-bold py-3 border-2 border-yellow-700 transition-all"
          >
            Close
          </button>
        </div>

        {/* Footer */}
        <div className="bg-yellow-900/30 p-3 text-center">
          <p className="text-yellow-600 text-xs">
            Thank you for playing the Golden Frog Trail
          </p>
          <p className="text-yellow-700 text-xs mt-1">
            Host verifies the voucher · Real stay, real discount
          </p>
        </div>
      </div>
    </div>
  )
}
