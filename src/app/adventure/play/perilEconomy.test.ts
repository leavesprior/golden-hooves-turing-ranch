// Tests for the medicine economy (2026-07-03). Pure — no wallet/DOM. Run via `npm test`.

import { MEDICINE_CATALOG, findMedicine, effectivePrice, quotePurchase } from './perilEconomy'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ✓ ${name}`)
  else { failures++; console.error(`  ✗ ${name}${detail ? ' — ' + detail : ''}`) }
}

console.log('perilEconomy')

// --- catalog integrity ---
check('catalog is non-empty and cheapest→dearest is sane',
  MEDICINE_CATALOG.length >= 3 && Math.min(...MEDICINE_CATALOG.map(m => m.priceKarma)) >= 1)
check('every dose actually reduces severity', MEDICINE_CATALOG.every(m => m.severityReduction >= 1))
check('disease/venom specialists exist', MEDICINE_CATALOG.some(m => m.bestFor === 'fever') && MEDICINE_CATALOG.some(m => m.bestFor === 'snakebite'))
check('findMedicine resolves + misses cleanly', findMedicine('trail_tonic')?.priceKarma === 2 && findMedicine('nope') === undefined)
check('prices are affordable vs 400 starting karma (all < 20)', MEDICINE_CATALOG.every(m => m.priceKarma < 20))

// --- price modifiers ---
const laud = findMedicine('laudanum')! // 8
check('no modifiers = list price', effectivePrice(laud) === 8)
check('shop-discount advantage takes 20%', effectivePrice(laud, { shopDiscountAdvantage: true }) === 6)
check('haggler feat stacks further', effectivePrice(laud, { shopDiscountAdvantage: true, hagglerFeat: true }) === 5)
const tonic = findMedicine('trail_tonic')! // 2
check('a sink is never free (floors at 1)', effectivePrice(tonic, { shopDiscountAdvantage: true, hagglerFeat: true }) >= 1)

// --- purchase quote (pure affordability, no mutation) ---
const q1 = quotePurchase(laud, 400)
check('rich player can afford', q1.affordable && q1.price === 8 && q1.shortfall === 0)
const q2 = quotePurchase(laud, 5)
check('broke player is quoted a shortfall, not charged', !q2.affordable && q2.shortfall === 3)
const q3 = quotePurchase(laud, 6, { shopDiscountAdvantage: true })
check('discount can make an unaffordable dose affordable', q3.affordable && q3.price === 6)

console.log(failures === 0 ? '\nperilEconomy: ALL PASS' : `\nperilEconomy: ${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
