'use client'

import { useState } from 'react'
import type { StreetPoster, TakenWarrant, TownFront, WarrantApproach } from '@/lib/goldCountryStreet'
import { postedBounty } from '@/lib/goldCountryStreet'
import { GoldCountryWantedPoster } from './GoldCountryWantedPoster'

export function GoldCountryWarrantBoard({
  front,
  posters,
  takes,
  takenWarrants,
  arrests,
  onTake,
  onStepInside,
  onStreet,
}: {
  front: TownFront
  posters: StreetPoster[]
  takes: Record<string, number>
  takenWarrants: TakenWarrant[]
  arrests: string[]
  onTake: (poster: StreetPoster, approach: WarrantApproach) => void
  onStepInside: () => void
  onStreet: () => void
}) {
  const [openId, setOpenId] = useState<string | null>(posters[0]?.id ?? null)
  const open = posters.find((p) => p.id === openId) ?? posters[0]

  return (
    <div className="west-face-shell min-h-screen" data-testid="warrant-board">
      <header className="px-4 py-3 border-b border-[var(--west-line)] flex items-start justify-between gap-3">
        <div>
          <p className="west-face-eyebrow">
            {posters.some((p) => p.form === 'claim_notice')
              ? 'Claim notices · 1849'
              : posters.some((p) => p.form === 'camp_notice')
                ? 'Camp notices · 1849'
                : 'Posted warrants · 1849'}
          </p>
          <h1 className="west-face-title text-3xl">{front.name}</h1>
          <p className="west-face-body mt-1 max-w-xl">
            {posters.some((p) => p.form === 'claim_notice')
              ? 'Partners watch the hole. Paper goes up rarely, and the purse is heavy — this ridge is for gold. They want him living, and the dust back.'
              : posters.some((p) => p.form === 'camp_notice')
                ? 'Calaveras has no county yet. These are alcalde papers. Take one. The purse thins when too many riders copy a notice and come back empty.'
                : 'The papers hang on the outer wall. Take one and the information is yours. The purse thins when too many riders copy a warrant and come back empty.'}
          </p>
        </div>
        <button type="button" className="west-face-pill shrink-0" onClick={onStreet}>
          Street
        </button>
      </header>

      <div
        className="relative min-h-[42vh] px-4 py-8"
        style={{
          background:
            'linear-gradient(180deg, rgba(20,12,6,0.35), rgba(10,6,3,0.7)), repeating-linear-gradient(90deg, #3a2718 0 14px, #2c1c10 14px 16px)',
        }}
      >
        {posters.length === 0 ? (
          <p className="font-serif text-[#e8dcc4] text-center">No paper nailed today.</p>
        ) : (
          <div className="flex flex-wrap items-start justify-center gap-6">
            {posters.map((poster, i) => {
              const served = arrests.includes(poster.hideNpcId)
              const taken = takenWarrants.find((t) => t.id === poster.id)
              const bounty = taken && served ? taken.bountyAtTake : postedBounty(poster, takes[poster.id] ?? poster.seedTakes)
              return (
                <button
                  key={poster.id}
                  type="button"
                  data-testid={`warrant-board-pin-${poster.id}`}
                  onClick={() => setOpenId(poster.id)}
                  className={`min-h-11 ${open?.id === poster.id ? 'ring-2 ring-[#e8dcc4]' : ''}`}
                  style={{ transform: `rotate(${i % 2 === 0 ? -3 : 4}deg)` }}
                  title={`Posted: ${poster.alias}`}
                >
                  <GoldCountryWantedPoster
                    poster={poster}
                    bounty={bounty}
                    size="board"
                    served={served}
                    approach={taken?.approach}
                    riders={takes[poster.id] ?? poster.seedTakes}
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {open && (
          <div className="west-face-paper" data-testid="warrant-sheet">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <GoldCountryWantedPoster
                poster={open}
                bounty={postedBounty(open, takes[open.id] ?? open.seedTakes)}
                size="sheet"
                served={arrests.includes(open.hideNpcId)}
                approach={takenWarrants.find((t) => t.id === open.id)?.approach}
                riders={takes[open.id] ?? open.seedTakes}
              />
              <div className="flex-1 space-y-3">
                <p className="west-face-eyebrow">Take this paper</p>
                <p className="west-face-body">
                  Click a warrant to store it. Choose how you mean to bring him in. The posted reward now is{' '}
                  <span className="text-amber-200">{postedBounty(open, takes[open.id] ?? open.seedTakes)}🌮</span>
                  {open.bounty !== postedBounty(open, takes[open.id] ?? open.seedTakes) ? ` (was ${open.bounty}🌮).` : '.'}
                </p>
                {arrests.includes(open.hideNpcId) ? (
                  <p className="font-serif text-emerald-200">Served. The purse is paid.</p>
                ) : takenWarrants.some((t) => t.id === open.id) ? (
                  <p className="font-serif text-[#e8dcc4]" data-testid="warrant-in-pocket">
                    In your papers — {takenWarrants.find((t) => t.id === open.id)?.approach === 'alive' ? 'bring him in alive' : 'dead or alive'}.
                    Locked at {takenWarrants.find((t) => t.id === open.id)?.bountyAtTake}🌮.
                  </p>
                ) : null}
                {!arrests.includes(open.hideNpcId) && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      data-testid="take-alive"
                      className="west-face-pill-cream west-face-pill flex-1 justify-center"
                      onClick={() => onTake(open, 'alive')}
                    >
                      Bring them in alive
                    </button>
                    {open.form !== 'camp_notice' && open.form !== 'claim_notice' && (
                      <button
                        type="button"
                        data-testid="take-dead-or-alive"
                        className="west-face-pill flex-1 justify-center"
                        onClick={() => onTake(open, 'dead_or_alive')}
                      >
                        Dead or alive
                      </button>
                    )}
                  </div>
                )}
                <p className="text-sm text-[#b8a88a] font-serif">
                  {open.form === 'camp_notice'
                    ? 'The alcalde wants him living. Alive pays the locked purse.'
                    : open.form === 'claim_notice'
                      ? 'The partners want him living and the dust back. Alive pays the locked purse. It is larger because the hole is gold.'
                      : 'Alive pays the locked purse. Dead or alive lets you take him dead for half, and it sits heavy.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" className="west-face-pill" onClick={onStepInside} data-testid="warrant-step-inside">
            Step inside
          </button>
          <button type="button" className="west-face-pill" onClick={onStreet}>
            Street
          </button>
        </div>
      </div>
    </div>
  )
}
