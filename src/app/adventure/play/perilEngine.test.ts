// Tests for the survivable peril engine (2026-07-02). Verifies both the pure
// mechanics AND the tuning intent: a careful player recovers, an heedless one
// can die, and death yields a successor legacy rather than a hard wipe.
// Run by `npm test` (tsx). Pure logic — no DOM, no storage, no RNG.

import {
  initPeril, inflict, tick, treatWithMedicine, rest, isDead, successorLegacy,
  maxVitalityForDurability, describeCondition, narrateCondition, stabilize, isDying,
  DEFAULT_PERIL_CONFIG as CFG, CLASSIC_PERIL_CONFIG as CLASSIC,
} from './perilEngine'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) { console.log(`  ✓ ${name}`) }
  else { failures++; console.error(`  ✗ ${name}${detail ? ' — ' + detail : ''}`) }
}

console.log('perilEngine')

// --- init / vitality ceiling ---
check('Durability 8 → base max vitality', maxVitalityForDurability(8) === CFG.baseMaxVitality)
check('higher Durability raises the ceiling', maxVitalityForDurability(12) > maxVitalityForDurability(8))
check('vitality has a floor of 20', maxVitalityForDurability(0) === 20)
const fresh = initPeril(8)
check('fresh state is full + alive + unafflicted', fresh.vitality === fresh.maxVitality && fresh.alive && fresh.conditions.length === 0)

// --- inflict + mitigations ---
const bitten = inflict(fresh, 'snakebite', 2)
check('inflict adds the condition', bitten.conditions.some(c => c.id === 'snakebite' && c.severity === 2))
check('inflict does not mutate the input', fresh.conditions.length === 0)
const immune = inflict(fresh, 'fever', 3, { immuneToDisease: true })
check('immunity negates disease entirely', immune.conditions.length === 0)
const hardened = inflict(fresh, 'snakebite', 1, { trailHardened: true })
check('trail-hardened can shrug off a mild travel peril', hardened.conditions.length === 0)
const hardened2 = inflict(fresh, 'injury', 3, { trailHardened: true })
check('trail-hardened lands travel perils one lighter', hardened2.conditions[0].severity === 2)
const restacked = inflict(inflict(fresh, 'fever', 1), 'fever', 3)
check('re-inflicting keeps the WORSE severity, no duplicate', restacked.conditions.length === 1 && restacked.conditions[0].severity === 3)

// --- careful player survives: reach camp, treat, rest ---
let careful = inflict(initPeril(8), 'snakebite', 2) // serious bite on the trail
careful = tick(careful) // one day of travel to camp
check('a serious condition does not kill in one tick', careful.alive && careful.vitality > 0)
const beforeMed = careful.vitality
careful = treatWithMedicine(careful, 'snakebite')
check('medicine clears a serious condition (reduction 2 ≥ severity 2)', !careful.conditions.some(c => c.id === 'snakebite'))
careful = rest(careful, 3)
check('resting restores vitality toward the ceiling', careful.vitality > beforeMed)
check('careful player is alive and healthy', careful.alive && careful.vitality === careful.maxVitality && careful.conditions.length === 0)

// --- heedless player can die: ignore a grave condition across many ticks ---
let heedless = inflict(initPeril(8), 'dysentery', 3) // grave, untreated
let ticks = 0
while (!isDead(heedless) && ticks < 100) { heedless = tick(heedless); ticks++ }
check('ignoring a grave condition eventually kills', isDead(heedless))
check('but death takes several ticks, not instant (survivable window)', ticks >= 4,
  `died after ${ticks} ticks`)
check('dead state clamps vitality to 0', heedless.vitality === 0)
check('tick on a dead state is a no-op', tick(heedless).vitality === 0 && !tick(heedless).alive)

// --- rest is time-heals: eases the WORST condition one level per day, so total
//     recovery scales with how hurt you are (grave+mild = 4 severity = 4 days).
//     Camp's 7-day budget comfortably covers even a stacked affliction. ---
let multi = initPeril(8)
multi = inflict(multi, 'fever', 3)
multi = inflict(multi, 'injury', 1)
const partly = rest(multi, 3)
check('three rest days clear the grave but leave the mild (triage)',
  partly.conditions.length === 1 && partly.conditions[0].id === 'injury' && partly.conditions[0].severity === 1)
