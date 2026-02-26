'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useKarma, ALIGNMENT_DISPLAY_NAMES } from '@/lib/karmaContext'
import { useCrossGame } from '@/lib/crossGameProgressionContext'
import { AlignmentCompass, KarmaToastContainer, HouseRulesQuiz } from '@/components/karma'

// Game card component
interface GameCardProps {
  title: string
  description: string
  href: string
  icon: string
  available: boolean
  comingSoon?: boolean
  isNew?: boolean
  locked?: boolean
  lockHint?: string
  features?: string[]
}

function GameCard({ title, description, href, icon, available, comingSoon, isNew, locked, lockHint, features }: GameCardProps) {
  const isAccessible = available && !locked
  const content = (
    <div
      className={`
        relative p-6 border-4 rounded-lg transition-all duration-300 group
        ${isAccessible
          ? 'bg-gradient-to-b from-amber-800/80 to-amber-900/80 border-amber-500 hover:border-amber-400 hover:scale-105 cursor-pointer shadow-lg shadow-amber-400/10'
          : locked
            ? 'bg-gradient-to-b from-purple-900/40 to-gray-900/60 border-purple-700/60 cursor-not-allowed opacity-75'
            : 'bg-gradient-to-b from-gray-800/60 to-gray-900/60 border-gray-600 cursor-not-allowed opacity-60'}
      `}
    >
      {comingSoon && (
        <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[8px] font-pixel px-2 py-1 rounded transform rotate-12">
          Coming Soon
        </div>
      )}
      {isNew && !comingSoon && !locked && (
        <div className="absolute -top-3 -right-3 bg-green-600 text-white text-[8px] font-pixel px-2 py-1 rounded transform rotate-12 animate-pulse">
          NEW!
        </div>
      )}
      {locked && (
        <div className="absolute -top-3 -right-3 bg-purple-700 text-purple-100 text-[8px] font-pixel px-2 py-1 rounded transform rotate-12">
          Locked
        </div>
      )}
      <div className="text-4xl mb-4 text-center group-hover:scale-110 transition-transform">
        {locked ? '\uD83D\uDD12' : icon}
      </div>
      <h3 className="font-pixel text-amber-200 text-sm text-center mb-2">{title}</h3>
      <p className="text-amber-400/80 text-xs text-center">{description}</p>
      {locked && lockHint && (
        <p className="text-purple-300/70 text-[9px] text-center mt-2 italic">{lockHint}</p>
      )}
      {features && features.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1 justify-center">
          {features.map((feature, i) => (
            <span key={i} className="text-[8px] bg-amber-700/50 text-amber-300 px-1.5 py-0.5 rounded">
              {feature}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  if (isAccessible) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

export default function HubPage() {
  const { karma, alignmentPosition, discountMultiplier, hasCompletedHouseRules, houseRulesScore } = useKarma()
  const { isUnlocked, unlockToasts, dismissUnlockToast } = useCrossGame()
  const [showQuiz, setShowQuiz] = useState(false)

  const prologueUnlocked = isUnlocked('prologue')
  const ranchHuntUnlocked = isUnlocked('ranch_treasure_hunt')

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950">
      <KarmaToastContainer />
      {/* Cross-game unlock toasts */}
      {unlockToasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {unlockToasts.map(toast => (
            <div
              key={toast.id}
              className="bg-gradient-to-r from-purple-900 to-purple-800 border-2 border-purple-400 rounded-lg p-4 shadow-lg animate-slide-in max-w-sm cursor-pointer"
              onClick={() => dismissUnlockToast(toast.id)}
            >
              <div className="font-pixel text-purple-200 text-xs">{'\uD83D\uDD13'} Game Unlocked!</div>
              <div className="font-pixel text-amber-200 text-sm mt-1">{toast.gameName}</div>
              <div className="text-purple-300 text-xs mt-1">{toast.message}</div>
            </div>
          ))}
        </div>
      )}
      <HouseRulesQuiz isOpen={showQuiz} onClose={() => setShowQuiz(false)} />

      {/* Header with ranch name */}
      <header className="border-b-4 border-amber-600 bg-amber-900/50 px-4 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-pixel text-amber-200 text-xl">Back of Beyond Ranch</h1>
            <p className="text-amber-400 text-xs mt-1">Gold Country Game Hub</p>
          </div>
          <Link
            href="/"
            className="text-amber-400 hover:text-amber-200 text-xs font-pixel transition-colors"
          >
            &larr; Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-16">
        {/* Ranch scenic view with hidden rope bridge */}
        <div className="mb-8 relative overflow-hidden rounded-lg border-4 border-amber-600">
          <div className="aspect-[21/9] relative" style={{
            background: 'linear-gradient(180deg, #2a4a5a 0%, #3a6a6a 15%, #2a5a4a 30%, #1e4d2e 45%, #2d5a3a 60%, #3b6b44 75%, #2a4a32 90%, #1f3828 100%)'
          }}>
            {/* Sky with clouds */}
            <div className="absolute top-2 left-[18%] text-xl opacity-50">{'\u2601\ufe0f'}</div>
            <div className="absolute top-4 left-[45%] text-sm opacity-40">{'\u2601\ufe0f'}</div>
            <div className="absolute top-3 right-[22%] text-lg opacity-45">{'\u2601\ufe0f'}</div>

            {/* Distant mountain range */}
            <div className="absolute top-[12%] left-0 right-0 h-[22%]" style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(25,55,45,0.9) 50%, rgba(40,75,55,0.5) 100%)',
              clipPath: 'polygon(0% 100%, 3% 50%, 8% 70%, 14% 25%, 20% 55%, 26% 15%, 32% 50%, 38% 30%, 44% 60%, 50% 20%, 56% 55%, 62% 10%, 68% 45%, 74% 25%, 80% 55%, 86% 35%, 92% 60%, 97% 40%, 100% 65%, 100% 100%)'
            }} />

            {/* Mountain meadow behind left cliff */}
            <div className="absolute top-[28%] left-0 w-[20%] h-[40%]" style={{
              background: 'linear-gradient(180deg, #3a6b44 0%, #4a7b54 40%, #3a6b44 100%)'
            }}>
              {/* Meadow wildflowers */}
              <div className="absolute bottom-[20%] left-[20%] text-[8px] opacity-70">{'\ud83c\udf3c'}</div>
              <div className="absolute bottom-[35%] left-[50%] text-[8px] opacity-60">{'\ud83c\udf3b'}</div>
              <div className="absolute bottom-[15%] left-[70%] text-[8px] opacity-50">{'\ud83c\udf3c'}</div>
            </div>

            {/* Mountain meadow behind right cliff */}
            <div className="absolute top-[28%] right-0 w-[20%] h-[40%]" style={{
              background: 'linear-gradient(180deg, #3a6b44 0%, #4a7b54 40%, #3a6b44 100%)'
            }}>
              {/* Meadow wildflowers */}
              <div className="absolute bottom-[25%] right-[25%] text-[8px] opacity-70">{'\ud83c\udf3c'}</div>
              <div className="absolute bottom-[40%] right-[55%] text-[8px] opacity-60">{'\ud83c\udf3b'}</div>
              <div className="absolute bottom-[18%] right-[75%] text-[8px] opacity-50">{'\ud83c\udf3c'}</div>
            </div>

            {/* Left rock cliff (ranch side) */}
            <div className="absolute bottom-0 left-[15%] w-[20%] h-[55%] rounded-t-lg z-[2]" style={{
              background: 'linear-gradient(135deg, #4a3a2a 0%, #5c4a38 20%, #4a3a2a 50%, #3d2f22 80%, #2e2218 100%)',
              clipPath: 'polygon(5% 0%, 25% 4%, 50% 0%, 75% 6%, 95% 2%, 100% 12%, 100% 100%, 0% 100%, 0% 8%)'
            }}>
              {/* Rock texture lines */}
              <div className="absolute top-[30%] left-[10%] w-[35%] h-[1px] bg-amber-900/20" />
              <div className="absolute top-[50%] left-[20%] w-[50%] h-[1px] bg-amber-900/15" />
              <div className="absolute top-[70%] left-[5%] w-[40%] h-[1px] bg-amber-900/20" />
            </div>

            {/* Ranch house on left cliff */}
            <div className="absolute bottom-[52%] left-[18%] text-2xl z-[3]">{'\ud83c\udfe0'}</div>
            {/* Barn next to ranch house */}
            <div className="absolute bottom-[51%] left-[25%] text-xl z-[3]" style={{ transform: 'scaleX(-1)' }}>{'\ud83c\udfda\ufe0f'}</div>

            {/* Right rock cliff (creature side) */}
            <div className="absolute bottom-0 right-[15%] w-[20%] h-[55%] rounded-t-lg z-[2]" style={{
              background: 'linear-gradient(225deg, #4a3a2a 0%, #5c4a38 20%, #4a3a2a 50%, #3d2f22 80%, #2e2218 100%)',
              clipPath: 'polygon(5% 2%, 25% 6%, 50% 0%, 75% 4%, 95% 0%, 100% 8%, 100% 100%, 0% 100%, 0% 12%)'
            }}>
              {/* Rock texture lines */}
              <div className="absolute top-[35%] right-[10%] w-[35%] h-[1px] bg-amber-900/20" />
              <div className="absolute top-[55%] right-[15%] w-[45%] h-[1px] bg-amber-900/15" />
              <div className="absolute top-[72%] right-[8%] w-[38%] h-[1px] bg-amber-900/20" />
            </div>

            {/* Creatures on right cliff */}
            <div className="absolute bottom-[53%] right-[17%] text-lg z-[3]">{'\ud83d\udc34'}</div>
            <div className="absolute bottom-[51%] right-[23%] text-base z-[3]">{'\ud83d\udc04'}</div>
            <div className="absolute bottom-[50%] right-[29%] text-sm z-[3]">{'\ud83d\udc11'}</div>
            <div className="absolute bottom-[52%] right-[33%] text-sm z-[3]">{'\ud83d\udc10'}</div>
            <div className="absolute bottom-[49%] right-[19%] text-xs z-[3]">{'\ud83d\udc14'}</div>
            <div className="absolute bottom-[54%] right-[27%] text-xs z-[3]">{'\ud83e\udd8c'}</div>

            {/* === THE ROPE BRIDGE (hidden in plain sight) === */}
            <Link href="/neoma" className="group absolute z-[5]" style={{
              left: '34%', right: '34%', bottom: '26%', height: '14%'
            }}>
              {/* Left post */}
              <div className="absolute left-0 top-[15%] bottom-[15%] w-[3px]" style={{
                background: 'linear-gradient(180deg, #6b5b43, #4a3a2a)'
              }} />
              {/* Right post */}
              <div className="absolute right-0 top-[15%] bottom-[15%] w-[3px]" style={{
                background: 'linear-gradient(180deg, #6b5b43, #4a3a2a)'
              }} />
              {/* Upper rope (handrail) - slight sag */}
              <div className="absolute top-[25%] left-[1%] right-[1%] h-[2px]" style={{
                background: '#7b6b53',
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 200%, 0% 100%)'
              }} />
              {/* Main plank walkway */}
              <div className="absolute top-[48%] left-0 right-0 h-[4px]" style={{
                background: 'linear-gradient(90deg, #5c4a38 0%, #8b7355 10%, #7b6545 25%, #8b7355 40%, #6b5b43 55%, #8b7355 70%, #7b6545 85%, #5c4a38 100%)'
              }} />
              {/* Plank slats */}
              <div className="absolute top-[42%] left-[6%] right-[6%] h-[20%] flex justify-between">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="w-[2px] h-full bg-amber-700/40" />
                ))}
              </div>
              {/* Lower rope */}
              <div className="absolute top-[72%] left-[1%] right-[1%] h-[2px]" style={{
                background: '#6b5b43',
                opacity: 0.5,
                clipPath: 'polygon(0% 100%, 100% 100%, 100% 0%, 50% -100%, 0% 0%)'
              }} />
              {/* Rope V-supports connecting upper rope to planks */}
              <div className="absolute top-[25%] left-[15%] w-[1px] h-[25%] bg-amber-800/25 origin-top" style={{ transform: 'rotate(-8deg)' }} />
              <div className="absolute top-[25%] left-[35%] w-[1px] h-[25%] bg-amber-800/25 origin-top" style={{ transform: 'rotate(5deg)' }} />
              <div className="absolute top-[25%] right-[35%] w-[1px] h-[25%] bg-amber-800/25 origin-top" style={{ transform: 'rotate(-5deg)' }} />
              <div className="absolute top-[25%] right-[15%] w-[1px] h-[25%] bg-amber-800/25 origin-top" style={{ transform: 'rotate(8deg)' }} />
              {/* Subtle hover glow */}
              <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/[0.06] transition-all duration-1000 rounded" />
            </Link>

            {/* Gorge/gap shadow between cliffs */}
            <div className="absolute bottom-0 left-[34%] right-[34%] h-[28%] z-[1]" style={{
              background: 'linear-gradient(180deg, rgba(10,15,10,0.2) 0%, rgba(8,12,8,0.6) 30%, rgba(5,8,5,0.85) 60%, #080c08 100%)'
            }} />

            {/* Conifer trees - far left meadow */}
            <div className="absolute bottom-[18%] left-[2%] text-3xl z-[2]">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[25%] left-[6%] text-4xl z-[2]">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[15%] left-[10%] text-2xl z-[2]">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[30%] left-[1%] text-2xl opacity-80 z-[2]">{'\ud83c\udf32'}</div>

            {/* Conifer trees - on left cliff edges */}
            <div className="absolute bottom-[54%] left-[14%] text-xl z-[3]">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[48%] left-[31%] text-lg opacity-80 z-[3]">{'\ud83c\udf32'}</div>

            {/* Conifer trees - on right cliff edges */}
            <div className="absolute bottom-[53%] right-[14%] text-xl z-[3]">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[47%] right-[32%] text-lg opacity-80 z-[3]">{'\ud83c\udf32'}</div>

            {/* Conifer trees - far right meadow */}
            <div className="absolute bottom-[20%] right-[3%] text-4xl z-[2]">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[14%] right-[8%] text-3xl z-[2]">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[28%] right-[1%] text-2xl opacity-80 z-[2]">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[16%] right-[12%] text-2xl z-[2]">{'\ud83c\udf32'}</div>

            {/* Foreground grass */}
            <div className="absolute bottom-0 left-0 right-0 h-[6%] z-[6]" style={{
              background: 'linear-gradient(180deg, #2a4a32 0%, #1f3828 100%)'
            }} />
          </div>
        </div>

        {/* Two column layout: Games + Karma */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Games grid */}
          <div className="md:col-span-2">
            <h2 className="font-pixel text-amber-200 text-lg mb-4 border-b-2 border-amber-600 pb-2">
              Choose Your Adventure
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <GameCard
                title="Mystery Game"
                description="Solve crimes in Gold Country and earn discounts"
                href="https://bobr-mystery-game.pages.dev"
                icon="🔍"
                available={true}
                features={['Black Bart', 'Evidence', 'Discounts']}
              />
              <GameCard
                title="Gold Country Explorer"
                description="Discover 6 historic towns with 30+ attractions"
                href="/explore"
                icon="⛏️"
                available={true}
                isNew={true}
                features={['XP System', 'Badges', 'Secrets']}
              />
              <GameCard
                title="The Prospector's Tale"
                description="Fallout-style journey from Missouri to Gold Country"
                href="/oregon-trail"
                icon="🚐"
                available={true}
                isNew={true}
                features={['World Map', 'Chapters', 'Easter Eggs']}
              />
              <GameCard
                title="RPG Adventure"
                description="Create a character and explore the frontier"
                href="/adventure"
                icon="⚔️"
                available={true}
                features={['Character', 'Quests']}
              />
              <GameCard
                title="Location Hunt"
                description="Discover hidden spots around the ranch"
                href="/game"
                icon="🗺️"
                available={true}
                features={['Photo Mode', 'Challenges']}
              />
              <GameCard
                title="Play The Prologue"
                description="600-1500 AD: Four civilizations, one ancient mystery"
                href="/prologue"
                icon={'\uD83C\uDFDB\uFE0F'}
                available={true}
                isNew={true}
                locked={!prologueUnlocked}
                lockHint="Verify your booking to unlock"
                features={['4 Characters', 'Investigation', 'Puzzles']}
              />
              <GameCard
                title="Ranch Treasure Hunt"
                description="Discover hidden treasures at Back of Beyond Ranch"
                href="/ranch-treasure-hunt"
                icon={'\uD83D\uDCE6'}
                available={true}
                isNew={true}
                locked={!ranchHuntUnlocked}
                lockHint="Reach West Point in The Prospector's Tale"
                features={['Bounties', 'QR Codes', 'Rewards']}
              />
              <GameCard
                title="Karma Market"
                description="Support the ranch, trade karma, collect momentos"
                href="/karma-market"
                icon={'\uD83C\uDFEA'}
                available={true}
                isNew={true}
                features={['Donations', 'Animal Treats', 'Momentos', 'Market Tracker']}
              />
              <GameCard
                title="Cynthia's Inn"
                description="Crossroads tavern connecting all adventures"
                href="/oregon-trail"
                icon={'\uD83C\uDFE8'}
                available={true}
                comingSoon={true}
                features={['NPCs', 'Side Quests']}
              />
            </div>

            {/* House Rules Quiz CTA */}
            <div className="mt-6 p-4 bg-amber-800/40 border-2 border-amber-600 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-pixel text-amber-200 text-sm">House Rules Quiz</h3>
                  <p className="text-amber-400 text-xs mt-1">
                    {hasCompletedHouseRules
                      ? `Completed! Score: ${houseRulesScore}/10`
                      : 'Learn the rules and earn Lawful karma!'}
                  </p>
                </div>
                <button
                  onClick={() => setShowQuiz(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-amber-100 font-pixel text-xs rounded border-2 border-amber-400 transition-colors"
                >
                  {hasCompletedHouseRules ? 'Retake' : 'Start Quiz'}
                </button>
              </div>
            </div>
          </div>

          {/* Karma sidebar */}
          <div className="bg-amber-900/40 border-2 border-amber-600 rounded-lg p-4">
            <h2 className="font-pixel text-amber-200 text-sm mb-4 text-center border-b border-amber-600 pb-2">
              Your Alignment
            </h2>

            <div className="flex justify-center mb-4">
              <AlignmentCompass size="md" showMultiplier={true} showLabels={false} />
            </div>

            {/* Karma stats */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-amber-400">Lawful/Chaotic:</span>
                <span className={`font-pixel ${karma.alignment.lawfulChaotic < 0 ? 'text-blue-300' : karma.alignment.lawfulChaotic > 0 ? 'text-purple-300' : 'text-gray-300'}`}>
                  {karma.alignment.lawfulChaotic > 0 ? '+' : ''}{karma.alignment.lawfulChaotic}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-400">Good/Evil:</span>
                <span className={`font-pixel ${karma.alignment.goodEvil < 0 ? 'text-green-300' : karma.alignment.goodEvil > 0 ? 'text-red-300' : 'text-gray-300'}`}>
                  {karma.alignment.goodEvil > 0 ? '+' : ''}{karma.alignment.goodEvil}
                </span>
              </div>
              <div className="border-t border-amber-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-amber-400">Discount Boost:</span>
                  <span className={`font-pixel ${discountMultiplier >= 1 ? 'text-green-300' : 'text-red-300'}`}>
                    {discountMultiplier}x
                  </span>
                </div>
              </div>
            </div>

            {/* Karma history preview */}
            {karma.history.length > 0 && (
              <div className="mt-4 pt-4 border-t border-amber-700">
                <div className="text-amber-400 text-xs mb-2">Recent Actions:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {karma.history.slice(0, 5).map((action) => (
                    <div key={action.id} className="text-[10px] text-amber-300/70 truncate">
                      {action.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Discount explanation */}
        <div className="mt-8 p-4 bg-amber-950/60 border border-amber-700 rounded-lg">
          <h3 className="font-pixel text-amber-200 text-sm mb-2">How Karma Affects Discounts</h3>
          <p className="text-amber-400 text-xs leading-relaxed">
            Your alignment determines your discount multiplier. Good guests who follow rules and help others
            earn better discounts. Lawful Good alignment gives you 1.5x your earned discount, while Chaotic
            Evil only gets 0.5x. Play games, complete the house rules quiz, and make good choices to improve
            your karma!
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="bg-yellow-900/40 p-2 rounded">
              <div className="text-yellow-300">Lawful Good</div>
              <div className="text-yellow-100">1.5x</div>
            </div>
            <div className="bg-gray-700/40 p-2 rounded">
              <div className="text-gray-300">True Neutral</div>
              <div className="text-gray-100">1.0x</div>
            </div>
            <div className="bg-red-900/40 p-2 rounded">
              <div className="text-red-300">Chaotic Evil</div>
              <div className="text-red-100">0.5x</div>
            </div>
          </div>
        </div>
      </main>

      {/* Book Your Stay CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-amber-950/90 border-t border-amber-700 p-3 text-center z-40 backdrop-blur-sm">
        <a href="/rentals" className="text-amber-200 font-pixel text-sm hover:text-amber-100 transition-colors">
          {'\uD83C\uDFE1'} Book Your Stay at Back of Beyond Ranch {'\u2192'}
        </a>
      </div>

      {/* Footer */}
      <footer className="border-t-2 border-amber-800 bg-amber-950/50 px-4 py-4 mt-8">
        <div className="max-w-4xl mx-auto text-center text-amber-600 text-xs">
          &copy; 2026 Back of Beyond Ranch | Gold Country, California
        </div>
      </footer>
    </div>
  )
}
