// ============================================
// PERIL ECONOMY — medicine as a karma-priced, counted consumable (pure)
// ============================================
// Currency is NEUTRAL KARMA (balance.neutral) — the game's real currency; "gold" is
// just its flavor label. A medicine purchase is a karma SINK, never a client-mint
// (reward-security rule: nothing of value is minted client-side). Doses are COUNTED
// (acquiredItems is a Set and can't count), so peril tracks a separate integer.
//
// PURE: no React, no wallet calls. The caller performs the actual spendNeutral via the
// existing handleSpendKarma(price, memo) hook; this module only defines the catalog and
// computes prices. All economy tuning lives HERE in one place (like DEFAULT_PERIL_CONFIG)
// — SuperGrok's instincts vs the 400-karma starting balance; PENDING Leif's confirm.

import type { ConditionId } from './perilEngine'

export interface MedicineItem {
  id: string
  label: string
  blurb: string                 // period flavor for the shop shelf
  priceKarma: number            // neutral-karma cost (the sink)
  severityReduction: number     // severity levels a dose removes (feeds treatWithMedicine)
  bestFor?: ConditionId         // ailment it especially answers (flavor + shop hinting)
}

// The 1849 general-store shelf. Common → precious.
export const MEDICINE_CATALOG: readonly MedicineItem[] = [
  { id: 'trail_tonic', label: 'Trail Tonic',      blurb: 'Brown-glass bitters — settles most any trail ailment.',        priceKarma: 2, severityReduction: 2 },
  { id: 'quinine',     label: 'Quinine Powder',   blurb: "Cinchona bark ground fine — the ague's only real answer.",     priceKarma: 6, severityReduction: 3, bestFor: 'fever' },
  { id: 'snakeroot',   label: 'Snakeroot Poultice', blurb: 'A trapper\'s draw for venom — pulls the worst of a bite.',   priceKarma: 5, severityReduction: 3, bestFor: 'snakebite' },
  { id: 'laudanum',    label: 'Laudanum Draught', blurb: "Opium tincture — steadies a man at death's door.",            priceKarma: 8, severityReduction: 3 },
]

export function findMedicine(id: string): MedicineItem | undefined {
  return MEDICINE_CATALOG.find(m => m.id === id)
}

// Existing price hooks the shop must honor for consistency (karma research):
//   "Shop prices −20%" advantage · "Haggler 15% better prices" feat.
export interface PriceModifiers {
  shopDiscountAdvantage?: boolean
  hagglerFeat?: boolean
}

/** Effective neutral-karma price after modifiers. Never below 1 (a sink is never free). */
export function effectivePrice(item: MedicineItem, mods: PriceModifiers = {}): number {
  let p = item.priceKarma
  if (mods.shopDiscountAdvantage) p *= 0.8
  if (mods.hagglerFeat) p *= 0.85
  return Math.max(1, Math.round(p))
}

export interface PurchaseQuote {
  affordable: boolean
  price: number          // effective price after modifiers
  shortfall: number      // karma still needed (0 when affordable)
}

/**
 * Quote a purchase against the player's current neutral karma. PURE — decides only
 * whether it's affordable and at what price; the caller runs handleSpendKarma(price)
 * and then increments the dose counter. No mutation, no minting.
 */
export function quotePurchase(item: MedicineItem, neutralKarma: number, mods: PriceModifiers = {}): PurchaseQuote {
  const price = effectivePrice(item, mods)
  const affordable = neutralKarma >= price
  return { affordable, price, shortfall: affordable ? 0 : price - neutralKarma }
}
