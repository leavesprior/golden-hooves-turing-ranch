'use client'

import React, { useState, useEffect } from 'react'

type ConsensusMode = 'full' | 'provisional' | 'offline'

interface ConsensusState {
  mode: ConsensusMode
  nodesOnline: number
  totalNodes: number
}

/**
 * Shows the current blockchain consensus status.
 * - Green: Full Consensus (3 nodes)
 * - Yellow: Provisional Ledger (2 nodes)
 * - Red: Local Only (offline)
 */
export function ConsensusIndicator() {
  const [consensus, setConsensus] = useState<ConsensusState>({
    mode: 'offline',
    nodesOnline: 0,
    totalNodes: 3,
  })

  // Check blockchain connectivity on mount and periodically
  useEffect(() => {
    const checkConsensus = async () => {
      try {
        const response = await fetch('http://localhost:8131/health', {
          signal: AbortSignal.timeout(1000),
        })

        if (response.ok) {
          const data = await response.json()
          const nodesOnline = data.nodes_online ?? data.nodesOnline ?? 2
          const totalNodes = data.total_nodes ?? data.totalNodes ?? 3

          setConsensus({
            mode: nodesOnline >= 3 ? 'full' : nodesOnline >= 2 ? 'provisional' : 'offline',
            nodesOnline,
            totalNodes,
          })
        } else {
          setConsensus({ mode: 'offline', nodesOnline: 0, totalNodes: 3 })
        }
      } catch {
        // In production or when blockchain is down, default to provisional
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          setConsensus({ mode: 'provisional', nodesOnline: 2, totalNodes: 3 })
        } else {
          setConsensus({ mode: 'offline', nodesOnline: 0, totalNodes: 3 })
        }
      }
    }

    checkConsensus()
    const interval = setInterval(checkConsensus, 30000)
    return () => clearInterval(interval)
  }, [])

  const config = {
    full: {
      color: 'text-green-400',
      bg: 'bg-green-900/30',
      border: 'border-green-600',
      dot: 'bg-green-400',
      label: 'Karma Ledger',
      description: 'All karma tracked',
    },
    provisional: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-600',
      dot: 'bg-yellow-400',
      label: 'Karma Ledger',
      description: 'Syncing your karma',
    },
    offline: {
      color: 'text-amber-400',
      bg: 'bg-amber-900/30',
      border: 'border-amber-700',
      dot: 'bg-amber-400',
      label: 'Karma Ledger',
      description: 'Saved locally',
    },
  }

  const c = config[consensus.mode]

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${c.bg} ${c.border}`}>
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
        {consensus.mode !== 'offline' && (
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
