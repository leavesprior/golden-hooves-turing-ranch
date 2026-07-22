'use client'

import React, { useState } from 'react'
import {
  type OutlawTraits,
  TRAIT_OPTIONS,
  TRAIT_DISPLAY_NAMES,
  TRAIT_VALUE_DISPLAY,
  findOutlawsByTraits
} from '../data/outlaws'
import { useMystery } from '../mysteryContext'
import { useReputation } from '../reputationContext'
import { useNarrator } from '../narratorContext'

interface TelegraphOfficeProps {
  onClose: () => void
  onWarrantIssued: (success: boolean, bounty: number, message: string) => void
}

export function TelegraphOffice({ onClose, onWarrantIssued }: TelegraphOfficeProps) {
  const { state: mysteryState, issueWarrant, executeWarrant, canIssueWarrant, getNarrowedDown } = useMystery()
  const { getReputation, modifyReputation } = useReputation()
  const { comment, setMood, lie } = useNarrator()

  const [selectedTraits, setSelectedTraits] = useState<Partial<OutlawTraits>>({
    ...mysteryState.knownTraits
  })
  const [showWarrantResult, setShowWarrantResult] = useState(false)
  const [warrantResult, setWarrantResult] = useState<{ success: boolean; message: string; bounty: number } | null>(null)
  const [showRecklessWarning, setShowRecklessWarning] = useState(false)

  const pinkertonRep = getReputation('pinkerton')
  const canAccessTelegraph = pinkertonRep > -50

  // Get matching outlaws for current selection
  const matchingOutlaws = findOutlawsByTraits(selectedTraits)
  const { possible } = getNarrowedDown()

  // Traits the player is accusing on that are NOT backed by gathered evidence —
  // i.e. hunches. Accusing on hunches is the reckless path that risks jailing an
  // innocent (Leif 2026-07-21). A fully-evidenced warrant (no guessed traits) is
  // never treated as reckless and never trips the warning or the penalty gate.
  const guessedTraits = (Object.keys(selectedTraits) as (keyof OutlawTraits)[])
    .filter(t => mysteryState.knownTraits[t] !== selectedTraits[t])
  const isThinEvidence = guessedTraits.length > 0

  // Toggle a trait value
  const toggleTrait = (trait: keyof OutlawTraits, value: string) => {
    setSelectedTraits(prev => {
      if (prev[trait] === value) {
        // Remove the trait
        const { [trait]: _, ...rest } = prev
        return rest
      }
      // Set the trait
      return { ...prev, [trait]: value }
    })
  }

  // Issue the warrant
  const handleIssueWarrant = () => {
    if (Object.keys(selectedTraits).length === 0) {
      comment('The telegraph operator stares at you blankly. "You need to describe the suspect, detective."', 'observation')
      return
    }

    if (matchingOutlaws.length === 0) {
      comment('The operator frowns. "Nobody in our records matches that description."', 'observation')
      return
    }

    if (matchingOutlaws.length > 1) {
      comment(`The operator shakes their head. "That description matches ${matchingOutlaws.length} known outlaws. Need more specifics."`, 'observation')
      setMood('annoyed')
      return
    }

    // Thin evidence (accusing partly on unproven hunches) → warn first and make the
    // player own the risk. The wrongful-arrest penalty can only follow this explicit
    // acknowledgment; an honest, fully-evidenced warrant proceeds straight through.
    if (isThinEvidence) {
      setShowRecklessWarning(true)
      setMood('annoyed')
      return
    }

    proceedWithWarrant()
  }

  // The actual warrant issue + execution — called directly for a fully-evidenced
  // accusation, or from the warning after the player acknowledges acting on a hunch.
  const proceedWithWarrant = () => {
    setShowRecklessWarning(false)
    const warrant = issueWarrant(selectedTraits)

    if (warrant.valid) {
      // Execute immediately
      const result = executeWarrant()
      setWarrantResult(result)
      setShowWarrantResult(true)

      if (result.success) {
        setMood('impressed')
        modifyReputation('pinkerton', 15, 'Successful arrest with proper warrant')
        modifyReputation('settlers', 10, 'Brought an outlaw to justice')
        onWarrantIssued(true, result.bounty, result.message)
      } else {
        setMood('annoyed')
        modifyReputation('pinkerton', -10, 'Wrong warrant accusation')
        // Narrator might lie about why it failed
        if (Math.random() > 0.7) {
          lie(
            'The outlaw escaped due to bad weather.',
            'The outlaw escaped because you accused the wrong person.',
            2
          )
        }
        onWarrantIssued(false, 0, result.message)
      }
    }
  }

  // UI when telegraph is inaccessible
  if (!canAccessTelegraph) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border-2 border-red-600 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 text-xl mb-4">Telegraph Office</h2>
          <p className="text-gray-300 mb-4">
            The operator looks at you coldly. "The Pinkerton agency has revoked your telegraph privileges, detective.
            Your reputation precedes you."
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700"
          >
            Leave
          </button>
        </div>
      </div>
    )
  }

  // Reckless-accusation warning: the player is about to swear out a warrant using
  // traits they have NOT verified. Surface the suspect + exactly which details are
  // hunches, and make them own the risk before the warrant (and its wrongful-arrest
  // penalty) can proceed. (Leif 2026-07-21: warn → admit rashness → then penalty.)
  if (showRecklessWarning) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border-2 border-amber-600 rounded-lg p-6 max-w-md">
          <h2 className="text-amber-400 text-xl mb-3">Acting on a Hunch?</h2>
          <p className="text-gray-300 mb-3 text-sm">
            You&apos;re about to swear out a warrant on{' '}
            <span className="text-amber-300">{matchingOutlaws[0]?.alias || 'this suspect'}</span> — but{' '}
            {guessedTraits.length} of your identifying {guessedTraits.length === 1 ? 'details is a guess' : 'details are guesses'}, not something you&apos;ve proven:
          </p>
          <ul className="text-red-300 text-xs mb-3 list-disc list-inside space-y-0.5">
            {guessedTraits.map(t => (
              <li key={t}>
                {t}: {String(selectedTraits[t])} <span className="text-gray-500">(unverified)</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-400 text-xs mb-4">
            You&apos;ve actually gathered {Object.keys(mysteryState.knownTraits).length} trait
            {Object.keys(mysteryState.knownTraits).length === 1 ? '' : 's'} of hard evidence. Accuse the wrong person and
            you jail an innocent — that stains your conscience, not the outlaw&apos;s.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRecklessWarning(false)}
              className="flex-1 py-2 bg-emerald-800 text-emerald-100 rounded hover:bg-emerald-700 text-sm"
            >
              Keep investigating
            </button>
            <button
              onClick={proceedWithWarrant}
              className="flex-1 py-2 bg-red-800 text-red-100 rounded hover:bg-red-700 text-sm"
            >
              I&apos;m acting rashly — accuse anyway
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-amber-600 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-amber-600 flex justify-between items-center">
          <div>
            <h2 className="text-amber-300 text-xl">Telegraph Office - Warrant System</h2>
            <p className="text-gray-500 text-sm">Issue a warrant based on your evidence</p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-800 text-red-200 rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>

        {showWarrantResult && warrantResult ? (
          // Warrant Result Screen
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <div className={`text-center p-6 rounded-lg ${warrantResult.success ? 'bg-emerald-900/50' : 'bg-red-900/50'}`}>
              <h3 className={`text-2xl mb-4 ${warrantResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {warrantResult.success ? 'WARRANT EXECUTED!' : 'WARRANT FAILED!'}
              </h3>
              <p className="text-gray-300 mb-4">{warrantResult.message}</p>
              {warrantResult.success && (
                <p className="text-yellow-500 text-xl mb-4">Bounty: ${warrantResult.bounty}</p>
              )}
              <button
                onClick={onClose}
                className={`px-6 py-2 rounded ${
                  warrantResult.success
                    ? 'bg-emerald-700 text-emerald-100 hover:bg-emerald-600'
                    : 'bg-red-700 text-red-100 hover:bg-red-600'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          // Warrant Form
          <div className="flex-1 overflow-y-auto p-4">
            {/* Known Evidence */}
            <div className="mb-6 p-3 bg-gray-800 rounded">
              <h3 className="text-amber-400 text-sm mb-2">Evidence Gathered ({Object.keys(mysteryState.knownTraits).length} traits):</h3>
              {Object.keys(mysteryState.knownTraits).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(mysteryState.knownTraits) as Array<[keyof OutlawTraits, string]>).map(
                    ([trait, value]) => (
                      <span
                        key={trait}
                        className="px-2 py-1 bg-amber-900/50 text-amber-300 text-xs rounded"
                      >
                        {TRAIT_DISPLAY_NAMES[trait]}: {TRAIT_VALUE_DISPLAY[value] || value}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No evidence gathered yet. Investigate crime scenes and interview witnesses.</p>
              )}
            </div>

            {/* Trait Selection */}
            <div className="space-y-4">
              <h3 className="text-gray-300">Select traits for warrant:</h3>

              {(Object.keys(TRAIT_OPTIONS) as Array<keyof OutlawTraits>).map(trait => (
                <div key={trait} className="border border-gray-700 rounded p-3">
                  <h4 className="text-amber-400 text-sm mb-2">{TRAIT_DISPLAY_NAMES[trait]}</h4>
                  <div className="flex flex-wrap gap-1">
                    {TRAIT_OPTIONS[trait].map(value => {
                      const isSelected = selectedTraits[trait] === value
                      const isEvidence = mysteryState.knownTraits[trait] === value

                      return (
                        <button
                          key={value}
                          onClick={() => toggleTrait(trait, value)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            isSelected
                              ? 'bg-amber-600 text-black'
                              : isEvidence
                              ? 'bg-amber-900/50 text-amber-300 border border-amber-600'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {TRAIT_VALUE_DISPLAY[value] || value}
                          {isEvidence && !isSelected && ' *'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Match Status */}
            <div className="mt-6 p-4 border border-gray-700 rounded">
              <h3 className="text-gray-300 mb-2">Warrant Status:</h3>
              {Object.keys(selectedTraits).length === 0 ? (
                <p className="text-gray-500">Select traits to identify a suspect.</p>
              ) : matchingOutlaws.length === 0 ? (
                <p className="text-red-400">No known outlaws match this description.</p>
              ) : matchingOutlaws.length === 1 ? (
                <div className="text-emerald-400">
                  <p className="font-bold">POSITIVE IDENTIFICATION</p>
                  <p className="text-sm">Only one suspect matches: {matchingOutlaws[0].alias}</p>
                  <p className="text-yellow-500 text-sm">Bounty: ${matchingOutlaws[0].bounty}</p>
                </div>
              ) : (
                <div className="text-amber-400">
                  <p>{matchingOutlaws.length} suspects match this description.</p>
                  <p className="text-sm text-gray-500">Need more evidence to narrow down.</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {matchingOutlaws.map(o => (
                      <span key={o.id} className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">
                        {o.alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer with Issue Button */}
        {!showWarrantResult && (
          <div className="bg-gray-800 p-4 border-t border-amber-600">
            <div className="flex justify-between items-center">
              <p className="text-gray-500 text-sm">
                Wire cost: $0.50 | Pinkerton standing: {pinkertonRep > 0 ? '+' : ''}{pinkertonRep}
              </p>
              <button
                onClick={handleIssueWarrant}
                disabled={matchingOutlaws.length !== 1}
                className={`px-6 py-2 rounded font-bold ${
                  matchingOutlaws.length === 1
                    ? 'bg-amber-600 text-black hover:bg-amber-500'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {matchingOutlaws.length === 1
                  ? `ISSUE WARRANT FOR ${matchingOutlaws[0].alias.toUpperCase()}`
                  : 'INSUFFICIENT EVIDENCE'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TelegraphOffice
