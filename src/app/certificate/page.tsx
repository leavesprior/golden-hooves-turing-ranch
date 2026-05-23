'use client'

import { useRef } from 'react'
import { PixelNavigation, PixelButton } from '@/components/pixel'
import { useGame } from '@/lib/gameContext'

export default function CertificatePage() {
  const { session, playerName, getReward, gameState } = useGame()
  const certificateRef = useRef<HTMLDivElement>(null)
  const reward = getReward()

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'I completed the Golden Hooves Legacy!',
          text: `I discovered all the treasures at Back of Beyond Ranch and earned a ${reward?.discount}% discount! 🏆`,
          url: 'https://backofbeyondranch.farm/game'
        })
      } catch (e) {
        console.log('Share cancelled')
      }
    }
  }

  if (gameState !== 'complete' || !session || !reward) {
    return (
      <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
        <PixelNavigation />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg mb-8">
            No Certificate Yet
          </h1>
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-8">
            Complete the treasure hunt to earn your certificate!
          </p>
          <PixelButton href="/game" variant="gold" size="md">
            Start Quest
          </PixelButton>
        </div>
      </div>
    )
  }

  const completionDate = session.completedAt
    ? new Date(session.completedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString()

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Certificate */}
        <div
          ref={certificateRef}
          className="bg-gradient-to-b from-[#f4d76b] to-[#e8a027] p-2 print:p-0"
        >
          <div className="bg-[#fffef8] border-8 border-double border-[#a7511a] p-8 text-center">
            {/* Header Decoration */}
            <div className="flex justify-center gap-4 mb-4">
              <span className="text-3xl">🏆</span>
              <span className="text-3xl">⭐</span>
              <span className="text-3xl">🏆</span>
            </div>

            <h1 className="font-[var(--font-pixel)] text-[#3b2a1f] text-lg sm:text-xl mb-2">
              Certificate of Achievement
            </h1>

            <div className="text-[#a7511a] text-sm mb-6">
              ═══════════════════════════════════════
            </div>

            <p className="font-[var(--font-pixel)] text-[10px] text-[#5c3d2e] mb-4">
              This certifies that
            </p>

            <h2 className="font-[var(--font-pixel)] text-[#1a1c2c] text-xl sm:text-2xl mb-4 border-b-2 border-[#a7511a] pb-2 mx-auto max-w-md">
              {playerName || 'Adventurer'}
            </h2>

            <p className="font-[var(--font-pixel)] text-[10px] text-[#5c3d2e] mb-6 max-w-lg mx-auto leading-relaxed">
              has successfully completed
              <br />
              <span className="text-[#a7511a] text-sm">The Golden Hooves Legacy</span>
              <br />
              treasure hunt at Back of Beyond Ranch
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <p className="font-[var(--font-pixel)] text-[8px] text-[#5c3d2e]">Score</p>
                <p className="font-[var(--font-pixel)] text-lg text-[#1a1c2c]">{session.score}</p>
              </div>
              <div>
                <p className="font-[var(--font-pixel)] text-[8px] text-[#5c3d2e]">Locations</p>
                <p className="font-[var(--font-pixel)] text-lg text-[#1a1c2c]">{session.discoveredLocations.length}</p>
              </div>
              <div>
                <p className="font-[var(--font-pixel)] text-[8px] text-[#5c3d2e]">Tier</p>
                <p className="font-[var(--font-pixel)] text-lg text-[#a7511a]">{reward.tier.toUpperCase()}</p>
              </div>
            </div>

            {/* Reward */}
            <div className="bg-[#f4d76b] border-4 border-[#a7511a] p-4 max-w-sm mx-auto mb-6">
              <p className="font-[var(--font-pixel)] text-[8px] text-[#3b2a1f] mb-2">REWARD EARNED</p>
              <p className="font-[var(--font-pixel)] text-xl text-[#1a1c2c]">{reward.discount}% OFF</p>
              <p className="font-[var(--font-pixel)] text-[10px] text-[#5c3d2e] mt-2">
                {reward.code ? (
                  <>Code: <span className="text-[#1a1c2c]">{reward.code}</span></>
                ) : (
                  <span className="text-[#1a1c2c]">Host verification required before booking</span>
                )}
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-8">
              <div className="text-left">
                <p className="font-[var(--font-pixel)] text-[8px] text-[#5c3d2e]">{completionDate}</p>
                <div className="border-t border-[#a7511a] mt-1 pt-1">
                  <p className="font-[var(--font-pixel)] text-[6px] text-[#5c3d2e]">Date</p>
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl mb-2">🦌</div>
                <p className="font-[var(--font-pixel)] text-[6px] text-[#a7511a]">The Golden Hooves</p>
              </div>

              <div className="text-right">
                <p className="font-[var(--font-pixel)] text-[8px] text-[#5c3d2e] italic">Back of Beyond Ranch</p>
                <div className="border-t border-[#a7511a] mt-1 pt-1">
                  <p className="font-[var(--font-pixel)] text-[6px] text-[#5c3d2e]">Gold Country, CA</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4 mt-8 print:hidden">
          <PixelButton onClick={handlePrint} variant="gold" size="md">
            🖨️ Print Certificate
          </PixelButton>
          <PixelButton onClick={handleShare} variant="blue" size="md">
            📤 Share
          </PixelButton>
          <PixelButton href="/rentals" variant="orange" size="md">
            📅 Book Your Stay
          </PixelButton>
          <PixelButton href="/game" variant="green" size="md">
            🎮 Play Again
          </PixelButton>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center print:hidden">
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
            Email your certificate when booking direct at backofbeyondranch.farm for host verification
          </p>
          <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-gold-mid)] mt-2">
            Valid for 1 year from date of completion
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-area,
          #certificate-area * {
            visibility: visible;
          }
          #certificate-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
