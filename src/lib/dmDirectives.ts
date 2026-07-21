/**
 * DM Directive Channel — grammar + deterministic validator (DM Layer P1).
 * Design: ~/Documents/BOBR/game_enhancements/NEOMA_DM_LAYER_20260715.md §3
 * (`dm-directive-channel`).
 *
 * THE VALIDATOR IS LAW. The DM (an LLM behind the port-42 chat route) only
 * PROPOSES directives; this deterministic code disposes. A directive that
 * fails validation is dropped and logged — never partially applied, never
 * clamped into acceptability. Caps and cooldowns live in code, not prompts:
 * "nothing grades its own homework."
 *
 * P1 vocabulary is exactly THREE classes (do not extend without a design pass):
 *   - weather.set       — bend the trail weather to one of the existing states
 *   - item.grant        — grant supplies, hard-capped per resource
 *   - encounter.boss    — spawn a hostile encounter referencing an EXISTING outlaw
 *
 * ── FICTION / SCOPE GUARDS (P1) ─────────────────────────────────────────────
 * - NO karma minting via directives. Karma flows ONLY through the game's
 *   existing earn paths (event choices, quests, Living Trail). Directive-spawned
 *   events must not carry karma deltas in their outcomes.
 * - Item caps are small and code-enforced; an over-cap directive is REJECTED
 *   (not clamped down) so a misbehaving DM proposal is visible in the logs.
 * - P2 LINE: before ANY directive class can touch a real-money-adjacent effect
 *   (discounts, bookings, redeemable rewards), this channel must become
 *   server-authoritative — authenticated DM surface, server-signed directives,
 *   server-side application. The P1 channel is fiction-only by construction.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { Weather } from '@/app/oregon-trail/state/types'
import { getOutlaw } from '@/app/oregon-trail/data/outlaws'

// ===================== TYPES =====================

export type DmDirectiveKind = 'weather.set' | 'item.grant' | 'encounter.boss'

/** Supply resources a DM may grant (all existing OregonTrailState fields). */
export type GrantableResource =
  | 'food'
  | 'ammunition'
  | 'medicine'
  | 'spareParts'
  | 'clothing'
  | 'oxen'

interface DmDirectiveBase {
  /** Unique id, minted server-side (used for queue drain bookkeeping). */
  id: string
  /** Epoch ms the directive was minted. */
  ts: number
  /** Executor attribution — which DM surface produced this (e.g. 'neoma-chat:tobias'). */
  source: string
  /** Optional short in-fiction reason, surfaced to the player in the message line. */
  reason?: string
}

export interface WeatherSetDirective extends DmDirectiveBase {
  kind: 'weather.set'
  weather: Weather
}

export interface ItemGrantDirective extends DmDirectiveBase {
  kind: 'item.grant'
  resource: GrantableResource
  qty: number
}

export interface EncounterBossDirective extends DmDirectiveBase {
  kind: 'encounter.boss'
  /** Must reference an EXISTING outlaw id from data/outlaws.ts. */
  enemyId: string
}

export type DmDirective = WeatherSetDirective | ItemGrantDirective | EncounterBossDirective

// ===================== LAW: CAPS + COOLDOWNS (code, not prompt) =====================

const VALID_WEATHERS: readonly Weather[] = ['fair', 'rain', 'storm', 'snow']

/** Hard per-directive quantity caps. Over-cap = REJECTED, never clamped. */
export const ITEM_GRANT_CAPS: Record<GrantableResource, number> = {
  food: 100,
  ammunition: 60,
  medicine: 3,
  spareParts: 2,
  clothing: 2,
  oxen: 1,
}

/** Per-class cooldown between directives for the same player (enforced at the queue). */
export const DIRECTIVE_COOLDOWN_MS: Record<DmDirectiveKind, number> = {
  'weather.set': 5 * 60_000,
  'item.grant': 10 * 60_000,
  'encounter.boss': 30 * 60_000,
}

/** playerId shape accepted anywhere in the DM channel (queue keys, chat body). */
export const PLAYER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

const ID_PATTERN = /^[A-Za-z0-9_-]{1,96}$/
const SOURCE_PATTERN = /^[A-Za-z0-9_:.-]{1,96}$/
const MAX_REASON_LENGTH = 200

// ===================== VALIDATOR =====================

export type DirectiveValidation =
  | { ok: true; directive: DmDirective }
  | { ok: false; reason: string }

function fail(reason: string): DirectiveValidation {
  return { ok: false, reason }
}

/**
 * Deterministic schema validation for one proposed directive. Pure function,
 * shared verbatim by the server queue (write AND read) and the client reducer
 * (apply) — defense in depth at every system boundary.
 */
export function validateDmDirective(raw: unknown): DirectiveValidation {
  if (!raw || typeof raw !== 'object') return fail('not_an_object')
  const d = raw as Record<string, unknown>

  if (typeof d.id !== 'string' || !ID_PATTERN.test(d.id)) return fail('invalid_id')
  if (typeof d.ts !== 'number' || !Number.isFinite(d.ts) || d.ts <= 0) return fail('invalid_ts')
  if (typeof d.source !== 'string' || !SOURCE_PATTERN.test(d.source)) return fail('invalid_source')
  if (d.reason !== undefined && (typeof d.reason !== 'string' || d.reason.length > MAX_REASON_LENGTH)) {
    return fail('invalid_reason')
  }
  const common = {
    id: d.id,
    ts: d.ts,
    source: d.source,
    ...(typeof d.reason === 'string' ? { reason: d.reason } : {}),
  }

  switch (d.kind) {
    case 'weather.set': {
      if (!VALID_WEATHERS.includes(d.weather as Weather)) return fail('invalid_weather')
      return { ok: true, directive: { ...common, kind: 'weather.set', weather: d.weather as Weather } }
    }
    case 'item.grant': {
      const resource = d.resource as GrantableResource
      if (!(typeof resource === 'string' && resource in ITEM_GRANT_CAPS)) return fail('invalid_resource')
      if (typeof d.qty !== 'number' || !Number.isInteger(d.qty) || d.qty <= 0) return fail('invalid_qty')
      if (d.qty > ITEM_GRANT_CAPS[resource]) return fail('over_cap')
      return { ok: true, directive: { ...common, kind: 'item.grant', resource, qty: d.qty } }
    }
    case 'encounter.boss': {
      if (typeof d.enemyId !== 'string' || !ID_PATTERN.test(d.enemyId)) return fail('invalid_enemy_id')
      if (!getOutlaw(d.enemyId)) return fail('unknown_enemy')
      return { ok: true, directive: { ...common, kind: 'encounter.boss', enemyId: d.enemyId } }
    }
    default:
      return fail('unknown_kind')
  }
}

// ===================== MINTING (server-side helper) =====================

let mintCounter = 0

/**
 * Mint a directive with fresh id/ts. The result is still passed through
 * validateDmDirective by every consumer — minting grants no trust.
 */
export function mintDmDirective(
  payload:
    | { kind: 'weather.set'; weather: Weather }
    | { kind: 'item.grant'; resource: GrantableResource; qty: number }
    | { kind: 'encounter.boss'; enemyId: string },
  source: string,
  reason?: string,
): DmDirective {
  mintCounter = (mintCounter + 1) % 1000
  const base = {
    id: `dm_${Date.now()}_${mintCounter}_${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    source,
    ...(reason ? { reason } : {}),
  }
  return { ...base, ...payload } as DmDirective
}
