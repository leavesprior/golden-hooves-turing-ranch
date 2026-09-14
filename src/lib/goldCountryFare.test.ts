import assert from 'node:assert/strict'
import { commitGoldCountryFare, hasGoldCountryFareReceipt, MAX_TRAVEL_FARE_RECEIPTS, type GoldCountryFareWallet } from './goldCountryFare'

const KEY = 'test_wallet'
const initialWallet = () => ({
  balance: { good: 7, neutral: 100, bad: 3 },
  walletMode: 'continue',
  alignment: { lawfulChaotic: 12, goodEvil: -8 },
  lastUpdated: 123,
})

function fakeStorage(initial: unknown = initialWallet()) {
  let raw: string | null = initial === undefined ? null : JSON.stringify(initial)
  const writes: string[] = []
  let failRead = false
  let failWrite = false
  return {
    getItem(key: string): string | null {
      assert.equal(key, KEY)
      if (failRead) throw new Error('Read blocked')
      return raw
    },
    setItem(key: string, value: string) {
      assert.equal(key, KEY)
      if (failWrite) throw new Error('Quota exceeded')
      writes.push(value)
      raw = value
    },
    read: () => raw === null ? undefined : JSON.parse(raw),
    setRaw: (value: string | null) => { raw = value },
    setReadFailure: (value: boolean) => { failRead = value },
    setWriteFailure: (value: boolean) => { failWrite = value },
    writes,
  }
}

let cases = 0
function check(name: string, run: () => void) {
  run()
  cases++
  console.log(`PASS ${name}`)
}

check('one complete write debits only tacos and retains legacy wallet fields', () => {
  const legacy = { ...initialWallet(), futureMetadata: { version: 9, notes: ['retained'] } }
  const storage = fakeStorage(legacy)
  const current = initialWallet()
  Object.freeze(current.balance)
  Object.freeze(current)
  const result = commitGoldCountryFare(storage, KEY, current, 'trip_stage_1', 14)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.replayed, false)
  assert.equal(current.balance.neutral, 100)
  assert.equal(storage.writes.length, 1)
  assert.deepEqual(storage.read(), {
    ...legacy,
    balance: { good: 7, neutral: 86, bad: 3 },
    travelFareReceipts: [{ tripId: 'trip_stage_1', amount: 14 }],
  })
  assert.deepEqual(result.wallet, storage.read())
})

check('same ID replays immediately and after JSON reload with no second write', () => {
  const storage = fakeStorage()
  const first = commitGoldCountryFare(storage, KEY, initialWallet(), 'trip-1', 8)
  assert.equal(first.ok, true)
  if (!first.ok) return
  for (const wallet of [first.wallet, storage.read()]) {
    const replay = commitGoldCountryFare(storage, KEY, wallet, 'trip-1', 8)
    assert.equal(replay.ok, true)
    if (!replay.ok) return
    assert.equal(replay.replayed, true)
    assert.equal(replay.wallet.balance.neutral, 92)
  }
  assert.equal(storage.writes.length, 1)
})

check('a changed amount for a paid ID conflicts even when funds are exhausted', () => {
  const storage = fakeStorage()
  const paid = commitGoldCountryFare(storage, KEY, initialWallet(), 'trip-1', 100)
  assert.equal(paid.ok, true)
  if (!paid.ok) return
  assert.deepEqual(commitGoldCountryFare(storage, KEY, paid.wallet, 'trip-1', 9), { ok: false, reason: 'conflict' })
  const replay = commitGoldCountryFare(storage, KEY, paid.wallet, 'trip-1', 100)
  assert.equal(replay.ok && replay.replayed, true)
  assert.equal(storage.read().balance.neutral, 0)
  assert.equal(storage.writes.length, 1)
})

