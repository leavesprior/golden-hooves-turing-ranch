import { CrossGameStorage } from '@/lib/crossGameProgression'
import type { JourneyImport } from '@/lib/bobrLocalCampaign'

interface MilestoneLike {
  id?: unknown
}

interface WorldEventLike {
  mode?: unknown
  action?: unknown
  label?: unknown
  impact?: {
    reputationDelta?: Record<string, unknown>
  }
}

interface CrossGameLike {
  milestones?: unknown
  eventLog?: unknown
}

export interface ProductionJourneySource {
  crossGame: unknown
  whereInTime?: unknown
  trailSave?: unknown
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function parseStored(key: string, storage: Storage): unknown {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function buildProductionJourneyImport(source: ProductionJourneySource): JourneyImport | null {
  const crossGame = record(source.crossGame) as CrossGameLike | null
  const milestones = Array.isArray(crossGame?.milestones) ? crossGame.milestones as MilestoneLike[] : []
  const events = Array.isArray(crossGame?.eventLog) ? crossGame.eventLog as WorldEventLike[] : []
  const ids = new Set(milestones.map((item) => typeof item?.id === 'string' ? item.id : '').filter(Boolean))

  const whereInTime = record(source.whereInTime)
  const witState = record(whereInTime?.state)
  const witPhase = typeof whereInTime?.phase === 'string' ? whereInTime.phase : ''
  const traits = Array.isArray(witState?.traits)
    ? witState.traits.map(record).filter(Boolean).map((item) => {
      const label = typeof item?.label === 'string' ? item.label : ''
      const value = typeof item?.value === 'string' ? item.value : ''
      return [label, value].filter(Boolean).join(': ')
    }).filter(Boolean).slice(0, 4)
    : []

  const trail = record(source.trailSave)
  const trailPhase = typeof trail?.gamePhase === 'string' ? trail.gamePhase : ''
  const trailChapter = typeof trail?.currentChapter === 'number' ? trail.currentChapter : 0
  const trailClues = Array.isArray(trail?.cluesGathered)
    ? trail.cluesGathered.filter((item): item is string => typeof item === 'string').slice(-3)
    : []

  const timeChaseComplete = ids.has('time_chase_complete') || witPhase === 'won'
  const trailComplete =
    ids.has('completed_journey_west') ||
    events.some((event) => event.action === 'survived_trail') ||
    trailPhase === 'gold_country' ||
    trailChapter > 1
  const reachedGoldCountry =
    ids.has('reached_west_point') ||
    ids.has('completed_gold_country') ||
    trailPhase === 'gold_country'

  if (!timeChaseComplete && !trailComplete && !reachedGoldCountry && traits.length === 0 && trailClues.length === 0) {
    return null
  }

  let tradeSafetyDelta = 0
  let routeTrustDelta = 0
  for (const event of events) {
    if (event.action === 'survived_trail') tradeSafetyDelta += 10
    if (event.action === 'generous_sharing') tradeSafetyDelta += 6
    if (event.action === 'greedy_hoarding') tradeSafetyDelta -= 8
    if (event.action === 'npc_befriended') routeTrustDelta += 3
    const nativeDelta = event.impact?.reputationDelta?.natives
    if (typeof nativeDelta === 'number' && Number.isFinite(nativeDelta)) routeTrustDelta += nativeDelta
  }

  const eventEvidence = events
    .filter((event) => event.mode === 'prospectors_tale' || event.mode === 'rpg_adventure')
    .map((event) => typeof event.label === 'string' ? event.label.trim() : '')
    .filter(Boolean)
    .slice(-5)

  return {
    timeChaseComplete,
    trailComplete,
    reachedGoldCountry,
    tradeSafetyDelta: Math.max(-20, Math.min(30, tradeSafetyDelta)),
    routeTrustDelta: Math.max(-20, Math.min(30, routeTrustDelta)),
    evidence: [...traits, ...trailClues, ...eventEvidence].slice(-8),
    sourceEventCount: events.length,
  }
}

export function readProductionJourneyImport(): JourneyImport | null {
  if (typeof window === 'undefined') return null
  return buildProductionJourneyImport({
    crossGame: CrossGameStorage.load(),
    whereInTime: parseStored('bobr_where_in_time_state', window.sessionStorage),
    trailSave: parseStored('golden_hooves_save', window.localStorage),
  })
}
