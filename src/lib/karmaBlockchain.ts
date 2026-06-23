/**
 * Karma data contracts (Oregon Trail / Prospector's Tale).
 *
 * The old :8131 `KarmaBlockchainClient` lived here. It was force-offline in
 * production (every network method short-circuited to a stub when not on
 * localhost), so in the deployed game it did nothing but return defaults — the
 * authoritative karma path is the SQLite-backed server ledger via
 * `karmaServerSync.ts`. The dead client and its singletons (`oregonTrailKarma`,
 * `karmaMarketClient`) were removed 2026-06-22; only these shared type
 * definitions remain, still consumed by the wallet context, the server-sync
 * helper, and save/load integration.
 */

export type KarmaType = 'good' | 'neutral' | 'bad'
export type KarmaTransactionType = 'transfer' | 'market_purchase' | 'donation' | 'treat' | 'momento'

export interface KarmaBalance {
  good: number    // 🍪 Good Karma - earned via virtuous acts, used for premium items
  neutral: number // 🪙 Neutral Karma - primary currency (replaces gold)
  bad: number     // 🪨 Bad Karma - debt/consequences for dark choices
}

export interface KarmaTransaction {
  id: string
  timestamp: number
  fromAgent: string
  toAgent: string
  karmaType: KarmaType
  amount: number
  memo?: string
  synced: boolean
  transactionType?: KarmaTransactionType
}

export interface BlockchainError {
  error: string
  code: string
}
