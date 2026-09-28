'use client'

import React, { useState, useEffect } from 'react'
import { ledgerDisplayFromJson, type LedgerDisplay } from '@/lib/ledgerDisplay'

/** Shows the current server karma ledger verification status. */
export function ConsensusIndicator() {
  const [ledgerDisplay, setLedgerDisplay] = useState<LedgerDisplay>(ledgerDisplayFromJson(''))

  // Check the same-origin server ledger verifier on mount and periodically.
  useEffect(() => {
    const checkLedger = async () => {
      try {
        const response = await fetch('/api/karma/verify', {
          cache: 'no-store',
        })
        setLedgerDisplay(ledgerDisplayFromJson(await response.text()))
      } catch {
        setLedgerDisplay(ledgerDisplayFromJson(''))
      }
    }

    checkLedger()
    const interval = setInterval(checkLedger, 30000)
    return () => clearInterval(interval)
  }, [])

  const config = {
    green: {
      color: 'text-green-400',
      bg: 'bg-green-900/30',
      border: 'border-green-600',
      dot: 'bg-green-400',
    },
    amber: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-600',
      dot: 'bg-yellow-400',
    },
    red: {
      color: 'text-red-400',
      bg: 'bg-red-900/30',
      border: 'border-red-700',
      dot: 'bg-red-400',
    },
    grey: {
      color: 'text-gray-400',
      bg: 'bg-gray-900/30',
      border: 'border-gray-700',
      dot: 'bg-gray-400',
    },
  }

  const c = config[ledgerDisplay.tone]

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${c.bg} ${c.border}`}>
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
        {ledgerDisplay.tone === 'green' && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${c.dot} animate-ping opacity-50`} />
        )}
      </div>
      <div>
        <div className={`font-pixel text-[9px] ${c.color}`}>{ledgerDisplay.label}</div>
        <div className="text-[8px] text-amber-600">{ledgerDisplay.description}</div>
      </div>
    </div>
  )
}
