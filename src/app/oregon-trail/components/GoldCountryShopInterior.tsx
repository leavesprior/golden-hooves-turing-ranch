'use client'

import type { GoldCountryNPC } from '../data/goldCountryNPCs'
import type { SearchArea } from '../data/goldCountryEncounters'
import type { ShopGood, StreetPoster, TownFront } from '@/lib/goldCountryStreet'

export function GoldCountryShopInterior({
  front,
  keeper,
  patrons,
  searches,
  searchedAreaIds,
  poster,
  posterSeen,
  arrested,
  boughtIds,
  canAfford,
  priceOf,
  onTalk,
  onSearch,
  onBuy,
  onConfront,
  onStreet,
}: {
  front: TownFront
  keeper?: GoldCountryNPC
  patrons: GoldCountryNPC[]
  searches: SearchArea[]
  searchedAreaIds: readonly string[]
  poster?: StreetPoster
  posterSeen: boolean
  arrested: boolean
  boughtIds: string[]
  canAfford: (price: number) => boolean
  priceOf: (good: ShopGood) => number
  onTalk: (npc: GoldCountryNPC) => void
  onSearch: (area: SearchArea) => void
  onBuy: (good: ShopGood) => void
  onConfront: (npc: GoldCountryNPC) => void
  onStreet: () => void
}) {
  const wanted = poster && poster.hideFrontId === front.id ? poster.hideNpcId : null

  return (
    <div className="west-face-shell min-h-screen">
      <header className="px-4 py-3 border-b border-[var(--west-line)] flex items-start justify-between gap-3">
        <div>
          <p className="west-face-eyebrow">Inside · 1849</p>
          <h1 className="west-face-title text-3xl">{front.name}</h1>
          <p className="west-face-body mt-1 max-w-xl">{front.interior}</p>
        </div>
        <button type="button" className="west-face-pill shrink-0" onClick={onStreet}>
          Street
        </button>
      </header>

      <div className="relative min-h-[36vh] bg-[#120e0a]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <p className="relative z-10 px-4 pt-8 font-serif text-[#cbbfa6] max-w-xl">
          Dust, lamp-smoke, the street noise muffled. Names belong in here.
        </p>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {keeper && (
          <div className="west-face-paper">
            <h2 className="west-face-eyebrow mb-3">Behind the counter</h2>
            <button
              type="button"
              onClick={() => onTalk(keeper)}
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--west-line)] text-left min-h-11 w-full"
            >
              <span className="text-2xl">{keeper.portrait}</span>
              <div>
                <p className="font-serif text-[#e8dcc4]">{keeper.name}</p>
                <p className="text-sm text-[#b8a88a]">{keeper.title}</p>
              </div>
            </button>
          </div>
        )}

        <div className="west-face-paper">
          <h2 className="west-face-eyebrow mb-3">Patrons</h2>
          {patrons.length === 0 ? (
            <p className="west-face-body">No one else at the tables.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {patrons.map((npc) => {
                const match = wanted === npc.id
                return (
                  <div key={npc.id} className="rounded-lg border border-[var(--west-line)] p-3">
                    <button
                      type="button"
                      onClick={() => onTalk(npc)}
                      className="flex items-center gap-3 text-left min-h-11 w-full"
                    >
                      <span className="text-2xl">{npc.portrait}</span>
                      <div>
                        <p className="font-serif text-[#e8dcc4]">{npc.name}</p>
                        <p className="text-sm text-[#b8a88a]">{npc.title}</p>
                      </div>
                    </button>
                    {match && posterSeen && !arrested && (
                      <button
                        type="button"
                        className="west-face-pill west-face-pill-cream w-full mt-2 justify-center"
                        onClick={() => onConfront(npc)}
                      >
                        That is {poster?.alias} — take him
                      </button>
                    )}
                    {match && arrested && (
                      <p className="text-sm text-emerald-200 mt-2">Taken. The poster is satisfied.</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {searches.length > 0 && (
          <div className="west-face-paper">
            <h2 className="west-face-eyebrow mb-3">Look around</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searches.map((area) => {
                const searched = searchedAreaIds.includes(area.id)
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => !searched && onSearch(area)}
                    disabled={searched}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left min-h-11 ${
                      searched ? 'opacity-50 cursor-not-allowed' : ''
                    } border-[var(--west-line)]`}
                  >
                    <span className="text-xl">{area.icon}</span>
                    <div>
                      <p className="font-serif text-[#e8dcc4]">{area.name}</p>
                      <p className="text-sm text-[#b8a88a]">{area.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {front.goods.length > 0 && (
          <div className="west-face-paper">
            <h2 className="west-face-eyebrow mb-3">Goods · click to buy</h2>
            <ul className="space-y-2">
              {front.goods.map((good) => {
                const sold = boughtIds.includes(good.id)
                const price = priceOf(good)
                const ok = canAfford(price)
                return (
                  <li key={good.id}>
                    <button
                      type="button"
                      disabled={sold || !ok}
                      onClick={() => onBuy(good)}
                      className={`w-full text-left p-3 rounded-lg border border-[var(--west-line)] min-h-11 ${
                        sold || !ok ? 'opacity-50' : ''
                      }`}
                    >
                      <span className="font-serif text-[#e8dcc4]">{good.name}</span>
                      <span className="text-sm text-[#b8a88a] float-right">{sold ? 'sold' : `${price}🌮`}</span>
                      <p className="text-sm text-[#b8a88a] mt-1">{good.desc}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
