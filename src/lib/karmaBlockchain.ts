/**
 * Neoma Karma Blockchain API Client
 * Connects to the Karma Blockchain service at port 8131
 * Used by Oregon Trail game for karma-based currency
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

// Default agent ID for Oregon Trail game
const DEFAULT_AGENT_ID = 'bobr_oregon_trail'
const BLOCKCHAIN_BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? '' // In production, blockchain is not available - use offline mode
  : 'http://localhost:8131'
const API_TIMEOUT_MS = 500
const IS_PRODUCTION = typeof window !== 'undefined' && window.location.hostname !== 'localhost'

/**
 * Timeout wrapper for fetch requests
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Karma Blockchain Client
 * Handles all interactions with the Neoma Karma Blockchain
 */
export class KarmaBlockchainClient {
  private baseUrl: string
  private agentId: string
  private pendingTransactions: KarmaTransaction[] = []
  private isOnline: boolean = true
  private lastSyncAttempt: number = 0
  private syncInterval: NodeJS.Timeout | null = null

  constructor(agentId: string = DEFAULT_AGENT_ID, baseUrl: string = BLOCKCHAIN_BASE_URL) {
    this.baseUrl = baseUrl
    this.agentId = agentId
  }

  /**
   * Start the sync interval for pending transactions
   */
  startSync(intervalMs: number = 5000): void {
    if (this.syncInterval) return
    this.syncInterval = setInterval(() => this.syncPendingTransactions(), intervalMs)
  }

  /**
   * Stop the sync interval
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Check if the blockchain API is available
   */
  async checkConnection(): Promise<boolean> {
    if (IS_PRODUCTION) {
      this.isOnline = false
      return false
    }
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/health`, {}, 1000)
      this.isOnline = response.ok
      return this.isOnline
    } catch {
      this.isOnline = false
      return false
    }
  }

  /**
   * Get the current karma balance for the agent
   */
  async getBalance(): Promise<KarmaBalance> {
    if (IS_PRODUCTION) {
      return { good: 0, neutral: 400, bad: 0 }
    }
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/karma/${this.agentId}`)

      if (!response.ok) {
        if (response.status === 404) {
          return { good: 0, neutral: 400, bad: 0 }
        }
        throw new Error(`Failed to get balance: ${response.statusText}`)
      }

      const data = await response.json()
      this.isOnline = true

