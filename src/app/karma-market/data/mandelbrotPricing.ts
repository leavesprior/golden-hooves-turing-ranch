/**
 * Mandelbrot Pricing Engine for the Karma Marketplace
 *
 * Uses Mandelbrot set escape-time iterations to drive exponential price hikes
 * for good/bad karma. Neutral karma stays flat-rate.
 *
 * Each purchase shifts the complex parameter `c` along a spiral path toward
 * the Mandelbrot boundary. Deeper = more expensive. Good karma spirals inward
 * (tends expensive), bad karma spirals outward (volatile).
 *
 * Reset: after 50 units or 24 hours, `c` resets to a curated starting point.
 */

export interface MandelbrotPricingState {
  /** Current real component of c */
  cReal: number
  /** Current imaginary component of c */
  cImag: number
  /** Total units of good karma purchased this epoch */
  goodUnitsPurchased: number
  /** Total units of bad karma purchased this epoch */
  badUnitsPurchased: number
  /** Epoch start timestamp (ms) */
  epochStart: number
  /** Base price in neutral karma per unit */
  basePrice: number
  /** Price history: { timestamp, goodPrice, badPrice } */
  priceHistory: PricePoint[]
}

export interface PricePoint {
  timestamp: number
  goodPrice: number
  badPrice: number
  neutralPrice: number
}

// Curated starting points on the Mandelbrot boundary
const STARTING_POINTS = [
  { name: 'Seahorse Valley', cReal: -0.75, cImag: 0.1 },
  { name: 'Spiral Arm', cReal: -0.4, cImag: 0.6 },
  { name: 'Elephant Valley', cReal: 0.28, cImag: 0.008 },
  { name: 'Mini-brot Fringe', cReal: -1.75, cImag: 0.01 },
  { name: 'Antenna Tip', cReal: -0.1, cImag: 0.65 },
]

const MAX_ITERATIONS = 100
const ESCAPE_RADIUS = 2
const EPOCH_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours
const EPOCH_UNIT_LIMIT = 50
const BASE_NEUTRAL_RATE = 10 // 10 neutral karma per dollar base
const FLAT_NEUTRAL_PRICE = 1 // 1:1 for neutral purchases

/**
 * Count Mandelbrot escape iterations for a given c value
 */
function escapeIterations(cReal: number, cImag: number): number {
  let zReal = 0
  let zImag = 0
  let iteration = 0

  while (iteration < MAX_ITERATIONS) {
    const zRealSquared = zReal * zReal
    const zImagSquared = zImag * zImag

    if (zRealSquared + zImagSquared > ESCAPE_RADIUS * ESCAPE_RADIUS) {
      return iteration
    }

    const newZReal = zRealSquared - zImagSquared + cReal
    zImag = 2 * zReal * zImag + cImag
    zReal = newZReal
    iteration++
  }

  return MAX_ITERATIONS // Inside the set
}

/**
 * Map escape iterations to a price multiplier (1x-10x)
 */
function iterationsToMultiplier(iterations: number): number {
  if (iterations >= MAX_ITERATIONS) {
    return 10 // Inside the set = maximum price
  }
  // Map 0..MAX_ITERATIONS to 1..10 with exponential curve
  const normalized = iterations / MAX_ITERATIONS
  return 1 + 9 * Math.pow(normalized, 1.5)
}

/**
 * Get a random starting point for a new epoch
 */
function getStartingPoint(): { cReal: number; cImag: number; name: string } {
  const idx = Math.floor(Math.random() * STARTING_POINTS.length)
  return STARTING_POINTS[idx]
}

/**
 * Check if epoch has expired (24h or 50 units)
 */
function isEpochExpired(state: MandelbrotPricingState): boolean {
  const now = Date.now()
  const totalUnits = state.goodUnitsPurchased + state.badUnitsPurchased
  return (now - state.epochStart > EPOCH_DURATION_MS) || (totalUnits >= EPOCH_UNIT_LIMIT)
}

/**
 * Create initial pricing state
 */
export function createInitialPricingState(): MandelbrotPricingState {
  const start = getStartingPoint()
  return {
    cReal: start.cReal,
    cImag: start.cImag,
    goodUnitsPurchased: 0,
    badUnitsPurchased: 0,
    epochStart: Date.now(),
    basePrice: BASE_NEUTRAL_RATE,
    priceHistory: [],
  }
}

/**
 * Reset state for a new epoch
 */
function resetEpoch(state: MandelbrotPricingState): MandelbrotPricingState {
  const start = getStartingPoint()
  return {
    ...state,
    cReal: start.cReal,
    cImag: start.cImag,
    goodUnitsPurchased: 0,
    badUnitsPurchased: 0,
    epochStart: Date.now(),
    // Keep price history
  }
}

