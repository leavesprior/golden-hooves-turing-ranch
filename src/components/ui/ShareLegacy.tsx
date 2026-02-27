'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { CrossGameStorage } from '@/lib/crossGameProgression'
import { playSFX } from '@/app/oregon-trail/lib/audioManager'

// ============================================
// TWAIN ROAST SELECTION
// ============================================

interface LegacySummary {
  totalEvents: number
  modesPlayed: string[]
  karmaBalance: { good: number; neutral: number; bad: number; totalEarned: number }
  discoveries: number
  confrontationsWon: number
  mysteriesSolved: number
  alliesRecruited: number
}

function selectTwainRoast(summary: LegacySummary): string {
  // Heavy combat
  if (summary.confrontationsWon >= 5) {
    return 'I have seen less violent quilting bees than your adventures through Gold Country.'
  }
  // High discovery
  if (summary.discoveries >= 8) {
    return 'You have found more hidden places than a California land speculator, and that is saying something.'
  }
  // High karma (good)
  if (summary.karmaBalance.good > summary.karmaBalance.bad + 10) {
    return 'A noble soul in a lawless land. The narrator finds this suspicious.'
  }
  // Low karma (evil)
  if (summary.karmaBalance.bad > summary.karmaBalance.good + 5) {
    return "Your moral compass doesn't point north. It doesn't point at all. The narrator approves."
  }
  // Many modes played
  if (summary.modesPlayed.length >= 4) {
    return "You've touched every corner of this world. The narrator is both impressed and slightly concerned."
  }
  // Few events
  if (summary.totalEvents < 10) {
    return 'Your legacy is... developing. The narrator shall check back in a few chapters.'
  }
  // Default
  return 'Another soul wandering Gold Country. The narrator has seen many. Most don\'t last.'
}

function selectShortTwainQuote(summary: LegacySummary): string {
  if (summary.confrontationsWon >= 5) return 'Less violent quilting bees exist.'
  if (summary.discoveries >= 8) return 'A land speculator would be jealous.'
  if (summary.karmaBalance.good > summary.karmaBalance.bad + 10) return 'Suspiciously noble.'
  if (summary.karmaBalance.bad > summary.karmaBalance.good + 5) return 'The narrator approves.'
  if (summary.modesPlayed.length >= 4) return 'Slightly concerning dedication.'
  return 'The narrator is watching.'
}

// ============================================
// KARMA SCORE (normalized 0-9)
// ============================================

function computeKarmaScore(karma: { good: number; bad: number }): number {
  const net = karma.good - karma.bad
  // Clamp to 0-9 scale
  return Math.max(0, Math.min(9, Math.round((net + 50) / 100 * 9)))
}

// ============================================
// STAT BAR RENDERER (inline for canvas capture)
// ============================================

function renderStatBar(value: number, maxWidth: number): string {
  // value is 0-100, render as block chars
  const filled = Math.round((value / 100) * maxWidth)
  const empty = maxWidth - filled
  return '\u2588'.repeat(filled) + '\u2591'.repeat(empty)
}

// ============================================
// SHARE LEGACY COMPONENT
// ============================================

