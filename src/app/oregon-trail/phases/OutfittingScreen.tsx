'use client'

import React, { useState } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { KarmaToastContainer } from '@/components/karma'
import { KarmaWallet } from '../components/KarmaWallet'
import { KarmaConvertModal } from '../components/KarmaConvertModal'
import { editorialForLandmark } from '@/lib/californiaTrailArt'
import { readAgeMode } from '@/lib/gftAgeMode'
import {
  WARE_WAGON,
  WARE_WAGON_COST,
  WARE_WAGON_PRICES,
  STARTING_NEUTRAL_FOR_WARE,
  OUTFIT_PURSE_LINE,
  AMMO_ROUNDS_PER_BOX,
} from '../data/wareWagon'

export function OutfittingScreen() {
  const { state, purchaseSupplies, goToCharacterCreation } = useOregonTrail()
  const { balance, canAfford, spendNeutral, showConvertModal, setShowConvertModal, convertModalContext, setConvertModalContext } = useKarmaWallet()
  const [supplies, setSupplies] = useState({ ...WARE_WAGON })

  const prices = WARE_WAGON_PRICES

  const costOf = (next: typeof supplies) =>
    next.food * prices.food +
    next.ammo * prices.ammo +
    next.parts * prices.parts +
    next.medicine * prices.medicine +
    next.oxen * prices.oxen

  const totalCost = costOf(supplies)

  const handlePurchase = async () => {
    const totalKarmaCost = Math.ceil(totalCost)

    if (!canAfford('neutral', totalKarmaCost)) {
      setConvertModalContext({ needed: totalKarmaCost, karmaType: 'neutral' })
      setShowConvertModal(true)
      return
    }

    const success = await spendNeutral(totalKarmaCost, "Matt's General Store - Outfitting")
    if (success) {
      purchaseSupplies(supplies)
      setSupplies({ food: 0, ammo: 0, parts: 0, medicine: 0, oxen: 0 })
    }
  }

  const onHand = {
    food: state.food,
    ammo: state.ammunition,
    parts: state.spareParts,
    medicine: state.medicine,
    oxen: state.oxen,
  }

  const rows: Array<{
    key: keyof typeof supplies
    name: string
    blurb: string
    unit: string
    step: number
    price: number
  }> = [
    { key: 'oxen', name: 'Oxen', blurb: 'The door west. Matt sells by the head; a yoke is two heads. Need 2 to leave.', unit: 'head', step: 1, price: prices.oxen },
    { key: 'food', name: 'Flour', blurb: 'Joseph Ware, 1849: about 180 lb per person. Need 100 lb to leave.', unit: 'lb', step: 50, price: prices.food },
    { key: 'ammo', name: 'Powder & lead', blurb: 'Hunting and the occasional warrant. One box is 20 rounds in the wagon.', unit: 'box', step: 1, price: prices.ammo },
    { key: 'parts', name: 'Spare axle', blurb: 'A broken axle without a spare ends a company.', unit: 'ea', step: 1, price: prices.parts },
    { key: 'medicine', name: 'Medicine chest', blurb: 'Laudanum, quinine, and more hope than science.', unit: 'kit', step: 1, price: prices.medicine },
  ]

  const remainingAfterCart = Math.max(0, Math.floor((balance?.neutral ?? 0) - Math.ceil(totalCost)))
  const purse = Math.floor(balance?.neutral ?? STARTING_NEUTRAL_FOR_WARE)

  const still =
    editorialForLandmark('Independence, Missouri') || '/place-art/editorial/independence.jpg'

  const bump = (key: keyof typeof supplies, delta: number) => {
    setSupplies((s) => {
      const nextVal = Math.max(0, s[key] + delta)
      const next = { ...s, [key]: nextVal }
      if (delta > 0 && !canAfford('neutral', Math.ceil(costOf(next)))) return s
      return next
    })
  }

  const canPlus = (row: (typeof rows)[number]) => {
    const next = { ...supplies, [row.key]: supplies[row.key] + row.step }
    return canAfford('neutral', Math.ceil(costOf(next)))
  }

  return (
    <div className="relative min-h-screen">
      <KarmaToastContainer />

      {/* Existing Independence pixels as the face. Shop stays React, off the courthouse. */}
      <div className="pointer-events-none fixed inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={still}
          alt=""
          className="h-full w-full object-cover object-[center_38%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="relative z-10 px-4 py-6 sm:px-8 md:max-w-xl md:px-16">
        <p className="font-serif text-[11px] uppercase tracking-[0.28em] text-amber-100/80">
          First camp · Independence, Missouri
        </p>
        <h1 className="west-face-title mt-2">Independence outfitters</h1>
        <p className="west-face-body mt-3 max-w-xl text-[#e8dcc4]/85">
          1849 prices, more or less. Joseph Ware told three people to pack a thousand pounds
          of flour. You are not three people, but the prairie does not grade on a curve.
        </p>

        <article className="west-face-paper mt-4">
          <div data-testid="outfit-purse">
            <p className="west-face-eyebrow">Expedition stake</p>
            <p className="west-face-body mt-2">{OUTFIT_PURSE_LINE}</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-serif text-[#f3ead8]">In the purse now</p>
                <div className="mt-1"><KarmaWallet compact showBadKarma={false} /></div>
              </div>
              <p className="font-serif text-sm text-[#e8dcc4]">
                This load {Math.ceil(totalCost)} · {remainingAfterCart} left after buy
              </p>
            </div>
            {purse <= 0 && (
              <p className="mt-2 text-sm text-red-300">The stake is spent. Convert, or buy a smaller load.</p>
            )}
          </div>

          <div className="mt-2" data-testid="outfit-gate">
            {rows.map((row) => {
              const plusOk = canPlus(row)
              const minusOk = supplies[row.key] > 0
              return (
                <div className="west-face-row" key={row.key} data-testid={`outfit-${row.key}`}>
                  <div className="min-w-0">
                    <h2 className="font-serif text-lg text-[#f3ead8]">{row.name}</h2>
                    <p className="west-face-body mt-1">
                      ${row.price} buy · {row.unit}
                      {row.key === 'ammo' ? ` (${AMMO_ROUNDS_PER_BOX} rd)` : ''}. On hand:{' '}
                      {row.key === 'ammo'
                        ? `${onHand.ammo} rd`
                        : `${onHand[row.key]}${row.key === 'food' ? ' lb' : ''}`}
                      . Adding {supplies[row.key]}
                      {row.key === 'ammo' ? ' boxes' : ''}.
                    </p>
                    <p className="mt-1 text-sm text-[#9a8b70]">{row.blurb}</p>
                    {!plusOk && (
                      <p className="mt-1 text-sm text-[#c4a574]">
                        +{row.step} needs {Math.ceil(row.price * row.step)} tacos · {remainingAfterCart} left in this cart
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="west-face-pill"
                      disabled={!minusOk}
                      aria-label={`Less ${row.name}`}
                      onClick={() => bump(row.key, -row.step)}
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-serif">{supplies[row.key]}</span>
                    <button
                      type="button"
                      className="west-face-pill"
                      disabled={!plusOk}
                      aria-label={`More ${row.name}`}
                      onClick={() => bump(row.key, row.step)}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <div className="mt-3 mb-16 flex flex-col gap-2 rounded-lg bg-black/70 p-3 md:mb-4">
          <button
            type="button"
            data-testid="outfit-ware"
            className="west-face-pill w-full text-center"
            disabled={!canAfford('neutral', WARE_WAGON_COST)}
            onClick={() => {
              if (!canAfford('neutral', WARE_WAGON_COST)) return
              setSupplies({ ...WARE_WAGON })
            }}
          >
            Pack as Ware wrote · {WARE_WAGON_COST} tacos
          </button>
          <button
            type="button"
            data-testid="outfit-buy"
            onClick={handlePurchase}
            disabled={totalCost === 0}
            className="west-face-pill west-face-pill-cream w-full text-center"
          >
            {canAfford('neutral', Math.ceil(totalCost)) ? 'Buy this load' : 'Need more tacos'}
          </button>
          <button
            type="button"
            data-testid="outfit-saddle"
            onClick={goToCharacterCreation}
            disabled={state.oxen < 2 || state.food < 100}
            className="west-face-pill west-face-pill-cream w-full text-center"
          >
            S.A.D.D.L.E. up
          </button>
          {(state.oxen < 2 || state.food < 100) && (
            <p className="text-sm text-red-300">Need at least 2 oxen and 100 lbs of food, then roll your agent</p>
          )}
        </div>
        <p className="west-face-footer mt-2">
          First camp: Independence, Missouri. Mode: {readAgeMode() === 'under18' ? 'Kid trail' : 'Adult warrant'}. NEOMA, DM.
        </p>
      </div>

      {showConvertModal && convertModalContext && (
        <KarmaConvertModal
          isOpen={showConvertModal}
          onClose={() => {
            setShowConvertModal(false)
            setConvertModalContext(null)
          }}
          neededAmount={convertModalContext.needed}
          karmaType={convertModalContext.karmaType === 'good' ? 'good' : 'neutral'}
          onSuccess={() => {
            handlePurchase()
          }}
        />
      )}
    </div>
  )
}
