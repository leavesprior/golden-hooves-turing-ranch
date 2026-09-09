/** Names the rest verb. Does not rest. Guest still has to click Inn and pick a room. */

export function townInnWhisper(input: {
  minHealth: number
  landmark: string
  distance: number
}): string | null {
  if (Number.isFinite(input.minHealth) && input.minHealth < 75) return 'The rest that lasts'
  if (input.distance === 0 && /Independence/i.test(input.landmark || '')) return 'First night'
  return null
}
