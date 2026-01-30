'use client'

/**
 * Guide Hire Component
 *
 * Modal for hiring unique trail guides at specific locations.
 * Each guide provides benefits for a set number of travel segments.
 */

import React, { useState, useCallback } from 'react'
import { useNarrator } from '../narratorContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { KarmaWallet } from './KarmaWallet'
import { KarmaConvertModal } from './KarmaConvertModal'
import { type HireableGuide } from '../data/specialtyShops'

interface GuideHireProps {
  guides: HireableGuide[]
  onHire: (guide: HireableGuide) => void
  onClose: () => void
  currentGuide?: HireableGuide | null
}

export function GuideHire({ guides, onHire, onClose, currentGuide }: GuideHireProps) {
  const { comment, setMood } = useNarrator()
  const {
    canAfford, spendNeutral, spendGood,
    showConvertModal, setShowConvertModal,
    convertModalContext, setConvertModalContext,
  } = useKarmaWallet()

  const [message, setMessage] = useState<string | null>(null)
  const [selectedGuide, setSelectedGuide] = useState<HireableGuide | null>(null)

  const handleHire = useCallback(async (guide: HireableGuide) => {
    if (currentGuide) {
      setMessage(`You already have ${currentGuide.name} traveling with you. One guide at a time.`)
      return
    }

    // Check costs
    if (!canAfford('neutral', guide.hireCost)) {
      setConvertModalContext({ needed: guide.hireCost, karmaType: 'neutral' })
      setShowConvertModal(true)
      return
    }
    if (guide.goodKarmaCost && !canAfford('good', guide.goodKarmaCost)) {
      setMessage(`You need ${guide.goodKarmaCost}🍪 Good Karma. ${guide.name} requires proof of character.`)
      return
    }

    // Spend karma
    const success = await spendNeutral(guide.hireCost, `Hire guide: ${guide.name}`)
    if (!success) {
      setMessage('Transaction failed!')
      return
    }

    if (guide.goodKarmaCost) {
      await spendGood(guide.goodKarmaCost, `Guide reputation: ${guide.name}`)
    }

    // Trigger hire
    onHire(guide)
    setMessage(`${guide.name} has joined your party for ${guide.duration} landmarks!`)
    setMood('impressed')
    setTimeout(() => {
      comment(guide.narratorComment, 'observation')
    }, 800)
  }, [currentGuide, canAfford, spendNeutral, spendGood, setConvertModalContext, setShowConvertModal, onHire, setMood, comment])

  if (guides.length === 0 && !currentGuide) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-950 border-2 border-amber-600 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-indigo-900/60 p-4 border-b border-indigo-600 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧭</span>
            <div>
              <h2 className="text-indigo-200 font-bold">Trail Guides</h2>
              <p className="text-indigo-400 text-xs">Hire an experienced guide for the journey ahead</p>
            </div>
          </div>
          <div className="text-right">
            <KarmaWallet compact showBadKarma={false} />
          </div>
        </div>

        {/* Current Guide Status */}
        {currentGuide && (
          <div className="bg-green-900/30 border-b border-green-700 p-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentGuide.emoji}</span>
              <div className="flex-1">
                <p className="text-green-200 font-bold text-sm">
                  Current Guide: {currentGuide.name}
                  <span className="text-green-400 font-normal ml-2">({currentGuide.title})</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {currentGuide.benefits.map((b, i) => (
                    <span key={i} className="text-xs bg-green-800/50 text-green-300 px-2 py-0.5 rounded">
                      {b.description}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Guides */}
        <div className="flex-1 overflow-y-auto p-4">
          {guides.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No guides available at this location.</p>
              {currentGuide && (
                <p className="text-green-400 text-xs mt-2">
                  {currentGuide.name} is still traveling with you.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {guides.map(guide => {
                const affordable = canAfford('neutral', guide.hireCost) &&
                  (!guide.goodKarmaCost || canAfford('good', guide.goodKarmaCost))
                const isExpanded = selectedGuide?.id === guide.id
                const canHire = affordable && !currentGuide

                return (
                  <div
                    key={guide.id}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      canHire
                        ? 'border-indigo-600 hover:border-indigo-400 cursor-pointer'
                        : 'border-gray-700 opacity-70'
                    }`}
                    onClick={() => setSelectedGuide(isExpanded ? null : guide)}
                  >
                    {/* Guide Summary */}
                    <div className={`p-3 ${isExpanded ? 'bg-indigo-900/40' : 'bg-stone-900/60'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{guide.emoji}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-indigo-200 font-bold">{guide.name}</h3>
                              <p className="text-indigo-400 text-xs">{guide.title}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${affordable ? 'text-yellow-300' : 'text-red-400'}`}>
                                {guide.hireCost}🌮
                              </p>
                              {guide.goodKarmaCost && (
                                <p className="text-amber-400 text-xs">+{guide.goodKarmaCost}🍪</p>
                              )}
                              <p className="text-gray-500 text-xs">{guide.duration} landmarks</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="bg-stone-900/80 p-3 border-t border-indigo-800">
                        <p className="text-indigo-300 text-sm mb-3">{guide.description}</p>

                        {/* Benefits */}
                        <div className="space-y-1.5 mb-3">
                          <p className="text-indigo-400 text-xs font-bold">Benefits:</p>
                          {guide.benefits.map((benefit, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-green-400 text-xs">+</span>
                              <span className="text-green-300 text-xs">{benefit.description}</span>
                            </div>
                          ))}
                        </div>

                        {/* Special Event */}
                        {guide.specialEvent && (
                          <p className="text-purple-400 text-xs italic mb-3">
                            * May trigger a unique event during travel
                          </p>
                        )}

                        {/* Hire Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (canHire) handleHire(guide)
                          }}
                          disabled={!canHire}
                          className={`w-full py-3 md:py-2 rounded font-bold text-base md:text-sm active:scale-[0.99] ${
                            canHire
                              ? 'bg-indigo-700 text-indigo-100 hover:bg-indigo-600'
                              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {currentGuide
                            ? 'Already traveling with a guide'
                            : affordable
                              ? `Hire ${guide.name} (${guide.hireCost}🌮${guide.goodKarmaCost ? ` + ${guide.goodKarmaCost}🍪` : ''})`
                              : 'Cannot afford'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-indigo-700 p-4">
          {message && (
            <p className="text-indigo-200 text-sm mb-3 text-center">{message}</p>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 md:py-2 bg-indigo-900/60 border border-indigo-600 text-indigo-200 rounded font-bold text-base md:text-sm hover:bg-indigo-800/60 active:scale-[0.99]"
          >
            Close
          </button>
        </div>
      </div>

      {/* Karma Convert Modal */}
      {showConvertModal && convertModalContext && (
        <KarmaConvertModal
          isOpen={showConvertModal}
          onClose={() => {
            setShowConvertModal(false)
            setConvertModalContext(null)
          }}
          neededAmount={convertModalContext.needed}
          karmaType={convertModalContext.karmaType === 'good' ? 'good' : 'neutral'}
        />
      )}
    </div>
  )
}

export default GuideHire
