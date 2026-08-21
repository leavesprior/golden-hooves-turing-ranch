/**
 * Standing-depth donor for the fold into Where in the West.
 *
 * The new face owns look. This file is the READ of who the player already is.
 * Same localStorage keys the live trail writes. Reset of a wagon must NOT
 * wipe these (family memory). Do not invent a second character sheet.
 *
 * Keys (do not rename):
 *   bobr_ot_character          — SADDLE person
 *   bobr_town_visits           — towns that remember the family
 *   bobr_town_visit_last       — remount guard
 *   oregon_trail_karma_wallet  — tacos / cookies / coal
 *   bobr_unified_karma         — alignment (not a mint)
 *   bobr_cross_game_progression
 */

export const DONOR_KEYS = {
  character: 'bobr_ot_character',
  visits: 'bobr_town_visits',
  visitLast: 'bobr_town_visit_last',
  wallet: 'oregon_trail_karma_wallet',
  alignment: 'bobr_unified_karma',
  crossGame: 'bobr_cross_game_progression',
} as const

export const SADDLE_ORDER = [
  'Shrewdness',
  'Agility',
  'Durability',
  'Diplomacy',
  'Luck',
  'Expertise',
] as const

export type SaddleName = (typeof SADDLE_ORDER)[number]

export interface DepthDonor {
  name: string | null
  background: string | null
  saddle: Partial<Record<SaddleName, number>>
  traits: string[]
  visits: Record<string, number>
  wallet: { tacos: number; cookies: number; coal: number }
  source: 'local_donor' | 'empty'
}

function readJson(key: string): unknown {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/** Snapshot the standing person. Never writes. */
export function readDepthDonor(): DepthDonor {
  const empty: DepthDonor = {
    name: null,
    background: null,
    saddle: {},
    traits: [],
    visits: {},
    wallet: { tacos: 0, cookies: 0, coal: 0 },
    source: 'empty',
  }
  if (typeof window === 'undefined') return empty

  const ch = readJson(DONOR_KEYS.character) as {
    name?: string
    background?: string
    stats?: Record<string, number>
    traits?: string[]
  } | null
  const visitsRaw = readJson(DONOR_KEYS.visits)
  const visits =
    visitsRaw && typeof visitsRaw === 'object' && !Array.isArray(visitsRaw)
      ? Object.fromEntries(
          Object.entries(visitsRaw as Record<string, unknown>).filter(
            ([, v]) => typeof v === 'number',
          ) as [string, number][],
        )
      : {}
  const walletRaw = readJson(DONOR_KEYS.wallet) as {
    balance?: { neutral?: number; good?: number; bad?: number }
  } | null
  const bal = walletRaw?.balance

  const saddle: Partial<Record<SaddleName, number>> = {}
  if (ch?.stats) {
    for (const k of SADDLE_ORDER) {
      if (typeof ch.stats[k] === 'number') saddle[k] = ch.stats[k]
    }
  }

  const hasPerson = !!(ch && typeof ch.name === 'string' && ch.name.trim())
  return {
    name: hasPerson ? (ch!.name as string) : null,
    background: typeof ch?.background === 'string' ? ch.background : null,
    saddle,
    traits: Array.isArray(ch?.traits) ? ch!.traits.filter((t) => typeof t === 'string') : [],
    visits,
    wallet: {
      tacos: num(bal?.neutral),
      cookies: num(bal?.good),
      coal: num(bal?.bad),
    },
    source: hasPerson || Object.keys(visits).length > 0 ? 'local_donor' : 'empty',
  }
}
