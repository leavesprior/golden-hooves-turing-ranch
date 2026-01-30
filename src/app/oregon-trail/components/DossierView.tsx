'use client'

import React, { useState, useMemo } from 'react'
import {
  OUTLAWS,
  type Outlaw,
  type OutlawTraits,
  TRAIT_DISPLAY_NAMES,
  TRAIT_VALUE_DISPLAY
} from '../data/outlaws'
import { useMystery } from '../mysteryContext'

// =============================================================================
// GOLD RUSH SEPIA PALETTE
// =============================================================================
// Primary gold:     #d4a843
// Dark gold:        #8b6914
// Deep brown bg:    #2a1f14
// Medium brown:     #3d2b18
// Muted gold:       #a08050
// Dark accent:      #6a5030
// Darkest accent:   #5a4020

interface DossierViewProps {
  onClose: () => void
  showCapturedOnly?: boolean
}

export function DossierView({ onClose, showCapturedOnly = false }: DossierViewProps) {
  const { state: mysteryState, getOutlawStatus, getNarrowedDown } = useMystery()
  const [selectedOutlaw, setSelectedOutlaw] = useState<Outlaw | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'suspects' | 'cleared' | 'captured'>('all')

  const { possible, eliminated } = getNarrowedDown()

  const knownTraitCount = Object.keys(mysteryState.knownTraits).length
  const totalTraits = 7
  const narrowProgress = knownTraitCount / totalTraits

  // ---------------------------------------------------------------------------
  // Filtered outlaws via useMemo
  // ---------------------------------------------------------------------------
  const filteredOutlaws = useMemo((): Outlaw[] => {
    if (showCapturedOnly) {
      return OUTLAWS.filter(o => getOutlawStatus(o.id)?.captured)
    }

    switch (filterMode) {
      case 'suspects':
        return possible
      case 'cleared':
        return eliminated
      case 'captured':
        return OUTLAWS.filter(o => getOutlawStatus(o.id)?.captured)
      default:
        return OUTLAWS
    }
  }, [showCapturedOnly, filterMode, possible, eliminated, getOutlawStatus])

  // ---------------------------------------------------------------------------
  // Trait helpers
  // ---------------------------------------------------------------------------
  const isTraitKnown = (trait: keyof OutlawTraits): boolean => {
    return trait in mysteryState.knownTraits
  }

  const doesTraitMatch = (outlaw: Outlaw, trait: keyof OutlawTraits): boolean | null => {
    if (!isTraitKnown(trait)) return null
    return outlaw.traits[trait] === mysteryState.knownTraits[trait]
  }

  // ---------------------------------------------------------------------------
  // Status helpers
  // ---------------------------------------------------------------------------
  const isCaptured = (outlaw: Outlaw) => !!getOutlawStatus(outlaw.id)?.captured
  const isEscaped = (outlaw: Outlaw) => !!getOutlawStatus(outlaw.id)?.escaped
  const isSuspect = (outlaw: Outlaw) => possible.some(p => p.id === outlaw.id)
  const isEliminated = (outlaw: Outlaw) => eliminated.some(e => e.id === outlaw.id)

  // ---------------------------------------------------------------------------
  // Filter tab definitions
  // ---------------------------------------------------------------------------
  const capturedCount = OUTLAWS.filter(o => getOutlawStatus(o.id)?.captured).length
  const filterTabs: { key: typeof filterMode; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: OUTLAWS.length },
    { key: 'suspects', label: 'Suspects', count: possible.length },
    { key: 'cleared', label: 'Cleared', count: eliminated.length },
    { key: 'captured', label: 'Captured', count: capturedCount },
  ]

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>

      {/* ---- Outer poster frame ---- */}
      <div
        className="w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col rounded-sm"
        style={{
          backgroundColor: '#2a1f14',
          border: '4px double #d4a843',
          boxShadow: '0 0 40px rgba(212,168,67,0.25), inset 0 0 60px rgba(0,0,0,0.5)',
        }}
      >

        {/* ================================================================= */}
        {/* HEADER: WANTED - DEAD OR ALIVE                                    */}
        {/* ================================================================= */}
        <div
          className="flex flex-col items-center py-3 px-4 relative select-none"
          style={{
            backgroundColor: '#3d2b18',
            borderBottom: '3px solid #d4a843',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)',
          }}
        >
          {/* Decorative rule */}
          <div className="w-full flex items-center gap-3 mb-1">
            <div className="flex-1 h-px" style={{ backgroundColor: '#8b6914' }} />
            <span className="text-xs tracking-[0.3em] uppercase" style={{ color: '#a08050' }}>
              Pinkerton National Detective Agency
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#8b6914' }} />
          </div>

          {/* WANTED */}
          <h1
            className="text-3xl md:text-4xl font-black tracking-[0.15em] uppercase"
            style={{
              color: '#d4a843',
              textShadow: '2px 2px 0 #5a4020, 0 0 10px rgba(212,168,67,0.3)',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            WANTED &mdash; DEAD OR ALIVE
          </h1>

          {/* Subtitle */}
          <p
            className="text-sm tracking-[0.2em] uppercase mt-0.5"
            style={{ color: '#a08050', fontFamily: 'Georgia, serif' }}
          >
            Black Bart&apos;s Gang &mdash; Pinkerton Case Files
          </p>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 px-3 py-1 text-sm rounded transition-colors"
            style={{
              backgroundColor: '#5a4020',
              color: '#d4a843',
              border: '1px solid #8b6914',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6a5030'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5a4020'
            }}
          >
            Close
          </button>
        </div>

        {/* ================================================================= */}
        {/* INVESTIGATION PROGRESS BAR                                        */}
        {/* ================================================================= */}
        <div className="px-4 py-2 flex items-center gap-4" style={{ backgroundColor: '#3d2b18', borderBottom: '1px solid #5a4020' }}>
          {/* Progress bar */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#a08050' }}>
                Investigation Progress
              </span>
              <span className="text-xs" style={{ color: '#d4a843' }}>
                {knownTraitCount} / {totalTraits} traits identified
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#2a1f14', border: '1px solid #5a4020' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${narrowProgress * 100}%`,
                  background: `linear-gradient(90deg, #8b6914, #d4a843)`,
                  boxShadow: narrowProgress > 0 ? '0 0 6px rgba(212,168,67,0.5)' : 'none',
                }}
              />
            </div>
          </div>

          {/* Suspects remaining */}
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold" style={{ color: '#d4a843' }}>{possible.length}</div>
            <div className="text-xs uppercase tracking-wider" style={{ color: '#a08050' }}>
              Suspects
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* FILTER TABS                                                       */}
        {/* ================================================================= */}
        {!showCapturedOnly && (
          <div className="flex gap-1 px-4 py-2" style={{ backgroundColor: '#2a1f14', borderBottom: '1px solid #5a4020' }}>
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterMode(tab.key)}
                className="px-3 py-1 text-xs rounded uppercase tracking-wider transition-colors"
                style={{
                  backgroundColor: filterMode === tab.key ? '#d4a843' : '#3d2b18',
                  color: filterMode === tab.key ? '#2a1f14' : '#a08050',
                  border: `1px solid ${filterMode === tab.key ? '#d4a843' : '#5a4020'}`,
                  fontWeight: filterMode === tab.key ? 700 : 400,
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        )}

        {/* ================================================================= */}
        {/* MAIN CONTENT: List + Detail                                       */}
        {/* ================================================================= */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

          {/* -------------------------------------------------------------- */}
          {/* LEFT: Outlaw roster                                             */}
          {/* -------------------------------------------------------------- */}
          <div
            className="w-1/3 overflow-y-auto"
            style={{
              borderRight: '2px solid #5a4020',
              backgroundColor: '#2a1f14',
            }}
          >
            {filteredOutlaws.map(outlaw => {
              const captured = isCaptured(outlaw)
              const escaped = isEscaped(outlaw)
              const suspect = isSuspect(outlaw)
              const cleared = isEliminated(outlaw) && !captured && !escaped
              const selected = selectedOutlaw?.id === outlaw.id

              return (
                <button
                  key={outlaw.id}
                  onClick={() => setSelectedOutlaw(outlaw)}
                  className="w-full text-left transition-colors relative"
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid #3d2b18',
                    backgroundColor: selected ? '#3d2b18' : 'transparent',
                    opacity: cleared ? 0.55 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3d2b18'
                  }}
                  onMouseLeave={e => {
                    if (!selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                  }}
                >
                  {/* Red X overlay for eliminated */}
                  {cleared && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ zIndex: 2 }}
                    >
                      <span
                        className="text-5xl font-black select-none"
                        style={{
                          color: 'rgba(200, 40, 40, 0.45)',
                          textShadow: '0 0 8px rgba(200,40,40,0.2)',
                          transform: 'rotate(-12deg)',
                          fontFamily: 'Impact, sans-serif',
                        }}
                      >
                        X
                      </span>
                    </div>
                  )}

                  {/* Green CAPTURED stamp */}
                  {captured && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ zIndex: 2 }}
                    >
                      <span
                        className="text-lg font-black uppercase tracking-wider select-none"
                        style={{
                          color: 'rgba(34, 197, 94, 0.7)',
                          border: '3px solid rgba(34, 197, 94, 0.5)',
                          borderRadius: '4px',
                          padding: '2px 12px',
                          transform: 'rotate(-8deg)',
                          fontFamily: 'Impact, sans-serif',
                          textShadow: '0 0 8px rgba(34,197,94,0.3)',
                        }}
                      >
                        CAPTURED
                      </span>
                    </div>
                  )}

                  {/* ESCAPED stamp */}
                  {escaped && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ zIndex: 2 }}
                    >
                      <span
                        className="text-lg font-black uppercase tracking-wider select-none"
                        style={{
                          color: 'rgba(239, 68, 68, 0.7)',
                          border: '3px solid rgba(239, 68, 68, 0.5)',
                          borderRadius: '4px',
                          padding: '2px 12px',
                          transform: 'rotate(6deg)',
                          fontFamily: 'Impact, sans-serif',
                          textShadow: '0 0 8px rgba(239,68,68,0.3)',
                        }}
                      >
                        ESCAPED
                      </span>
                    </div>
                  )}

                  {/* Card content */}
                  <div className="relative" style={{ zIndex: 1 }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#d4a843', fontFamily: 'Georgia, serif' }}>
                          {outlaw.alias}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#6a5030' }}>
                          {outlaw.realName}
                        </p>
                      </div>

                      {/* Status badges */}
                      <div className="flex-shrink-0 ml-2">
                        {captured && (
                          <span className="px-2 py-0.5 text-xs rounded font-bold"
                            style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                            CAPTURED
                          </span>
                        )}
                        {escaped && (
                          <span className="px-2 py-0.5 text-xs rounded font-bold"
                            style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                            ESCAPED
                          </span>
                        )}
                        {suspect && !captured && !escaped && (
                          <span
                            className="px-2 py-0.5 text-xs rounded font-bold"
                            style={{
                              backgroundColor: 'rgba(212,168,67,0.15)',
                              color: '#d4a843',
                              border: '1px solid rgba(212,168,67,0.3)',
                              animation: 'suspectPulse 2s ease-in-out infinite',
                            }}
                          >
                            SUSPECT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bounty */}
                    <p className="text-xs mt-1 font-bold" style={{ color: '#8b6914' }}>
                      ${outlaw.bounty.toLocaleString()} BOUNTY
                    </p>
                  </div>
                </button>
              )
            })}

            {filteredOutlaws.length === 0 && (
              <p className="p-6 text-center text-sm" style={{ color: '#6a5030' }}>
                No outlaws match this filter.
              </p>
            )}
          </div>

          {/* -------------------------------------------------------------- */}
          {/* RIGHT: Wanted poster detail view                                */}
          {/* -------------------------------------------------------------- */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              backgroundColor: '#2a1f14',
              backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(212,168,67,0.04) 0%, transparent 70%)',
            }}
          >
            {selectedOutlaw ? (
              <div className="p-5 space-y-5">

                {/* --- Name / Bounty header --- */}
                <div
                  className="pb-4 relative"
                  style={{ borderBottom: '2px solid #5a4020' }}
                >
                  {/* Captured / Escaped overlay on detail */}
                  {isCaptured(selectedOutlaw) && (
                    <div className="absolute top-0 right-0" style={{ zIndex: 2 }}>
                      <span
                        className="text-2xl font-black uppercase tracking-wider select-none block"
                        style={{
                          color: 'rgba(34, 197, 94, 0.6)',
                          border: '4px solid rgba(34, 197, 94, 0.4)',
                          borderRadius: '6px',
                          padding: '4px 18px',
                          transform: 'rotate(-6deg)',
                          fontFamily: 'Impact, sans-serif',
                        }}
                      >
                        CAPTURED
                      </span>
                    </div>
                  )}
                  {isEscaped(selectedOutlaw) && (
                    <div className="absolute top-0 right-0" style={{ zIndex: 2 }}>
                      <span
                        className="text-2xl font-black uppercase tracking-wider select-none block"
                        style={{
                          color: 'rgba(239, 68, 68, 0.6)',
                          border: '4px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '6px',
                          padding: '4px 18px',
                          transform: 'rotate(5deg)',
                          fontFamily: 'Impact, sans-serif',
                        }}
                      >
                        ESCAPED
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div>
                      <h3
                        className="text-2xl md:text-3xl font-bold uppercase tracking-wide"
                        style={{
                          color: '#d4a843',
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          textShadow: '1px 1px 0 #5a4020',
                        }}
                      >
                        {selectedOutlaw.alias}
                      </h3>
                      <p className="text-sm mt-0.5" style={{ color: '#a08050' }}>
                        AKA: {selectedOutlaw.realName}
                      </p>
                    </div>

                    {/* Bounty display */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <div
                        className="inline-block px-4 py-2 rounded"
                        style={{
                          backgroundColor: '#3d2b18',
                          border: '2px solid #8b6914',
                          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.3)',
                        }}
                      >
                        <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: '#a08050' }}>
                          Reward
                        </p>
                        <p
                          className="text-2xl font-black"
                          style={{
                            color: '#d4a843',
                            fontFamily: 'Georgia, serif',
                            textShadow: '0 0 8px rgba(212,168,67,0.3)',
                          }}
                        >
                          ${selectedOutlaw.bounty.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* GANG LEADER badge */}
                  {selectedOutlaw.isLeader && (
                    <div className="mt-2 inline-block">
                      <span
                        className="px-3 py-1 text-xs font-black uppercase tracking-widest rounded"
                        style={{
                          backgroundColor: 'rgba(200,40,40,0.2)',
                          color: '#ef4444',
                          border: '2px solid rgba(239,68,68,0.4)',
                          letterSpacing: '0.15em',
                        }}
                      >
                        GANG LEADER
                      </span>
                    </div>
                  )}
                </div>

                {/* --- CRIMINAL HISTORY (description + backstory) --- */}
                <div>
                  <h4
                    className="text-xs font-bold uppercase tracking-[0.2em] mb-2"
                    style={{ color: '#8b6914', fontFamily: 'Georgia, serif' }}
                  >
                    Criminal History
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#a08050' }}>
                    {selectedOutlaw.description}
                  </p>
                  <p className="text-sm leading-relaxed mt-2" style={{ color: '#6a5030' }}>
                    {selectedOutlaw.backstory}
                  </p>
                </div>

                {/* --- KNOWN SAYING --- */}
                <div
                  className="py-3 px-4 rounded"
                  style={{
                    backgroundColor: '#3d2b18',
                    borderLeft: '3px solid #8b6914',
                  }}
                >
                  <h4
                    className="text-xs font-bold uppercase tracking-[0.2em] mb-1"
                    style={{ color: '#8b6914', fontFamily: 'Georgia, serif' }}
                  >
                    Known Saying
                  </h4>
                  <p
                    className="italic text-sm"
                    style={{ color: '#d4a843', fontFamily: 'Georgia, serif' }}
                  >
                    &ldquo;{selectedOutlaw.catchphrase}&rdquo;
                  </p>
                </div>

                {/* --- IDENTIFYING CHARACTERISTICS --- */}
                <div>
                  <h4
                    className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
                    style={{ color: '#8b6914', fontFamily: 'Georgia, serif' }}
                  >
                    Identifying Characteristics
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(selectedOutlaw.traits) as Array<keyof OutlawTraits>).map(trait => {
                      const match = doesTraitMatch(selectedOutlaw, trait)
                      const value = selectedOutlaw.traits[trait]

                      // Colors: emerald for match, red for mismatch, neutral otherwise
                      let borderColor = '#5a4020'
                      let bgColor = 'rgba(61,43,24,0.5)'
                      let valueColor = '#a08050'
                      let matchIndicatorColor = ''

                      if (match === true) {
                        borderColor = '#059669'  // emerald-600
                        bgColor = 'rgba(5,150,105,0.12)'
                        valueColor = '#34d399'    // emerald-400
                        matchIndicatorColor = '#34d399'
                      } else if (match === false) {
                        borderColor = '#dc2626'  // red-600
                        bgColor = 'rgba(220,38,38,0.10)'
                        valueColor = '#f87171'    // red-400
                        matchIndicatorColor = '#f87171'
                      }

                      return (
                        <div
                          key={trait}
                          className="p-2 rounded"
                          style={{
                            border: `1px solid ${borderColor}`,
                            backgroundColor: bgColor,
                          }}
                        >
                          <p className="text-xs uppercase tracking-wider" style={{ color: '#6a5030' }}>
                            {TRAIT_DISPLAY_NAMES[trait]}
                          </p>
                          <p
                            className="text-sm font-medium mt-0.5"
                            style={{
                              color: valueColor,
                              textDecoration: match === false ? 'line-through' : 'none',
                            }}
                          >
                            {TRAIT_VALUE_DISPLAY[value] || value}
                          </p>
                          {match !== null && (
                            <span className="text-xs block mt-0.5" style={{ color: matchIndicatorColor }}>
                              {match ? '\u2713 Matches Evidence' : '\u2717 Does Not Match'}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* --- KNOWN CRIMES --- */}
                <div>
                  <h4
                    className="text-xs font-bold uppercase tracking-[0.2em] mb-2"
                    style={{ color: '#8b6914', fontFamily: 'Georgia, serif' }}
                  >
                    Known Crimes
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOutlaw.preferredCrimes.map(crime => (
                      <span
                        key={crime}
                        className="px-2 py-1 text-xs rounded uppercase tracking-wide"
                        style={{
                          backgroundColor: '#3d2b18',
                          color: '#a08050',
                          border: '1px solid #5a4020',
                        }}
                      >
                        {crime.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center px-4">
                <p
                  className="text-lg uppercase tracking-wider"
                  style={{ color: '#5a4020', fontFamily: 'Georgia, serif' }}
                >
                  Select an outlaw to view their dossier
                </p>
                <p className="text-xs mt-2" style={{ color: '#3d2b18' }}>
                  Evidence files maintained by the Pinkerton Agency
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* EVIDENCE BOARD FOOTER                                             */}
        {/* ================================================================= */}
        {knownTraitCount > 0 && (
          <div
            className="px-4 py-3"
            style={{
              backgroundColor: '#3d2b18',
              borderTop: '3px solid #d4a843',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#d4a843' }} />
              <p
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: '#d4a843', fontFamily: 'Georgia, serif' }}
              >
                Evidence Board &mdash; Known Traits
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(mysteryState.knownTraits) as Array<[keyof OutlawTraits, string]>).map(
                ([trait, value]) => (
                  <span
                    key={trait}
                    className="px-2 py-1 text-xs rounded inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: 'rgba(212,168,67,0.12)',
                      color: '#d4a843',
                      border: '1px solid rgba(212,168,67,0.3)',
                    }}
                  >
                    <span className="font-bold" style={{ color: '#8b6914' }}>
                      {TRAIT_DISPLAY_NAMES[trait]}:
                    </span>
                    {TRAIT_VALUE_DISPLAY[value] || value}
                  </span>
                )
              )}
            </div>
          </div>
        )}

      </div>

      {/* ================================================================= */}
      {/* KEYFRAME ANIMATION for SUSPECT pulse                              */}
      {/* ================================================================= */}
      <style jsx>{`
        @keyframes suspectPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default DossierView
