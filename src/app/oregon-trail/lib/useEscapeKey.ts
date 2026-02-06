'use client'

import { useEffect } from 'react'

export function useEscapeKey(onEscape: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onEscape])
}