/**
 * Calculate the current price for a karma type
 */
export function calculatePrice(
  state: MandelbrotPricingState,
  karmaType: 'good' | 'bad' | 'neutral'
): number {
  if (karmaType === 'neutral') return FLAT_NEUTRAL_PRICE

  // Check epoch expiry
  const currentState = isEpochExpired(state) ? resetEpoch(state) : state

  const iterations = escapeIterations(currentState.cReal, currentState.cImag)
  const multiplier = iterationsToMultiplier(iterations)

  return Math.round(currentState.basePrice * multiplier)
}

/**
 * Advance the c parameter after a purchase.
 * Good karma spirals inward (toward boundary), bad karma spirals outward (volatile).
 */
export function advanceState(
  state: MandelbrotPricingState,
  karmaType: 'good' | 'bad'
): MandelbrotPricingState {
  // Check epoch expiry first
  let newState = isEpochExpired(state) ? resetEpoch(state) : { ...state }

  const step = 0.02 // Small step per purchase

  if (karmaType === 'good') {
    // Spiral inward toward the boundary (more expensive over time)
    const angle = Math.atan2(newState.cImag, newState.cReal + 0.5) + 0.3
    const radius = Math.sqrt(
      (newState.cReal + 0.5) ** 2 + newState.cImag ** 2
    )
    const newRadius = Math.max(0.01, radius - step * 0.5)
    newState.cReal = newRadius * Math.cos(angle) - 0.5
    newState.cImag = newRadius * Math.sin(angle)
    newState.goodUnitsPurchased++
  } else {
    // Spiral outward (volatile — sometimes cheaper, sometimes expensive)
    const angle = Math.atan2(newState.cImag, newState.cReal + 0.5) - 0.4
    const radius = Math.sqrt(
      (newState.cReal + 0.5) ** 2 + newState.cImag ** 2
    )
    const newRadius = radius + step * 0.3
    newState.cReal = newRadius * Math.cos(angle) - 0.5
    newState.cImag = newRadius * Math.sin(angle)
    newState.badUnitsPurchased++
  }

  // Record price point
  const goodPrice = calculatePrice(newState, 'good')
  const badPrice = calculatePrice(newState, 'bad')
  const pricePoint: PricePoint = {
    timestamp: Date.now(),
    goodPrice,
    badPrice,
    neutralPrice: FLAT_NEUTRAL_PRICE,
  }

  newState.priceHistory = [
    ...newState.priceHistory.slice(-199),
    pricePoint,
  ]

  return newState
}

/**
 * Preview next price without advancing state
 */
export function getNextPrice(
  state: MandelbrotPricingState,
  karmaType: 'good' | 'bad'
): number {
  const previewState = advanceState(state, karmaType)
  return calculatePrice(previewState, karmaType)
}

/**
 * Get current prices for display
 */
export function getCurrentPrices(state: MandelbrotPricingState): {
  good: number
  bad: number
  neutral: number
} {
  return {
    good: calculatePrice(state, 'good'),
    bad: calculatePrice(state, 'bad'),
    neutral: FLAT_NEUTRAL_PRICE,
  }
}

/**
 * Get the current Mandelbrot iteration count (for visualizer)
 */
export function getCurrentIterations(state: MandelbrotPricingState): number {
  return escapeIterations(state.cReal, state.cImag)
}

/**
 * Generate a small Mandelbrot set image data for visualization
 */
export function generateMandelbrotData(
  centerReal: number,
  centerImag: number,
  size: number = 80,
  zoom: number = 2.5
): number[][] {
  const data: number[][] = []
  const halfZoom = zoom / 2

  for (let y = 0; y < size; y++) {
    const row: number[] = []
    for (let x = 0; x < size; x++) {
      const cReal = centerReal + (x / size - 0.5) * zoom - halfZoom * 0.3
      const cImag = centerImag + (y / size - 0.5) * zoom
      row.push(escapeIterations(cReal, cImag))
    }
    data.push(row)
  }

  return data
}

/**
 * Get the epoch info for display
 */
export function getEpochInfo(state: MandelbrotPricingState): {
  unitsRemaining: number
  timeRemainingMs: number
  isExpired: boolean
} {
  const totalUnits = state.goodUnitsPurchased + state.badUnitsPurchased
  const elapsed = Date.now() - state.epochStart

  return {
    unitsRemaining: Math.max(0, EPOCH_UNIT_LIMIT - totalUnits),
    timeRemainingMs: Math.max(0, EPOCH_DURATION_MS - elapsed),
    isExpired: isEpochExpired(state),
  }
}
