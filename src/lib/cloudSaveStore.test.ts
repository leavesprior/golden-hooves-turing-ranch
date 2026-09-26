/**
 * Cloud saves on the Railway /data volume (2026-09-26). Replaces the Notion
 * store, which is not configured in production (every call 503'd as of 2026-09-26) and had
 * no owner check: anyone holding a playerId could overwrite or wipe a save.
 *
 * What these fixtures pin:
 *   - the first write CLAIMS a player with a passphrase-derived proof;
 *     a later write or read with any other proof is refused (403)
 *   - a refused write leaves the stored save byte-for-byte unchanged
 *   - replacing a save is one statement: there is no moment with no save
 *   - metadata answers without a proof, but never carries save data
 *   - bad ids / types / oversized payloads are refused before touching the DB
 *   - repeated wrong proofs are throttled, and the right proof still works after
 *   - the proof is deterministic per (passphrase, player) and differs otherwise
 *   npx tsx src/lib/cloudSaveStore.test.ts
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cloud-save-test-'))
  process.env.BOBR_ALLOW_TEST_DB = '1'
  process.env.BOBR_DB_PATH_FOR_TESTS = path.join(dir, 'saves.db')

  const store = await import('./cloudSaveStore')
  const { deriveSaveProof, MIN_PASSPHRASE_LENGTH } = await import('./saveProof')

  const P1 = 'player_1790452991009_ximq2aw'
  const P2 = 'player_1790453032523_skrw9zp'
  const owner = await deriveSaveProof('correct horse battery', P1)
  const thief = await deriveSaveProof('wrong horse battery', P1)

  // ── proof derivation ──
  check('proof is deterministic', owner === await deriveSaveProof('correct horse battery', P1))
  check('proof differs by passphrase', owner !== thief)
  check('proof differs by player (same passphrase)', owner !== await deriveSaveProof('correct horse battery', P2))
  check('proof is 43-char base64url (32 bytes)', /^[A-Za-z0-9_-]{43}$/.test(owner), owner)
  check('minimum passphrase is at least 8', MIN_PASSPHRASE_LENGTH >= 8, MIN_PASSPHRASE_LENGTH)

  // ── nothing there yet ──
  check('meta on empty store is null', store.getSaveMeta(P1, 'adventure_save') === null)
  const r0 = store.readSave(P1, 'adventure_save', owner)
  check('read on empty store is not_found', !r0.ok && r0.reason === 'not_found', r0)

  // ── first write claims ──
  const w1 = store.writeSave({ playerId: P1, saveType: 'adventure_save', saveData: 'CIPHER-1', saveVersion: '1.0', deviceId: 'dev-a', proof: owner })
  check('first write creates', w1.ok && w1.action === 'created', w1)
  const r1 = store.readSave(P1, 'adventure_save', owner)
  check('owner reads back exactly what was written', r1.ok && r1.saveData === 'CIPHER-1', r1)

  // ── the attack the Notion route allowed ──
  const wBad = store.writeSave({ playerId: P1, saveType: 'adventure_save', saveData: 'WIPED', proof: thief })
  check('write with another proof is forbidden', !wBad.ok && wBad.reason === 'forbidden', wBad)
  const rAfterBad = store.readSave(P1, 'adventure_save', owner)
  check('refused write leaves the save unchanged', rAfterBad.ok && rAfterBad.saveData === 'CIPHER-1', rAfterBad)
  const wBadType = store.writeSave({ playerId: P1, saveType: 'karma', saveData: 'X', proof: thief })
  check('a claimed player cannot gain a NEW save type with another proof', !wBadType.ok && wBadType.reason === 'forbidden', wBadType)
  const rBad = store.readSave(P1, 'adventure_save', thief)
  check('read with another proof is forbidden (no ciphertext to brute-force)', !rBad.ok && rBad.reason === 'forbidden', rBad)

  // ── replace is atomic and exact ──
  const w2 = store.writeSave({ playerId: P1, saveType: 'adventure_save', saveData: 'CIPHER-2', proof: owner })
  check('second write by owner reports saved', w2.ok && w2.action === 'saved', w2)
  const r2 = store.readSave(P1, 'adventure_save', owner)
  check('second write replaced the first', r2.ok && r2.saveData === 'CIPHER-2', r2)
  check('one row per (player, type) after replace', store._countRows(P1) === 1, store._countRows(P1))
  const big = 'A'.repeat(300_000)
  store.writeSave({ playerId: P1, saveType: 'adventure_save', saveData: big, proof: owner })
  const rBig = store.readSave(P1, 'adventure_save', owner)
  check('a 300KB save round-trips whole (Notion cut at 100 blocks)', rBig.ok && rBig.saveData.length === 300_000, rBig.ok && rBig.saveData.length)

  // ── metadata ──
  const meta = store.getSaveMeta(P1, 'adventure_save')
  check('meta says exists with a timestamp', !!meta && meta.exists && typeof meta.lastSaved === 'string', meta)
  check('meta carries no save data', !!meta && !('saveData' in meta), meta)
  const metaAny = store.getSaveMeta(P1)
  check('meta without a type finds the latest save', !!metaAny && metaAny.saveType === 'adventure_save', metaAny)

  // ── players are isolated ──
  const other = await deriveSaveProof('another passphrase', P2)
  const w3 = store.writeSave({ playerId: P2, saveType: 'adventure_save', saveData: 'P2-DATA', proof: other })
  check('a second player claims independently', w3.ok && w3.action === 'created', w3)
  const rCross = store.readSave(P2, 'adventure_save', owner)
  check("player 1's proof cannot read player 2", !rCross.ok && rCross.reason === 'forbidden', rCross)

  // ── validation before the DB ──
  const inv = [
    store.writeSave({ playerId: 'bad id with spaces', saveType: 'adventure_save', saveData: 'x', proof: owner }),
    store.writeSave({ playerId: P1, saveType: 'leaderboard', saveData: 'x', proof: owner }),
    store.writeSave({ playerId: P1, saveType: 'adventure_save', saveData: '', proof: owner }),
    store.writeSave({ playerId: P1, saveType: 'adventure_save', saveData: 'x', proof: 'short' }),
    store.writeSave({ playerId: P1, saveType: 'adventure_save', saveData: 'x', proof: undefined as unknown as string }),
  ]
  check('bad id / type / empty data / malformed or missing proof are invalid', inv.every((r) => !r.ok && r.reason === 'invalid'), inv)
  const tooBig = store.writeSave({ playerId: P1, saveType: 'adventure_save', saveData: 'A'.repeat(store.MAX_SAVE_BYTES + 1), proof: owner })
  check('oversized save is too_large', !tooBig.ok && tooBig.reason === 'too_large', tooBig)
  const rAfterInv = store.readSave(P1, 'adventure_save', owner)
  check('refused writes did not touch the save', rAfterInv.ok && rAfterInv.saveData.length === 300_000)

  // ── throttle ──
  const P3 = 'player_1790453999999_throttl'
  const p3 = await deriveSaveProof('p3 passphrase ok', P3)
  store.writeSave({ playerId: P3, saveType: 'adventure_save', saveData: 'P3', proof: p3 })
  const wrong = await deriveSaveProof('guess guess guess', P3)
  const reasons: string[] = []
  for (let i = 0; i < store.MAX_FAILED_PROOFS + 2; i++) {
    const r = store.readSave(P3, 'adventure_save', wrong)
    reasons.push(r.ok ? 'ok' : r.reason)
  }
  check('wrong proofs become throttled after the limit', reasons.slice(-2).every((r) => r === 'throttled') && reasons[0] === 'forbidden', reasons)
  const rThrottledOwner = store.readSave(P3, 'adventure_save', p3)
  check('while throttled even the owner waits (no oracle)', !rThrottledOwner.ok && rThrottledOwner.reason === 'throttled', rThrottledOwner)
  store._advanceClockForTests(store.THROTTLE_MS + 1)
  const rOwnerLater = store.readSave(P3, 'adventure_save', p3)
  check('after the window the owner gets in', rOwnerLater.ok && rOwnerLater.saveData === 'P3', rOwnerLater)
  const rWrongAfter = store.readSave(P3, 'adventure_save', wrong)
  check('a success resets the failure count', !rWrongAfter.ok && rWrongAfter.reason === 'forbidden', rWrongAfter)

  fs.rmSync(dir, { recursive: true, force: true })
}

main().then(() => {
  const failed = results.filter((r) => !r.pass)
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + JSON.stringify(r.detail).slice(0, 300)}`)
  console.log(`cloudSaveStore: ${results.length - failed.length}/${results.length}`)
  process.exit(failed.length ? 1 : 0)
}).catch((e) => { console.error(e); process.exit(1) })
