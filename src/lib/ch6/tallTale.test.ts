/**
 * Chapter 6 — Truth / Stretcher / Whopper judge.
 *   npx tsx src/lib/ch6/tallTale.test.ts
 */
import { readFileSync } from 'node:fs'
import { judgeTale, reasoningFor, isTaleCall, LIARS_BENCH_TALES, REASONING_STEP, TALE_CALLS, type Tale } from './tallTale'

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })

const tale: Tale = { id: 't', telling: 'x', answer: 'stretcher', why: 'because', source: 's' }

check('three calls: truth, stretcher, whopper', TALE_CALLS.join(',') === 'truth,stretcher,whopper')
check('a right call earns +25', judgeTale(tale, 'stretcher').reasoningDelta === 25 && judgeTale(tale, 'stretcher').right)
check('a wrong call costs 25', judgeTale(tale, 'truth').reasoningDelta === -25 && !judgeTale(tale, 'truth').right)
check('the step is 25', REASONING_STEP === 25)
check('the verdict always tells the honest record', judgeTale(tale, 'whopper').why === 'because' && judgeTale(tale, 'whopper').answer === 'stretcher')
for (const junk of [undefined, null, '', 'Stretcher', 'STRETCHER', 'lie', 1, {}]) {
  check(`an unrecognised call (${JSON.stringify(junk)}) is wrong, never right`, !judgeTale(tale, junk).right && judgeTale(tale, junk).reasoningDelta === -25)
}
check('isTaleCall accepts only the three calls', isTaleCall('truth') && !isTaleCall('maybe') && !isTaleCall(3))

const [a, b, c] = LIARS_BENCH_TALES
check('reasoning sums right and wrong calls', reasoningFor([{ tale: a, call: a.answer }, { tale: b, call: b.answer }, { tale: c, call: 'truth' }]) === 25)
check('the same tale cannot be judged twice for extra reasoning',
  reasoningFor([{ tale: a, call: a.answer }, { tale: a, call: a.answer }, { tale: a, call: a.answer }]) === 25)

// The tutorial set.
check('the Liar\'s Bench teaches one of each call',
  [...LIARS_BENCH_TALES.map(t => t.answer)].sort().join(',') === 'stretcher,truth,whopper', LIARS_BENCH_TALES.map(t => t.answer))
check('every tale cites a verified source', LIARS_BENCH_TALES.every(t => t.source.startsWith('05 §') && t.why.length > 20))
check('tale ids are unique', new Set(LIARS_BENCH_TALES.map(t => t.id)).size === LIARS_BENCH_TALES.length)
check('the unverified "near the state capital" draft is not used', !LIARS_BENCH_TALES.some(t => /capital/i.test(t.telling)))
check('the tales are frozen', Object.isFrozen(LIARS_BENCH_TALES) && LIARS_BENCH_TALES.every(t => Object.isFrozen(t)))

// Reasoning is not currency: the judge must not reach the karma ledger.
const src = readFileSync(new URL('./tallTale.ts', import.meta.url), 'utf8')
const imports = src.split('\n').filter(l => /^\s*import\b/.test(l))
check('tallTale imports nothing (no karma, no ledger, no storage)', imports.length === 0, imports)

const failed = results.filter(r => !r.pass)
for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.name}${r.pass ? '' : ` — ${JSON.stringify(r.detail)}`}`)
console.log(failed.length === 0 ? `\ntallTale: ALL ${results.length} PASS` : `\ntallTale: ${failed.length} FAILURE(S)`)
process.exit(failed.length === 0 ? 0 : 1)