check('accepted ordinary earnings or purchases are included before their autosave', () => {
  for (const neutral of [137, 61, 61.5]) {
    const storage = fakeStorage() // old render still has 100
    const current = { ...initialWallet(), balance: { good: 11, neutral, bad: 4 } }
    const result = commitGoldCountryFare(storage, KEY, current, 'trip-queued', 14)
    assert.equal(result.ok, true)
    assert.deepEqual(storage.read().balance, { good: 11, neutral: neutral - 14, bad: 4 })
  }
})

check('insufficient funds have no write, mutation, or receipt', () => {
  const current = initialWallet()
  const storage = fakeStorage(current)
  assert.deepEqual(commitGoldCountryFare(storage, KEY, current, 'trip-poor', 101), { ok: false, reason: 'funds' })
  assert.deepEqual(storage.read(), current)
  assert.equal(Object.hasOwn(current, 'travelFareReceipts'), false)
  assert.equal(storage.writes.length, 0)
})

check('write failure leaves the full prior record intact and permits one later retry', () => {
  const current = initialWallet()
  const storage = fakeStorage(current)
  storage.setWriteFailure(true)
  assert.deepEqual(commitGoldCountryFare(storage, KEY, current, 'trip-quota', 8), { ok: false, reason: 'storage' })
  assert.deepEqual(storage.read(), current)
  assert.equal(current.balance.neutral, 100)
  storage.setWriteFailure(false)
  const retry = commitGoldCountryFare(storage, KEY, current, 'trip-quota', 8)
  assert.equal(retry.ok && !retry.replayed, true)
  assert.equal(storage.read().balance.neutral, 92)
  assert.equal(storage.writes.length, 1)
})

check('unreadable and malformed stored roots are preserved', () => {
  const storage = fakeStorage()
  storage.setReadFailure(true)
  assert.deepEqual(commitGoldCountryFare(storage, KEY, initialWallet(), 'trip-read', 8), { ok: false, reason: 'storage' })
  storage.setReadFailure(false)
  for (const raw of ['{broken', 'null', '[]', '400', '"wallet"', '']) {
    storage.setRaw(raw)
    assert.deepEqual(commitGoldCountryFare(storage, KEY, initialWallet(), 'trip-read', 8), { ok: false, reason: 'storage' })
    assert.equal(storage.getItem(KEY), raw)
  }
  assert.equal(storage.writes.length, 0)
})

check('an initialized wallet without an existing storage record can pay', () => {
  const storage = fakeStorage()
  storage.setRaw(null)
  assert.equal(commitGoldCountryFare(storage, KEY, initialWallet(), 'trip-first', 8).ok, true)
  assert.equal(storage.read().balance.neutral, 92)
  assert.equal(storage.writes.length, 1)
})

check('bad amounts, IDs, and balances never write', () => {
  const storage = fakeStorage()
  for (const amount of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '8']) {
    assert.deepEqual(commitGoldCountryFare(storage, KEY, initialWallet(), 'trip-invalid', amount as number), { ok: false, reason: 'invalid' })
  }
  for (const id of ['', ' ', 'trip with spaces', 'trip\nnewline', 'x'.repeat(129), null, {}]) {
    assert.deepEqual(commitGoldCountryFare(storage, KEY, initialWallet(), id as string, 8), { ok: false, reason: 'invalid' })
  }
  for (const neutral of [NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.deepEqual(commitGoldCountryFare(storage, KEY, { balance: { good: 0, bad: 0, neutral } }, 'trip-invalid', 8), { ok: false, reason: 'invalid' })
  }
  assert.equal(storage.writes.length, 0)
})

check('malformed receipts are not silently discarded or charged again', () => {
  for (const travelFareReceipts of [null, {}, [{ tripId: 'trip-1', amount: 0 }], [{ amount: 8 }], [{ tripId: 'trip-1', amount: '8' }], Array(65).fill({ tripId: 'trip-1', amount: 8 })]) {
    const badWallet = { ...initialWallet(), travelFareReceipts }
    const storage = fakeStorage(badWallet)
    assert.deepEqual(commitGoldCountryFare(storage, KEY, initialWallet(), 'trip-1', 8), { ok: false, reason: 'storage' })
    assert.equal(storage.writes.length, 0)
    const cleanStorage = fakeStorage()
    assert.deepEqual(commitGoldCountryFare(cleanStorage, KEY, badWallet as unknown as GoldCountryFareWallet, 'trip-1', 8), { ok: false, reason: 'storage' })
    assert.equal(cleanStorage.writes.length, 0)
  }
})

