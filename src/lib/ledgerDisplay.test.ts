/**
 * npx tsx src/lib/ledgerDisplay.test.ts
 */
import assert from 'node:assert/strict'
import { ledgerDisplayFromJson, ledgerDisplayFromVerdict } from './ledgerDisplay'

const head = 'abcdef1234567890'

const intact = ledgerDisplayFromVerdict({ ok: true, status: 'intact', rows: 7, head, checkedAt: '2026-09-27T00:00:00.000Z' })
assert.equal(intact.tone, 'green')
assert.equal(intact.status, 'intact')
assert.match(intact.description, /7 rows/)
assert.match(intact.description, /abcdef123456/)

const broken = ledgerDisplayFromVerdict({ ok: false, status: 'broken', rows: 7, head: null, checkedAt: '2026-09-27T00:00:00.000Z' })
assert.equal(broken.tone, 'red')
assert.notEqual(broken.tone, 'green')
assert.match(broken.description, /broken/)

const empty = ledgerDisplayFromVerdict({ ok: false, status: 'empty', rows: 0, head: null, checkedAt: '2026-09-27T00:00:00.000Z' })
assert.equal(empty.tone, 'amber')
assert.notEqual(empty.tone, 'green')
assert.match(empty.description, /empty/)

const unmeasured = ledgerDisplayFromVerdict({ ok: false, status: 'unmeasured', reason: 'ledger_unavailable' })
assert.equal(unmeasured.tone, 'grey')
assert.notEqual(unmeasured.tone, 'green')
assert.match(unmeasured.description, /unmeasured/)

const malformedJson = ledgerDisplayFromJson('{not json')
assert.equal(malformedJson.tone, 'grey')
assert.notEqual(malformedJson.tone, 'green')

const malformedIntact = ledgerDisplayFromVerdict({ ok: false, status: 'intact', rows: 7, head })
assert.equal(malformedIntact.tone, 'grey')
assert.notEqual(malformedIntact.tone, 'green')

console.log('ledgerDisplay: ok')
