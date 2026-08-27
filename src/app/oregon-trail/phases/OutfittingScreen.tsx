'use client'

import React, { useState } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { KarmaToastContainer } from '@/components/karma'
import { KarmaWallet } from '../components/KarmaWallet'
import { KarmaConvertModal } from '../components/KarmaConvertModal'
import { editorialForLandmark } from '@/lib/californiaTrailArt'
import { readAgeMode } from '@/lib/gftAgeMode'

export function OutfittingScreen() {
  const { state, purchaseSupplies, goToCharacterCreation } = useOregonTrail()
  const { balance, canAfford, spendNeutral, showConvertModal, setShowConvertModal, convertModalContext, setConvertModalContext } = useKarmaWallet()
  const [supplies, setSupplies] = useState({
    food: 0,
    ammo: 0,
    parts: 0,
    medicine: 0,
    oxen: 0,
  })

  const prices = {
    food: 0.2,
    ammo: 2,
    parts: 10,
    medicine: 5,
    oxen: 40,
  }

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
    { key: 'oxen', name: 'Oxen (pair)', blurb: 'The door west. Slow, sure, and they eat grass you do not pack.', unit: 'yoke', step: 1, price: prices.oxen },
    { key: 'food', name: 'Flour', blurb: 'Joseph Ware, 1849: about 180 lb per person. Need 100 lb to leave.', unit: 'lb', step: 50, price: prices.food },
    { key: 'ammo', name: 'Powder & lead', blurb: 'Hunting and the occasional warrant.', unit: 'box', step: 1, price: prices.ammo },
    { key: 'parts', name: 'Spare axle', blurb: 'A broken axle without a spare ends a company.', unit: 'ea', step: 1, price: prices.parts },
    { key: 'medicine', name: 'Medicine chest', blurb: 'Laudanum, quinine, and more hope than science.', unit: 'kit', step: 1, price: prices.medicine },
  ]
  const gateRows = rows.filter((row) => row.key === 'oxen' || row.key === 'food')
  const otherRows = rows.filter((row) => row.key !== 'oxen' && row.key !== 'food')

  const still =
    editorialForLandmark('Independence, Missouri') || '/place-art/editorial/independence.jpg'

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

      <div className="relative z-10 flex h-[calc(100dvh-6.5rem-env(safe-area-inset-bottom,0px))] flex-col overflow-hidden px-4 py-6 sm:px-8 md:h-[calc(100dvh-2.5rem)] md:max-w-xl md:px-16">
        <p className="font-serif text-[11px] uppercase tracking-[0.28em] text-amber-100/80 shrink-0">
          First camp · Independence, Missouri
        </p>
        <h1 className="west-face-title mt-2 shrink-0">Independence outfitters</h1>
        <p className="west-face-body mt-3 max-w-xl shrink-0 text-[#e8dcc4]/85">
          1849 prices, more or less. Joseph Ware told three people to pack a thousand pounds
          of flour. You are not three people, but the prairie does not grade on a curve.
        </p>

        <article className="west-face-paper mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-start justify-between gap-4">
            <p className="font-serif text-sm text-[#e8dcc4]">
              {Math.max(0, Math.floor((balance?.neutral ?? 0) - Math.ceil(totalCost)))} remaining
            </p>
          </div>

          <div className="mt-4 shrink-0" data-testid="outfit-gate">
            {gateRows.map((row) => (
              <div className="west-face-row" key={row.key} data-testid={`outfit-${row.key}`}>
                <div>
                  <h2 className="font-serif text-lg text-[#f3ead8]">{row.name}</h2>
                  <p className="west-face-body mt-1">
                    ${row.price} buy · {row.unit}. On hand: {onHand[row.key]}
                    {row.key === 'food' ? ' lb' : ''}. Adding {supplies[row.key]}.
                  </p>
                  <p className="mt-1 text-sm text-[#9a8b70]">{row.blurb}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="west-face-pill"
                    onClick={() => setSupplies((s) => ({ ...s, [row.key]: Math.max(0, s[row.key] - row.step) }))}
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-serif">{supplies[row.key]}</span>
                  <button
                    type="button"
                    className="west-face-pill"
                    onClick={() => setSupplies((s) => {
                      const next = { ...s, [row.key]: s[row.key] + row.step }
                      if (!canAfford('neutral', Math.ceil(costOf(next)))) return s
                      return next
                    })}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {otherRows.map((row) => (
              <div className="west-face-row" key={row.key}>
                <div>
                  <h2 className="font-serif text-lg text-[#f3ead8]">{row.name}</h2>
                  <p className="west-face-body mt-1">
                    ${row.price} buy · {row.unit}. On hand: {onHand[row.key]}
                    {row.key === 'food' ? ' lb' : ''}. Adding {supplies[row.key]}.
                  </p>
                  <p className="mt-1 text-sm text-[#9a8b70]">{row.blurb}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="west-face-pill"
                    onClick={() => setSupplies((s) => ({ ...s, [row.key]: Math.max(0, s[row.key] - row.step) }))}
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-serif">{supplies[row.key]}</span>
                  <button
                    type="button"
                    className="west-face-pill"
                    onClick={() => setSupplies((s) => {
                      const next = { ...s, [row.key]: s[row.key] + row.step }
                      if (!canAfford('neutral', Math.ceil(costOf(next)))) return s
                      return next
                    })}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="west-face-row shrink-0 items-center">
            <div>
              <p className="font-serif text-[#f3ead8]">This load</p>
              <div className="mt-2"><KarmaWallet compact showBadKarma={false} /></div>
            </div>
            <p className={`font-serif ${!canAfford('neutral', Math.ceil(totalCost)) ? 'text-red-300' : 'text-[#e8dcc4]'}`}>
              {Math.ceil(totalCost)} tacos
            </p>
          </div>
        </article>

        <div className="mt-3 flex shrink-0 flex-col gap-2 rounded-lg bg-black/70 p-3">
          <button
            type="button"
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
        <p className="west-face-footer mt-2 shrink-0">
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
