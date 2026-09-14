import assert from 'node:assert/strict'
import { DEFAULT_STATE } from './constants'
import { gameReducer } from './reducer'
import { NO_OXEN_EVENT } from './travelEngine'
import { readTeamsterHire, hasPaidPendingTeamster, type TeamsterHire } from './teamsterHire'
import { commitGoldCountryFare } from '@/lib/goldCountryFare'
import type { OregonTrailState } from './types'

const stuck: OregonTrailState = { ...DEFAULT_STATE, phase: 'event', currentEvent: NO_OXEN_EVENT,
  oxen: 0, food: 100, day: 12, wagonAbandoned: false, inventory: ['towel'], completedQuests: ['kept'],
  party: [{ id: 'leader', name: 'Mae', health: 85, isSick: false, role: 'leader' }] }
const order: TeamsterHire = { version: 1, id: 'teamster_test-order', cost: 20 }
assert.equal(gameReducer(stuck, { type: 'HANDLE_EVENT_CHOICE', choiceId: 'hire_teamster' }), stuck,
  'generic/legacy choice never grants an unpaid yoke')
const pending = gameReducer(stuck, { type: 'BEGIN_TEAMSTER_HIRE', order })
assert.notEqual(pending.teamsterHire, order, 'order is validated and copied')
assert.equal(pending.oxen, 0)
assert.equal(pending.day, 12)
assert.equal(pending.food, 100)
assert.equal(gameReducer(pending, { type: 'BEGIN_TEAMSTER_HIRE', order: { ...order, id: 'teamster_second' } }), pending)
assert.equal(gameReducer(pending, { type: 'HANDLE_EVENT_CHOICE', choiceId: 'abandon_wagon' }), pending,
  'pending order must use guarded provider cancellation before a different choice')
assert.equal(gameReducer(pending, { type: 'COMPLETE_TEAMSTER_HIRE', orderId: 'teamster_wrong' }), pending)
const restored = gameReducer(DEFAULT_STATE, { type: 'LOAD_STATE', savedState: JSON.parse(JSON.stringify(pending)) })
assert.deepEqual(restored.teamsterHire, order)
const completed = gameReducer(restored, { type: 'COMPLETE_TEAMSTER_HIRE', orderId: order.id })
assert.equal(completed.oxen, 2)
assert.equal(completed.day, 14)
assert.equal(completed.food, 100, 'tacos replace the food price')
assert.equal(completed.teamsterHire, undefined)
assert.equal(completed.currentEvent, null)
assert.equal(completed.phase, 'traveling')
assert.deepEqual(completed.party, stuck.party)
assert.deepEqual(completed.completedQuests, stuck.completedQuests)
assert.deepEqual(completed.inventory, stuck.inventory)
assert.equal(gameReducer(completed, { type: 'COMPLETE_TEAMSTER_HIRE', orderId: order.id }), completed)
const cancelled = gameReducer(pending, { type: 'CANCEL_TEAMSTER_HIRE', orderId: order.id })
assert.equal(gameReducer(cancelled, { type: 'HANDLE_EVENT_CHOICE', choiceId: 'abandon_wagon' }).wagonAbandoned, true)
for (const invalid of [{ ...order, version: 2 }, { ...order, cost: 0 }, { ...order, id: 'gc_other-purchase' }, { ...order, id: 'teamster_' }, null]) {
  assert.equal(readTeamsterHire(invalid), undefined)
  const loaded = gameReducer(DEFAULT_STATE, { type: 'LOAD_STATE', savedState: { ...stuck, teamsterHire: invalid } as OregonTrailState })
  assert.equal(loaded.teamsterHire, undefined)
  assert.equal(loaded.food, stuck.food)
}
assert.equal(gameReducer(DEFAULT_STATE, { type: 'LOAD_STATE', savedState: { ...pending, oxen: 2 } }).teamsterHire, undefined)

// Existing durable wallet helper, exact scoped order IDs. Actual provider/UI
// ordering and injected write failures are exercised separately in browser QA.
const records = new Map<string, string>()
const storage = { getItem: (key: string) => records.get(key) ?? null, setItem: (key: string, value: string) => { records.set(key, value) } }
const wallet = { balance: { neutral: 50, good: 3, bad: 1 }, donor: 'retained' }
const paid = commitGoldCountryFare(storage, 'wallet', wallet, order.id, order.cost)
assert.equal(paid.ok, true)
if (!paid.ok) throw new Error('payment failed')
assert.equal(paid.wallet.balance.neutral, 30)
const replay = commitGoldCountryFare(storage, 'wallet', paid.wallet, order.id, order.cost)
assert.equal(replay.ok, true)
if (!replay.ok) throw new Error('replay failed')
assert.equal(replay.replayed, true)
assert.equal(replay.wallet.balance.neutral, 30)
assert.equal(replay.wallet.donor, 'retained')
const receipt = (id: string, cost: number) => id === order.id && cost === order.cost
assert.equal(hasPaidPendingTeamster(pending, receipt), true, 'old pending slot retains newer paid wallet')
assert.equal(hasPaidPendingTeamster(pending, () => false), false)
assert.equal(hasPaidPendingTeamster(completed, receipt), false)
assert.equal(hasPaidPendingTeamster({ ...pending, wagonAbandoned: true }, receipt), false)
assert.equal(hasPaidPendingTeamster({ ...pending, phase: 'town' }, receipt), false)
const farm = gameReducer(pending, { type: 'OPEN_RANCH_MANAGEMENT' })
assert.equal(farm.phase, 'ranch_management')
assert.equal(farm.previousPhase, 'event')
const farmReloaded = gameReducer(DEFAULT_STATE, { type: 'LOAD_STATE', savedState: JSON.parse(JSON.stringify(farm)) })
assert.deepEqual(farmReloaded.teamsterHire, order, 'supported farm overlay retains exact pending order across reload')
assert.equal(hasPaidPendingTeamster(farmReloaded, receipt), true, 'pending farm slot preserves the post-payment wallet')
assert.equal(hasPaidPendingTeamster({ ...farmReloaded, previousPhase: 'town' }, receipt), false)
assert.equal(gameReducer(farmReloaded, { type: 'COMPLETE_TEAMSTER_HIRE', orderId: order.id }), farmReloaded,
  'retaining a pending order does not permit hiring inside the farm overlay')
const returned = gameReducer(farmReloaded, { type: 'CLOSE_RANCH_MANAGEMENT' })
assert.equal(returned.phase, 'event')
assert.deepEqual(returned.teamsterHire, order)
assert.equal(gameReducer(returned, { type: 'COMPLETE_TEAMSTER_HIRE', orderId: order.id }).oxen, 2)
console.log('Teamster order: pure guarded yoke transition, legacy bypass prevention, cancellation, replay and exact save-slot predicate PASS')
