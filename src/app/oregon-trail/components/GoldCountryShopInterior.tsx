'use client'

import type { GoldCountryNPC } from '../data/goldCountryNPCs'
import type { SearchArea } from '../data/goldCountryEncounters'
import type { ShopGood, StreetPoster, TakenWarrant, TownFront, WarrantCapture } from '@/lib/goldCountryStreet'

export function GoldCountryShopInterior({
  front,
  keeper,
  patrons,
  searches,
  searchedAreaIds,
  poster,
  posterSeen,
  takenWarrant,
  arrested,
  boughtIds,
  canAfford,
  priceOf,
  onTalk,
  onSearch,
  onBuy,
  onConfront,
  onStreet,
  art,
  huntHot = true,
  emptyChair = null,
  onOpenGuestBook,
}: {
  front: TownFront
  keeper?: GoldCountryNPC
  patrons: GoldCountryNPC[]
  searches: SearchArea[]
  searchedAreaIds: readonly string[]
  poster?: StreetPoster
  posterSeen: boolean
  takenWarrant?: TakenWarrant
  arrested: boolean
  boughtIds: string[]
  canAfford: (price: number) => boolean
  priceOf: (good: ShopGood) => number
  onTalk: (npc: GoldCountryNPC) => void
  onSearch: (area: SearchArea) => void
  onBuy: (good: ShopGood) => void
  onConfront: (npc: GoldCountryNPC, method: WarrantCapture) => void
  onStreet: () => void
  /** Same painted still as the street, so stepping inside does not drop the town. */
  art?: string | null
  huntHot?: boolean
  emptyChair?: string | null
  onOpenGuestBook?: () => void
}) {
  const guestBookSearch = searches.find((area) => area.id === 'cabin_guest_book')
  const lookAround = searches.filter((area) => area.id !== 'cabin_guest_book')
  const wanted = poster && poster.hideFrontId === front.id ? poster.hideNpcId : null
  const voice =
    front.kind === 'office' || front.duty === 'sheriff'
      ? { keeper: 'At the desk', others: 'Waiting', empty: 'No one else in the office.' }
      : front.kind === 'saloon'
        ? { keeper: 'Behind the bar', others: 'At the tables', empty: 'No one else at the tables.' }
        : front.kind === 'wine'
          ? { keeper: 'Among the barrels', others: 'In the dark', empty: 'Just you and the barrels.' }
          : front.kind === 'mine'
            ? { keeper: 'At the hole', others: 'On the timber', empty: 'No one else will go further.' }
            : front.kind === 'cave'
              ? { keeper: 'At the mouth', others: 'With a lamp', empty: 'Just the moan and the rope.' }
              : front.kind === 'cabin'
                ? { keeper: 'On the porch', others: 'In the house', empty: 'The house is yours to enjoy, while you are visiting us.' }
                : front.kind === 'tent'
                  ? { keeper: 'In the stall', others: 'In the loft', empty: 'Hay and old tack. No one else here.' }
                : { keeper: 'Behind the counter', others: 'Patrons', empty: 'No one else at the tables.' }

  return (
    <div className="west-face-shell min-h-screen">
      <header className="px-4 py-3 border-b border-[var(--west-line)] flex items-start justify-between gap-3">
        <div>
          <p className="west-face-eyebrow">Inside · 1849</p>
          <h1 className="west-face-title text-3xl">{front.name}</h1>
        </div>
        <button type="button" className="west-face-pill shrink-0" onClick={onStreet}>
          Street
        </button>
      </header>

      <div className="relative min-h-[42vh] sm:min-h-[52vh] bg-[#120e0a]">
        {art ? (
          <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a] via-black/45 to-black/25" />
        <p className="relative z-10 max-w-xl px-4 pt-10 font-serif text-[#e8dcc4] drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
          {front.interior}
        </p>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {keeper && (
          <div className="west-face-paper">
            <h2 className="west-face-eyebrow mb-3">{voice.keeper}</h2>
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
          <h2 className="west-face-eyebrow mb-3">{voice.others}</h2>
          {emptyChair && (
            <p className="west-face-body mb-3" data-testid="empty-chair">{emptyChair}</p>
          )}
          {patrons.length === 0 && !emptyChair ? (
            <p className="west-face-body">{voice.empty}</p>
          ) : patrons.length === 0 ? null : (
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
                    {match && takenWarrant && !arrested && !huntHot && (
                      <p className="text-sm text-[#cbbfa6] font-serif mt-2">
                        The paper is not enough. Follow the street. He is in the wind.
                      </p>
                    )}
                    {match && takenWarrant && !arrested && huntHot && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-[#cbbfa6] font-serif">
                          That is {poster?.alias}. Your paper says {takenWarrant.approach === 'alive' ? 'alive' : 'dead or alive'}.
                          The alley is the catch — gun and rope, seconds to choose.
                        </p>
                        <button
                          type="button"
                          data-testid="confront-chase"
                          className="west-face-pill west-face-pill-cream w-full justify-center"
                          onClick={() => onConfront(npc, 'alive')}
                        >
                          Chase him — the alley
                        </button>
                      </div>
                    )}
                    {match && posterSeen && !takenWarrant && !arrested && (
                      <p className="text-sm text-amber-200/90 mt-2 font-serif">
                        He matches the wall. Take the paper at the sheriff office first.
                      </p>
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

        {(guestBookSearch || lookAround.length > 0) && (
          <div className="west-face-paper">
            <h2 className="west-face-eyebrow mb-3">Look around</h2>
            {guestBookSearch && onOpenGuestBook && (
              <button
                type="button"
                data-testid="open-guest-book"
                onClick={onOpenGuestBook}
                className="flex items-center gap-3 p-3 rounded-lg border border-amber-600 text-left min-h-11 w-full mb-3"
              >
                <span className="text-xl">{guestBookSearch.icon}</span>
                <div>
                  <p className="font-serif text-[#e8dcc4]">{guestBookSearch.name}</p>
                  <p className="text-sm text-[#b8a88a]">Open it. Read who passed. Sign if you mean to stay a name.</p>
                </div>
              </button>
            )}
            {lookAround.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lookAround.map((area) => {
                  const searched = searchedAreaIds.includes(area.id)
                  const searchedClass = searched
                    ? 'opacity-50 cursor-not-allowed border-[var(--west-line)]'
                    : 'border-amber-600'
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => { if (!searched) onSearch(area) }}
                      disabled={searched}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left min-h-11 ${searchedClass}`}
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
            ) : null}
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