const healed = rest(multi, 4)
check('four rest days clear a grave + mild pair', healed.conditions.length === 0)

// --- medicine no-ops on an absent condition ---
check('medicine on an absent condition is a no-op', treatWithMedicine(fresh, 'fever').conditions.length === 0)

// --- graded dying / stabilization window (Grok's highest-leverage change) ---
// Drive a character to 0 and confirm they enter the dying window, NOT death.
let brink = inflict(initPeril(8), 'dysentery', 3) // grave, drains 18/tick
while (brink.vitality > 0 && !brink.dying) brink = tick(brink)
check('reaching 0 vitality opens the dying window, not instant death', brink.dying && brink.alive && !isDead(brink))
check('isDying reflects the bleeding-out state', isDying(brink))
check('dying reserve is seeded from config', brink.dyingReserve === CFG.dyingReserve)

// A successful field-medicine check stabilizes: back to fragile-but-conscious.
const saved = stabilize(brink, true)
check('a successful stabilize pulls you out of dying', !saved.dying && saved.alive && !isDying(saved))
check('stabilize restores to the fragile footing', saved.vitality === CFG.stabilizeVitalityRestore)
check('the underlying condition still needs treating after stabilize', saved.conditions.some(c => c.id === 'dysentery'))

// A failed check is a no-op; ignored, the reserve bleeds out to true death.
check('a failed stabilize is a no-op (still dying)', stabilize(brink, false).dying === true)
check('stabilize on a healthy character is a no-op', stabilize(fresh, true) === fresh)
let bleeding = brink
let dyingTicks = 0
while (!isDead(bleeding) && dyingTicks < 20) { bleeding = tick(bleeding); dyingTicks++ }
check('an unstabilized dying character eventually bleeds out', isDead(bleeding))
check('but the dying window lasts more than one tick (a real chance to act)', dyingTicks >= 2,
  `bled out after ${dyingTicks} dying ticks`)

// Medicine and rest are the other two ways out of the brink.
const dosed = treatWithMedicine(brink, 'dysentery')
check('a medicine dose guarantees a save from dying', !dosed.dying && dosed.alive && dosed.vitality > 0)
const camped = rest(brink, 2)
check('camp rest pulls a dying character back', !camped.dying && camped.alive && camped.vitality > 0)

// --- Classic (hard) mode is genuinely spicier ---
check('classic mode drains faster than soft', CLASSIC.drainPerSeverityPerTick > CFG.drainPerSeverityPerTick)
check('classic mode has a thinner dying window', CLASSIC.dyingReserve < CFG.dyingReserve)
let cBrink = inflict(initPeril(8, CLASSIC), 'dysentery', 3)
while (cBrink.vitality > 0 && !cBrink.dying) cBrink = tick(cBrink, CLASSIC)
check('classic dying bleeds out in ~1 tick', isDead(tick(cBrink, CLASSIC)))

// --- successor legacy ---
const legacy = successorLegacy('Tobias Vane', 200)
check('successor inherits half the gold', legacy.inheritedGold === 100)
check('successor carries a reputation fraction', legacy.reputationFraction === CFG.successorReputationFraction)
check('heirloom trait encodes the fallen', legacy.heirloomTrait === 'heir_of_tobias_vane')
check('legacy handles empty name gracefully', successorLegacy('', 0).heirloomTrait === 'heir_of_the_fallen')

// --- describe (UI helper) ---
check('describeCondition reads naturally', describeCondition({ id: 'snakebite', severity: 2 }) === 'serious snakebite')

// --- narrateCondition: immersive, history-grounded prose (Grok Q-overall) ---
const graveDys = narrateCondition({ id: 'dysentery', severity: 3 })
check('narrateCondition conveys grave severity', /grave|life-threatening/i.test(graveDys))
check('narrateCondition grounds dysentery in history', /overland trails|killer/i.test(graveDys))
check('narrateCondition names the governing mechanic (Durability)', /Durability/i.test(graveDys))
check('narrateCondition varies by severity', narrateCondition({ id: 'dysentery', severity: 1 }) !== graveDys)
check('narrateCondition covers every condition',
  (['snakebite','fever','dysentery','injury','exhaustion'] as const).every(id => narrateCondition({ id, severity: 2 }).length > 20))

console.log(failures === 0 ? '\nperilEngine: ALL PASS' : `\nperilEngine: ${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
