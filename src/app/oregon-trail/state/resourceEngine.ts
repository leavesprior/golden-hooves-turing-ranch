/**
 * Resource engine — pure state transforms for shop, inn, and wagon operations.
 * All costs in 🌮 Neutral Karma, handled by KarmaWalletContext (not here).
 */

import type { OregonTrailState } from './types'

type ShopResource = 'food' | 'ammunition' | 'medicine' | 'spareParts' | 'clothing' | 'oxen'

export function applyBuySupplies(
  prev: OregonTrailState,
  resource: ShopResource,
  amount: number,
): OregonTrailState {
  return { ...prev, [resource]: prev[resource] + amount }
}

export function applySellSupplies(
  prev: OregonTrailState,
  resource: ShopResource,
  amount: number,
): OregonTrailState {
  if (prev[resource] < amount) return prev
  return { ...prev, [resource]: prev[resource] - amount }
}

export function applyRepairWagon(prev: OregonTrailState): OregonTrailState {
  if (prev.spareParts <= 0 || prev.wagonCondition >= 100) return prev
  return {
    ...prev,
    spareParts: prev.spareParts - 1,
    wagonCondition: Math.min(100, prev.wagonCondition + 25),
  }
}

export function applyRestAtInn(
  prev: OregonTrailState,
  healthBonus: number,
  moraleBonus: number,
): OregonTrailState {
  return {
    ...prev,
    morale: Math.min(100, prev.morale + moraleBonus),
    party: prev.party.map(member => ({
      ...member,
      health: Math.min(100, member.health + healthBonus),
      loyalty: member.isHired && member.loyalty !== undefined
        ? Math.min(100, member.loyalty + 3)
        : member.loyalty,
    })),
    day: prev.day + 1,
    message: 'Your party rests and recovers.',
  }
}

/** Apothecary tincture. Clears isSick. No-op if nobody living is sick. Does not auto. */
export function applyCureSickness(prev: OregonTrailState): OregonTrailState {
  const party = (Array.isArray(prev.party) ? prev.party : []).filter(Boolean)
  if (!party.some((m) => m.isSick && m.health > 0)) return prev
  return {
    ...prev,
    party: party.map((m) => {
      if (m.health <= 0 || !m.isSick) return m
      return {
        ...m,
        isSick: false,
        sicknessType: undefined,
        daysUntilRecovery: undefined,
      }
    }),
    message: 'The tincture takes. The fever breaks.',
  }
}

/** Trail camp. Costs a day and rations. Does not move miles. Does not auto. */
export function applyHunkerOnTrail(prev: OregonTrailState): OregonTrailState {
  if (prev.phase !== 'traveling') return prev
  const party = (Array.isArray(prev.party) ? prev.party : []).filter(Boolean)
  if (party.length === 0) return prev
  const rationMultiplier = { filling: 3, meager: 2, bare_bones: 1 }[prev.rations] ?? 2
  const foodConsumed = Math.ceil(party.length * rationMultiplier)
  return {
    ...prev,
    food: Math.max(0, prev.food - foodConsumed),
    morale: Math.min(100, prev.morale + 5),
    party: party.map(member => ({
      ...member,
      health: Math.min(100, member.health + 10),
    })),
    day: prev.day + 1,
    daysOnTrail: (prev.daysOnTrail || 0) + 1,
    message: 'You hunker. The miles wait.',
  }
}

export function applyBuyFood(
  prev: OregonTrailState,
  healthBonus: number,
  moraleBonus: number,
  partyWide: boolean,
): OregonTrailState {
  return {
    ...prev,
    morale: Math.min(100, prev.morale + moraleBonus),
    party: partyWide
      ? prev.party.map(member => ({
          ...member,
          health: Math.min(100, member.health + healthBonus),
        }))
      : prev.party,
  }
}

export function applyBuyDrink(
  prev: OregonTrailState,
  moraleBonus: number,
): OregonTrailState {
  return { ...prev, morale: Math.min(100, prev.morale + moraleBonus) }
}
