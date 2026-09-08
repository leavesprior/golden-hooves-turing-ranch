/** One click sells one shop batch (food 50 lb, ammo 20 rd, oxen 1 head).
 * Returns 0 when that lot would floor to 0 tacos — do not no-op the pill. */
export function defaultSellAmount(sellPrice: number, quantity: number, stock: number): number {
  const lot = Math.min(quantity, Math.max(0, stock))
  if (lot <= 0) return 0
  if (Math.floor(sellPrice * lot) <= 0) return 0
  return lot
}
