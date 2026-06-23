'use client'

import React, { useState, useEffect } from 'react'
import { getKarmaSessionId, fetchServerBalance } from '@/lib/karmaServerSync'

type LedgerMode = 'saved' | 'local'

/**
 * Shows where the player's karma is actually being saved — honestly.
 *
 * The old version claimed a 3-node blockchain "consensus" (green = 3 nodes,
 * yellow = "provisional 2 of 3") by probing localhost:8131, a node never
 * reachable from a visitor's browser, so it perpetually showed a fictional
 * provisional state. Karma is really persisted to the same-origin SQLite ranch
 * ledger (`/api/karma/balance`), which works in production. This now reflects
 * that real state:
 * - Green  "Saved to ranch ledger" — the server ledger answered.
 * - Amber  "Saved locally"         — server unreachable; progress kept on device.
 */
export function ConsensusIndicator() {
  const [mode, setMode] = useState<LedgerMode>('local')

  useEffect(() => {
    let cancelled = false

    const checkLedger = async () => {
      const res = await fetchServerBalance(getKarmaSessionId())
      if (cancelled) return
      // Server-authoritative ledger answered → karma is saved to the ranch ledger.
      // Otherwise it's still safe on the device (offline-tolerant), shown honestly.
      setMode(res.ok ? 'saved' : 'local')
    }

    checkLedger()
    const interval = setInterval(checkLedger, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const config = {
    saved: {
      color: 'text-green-400',
      bg: 'bg-green-900/30',
      border: 'border-green-600',
      dot: 'bg-green-400',
      label: 'Karma Ledger',
      description: 'Saved to ranch ledger',
    },
    local: {
      color: 'text-amber-400',
      bg: 'bg-amber-900/30',
      border: 'border-amber-700',
      dot: 'bg-amber-400',
      label: 'Karma Ledger',
      description: 'Saved locally',
    },
  }

  const c = config[mode]

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${c.bg} ${c.border}`}>
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
        {mode === 'saved' && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${c.dot} animate-ping opacity-50`} />
        )}
      </div>
      <div>
        <div className={`font-pixel text-[9px] ${c.color}`}>{c.label}</div>
        <div className="text-[8px] text-amber-600">{c.description}</div>
      </div>
    </div>
  )
}