      return {
        good: data.good ?? data.good_karma ?? 0,
        neutral: data.neutral ?? data.neutral_karma ?? 400,
        bad: data.bad ?? data.bad_karma ?? 0,
      }
    } catch (error) {
      this.isOnline = false
      console.warn('Karma blockchain offline, using local fallback')
      return { good: 0, neutral: 400, bad: 0 }
    }
  }

  /**
   * Initialize a new wallet with starting balance
   */
  async initializeWallet(startingNeutral: number = 400): Promise<KarmaBalance> {
    if (IS_PRODUCTION) {
      return { good: 0, neutral: startingNeutral, bad: 0 }
    }
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/karma/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: this.agentId,
          initial_balance: {
            good: 0,
            neutral: startingNeutral,
            bad: 0,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to initialize wallet: ${response.statusText}`)
      }

      this.isOnline = true
      return await response.json()
    } catch (error) {
      this.isOnline = false
      return { good: 0, neutral: startingNeutral, bad: 0 }
    }
  }

  /**
   * Transfer karma to another agent (e.g., "merchant" for shop purchases)
   */
  async transfer(
    toAgent: string,
    karmaType: KarmaType,
    amount: number,
    memo?: string
  ): Promise<boolean> {
    const transaction: KarmaTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      fromAgent: this.agentId,
      toAgent,
      karmaType,
      amount,
      memo,
      synced: false,
    }

    if (IS_PRODUCTION) {
      this.pendingTransactions.push(transaction)
      return false
    }

    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/karma/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_agent: this.agentId,
          to_agent: toAgent,
          karma_type: karmaType,
          amount,
          memo,
        }),
      })

      if (!response.ok) {
        throw new Error(`Transfer failed: ${response.statusText}`)
      }

      transaction.synced = true
      this.isOnline = true
      return true
    } catch (error) {
      // Queue for later sync
      this.pendingTransactions.push(transaction)
      this.isOnline = false
      console.warn('Transfer queued for sync:', transaction)
      return false
    }
  }

  /**
   * Spend neutral karma (primary currency)
   */
  async spendNeutral(amount: number, memo?: string): Promise<boolean> {
    return this.transfer('merchant', 'neutral', amount, memo)
  }

  /**
   * Spend good karma (premium currency)
   */
  async spendGood(amount: number, memo?: string): Promise<boolean> {
    return this.transfer('merchant', 'good', amount, memo)
  }

  /**
   * Earn neutral karma (from sales, rewards)
   */
  async earnNeutral(amount: number, memo?: string): Promise<boolean> {
    return this.transfer(this.agentId, 'neutral', -amount, `EARN: ${memo}`)
  }

  /**
   * Earn good karma (from virtuous actions)
   */
  async earnGood(amount: number, memo?: string): Promise<boolean> {
    return this.transfer(this.agentId, 'good', -amount, `EARN: ${memo}`)
  }

  /**
   * Add bad karma (consequences for dark choices)
   */
  async addBadKarma(amount: number, reason?: string): Promise<boolean> {
    if (IS_PRODUCTION) return false
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/karma/contrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: this.agentId,
          amount,
          reason,
        }),
      })

      this.isOnline = response.ok
      return response.ok
    } catch (error) {
      this.isOnline = false
      return false
    }
  }

  /**
   * Convert good karma to neutral karma (2:1 ratio)
   * Sacrifice 2 good karma to receive 1 neutral karma
   */
  async convertGoodToNeutral(goodAmount: number): Promise<boolean> {
    if (IS_PRODUCTION) return false
    const neutralReceived = Math.floor(goodAmount / 2)

    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/karma/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: this.agentId,
          from_type: 'good',
          to_type: 'neutral',
          from_amount: goodAmount,
          to_amount: neutralReceived,
        }),
      })

      this.isOnline = response.ok
      return response.ok
    } catch (error) {
      this.isOnline = false
      return false
    }
  }

  /**
   * Take debt - gain neutral karma but also gain bad karma (1:1 ratio)
   */
  async takeDebt(amount: number): Promise<boolean> {
    try {
      // First add the neutral karma
      await this.transfer(this.agentId, 'neutral', -amount, 'DEBT: Borrowed')
      // Then add the bad karma debt
      await this.addBadKarma(amount, 'Debt taken')
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Absolve bad karma by sacrificing good karma
   */
  async absolveBadKarma(badAmount: number): Promise<boolean> {
    if (IS_PRODUCTION) return false
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/karma/absolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: this.agentId,
          bad_karma_amount: badAmount,
        }),
      })

      this.isOnline = response.ok
      return response.ok
    } catch (error) {
      this.isOnline = false
      return false
    }
  }

  /**
   * Sync pending transactions when connection is restored
   */
  async syncPendingTransactions(): Promise<number> {
    if (IS_PRODUCTION) return 0
    if (this.pendingTransactions.length === 0) return 0
    if (Date.now() - this.lastSyncAttempt < 5000) return 0 // Rate limit

    this.lastSyncAttempt = Date.now()

    // Check connection first
    const connected = await this.checkConnection()
    if (!connected) return 0

    let syncedCount = 0
    const stillPending: KarmaTransaction[] = []

    for (const tx of this.pendingTransactions) {
      try {
        const success = await this.transfer(tx.toAgent, tx.karmaType, tx.amount, tx.memo)
        if (success) {
          syncedCount++
        } else {
          stillPending.push(tx)
        }
      } catch {
        stillPending.push(tx)
      }
    }

    this.pendingTransactions = stillPending
    return syncedCount
  }

  /**
   * Get online status
   */
  get online(): boolean {
    return this.isOnline
  }

  /**
   * Get pending transaction count
   */
  get pendingCount(): number {
    return this.pendingTransactions.length
  }

  /**
   * Get the agent ID
   */
  get agent(): string {
    return this.agentId
  }

  /**
   * Get market state from blockchain (optional sync)
   */
  async getMarketState(): Promise<Record<string, unknown> | null> {
    if (IS_PRODUCTION) return null
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/karma/market-state/${this.agentId}`)
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }

  /**
   * Set market state on blockchain (optional sync)
   */
  async setMarketState(state: Record<string, unknown>): Promise<boolean> {
    if (IS_PRODUCTION) return false
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/karma/market-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: this.agentId,
          market_state: state,
        }),
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Export singleton instance for Oregon Trail
export const oregonTrailKarma = new KarmaBlockchainClient()

// Export singleton instance for Karma Market
export const karmaMarketClient = new KarmaBlockchainClient('bobr_karma_market')

export default KarmaBlockchainClient
