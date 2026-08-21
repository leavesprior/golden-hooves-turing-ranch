'use client'

import { useEffect, useState } from 'react'

/**
 * When the Next dev server dies mid-run the tab keeps a dead RSC shell and
 * paints white (no GameErrorBoundary — React never mounted). After a short
 * wait, offer a reload instead of a blank page.
 */
export function HydrationWatch() {
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      const text = (document.body?.innerText || '').replace(/\s+/g, ' ').trim()
      if (text.length < 40) setStuck(true)
    }, 12000)
    return () => window.clearTimeout(t)
  }, [])

  if (!stuck) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0e0c0a',
        color: '#e8dcc4',
        fontFamily: 'Georgia, serif',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 22, marginBottom: 8 }}>The wagon lost the road.</p>
      <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 20, maxWidth: 360 }}>
        The trail page never finished loading. Reload to pick up the last save.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          background: 'transparent',
          color: '#e8dcc4',
          border: '1px solid #e8dcc4',
          borderRadius: 999,
          padding: '8px 20px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Reload the trail
      </button>
    </div>
  )
}
