'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useKarma, formatAlignmentLegend } from '@/lib/karmaContext'
import { useCrossGame } from '@/lib/crossGameProgressionContext'
import { hasAnyCharacter } from '@/lib/sharedCharacter'
import { KarmaToastContainer, HouseRulesQuiz } from '@/components/karma'
import { interestHref, nextInterest } from '@/lib/overlay/interest-next'
import { readExplorerVisits } from '@/app/explore/explorerContext'
import BookStayButton from '@/components/pixel/BookStayButton'
import { readArcadeAccess } from '@/lib/arcadeFirstLevel'
import { hasExploreQr } from '@/lib/exploreQrGate'

/** One quiet row in More — depth stays, first paint does not. */
function MoreRow({ href, title, note, locked, lockHint }: {
  href?: string
  title: string
  note: string
  locked?: boolean
  lockHint?: string
}) {
  const body = (
    <div className="west-face-row">
      <div>
        <p className="font-serif text-[#f3ead8]">{title}</p>
        <p className="west-face-body mt-1 text-sm">{locked ? (lockHint || note) : note}</p>
      </div>
      {!locked && href && <span className="west-face-pill shrink-0">Open</span>}
    </div>
  )
  if (locked || !href) return body
  return <Link href={href} className="block">{body}</Link>
}

