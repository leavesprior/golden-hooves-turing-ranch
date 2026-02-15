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
          ? 'bg-gradient-to-b from-amber-800/80 to-amber-900/80 border-amber-500 hover:border-amber-400 hover:scale-105 cursor-pointer'
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Ranch scenic view with hidden rope bridge */}
        <div className="mb-8 relative overflow-hidden rounded-lg border-4 border-amber-600">
          <div className="aspect-[21/9] relative" style={{
            background: 'linear-gradient(180deg, #1a3a2a 0%, #1e4d2e 30%, #2d5a3a 50%, #3b6b44 65%, #2a4a32 80%, #1f3828 100%)'
          }}>
            {/* Sky hints */}
            <div className="absolute top-3 left-[22%] text-xl opacity-60">{'\u2601\ufe0f'}</div>
            <div className="absolute top-5 right-[28%] text-lg opacity-50">{'\u2601\ufe0f'}</div>

            {/* Distant mountains */}
            <div className="absolute top-[15%] left-0 right-0 h-[20%]" style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(30,60,40,0.8) 40%, rgba(45,80,55,0.6) 100%)',
              clipPath: 'polygon(0% 100%, 5% 40%, 12% 60%, 20% 20%, 28% 50%, 35% 10%, 42% 45%, 50% 25%, 58% 55%, 65% 15%, 72% 50%, 80% 30%, 88% 55%, 95% 35%, 100% 60%, 100% 100%)'
            }} />

            {/* Left rock cliff */}
            <div className="absolute bottom-0 left-[15%] w-[18%] h-[55%] rounded-t-lg" style={{
              background: 'linear-gradient(135deg, #4a3a2a 0%, #5c4a38 30%, #3d2f22 70%, #2e2218 100%)',
              clipPath: 'polygon(10% 0%, 30% 5%, 60% 0%, 85% 8%, 100% 15%, 100% 100%, 0% 100%, 0% 10%)'
            }} />

            {/* Right rock cliff */}
            <div className="absolute bottom-0 right-[15%] w-[18%] h-[55%] rounded-t-lg" style={{
              background: 'linear-gradient(225deg, #4a3a2a 0%, #5c4a38 30%, #3d2f22 70%, #2e2218 100%)',
              clipPath: 'polygon(15% 8%, 40% 0%, 70% 5%, 90% 0%, 100% 10%, 100% 100%, 0% 100%, 0% 15%)'
            }} />

            {/* === THE ROPE BRIDGE (hidden in plain sight) === */}
            <Link href="/neoma" className="group absolute z-10" style={{
              left: '33%', right: '33%', bottom: '28%', height: '12%'
            }}>
              {/* Main rope/plank line */}
              <div className="absolute top-[45%] left-0 right-0 h-[3px]" style={{
                background: 'linear-gradient(90deg, #5c4a38 0%, #8b7355 15%, #6b5b43 30%, #8b7355 50%, #6b5b43 70%, #8b7355 85%, #5c4a38 100%)'
              }} />
              {/* Plank marks */}
              <div className="absolute top-[40%] left-[10%] right-[10%] h-[18%] flex justify-between opacity-40">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-[2px] h-full bg-amber-800/70" />
                ))}
              </div>
              {/* Upper rope */}
              <div className="absolute top-[20%] left-0 right-0 h-[1px] bg-amber-800/30" style={{
                clipPath: 'polygon(0% 100%, 5% 0%, 15% 80%, 25% 10%, 35% 70%, 50% 100%, 65% 70%, 75% 10%, 85% 80%, 95% 0%, 100% 100%)'
              }} />
              {/* Lower rope */}
              <div className="absolute top-[70%] left-0 right-0 h-[1px] bg-amber-800/20" style={{
                clipPath: 'polygon(0% 0%, 5% 100%, 15% 20%, 25% 90%, 35% 30%, 50% 0%, 65% 30%, 75% 90%, 85% 20%, 95% 100%, 100% 0%)'
              }} />
              {/* Subtle hover glow - barely perceptible */}
              <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/[0.06] transition-all duration-1000 rounded" />
            </Link>

            {/* Gorge/gap shadow between cliffs */}
            <div className="absolute bottom-0 left-[32%] right-[32%] h-[25%]" style={{
              background: 'linear-gradient(180deg, rgba(10,15,10,0.3) 0%, rgba(5,8,5,0.8) 60%, #0a0f0a 100%)'
            }} />

            {/* Conifer trees - left cluster */}
            <div className="absolute bottom-[8%] left-[3%] text-3xl">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[12%] left-[8%] text-4xl">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[6%] left-[12%] text-2xl">{'\ud83c\udf32'}</div>

            {/* Conifer trees - on/near left cliff */}
            <div className="absolute bottom-[52%] left-[16%] text-2xl">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[48%] left-[22%] text-xl">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[42%] left-[28%] text-lg opacity-80">{'\ud83c\udf32'}</div>

            {/* Conifer trees - on/near right cliff */}
            <div className="absolute bottom-[50%] right-[17%] text-2xl">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[46%] right-[23%] text-xl">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[40%] right-[28%] text-lg opacity-80">{'\ud83c\udf32'}</div>

            {/* Conifer trees - right cluster */}
            <div className="absolute bottom-[10%] right-[4%] text-4xl">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[6%] right-[10%] text-3xl">{'\ud83c\udf32'}</div>
            <div className="absolute bottom-[14%] right-[14%] text-2xl">{'\ud83c\udf32'}</div>

            {/* Foreground grass/ground */}
            <div className="absolute bottom-0 left-0 right-0 h-[8%]" style={{
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

      {/* Footer */}
      <footer className="border-t-2 border-amber-800 bg-amber-950/50 px-4 py-4 mt-8">
        <div className="max-w-4xl mx-auto text-center text-amber-600 text-xs">
          &copy; 2026 Back of Beyond Ranch | Gold Country, California
        </div>
      </footer>
    </div>
  )
}
