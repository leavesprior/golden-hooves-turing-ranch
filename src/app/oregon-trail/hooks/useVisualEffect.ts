'use client'

import { useCallback, useRef } from 'react'
import { VISUAL_EFFECTS } from '../data/visualEffects'

export function useVisualEffect() {
  const activeTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const trigger = useCallback((ref: React.RefObject<HTMLElement | null>, effectId: string) => {
    const effect = VISUAL_EFFECTS[effectId]
    if (!effect || !ref.current) return

    const el = ref.current
    const classes = effect.cssClass.split(' ')
    el.classList.add(...classes)

    // Clear any existing timer for this element+effect
    const key = `${effectId}-${el.dataset.vfxId || ''}`
    const existing = activeTimers.current.get(key)
    if (existing) clearTimeout(existing)

    if (effect.duration > 0) {
      const timer = setTimeout(() => {
        el.classList.remove(...classes)
        activeTimers.current.delete(key)
      }, effect.duration)
      activeTimers.current.set(key, timer)
    }
  }, [])

  return { trigger }
}
