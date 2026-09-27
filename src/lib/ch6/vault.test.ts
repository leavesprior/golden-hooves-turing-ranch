/**
 * Chapter 6 vault — combination from VERIFIED landmark numbers + the 1864-06-30 dial.
 *   npx tsx src/lib/ch6/vault.test.ts
 */
import { VAULT_PLACES, VAULT_DIAL, combinationFor, tryOpenVault } from './vault'

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })

const all = VAULT_PLACES.map(p => p.id)
const chl = (id: string) => VAULT_PLACES.find(p => p.id === id)?.chl

// The verified numbers (05_verification.md), one by one.
const verified: Record<string, number> = {
  sandy_gulch: 253, angels_camp: 287, san_andreas: 252, placerville: 475, mokelumne_hill: 269,
  columbia: 123, knights_ferry: 347, jamestown: 431, jackass_hill: 138,
}
for (const [id, n] of Object.entries(verified)) check(`${id} is CHL ${n}`, chl(id) === n, chl(id))
check('exactly the 9 verified places, nothing else', VAULT_PLACES.length === 9 && all.every(id => id in verified), all)
check('Knights Ferry is 347, never the book\'s 415 (415 is Willms Ranch)', chl('knights_ferry') === 347)
check('415 appears nowhere in the vault', !VAULT_PLACES.some(p => p.chl === 415))
check('the table is frozen', Object.isFrozen(VAULT_PLACES) && Object.isFrozen(VAULT_PLACES[0]))

const full = combinationFor(all)
check('all nine places give the full combination in leg order',
  full.ok && full.combination.join(',') === '253,287,252,475,269,123,347,431,138', full)

const shuffled = combinationFor(['jackass_hill', 'sandy_gulch', 'columbia'])
check('the order of visits does not matter — leg order does',
  shuffled.ok && shuffled.combination.join(',') === '253,123,138', shuffled)

check('an unknown place is refused', (() => { const r = combinationFor(['sonora']); return !r.ok && r.reason === 'unknown_place' })())
check('a duplicate place is refused', (() => { const r = combinationFor(['columbia', 'columbia']); return !r.ok && r.reason === 'duplicate_place' })())
check('no places is refused', (() => { const r = combinationFor([]); return !r.ok && r.reason === 'no_places' })())

check('the dial is June 30, 1864', VAULT_DIAL.year === 1864 && VAULT_DIAL.month === 6 && VAULT_DIAL.day === 30)

const right = { numbers: [253, 287, 252, 475, 269, 123, 347, 431, 138], dial: { year: 1864, month: 6, day: 30 } }
check('the right numbers and the right date open it', tryOpenVault(all, right))
check('the book\'s 415 for Knights Ferry does not open it',
  !tryOpenVault(all, { ...right, numbers: [253, 287, 252, 475, 269, 123, 415, 431, 138] }))
check('the right numbers in the wrong order do not open it',
  !tryOpenVault(all, { ...right, numbers: [287, 253, 252, 475, 269, 123, 347, 431, 138] }))
check('a missing number does not open it', !tryOpenVault(all, { ...right, numbers: right.numbers.slice(0, 8) }))
check('an extra number does not open it', !tryOpenVault(all, { ...right, numbers: [...right.numbers, 1] }))
check('July 1, 1864 (the day Staples was killed) does not open it',
  !tryOpenVault(all, { ...right, dial: { year: 1864, month: 7, day: 1 } }))
check('June 30, 1865 does not open it', !tryOpenVault(all, { ...right, dial: { year: 1865, month: 6, day: 30 } }))
check('an unknown place never opens it', !tryOpenVault(['nowhere'], { numbers: [], dial: right.dial }))

const failed = results.filter(r => !r.pass)
for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.name}${r.pass ? '' : ` — ${JSON.stringify(r.detail)}`}`)
console.log(failed.length === 0 ? `\nvault: ALL ${results.length} PASS` : `\nvault: ${failed.length} FAILURE(S)`)
process.exit(failed.length === 0 ? 0 : 1)
