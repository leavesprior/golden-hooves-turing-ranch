/**
 * One S.A.D.D.L.E. point move. Pure so rapid clicks cannot overshoot remaining.
 */

export function applySaddleAdjust<T extends Record<string, number>>(
  stats: T,
  remaining: number,
  stat: keyof T & string,
  delta: number,
  minValue: number,
  maxValue = 18,
): { stats: T; remaining: number } | null {
  if (delta !== 1 && delta !== -1) return null
  const current = stats[stat]
  if (typeof current !== 'number') return null
  const nextVal = current + delta
  if (nextVal < minValue || nextVal > maxValue) return null
  if (delta > 0 && remaining <= 0) return null
  if (delta < 0 && current <= minValue) return null
  return {
    stats: { ...stats, [stat]: nextVal },
    remaining: remaining - delta,
  }
}
