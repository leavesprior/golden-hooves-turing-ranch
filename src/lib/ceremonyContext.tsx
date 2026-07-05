'use client'

// Ceremony channel — the "loud, named, immediate consequence" layer.
// Reference grounding (research/bobr_fun_references_20260703): Oregon Trail names
// what changed ("Sarah has died"), FNV toasts every rep shift with a flavor line and
// the world visibly reacts. This provider is the generic queue those toasts/overlays
// ride on. It deliberately mirrors the shape of KarmaProvider (queue + auto-dismiss)
// so the codebase keeps one notification grammar, not two.

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface CeremonyRepChange {
  faction: string
  name: string
  icon: string
  delta: number
}

export interface CeremonyRewards {
  xp?: number
  gold?: number
  karmaGood?: number   // >0 = good deed, <0 = a darker choice
  karmaLawful?: number // >0 = lawful, <0 = chaotic
  reputation?: CeremonyRepChange[]
}

// 'quest' rides the toast lane (top-center, auto-dismiss). 'levelup' and 'chapter'
// ride the overlay lane (center-screen, player dismisses — these are the beats worth
// pausing on).
export type CeremonyKind = 'quest' | 'levelup' | 'chapter'

export interface CeremonyEvent {
  id: string
  kind: CeremonyKind
  title: string
  subtitle?: string
  flavor?: string
  rewards?: CeremonyRewards
  level?: number
  skillPoints?: number
  chapter?: number
  timestamp: number
}

export type CeremonyInput = Omit<CeremonyEvent, 'id' | 'timestamp'>

interface CeremonyContextValue {
  events: CeremonyEvent[]
  celebrate: (event: CeremonyInput) => void
  dismiss: (id: string) => void
}

const CeremonyContext = createContext<CeremonyContextValue | null>(null)

export function useCeremony(): CeremonyContextValue {
  const ctx = useContext(CeremonyContext)
  if (!ctx) {
    // Fail soft: a caller outside the provider gets a no-op rather than a crash.
    // Ceremony is polish — it must never be able to break gameplay.
    return { events: [], celebrate: () => {}, dismiss: () => {} }
  }
  return ctx
}

// Monotonic id source — avoids Math.random()/Date.now() collisions when several
// ceremonies fire in the same tick (a quest that awards xp + gold + rep at once).
let _seq = 0

export function CeremonyProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CeremonyEvent[]>([])

  const dismiss = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  const celebrate = useCallback((event: CeremonyInput) => {
    _seq += 1
    const full: CeremonyEvent = {
      ...event,
      id: `ceremony_${_seq}`,
      timestamp: _seq,
    }
    // Cap the queue so a burst can never wall off the screen.
    setEvents(prev => [...prev, full].slice(-6))
  }, [])

  const value: CeremonyContextValue = { events, celebrate, dismiss }

  return (
    <CeremonyContext.Provider value={value}>
      {children}
    </CeremonyContext.Provider>
  )
}

export default CeremonyProvider
