/**
 * Wagonwright repair must move wagon condition, not a dummy spareParts 0.
 *   npx tsx src/app/oregon-trail/state/specialtyRepair.test.ts
 */
import { readFileSync } from 'node:fs'
import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'
import type { OregonTrailState } from './types'
import {
  SPECIALTY_BENCH_REFUSE,
  SPECIALTY_SHOPS,
  specialtyEffectDelivers,
  specialtySpokenEffect,
} from '../data/specialtyShops'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}`) }
}

const src = readFileSync(new URL('../components/SpecialtyShop.tsx', import.meta.url), 'utf8')
const shops = readFileSync(new URL('../data/specialtyShops.ts', import.meta.url), 'utf8')
const block = src.slice(src.indexOf("case 'wagon_repair'"), src.indexOf("case 'wagon_upgrade'"))

ok(/repairWagon\(\)/.test(block), 'wagonwright calls repairWagon')
ok(/buySupplies\('spareParts', ticks, 0\)/.test(block), 'taco job issues the parts it then spends')
ok(!/buySupplies\('spareParts', 0, 0\)/.test(src), 'dummy spareParts 0 is gone')
ok(/wagonCondition >= 100/.test(src), 'does not charge when the wagon is already sound')

let s = { ...DEFAULT_STATE, wagonCondition: 40, spareParts: 0 }
s = gameReducer(s, { type: 'BUY_SUPPLIES', resource: 'spareParts', amount: 2, cost: 0 })
s = gameReducer(s, { type: 'REPAIR_WAGON' })
s = gameReducer(s, { type: 'REPAIR_WAGON' })
ok(s.wagonCondition === 90, 'two ticks 40→90')
ok(s.spareParts === 0, 'issued parts were spent')

const full = gameReducer(
  { ...DEFAULT_STATE, wagonCondition: 100, spareParts: 1 },
  { type: 'REPAIR_WAGON' },
)
ok(full.wagonCondition === 100 && full.spareParts === 1, 'sound wagon is a no-op')

ok(specialtyEffectDelivers('wagon_repair'), 'repair delivers')
ok(specialtyEffectDelivers('health_restore'), 'elixir delivers')
ok(specialtyEffectDelivers('resource_add'), 'spare wheels deliver')
ok(specialtyEffectDelivers('stat_buff'), 'stat tonic delivers')
ok(specialtyEffectDelivers('cure_sickness'), 'tincture delivers')
ok(!/prevents cholera for 10 days/.test(shops), 'cholera copy does not promise 10-day immunity')
ok(!/immunity for 7 days/.test(shops), 'antivenom copy does not promise 7-day immunity')
ok(!/recovery time by 3 days/.test(shops), 'willow copy does not promise a 3-day recovery cut')
ok((shops.match(/Clears sickness in the living party\./g) || []).length === 3, 'three cure items speak the same delivery')
ok(/cureSickness\(\)/.test(src), 'apothecary calls cureSickness')
ok(/Nobody is sick/.test(src), 'does not charge when nobody is sick')

const illStart: OregonTrailState = {
  ...DEFAULT_STATE,
  party: [
    { id: 'ada', name: 'Ada', health: 40, isSick: true, sicknessType: 'cholera', role: 'leader' },
    { id: 'cole', name: 'Cole', health: 0, isSick: true, role: 'companion' },
  ],
}
const ill = gameReducer(illStart, { type: 'CURE_SICKNESS' })
ok(ill.party[0].isSick === false && ill.party[0].sicknessType === undefined, 'living sick is cleared')
ok(ill.party[1].isSick === true && ill.party[1].health === 0, 'dead stay as they were')
const well = gameReducer(
  { ...DEFAULT_STATE, party: [{ id: 'ada', name: 'Ada', health: 80, isSick: false, role: 'leader' as const }] },
  { type: 'CURE_SICKNESS' },
)
ok(well.party[0].isSick === false && well.message !== 'The tincture takes. The fever breaks.', 'nobody sick is a no-op')
ok(!specialtyEffectDelivers('oxen_heal'), 'yoke does not yet move oxen')
ok(!specialtyEffectDelivers('wagon_upgrade'), 'iron axle does not yet raise a max')
ok(!specialtyEffectDelivers('speed_boost'), 'grease does not yet add a pace buff')
ok(!specialtyEffectDelivers('special'), 'special wares do not yet move state')
ok(/Not on the bench tonight/.test(src), 'undelivered goods refuse the purse')
ok(src.indexOf('specialtyEffectDelivers') < src.indexOf('spendNeutral'), 'refuse before charge')
ok(/delivers \?/.test(src), 'green mechanical line is gated on delivers')
ok(/delivers && item\.effect\.duration/.test(src), 'duration days only when the ware delivers')

const undelivered = SPECIALTY_SHOPS.flatMap((s) => s.items).filter(
  (i) => !specialtyEffectDelivers(i.effect.type),
)
ok(undelivered.length >= 11, 'wagonwright/apothecary/outfitter/assayer/blacksmith leftovers exist')
ok(
  undelivered.every((i) => i.effect.description === SPECIALTY_BENCH_REFUSE),
  'undelivered catalog copy is the bench refuse',
)
ok(
  specialtySpokenEffect({
    type: 'speed_boost',
    value: 10,
    description: '+10% travel speed for 5 days',
  }) === SPECIALTY_BENCH_REFUSE,
  'spoken grease line stays refuse even if data lies',
)
ok(
  specialtySpokenEffect({
    type: 'wagon_upgrade',
    value: 15,
    description: '+15 max wagon durability (permanent upgrade)',
  }) === SPECIALTY_BENCH_REFUSE,
  'spoken axle line stays refuse even if data lies',
)
ok(
  specialtySpokenEffect({
    type: 'oxen_heal',
    value: 2,
    description: 'Oxen health improved, reduces oxen death chance by 50%',
  }) === SPECIALTY_BENCH_REFUSE,
  'spoken yoke line stays refuse even if data lies',
)
ok(
  specialtySpokenEffect({
    type: 'special',
    value: 10,
    description: '50% disease resistance for entire party for 10 days',
  }) === SPECIALTY_BENCH_REFUSE,
  'spoken tonic line stays refuse even if data lies',
)
ok(
  specialtySpokenEffect({
    type: 'cure_sickness',
    value: 1,
    description: 'Clears sickness in the living party.',
  }) === 'Clears sickness in the living party.',
  'delivered tincture still speaks the fever that breaks',
)
ok(!/\+10% travel speed for 5 days/.test(shops), 'grease catalog does not promise a pace buff')
ok(!/\+15 max wagon durability/.test(shops), 'axle catalog does not promise a durability raise')
ok(!/oxen death chance/.test(shops), 'yoke catalog does not promise oxen survival')
ok(!/50% disease resistance for entire party/.test(shops), 'tonic catalog does not promise 10-day immunity')

console.log(`\nspecialty-repair tests: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
