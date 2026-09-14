import type { SaddleStats } from '../characterContext'
import { SADDLE_ORDER } from '@/lib/bobrDepthDonor'

/** Copy the six existing stats at the action boundary; no storage or React reads. */
export function copySaddleSnapshot(value: unknown): SaddleStats | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const raw = value as Record<string, unknown>
  if (!SADDLE_ORDER.every(stat => typeof raw[stat] === 'number' && Number.isFinite(raw[stat]))) return undefined
  return Object.fromEntries(SADDLE_ORDER.map(stat => [stat, Math.max(1, Math.min(20, Math.round(raw[stat] as number)))])) as unknown as SaddleStats
}

