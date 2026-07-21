import { CrossGameStorage } from '@/lib/crossGameProgression'

export interface KarmaMarketSignal {
  good: number
  neutral: number
  bad: number
  bias: number
  source: 'cross_game_ledger'
  chainStatus: 'resolve_later'
}

export function buildKarmaMarketSignal(pool: { good?: unknown; neutral?: unknown; bad?: unknown }): KarmaMarketSignal {
  const safe = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
  const good = safe(pool.good)
  const neutral = safe(pool.neutral)
  const bad = safe(pool.bad)
  const moralTotal = good + bad
  const bias = moralTotal === 0 ? 0 : Math.max(-1, Math.min(1, (good - bad) / moralTotal))
  return { good, neutral, bad, bias, source: 'cross_game_ledger', chainStatus: 'resolve_later' }
}

export function readKarmaMarketSignal(): KarmaMarketSignal {
  return buildKarmaMarketSignal(CrossGameStorage.loadSharedKarma())
}