check('conflicting persisted and accepted receipts reject without modifying either', () => {
  const storage = fakeStorage({ ...initialWallet(), travelFareReceipts: [{ tripId: 'trip-1', amount: 8 }] })
  const current = { ...initialWallet(), travelFareReceipts: [{ tripId: 'trip-1', amount: 14 }] }
  assert.deepEqual(commitGoldCountryFare(storage, KEY, current, 'trip-2', 8), { ok: false, reason: 'conflict' })
  assert.equal(storage.writes.length, 0)
})

check('the latest 64 sequential trips remain replayable after many journeys', () => {
  const storage = fakeStorage()
  let wallet: GoldCountryFareWallet = { ...initialWallet(), balance: { good: 7, neutral: 1000, bad: 3 } }
  for (let trip = 1; trip <= 100; trip++) {
    const result = commitGoldCountryFare(storage, KEY, wallet, `trip-${trip}`, 8)
    assert.equal(result.ok, true)
    if (!result.ok) return
    wallet = result.wallet
  }
  assert.equal(wallet.balance.neutral, 200)
  assert.equal(wallet.travelFareReceipts?.length, MAX_TRAVEL_FARE_RECEIPTS)
  assert.equal(wallet.travelFareReceipts?.[0].tripId, 'trip-37')
  for (let trip = 37; trip <= 100; trip++) {
    const replay = commitGoldCountryFare(storage, KEY, storage.read(), `trip-${trip}`, 8)
    assert.equal(replay.ok && replay.replayed, true)
  }
  assert.equal(storage.writes.length, 100)
})

check('receipt reader recognizes a committed/reloaded fare without touching storage or state', () => {
  const storage = fakeStorage()
  const current = initialWallet()
  assert.equal(hasGoldCountryFareReceipt(undefined, 'trip-read-only', 8), false)
  const paid = commitGoldCountryFare(storage, KEY, current, 'trip-read-only', 8)
  assert.equal(paid.ok, true)
  if (!paid.ok) return
  const receipts = Object.freeze(storage.read().travelFareReceipts.map((receipt: object) => Object.freeze(receipt)))
  const before = JSON.stringify(receipts)
  storage.setReadFailure(true)
  storage.setWriteFailure(true)
  assert.equal(hasGoldCountryFareReceipt(receipts, 'trip-read-only', 8), true)
  assert.equal(hasGoldCountryFareReceipt(receipts, 'trip-read-only', 14), false)
  assert.equal(hasGoldCountryFareReceipt(receipts, 'other-trip', 8), false)
  assert.equal(JSON.stringify(receipts), before)
  assert.equal(storage.writes.length, 1)
  assert.equal(current.balance.neutral, 100)
})

check('receipt reader rejects malformed history, conflicts, and invalid requests', () => {
  const valid = [{ tripId: 'trip-1', amount: 8 }]
  for (const value of [undefined, null, {}, [], [{ tripId: 'trip-1', amount: '8' }],
    [...valid, { tripId: 'trip-1', amount: 14 }], Array(65).fill(valid[0])]) {
    assert.equal(hasGoldCountryFareReceipt(value, 'trip-1', 8), false)
  }
  assert.equal(hasGoldCountryFareReceipt(valid, '', 8), false)
  assert.equal(hasGoldCountryFareReceipt(valid, 'trip-1', NaN), false)
  assert.equal(hasGoldCountryFareReceipt(valid, 'trip-1', 0), false)
})

console.log(JSON.stringify({ ok: true, cases, scope: 'durable local travel fare helper' }))
