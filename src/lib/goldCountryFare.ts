/**
 * Local durable travel payment. The caller first saves the planned trip and keeps
 * one trip active until arrival. This is one wallet-record write, not a server
 * transaction or a cross-tab lock; receipts are bounded to the latest 64 trips.
 */
export interface GoldCountryFareReceipt {
  tripId: string
  amount: number
}

export type GoldCountryFareResult =
  | { ok: true; replayed: boolean }
  | { ok: false; reason: 'funds' | 'storage' | 'invalid' | 'conflict' }

export interface GoldCountryFareWallet {
  balance: { good: number; neutral: number; bad: number }
  travelFareReceipts?: GoldCountryFareReceipt[]
}

type FareCommitResult<T> =
  | { ok: true; replayed: boolean; wallet: T & { travelFareReceipts: GoldCountryFareReceipt[] } }
  | Extract<GoldCountryFareResult, { ok: false }>

type FareStorage = Pick<Storage, 'getItem' | 'setItem'>
export const MAX_TRAVEL_FARE_RECEIPTS = 64

function validTripId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)
}

function validAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function readReceipts(value: unknown): GoldCountryFareReceipt[] | undefined {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > MAX_TRAVEL_FARE_RECEIPTS) return undefined
  if (!value.every(receipt => isRecord(receipt) && validTripId(receipt.tripId) && validAmount(receipt.amount))) return undefined
  return value as GoldCountryFareReceipt[]
}

/** Read only the accepted receipt snapshot; malformed/conflicting history is not proof. */
export function hasGoldCountryFareReceipt(value: unknown, tripId: string, amount: number): boolean {
  if (!validTripId(tripId) || !validAmount(amount)) return false
  const receipts = readReceipts(value)
  if (!receipts) return false
  const amounts = new Map<string, number>()
  for (const receipt of receipts) {
    const previous = amounts.get(receipt.tripId)
    if (previous !== undefined && previous !== receipt.amount) return false
    amounts.set(receipt.tripId, receipt.amount)
  }
  return amounts.get(tripId) === amount
}

/**
 * `currentWallet` must contain the provider's latest accepted balance, including
 * ordinary earnings/purchases queued before React renders. Storage supplies the
 * durable receipts and any unrelated legacy fields, not an older balance.
 * No caller state is changed unless the single complete setItem succeeds.
 */
export function commitGoldCountryFare<T extends GoldCountryFareWallet>(
  storage: FareStorage,
  key: string,
  currentWallet: T,
  tripId: string,
  amount: number,
): FareCommitResult<T> {
  if (!validTripId(tripId) || !validAmount(amount)) return { ok: false, reason: 'invalid' }

  let stored: Record<string, unknown> = {}
  try {
    const raw = storage.getItem(key)
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw)
      if (!isRecord(parsed)) return { ok: false, reason: 'storage' }
      stored = parsed
    }
  } catch {
    return { ok: false, reason: 'storage' }
  }

  const storedReceipts = readReceipts(stored.travelFareReceipts)
  const currentReceipts = readReceipts(currentWallet.travelFareReceipts)
  // A malformed receipt must not be discarded and then charged again.
  if (!storedReceipts || !currentReceipts) return { ok: false, reason: 'storage' }
  const receipts = new Map<string, GoldCountryFareReceipt>()
  for (const receipt of [...storedReceipts, ...currentReceipts]) {
    const previous = receipts.get(receipt.tripId)
    if (previous && previous.amount !== receipt.amount) return { ok: false, reason: 'conflict' }
    receipts.set(receipt.tripId, { tripId: receipt.tripId, amount: receipt.amount })
  }
  const previous = receipts.get(tripId)
  if (previous && previous.amount !== amount) return { ok: false, reason: 'conflict' }
  if (previous) {
    return {
      ok: true,
      replayed: true,
      wallet: { ...stored, ...currentWallet, travelFareReceipts: [...receipts.values()].slice(-MAX_TRAVEL_FARE_RECEIPTS) },
    }
  }

  const balance = currentWallet.balance
  if (!balance || ![balance.good, balance.neutral, balance.bad].every(Number.isFinite)
    || Math.abs(balance.neutral) > Number.MAX_SAFE_INTEGER) return { ok: false, reason: 'invalid' }
  if (balance.neutral < amount) return { ok: false, reason: 'funds' }

  const wallet = {
    ...stored,
    ...currentWallet,
    balance: { ...balance, neutral: balance.neutral - amount },
    travelFareReceipts: [...receipts.values(), { tripId, amount }].slice(-MAX_TRAVEL_FARE_RECEIPTS),
  }
  try {
    storage.setItem(key, JSON.stringify(wallet))
  } catch {
    return { ok: false, reason: 'storage' }
  }
  return { ok: true, replayed: false, wallet }
}
