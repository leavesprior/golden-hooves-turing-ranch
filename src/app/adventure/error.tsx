'use client'

import { useEffect } from 'react'
import { PixelButton, PixelCard } from '@/components/pixel'

// Route segment error boundary for /adventure/*. Without this, any render error
// in adventure/play silently blanks the page (the "doesn't remain up" symptom).
// Modeled on the existing GameErrorBoundary used by /oregon-trail.
export default function AdventureError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Adventure render crash:', error)
  }, [error])

  const message = error?.message || 'The adventure encountered an unexpected glitch.'
  const digest = error?.digest

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <PixelCard title="The Trail Slipped">
          <div className="space-y-4">
            <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
              Something tripped Tobias mid-step. Your progress is safe — it's stored on your device.
            </p>

            <div className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] p-3 mt-4">
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-fire-orange)] mb-2">
                Error detail (for the wrangler):
              </p>
              <p className="font-[var(--font-mono,monospace)] text-[10px] text-[var(--pixel-ui-text)] break-words">
                {message}
              </p>
              {digest ? (
                <p className="font-[var(--font-mono,monospace)] text-[9px] text-[var(--pixel-forest-light)] mt-2 opacity-70">
                  ref: {digest}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <PixelButton onClick={reset} variant="gold" size="md">
                Try Again
              </PixelButton>
              <PixelButton href="/game" variant="green" size="md">
                Back to Menu
              </PixelButton>
              <PixelButton href="/" variant="blue" size="sm">
                Home
              </PixelButton>
            </div>
          </div>
        </PixelCard>
      </div>
    </div>
  )
}