export function ShareLegacy() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [capturing, setCapturing] = useState(false)

  // SSR guard
  useEffect(() => {
    if (typeof window === 'undefined') return
    const log = CrossGameStorage.getEventLog()
    setVisible(log.length >= 3)

    // Listen for storage changes (cross-tab)
    const handler = () => {
      const updated = CrossGameStorage.getEventLog()
      setVisible(updated.length >= 3)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const handleShare = useCallback(async () => {
    if (!cardRef.current || capturing) return
    setCapturing(true)

    try {
      playSFX('success')
    } catch {
      // Audio may not be initialized
    }

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const summary = CrossGameStorage.getLegacySummary()
      const karma = CrossGameStorage.loadSharedKarma()
      const karmaScore = computeKarmaScore(karma)
      const tacoCount = karma.totalEarned.toLocaleString()
      const shortQuote = selectShortTwainQuote(summary)

      const tweetText = `My 1849 Gold Country legacy: ${tacoCount} tacos, karma ${karmaScore}/9. ${shortQuote} #BOBR #GoldRush1849 backofbeyondranch.farm`

      // Try Web Share API first (mobile)
      if (navigator.share && navigator.canShare) {
        try {
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => {
              if (b) resolve(b)
              else reject(new Error('Canvas to blob failed'))
            }, 'image/png')
          })
          const file = new File([blob], 'bobr-legacy.png', { type: 'image/png' })
          const shareData = { text: tweetText, files: [file] }
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData)
            setCapturing(false)
            return
          }
        } catch {
          // Fall through to X intent
        }
      }

      // Fallback: open X/Twitter share intent (image as download + tweet text)
      // Download the image first
      const link = document.createElement('a')
      link.download = 'bobr-legacy.png'
      link.href = canvas.toDataURL('image/png')
      link.click()

      // Open Twitter intent
      const encodedText = encodeURIComponent(tweetText)
      window.open(
        `https://twitter.com/intent/tweet?text=${encodedText}`,
        '_blank',
        'noopener,noreferrer'
      )
    } catch (err) {
      console.error('ShareLegacy capture failed:', err)
    } finally {
      setCapturing(false)
    }
  }, [capturing])

  // Don't render anything on server or if not enough events
  if (typeof window === 'undefined') return null

  const summary = CrossGameStorage.getLegacySummary()
  const karma = CrossGameStorage.loadSharedKarma()
  const qualities = CrossGameStorage.load()?.characterQualities || {
    investigation: 50, survival: 50, social: 50, combat: 50, resilience: 50, fortune: 50,
  }
  const karmaScore = computeKarmaScore(karma)
  const twainRoast = selectTwainRoast(summary)
  const totalModes = 9 // Total available game modes

  return (
    <>
      {/* Off-screen card for html2canvas capture */}
      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '0px',
          width: '600px',
          height: '315px',
          backgroundColor: '#0a0a0a',
          border: '2px solid #d97706',
          fontFamily: 'monospace',
          overflow: 'hidden',
          boxSizing: 'border-box',
          padding: '0',
        }}
      >
        {/* CRT green tint overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.04) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          zIndex: 10,
        }} />

        {/* Scanline effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          pointerEvents: 'none',
          zIndex: 11,
        }} />

        {/* Header */}
        <div style={{
          backgroundColor: '#1a1a0a',
          borderBottom: '1px solid #d97706',
          padding: '6px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: '#fde68a', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}>
            MY 1849 LEGACY
          </span>
          <span style={{ color: '#92400e', fontSize: '10px', fontFamily: 'monospace' }}>
            BACK OF BEYOND RANCH
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '8px 16px', position: 'relative', zIndex: 1 }}>
          {/* Karma bar + Taco count row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#fbbf24', fontSize: '11px', fontFamily: 'monospace' }}>KARMA:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', letterSpacing: '1px' }}>
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} style={{ color: i < karmaScore ? '#d97706' : '#374151' }}>
                    {'\u2588'}
                  </span>
                ))}
              </span>
              <span style={{ color: '#fbbf24', fontSize: '11px', fontFamily: 'monospace' }}>
                {karmaScore}/9
              </span>
            </div>
            <div style={{ color: '#fbbf24', fontSize: '11px', fontFamily: 'monospace' }}>
              {'\uD83C\uDF2E'} TACOS: {karma.totalEarned.toLocaleString()}
            </div>
          </div>

          {/* SADDLE Stats */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ color: '#fde68a', fontSize: '10px', fontFamily: 'monospace', marginBottom: '3px' }}>
              {'\uD83D\uDCCA'} SADDLE STATS
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontFamily: 'monospace', fontSize: '10px' }}>
              <span style={{ color: '#fbbf24' }}>
                S:{renderStatBar(qualities.investigation, 4)}
              </span>
              <span style={{ color: '#fbbf24' }}>
                A:{renderStatBar(qualities.combat, 4)}
              </span>
              <span style={{ color: '#fbbf24' }}>
                D:{renderStatBar(qualities.resilience, 4)}
              </span>
              <span style={{ color: '#fbbf24' }}>
                D:{renderStatBar(qualities.social, 4)}
              </span>
              <span style={{ color: '#fbbf24' }}>
                L:{renderStatBar(qualities.fortune, 4)}
              </span>
              <span style={{ color: '#fbbf24' }}>
                E:{renderStatBar(qualities.survival, 4)}
              </span>
            </div>
          </div>

          {/* Legacy stats */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ color: '#fde68a', fontSize: '10px', fontFamily: 'monospace', marginBottom: '3px' }}>
              {'\uD83C\uDFC6'} LEGACY
            </div>
            <div style={{ color: '#fbbf24', fontSize: '10px', fontFamily: 'monospace', lineHeight: '1.5' }}>
              Modes: {summary.modesPlayed.length}/{totalModes}{'  '}
              Discoveries: {summary.discoveries}{'  '}
              Battles Won: {summary.confrontationsWon}
              <br />
              Mysteries: {summary.mysteriesSolved}{'  '}
              Allies: {summary.alliesRecruited}
            </div>
          </div>

          {/* Twain roast */}
          <div style={{
            marginBottom: '6px',
            padding: '6px 8px',
            borderLeft: '2px solid #92400e',
            backgroundColor: 'rgba(120,53,15,0.15)',
          }}>
            <div style={{
              color: '#d4a574',
              fontSize: '10px',
              fontFamily: 'monospace',
              fontStyle: 'italic',
              lineHeight: '1.4',
            }}>
              &quot;{twainRoast}&quot;
            </div>
            <div style={{ color: '#92400e', fontSize: '9px', fontFamily: 'monospace', marginTop: '2px' }}>
              {'\u2014'} Mark Twain, Unreliable Narrator
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #374151',
            paddingTop: '4px',
          }}>
            <span style={{ color: '#92400e', fontSize: '10px', fontFamily: 'monospace' }}>
              backofbeyondranch.farm
            </span>
            <span style={{ color: '#92400e', fontSize: '10px', fontFamily: 'monospace' }}>
              #BOBR #GoldRush1849
            </span>
          </div>
        </div>
      </div>

      {/* Floating share button */}
      {visible && (
        <button
          onClick={handleShare}
          disabled={capturing}
          className="fixed bottom-20 right-4 z-50 animate-slide-in-up"
          style={{
            background: 'linear-gradient(180deg, #78350f 0%, #451a03 100%)',
            border: '2px solid #d97706',
            color: '#fde68a',
            padding: '8px 14px',
            cursor: capturing ? 'wait' : 'pointer',
            opacity: capturing ? 0.6 : 1,
            transition: 'opacity 0.2s, transform 0.2s',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
          }}
        >
          <span className="font-pixel text-xs">
            {capturing ? '[CAPTURING...]' : '[SHARE LEGACY]'}
          </span>
        </button>
      )}
    </>
  )
}

export default ShareLegacy