export default function HubPage() {
  const { discountMultiplier, hasCompletedHouseRules, houseRulesScore, karma } = useKarma()
  const { isUnlocked, unlockToasts, dismissUnlockToast } = useCrossGame()
  const [showQuiz, setShowQuiz] = useState(false)
  const [hasCharacter, setHasCharacter] = useState(false)
  const [trailComplete, setTrailComplete] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [visits, setVisits] = useState<{ visitedTownIds: string[]; lastTownId?: string }>({ visitedTownIds: [] })

  const ranchHuntUnlocked = isUnlocked('ranch_treasure_hunt')
  const clueGameUnlocked = isUnlocked('clue_game')

  useEffect(() => {
    setHasCharacter(hasAnyCharacter())
    setVisits(readExplorerVisits())
    // Presentation only: retain the existing local progression and QR gates.
    try { setTrailComplete(readArcadeAccess().trailComplete) } catch { setTrailComplete(false) }
    setExploreOpen(hasExploreQr())
  }, [])

  const visitedTownIds = visits.visitedTownIds
  const lastTownId = visits.lastTownId
  const interest = nextInterest(visitedTownIds, lastTownId)
  const nextHref = interestHref(interest.id)

  const alignmentLegend = formatAlignmentLegend(karma.alignment)

  return (
    <div className="min-h-screen bg-[#0e0c0a] text-[#e8dcc4]">
      <KarmaToastContainer />
      {unlockToasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {unlockToasts.map(toast => (
            <button
              type="button"
              key={toast.id}
              className="west-face-paper max-w-sm text-left"
              onClick={() => dismissUnlockToast(toast.id)}
            >
              <p className="west-face-eyebrow">Opened</p>
              <p className="mt-1 font-serif text-[#f3ead8]">{toast.gameName}</p>
              <p className="west-face-body mt-1 text-sm">{toast.message}</p>
            </button>
          ))}
        </div>
      )}
      <HouseRulesQuiz isOpen={showQuiz} onClose={() => setShowQuiz(false)} />

      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-6">
        <div>
          <p className="west-face-eyebrow">Back of Beyond Ranch</p>
          <p className="mt-1 font-serif text-sm text-[#b8a88a]">West Point · Gold Country</p>
        </div>
        <Link href="/" className="west-face-pill">The ranch</Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <article className="overflow-hidden rounded-[1.25rem] border border-[rgba(232,220,196,0.12)] bg-[#16130f]">
          <div className="relative aspect-[16/9]">
            <Image
              src="/place-art/ot_title_prairie_editorial.jpg"
              alt=""
              fill
              priority
              className="visual64-scene-image object-cover object-[center_35%]"
              sizes="(max-width: 768px) 100vw, 768px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16130f] via-[#16130f]/20 to-transparent" />
          </div>
          <div className="relative px-6 pb-7 pt-2 sm:px-8">
            <p className="west-face-eyebrow">1849 · one season</p>
            <h1 className="west-face-title mt-2">Golden Frog Trail</h1>
            <p className="west-face-body mt-3 max-w-xl">
              Wagon, warrant, and the river that started a country over. The towns are real.
              Play this first. The rest of the land waits behind it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <BookStayButton size="md">Book</BookStayButton>
              <Link href="/oregon-trail" className="west-face-pill west-face-pill-cream" data-testid="hub-play-trail">
                Play the trail
              </Link>
            </div>
            {!interest.done && interest.trailWord && !interest.named && (
              <p className="west-face-body mt-4 max-w-xl" data-testid="hub-interest-next">
                <Link href={nextHref} className="hover:text-[#f3ead8]">
                  {interest.trailWord}
                </Link>
              </p>
            )}
            <p className="west-face-body mt-3 text-sm" data-testid="alignment-legend">
              {alignmentLegend}
            </p>
          </div>
        </article>

        {(trailComplete || exploreOpen) && <details className="west-face-paper mt-8" data-testid="hub-more">
          <summary className="west-face-eyebrow min-h-11 cursor-pointer">More on this land</summary>
          <p className="west-face-body mt-3">
            The depth is still here. It does not all have to be the first door.
          </p>
          <div className="mt-2">
            <MoreRow href="/oregon-trail" title="Golden Frog Trail · 1849" note="The wagon road. One Play button from the door above." />
            <MoreRow href={exploreOpen ? '/explore' : undefined} title="Gold Country Explorer" note="West Point, Volcano, Angels Camp — walk the real towns." locked={!exploreOpen} lockHint="The ranch-house QR opens the full map. Town readings remain along the trail." />
            {exploreOpen && <Link href="/explore" className="west-face-pill mt-3 inline-flex items-center" style={{ minHeight: 44 }} data-testid="hub-walk-map">Walk the map</Link>}
            {trailComplete && <>
            <MoreRow
              href={hasCharacter ? '/adventure/play' : '/adventure/character-creation'}
              title="The Diggings · 1852"
              note={hasCharacter ? 'Continue after the wagon.' : 'The Mother Lode after the trail.'}
            />
            <MoreRow href="/prologue" title="The Prologue · 600–1500" note="Four civilizations, one mystery. Optional, before 1849." />
            <MoreRow href="/adventure/where-in-time" title="Where in Time" note="The chase across eras. For guests who already know the land." />
            <MoreRow href="/investigations" title="The Tare’s Trail" note="Ten towns. A scale that does not lie." />
            <MoreRow href="/playtest" title="Volcano · the case" note="Local campaign table. Same land, a tighter loop." />
            <MoreRow href="/karma-market" title="Karma Market" note="Treats, momentos, and the ranch ledger." />
            <MoreRow href="/game" title="Location hunt" note="Photo challenges around the ranch." />
            <MoreRow
              href={ranchHuntUnlocked ? '/ranch-treasure-hunt' : undefined}
              title="Ranch treasure hunt"
              note="QR bounties on the property."
              locked={!ranchHuntUnlocked}
              lockHint="Reach West Point on the trail, then this opens."
            />
            <MoreRow
              href={clueGameUnlocked ? '/clue-game' : undefined}
              title="Mystery for guests"
              note="A hidden quest at the ranch."
              locked={!clueGameUnlocked}
              lockHint="Find the key during your stay."
            />
            <MoreRow title="Cynthia’s Inn" note="The crossroads tavern. Coming when the trail can carry it." locked lockHint="Coming. Not a first door." />
            </>}
          </div>

          <div className="west-face-footer mt-4 flex flex-wrap items-center justify-between gap-3">
            <p>
              {hasCompletedHouseRules
                ? `House rules remembered (${houseRulesScore}/10). Alignment: ${alignmentLegend} · stay discount ${discountMultiplier}×.`
                : 'A short house-rules quiz, if you want the stay discount to know you.'}
            </p>
            <button type="button" className="west-face-pill" onClick={() => setShowQuiz(true)}>
              {hasCompletedHouseRules ? 'Retake' : 'House rules'}
            </button>
          </div>
          {karma.history.length > 0 && (
            <p className="west-face-body mt-3 text-sm">
              Last on the land: {karma.history[0]?.description}
            </p>
          )}
        </details>}
      </main>

      <footer className="west-face-footer mx-auto max-w-3xl px-6 pb-10">
        <p>West Point, Volcano, and Angels Camp are real Gold Country towns. The ranch sits among them.</p>
        <p className="mt-2">
          {exploreOpen && <><Link href="/explore" className="hover:text-[#f3ead8]">Walk the map</Link><span className="mx-2 opacity-50">·</span></>}
          <Link href="/rentals" className="hover:text-[#f3ead8]">If you stay</Link>
        </p>
      </footer>
    </div>
  )
}
