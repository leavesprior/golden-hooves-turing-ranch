/**
 * Chapter 6 — the Toy Board, a carved wooden checkerboard toy with 12 pieces.
 * Three squares start empty; legs of the journey recover the missing pieces.
 * Carved on the underside: "Where the wall meets the post, the circle breaks."
 *
 * Pure state: every function returns a new board and never mutates its input.
 */

// The 12 symbols, verbatim from 03_level_design.md ("The MacGuffin").
export const BOARD_SYMBOLS = Object.freeze([
  'red_barn', 'wave', 'dome', 'frog', 'fish', 'white_horse',
  'horseshoe', 'bell', 'pitcher', 'cannonball_stack', 'knight', 'pawn',
] as const)

export type BoardSymbol = (typeof BOARD_SYMBOLS)[number]

export const BOARD_UNDERSIDE = 'Where the wall meets the post, the circle breaks.'
export const EMPTY_SQUARES = 3

// _conf=-1: the design fixes only the bell (Columbia recovers the Highway
// Bell's lost clapper). Knight (the finale symbol) and pawn (San Andreas,
// Black Bart) are PROVISIONAL picks until the leg design names the other two.
export const DEFAULT_MISSING: readonly BoardSymbol[] = Object.freeze(['bell', 'knight', 'pawn'])

export interface ToyBoard {
  placed: readonly BoardSymbol[] // board order
  missing: readonly BoardSymbol[]
}

export function isBoardSymbol(value: unknown): value is BoardSymbol {
  return typeof value === 'string' && (BOARD_SYMBOLS as readonly string[]).includes(value)
}

/** A new board with exactly three distinct board symbols missing. */
export function createBoard(missing: readonly BoardSymbol[] = DEFAULT_MISSING): ToyBoard {
  const unique = new Set(missing)
  if (missing.length !== EMPTY_SQUARES || unique.size !== EMPTY_SQUARES || !missing.every(isBoardSymbol)) {
    throw new Error(`a toy board starts with exactly ${EMPTY_SQUARES} distinct missing symbols`)
  }
  return {
    placed: Object.freeze(BOARD_SYMBOLS.filter(s => !unique.has(s))),
    missing: Object.freeze(BOARD_SYMBOLS.filter(s => unique.has(s))),
  }
}

export type RecoverResult =
  | { ok: true; board: ToyBoard }
  | { ok: false; reason: 'not_a_piece' | 'already_placed' }

/** Put a recovered piece back. Only a piece that is actually missing fits. */
export function recoverPiece(board: ToyBoard, piece: unknown): RecoverResult {
  if (!isBoardSymbol(piece)) return { ok: false, reason: 'not_a_piece' }
  if (!board.missing.includes(piece)) return { ok: false, reason: 'already_placed' }
  const placed = new Set([...board.placed, piece])
  return {
    ok: true,
    board: {
      placed: Object.freeze(BOARD_SYMBOLS.filter(s => placed.has(s))),
      missing: Object.freeze(board.missing.filter(s => s !== piece)),
    },
  }
}

export function emptySquares(board: ToyBoard): number {
  return board.missing.length
}

export function isComplete(board: ToyBoard): boolean {
  return board.missing.length === 0 && board.placed.length === BOARD_SYMBOLS.length
}
