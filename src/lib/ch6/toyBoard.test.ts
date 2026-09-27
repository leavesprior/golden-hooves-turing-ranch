/**
 * Chapter 6 — Toy Board state: 12 symbols, 3 empty squares, piece recovery.
 *   npx tsx src/lib/ch6/toyBoard.test.ts
 */
import { BOARD_SYMBOLS, DEFAULT_MISSING, EMPTY_SQUARES, BOARD_UNDERSIDE, createBoard, recoverPiece, emptySquares, isComplete, type ToyBoard } from './toyBoard'

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })
const throws = (fn: () => unknown) => { try { fn(); return false } catch { return true } }

check('12 pieces', BOARD_SYMBOLS.length === 12 && new Set(BOARD_SYMBOLS).size === 12)
check('the symbols are the design\'s, in its order',
  BOARD_SYMBOLS.join(',') === 'red_barn,wave,dome,frog,fish,white_horse,horseshoe,bell,pitcher,cannonball_stack,knight,pawn')
check('the underside reads the carved line', BOARD_UNDERSIDE === 'Where the wall meets the post, the circle breaks.')

const board = createBoard()
check('a new board has exactly 3 empty squares', emptySquares(board) === 3 && EMPTY_SQUARES === 3)
check('a new board holds the other 9 pieces', board.placed.length === 9)
check('the bell is missing (Columbia recovers its clapper)', board.missing.includes('bell'))
check('by default the missing three are the default set', board.missing.join(',') === [...DEFAULT_MISSING].sort((x, y) => BOARD_SYMBOLS.indexOf(x) - BOARD_SYMBOLS.indexOf(y)).join(','))
check('a new board is not complete', !isComplete(board))
check('placed and missing never overlap and together make all 12',
  board.placed.every(s => !board.missing.includes(s)) && board.placed.length + board.missing.length === 12)

check('two missing is refused', throws(() => createBoard(['bell', 'knight'])))
check('four missing is refused', throws(() => createBoard(['bell', 'knight', 'pawn', 'frog'])))
check('a repeated missing symbol is refused', throws(() => createBoard(['bell', 'bell', 'pawn'])))
check('an unknown missing symbol is refused', throws(() => createBoard(['bell', 'pawn', 'teapot' as never])))
check('another valid missing set works', emptySquares(createBoard(['frog', 'wave', 'fish'])) === 3)

const r1 = recoverPiece(board, 'bell')
check('recovering a missing piece fills one square', r1.ok && emptySquares(r1.board) === 2 && r1.board.placed.includes('bell'))
check('recovery keeps board order', r1.ok && r1.board.placed.join(',') === BOARD_SYMBOLS.filter(s => s !== 'knight' && s !== 'pawn').join(','))
check('recovery does not change the old board', emptySquares(board) === 3 && !board.placed.includes('bell'))
check('recovering a piece already on the board is refused', (() => { const r = recoverPiece(board, 'frog'); return !r.ok && r.reason === 'already_placed' })())
check('recovering the same piece twice is refused', r1.ok && (() => { const r = recoverPiece(r1.board, 'bell'); return !r.ok && r.reason === 'already_placed' })())
for (const junk of ['Bell', 'clapper', '', undefined, 7]) {
  check(`recovering ${JSON.stringify(junk)} is refused as not a piece`, (() => { const r = recoverPiece(board, junk); return !r.ok && r.reason === 'not_a_piece' })())
}

let b: ToyBoard = board
for (const p of [...board.missing]) { const r = recoverPiece(b, p); if (r.ok) b = r.board }
check('recovering all three completes the board', isComplete(b) && emptySquares(b) === 0 && b.placed.join(',') === BOARD_SYMBOLS.join(','))
check('a board is frozen', Object.isFrozen(board.placed) && Object.isFrozen(board.missing))

const failed = results.filter(r => !r.pass)
for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.name}${r.pass ? '' : ` — ${JSON.stringify(r.detail)}`}`)
console.log(failed.length === 0 ? `\ntoyBoard: ALL ${results.length} PASS` : `\ntoyBoard: ${failed.length} FAILURE(S)`)
process.exit(failed.length === 0 ? 0 : 1)
