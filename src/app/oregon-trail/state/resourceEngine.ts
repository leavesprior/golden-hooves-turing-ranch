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
