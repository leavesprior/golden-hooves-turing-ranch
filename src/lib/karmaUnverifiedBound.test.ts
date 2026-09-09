/**
 * Unverified play bound. Prints JSON for wheelwright.
 *   npx tsx src/lib/karmaUnverifiedBound.test.ts
 */
import { UNVERIFIED_MAX_ABS_DELTA, withinUnverifiedBound, allowedLedgerDelta } from './karmaUnverifiedBound'

const play = [
  { n: 390, want: true },
  { n: 1000, want: true },
  { n: 1001, want: false },
  { n: -390, want: true },
  { n: -1001, want: false },
  { n: Number.NaN, want: false },
]
const ledger = [
  { n: 1200, want: true },
  { n: -1200, want: true },
  { n: 2000, want: true },
  { n: 3000, want: true },
  { n: 1001, want: false },
  { n: 3001, want: false },
]

const playResults = play.map((c) => {
  const got = withinUnverifiedBound(c.n)
  return { kind: 'debt_or_play', ...c, got, pass: got === c.want }
})
const ledgerResults = ledger.map((c) => {
  const got = allowedLedgerDelta(c.n)
  return { kind: 'ledger', ...c, got, pass: got === c.want }
})
const results = [...playResults, ...ledgerResults]

const report = {
  ok: UNVERIFIED_MAX_ABS_DELTA === 1000 && results.every((r) => r.pass),
  bound: UNVERIFIED_MAX_ABS_DELTA,
  results,
  _conf: 1,
}
console.log(JSON.stringify(report, null, 2))
if (!report.ok) process.exit(1)
