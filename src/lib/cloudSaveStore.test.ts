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
 *   - repeated wrong proofs throttle the guessing client (IP), never the owner
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
  // The throttle follows the GUESSER (client key = IP), never the account:
  // player ids are public on the Hall of Fame, so an account lock would let
  // anyone lock any owner out.
  const reasons: string[] = []
  for (let i = 0; i < store.MAX_FAILED_PROOFS + 2; i++) {
    const r = store.readSave(P3, 'adventure_save', wrong, 'ip-attacker')
    reasons.push(r.ok ? 'ok' : r.reason)
  }
  check('wrong proofs from one client become throttled after the limit', reasons.slice(-2).every((r) => r === 'throttled') && reasons[0] === 'forbidden', reasons)
  const rOwner = store.readSave(P3, 'adventure_save', p3, 'ip-owner')
  check('the owner is NOT locked out by someone else guessing', rOwner.ok && rOwner.saveData === 'P3', rOwner)
  const wOwner = store.writeSave({ playerId: P3, saveType: 'adventure_save', saveData: 'P3b', proof: p3, clientKey: 'ip-owner' })
  check('the owner can still save while the attacker is throttled', wOwner.ok, wOwner)
  const rOtherPlayer = store.readSave(P1, 'adventure_save', owner, 'ip-attacker')
  check('a throttled client is throttled for every player, even with a right proof', !rOtherPlayer.ok && rOtherPlayer.reason === 'throttled', rOtherPlayer)
  const wAttack = store.writeSave({ playerId: P3, saveType: 'adventure_save', saveData: 'X', proof: wrong, clientKey: 'ip-attacker' })
  check('a throttled client cannot write either', !wAttack.ok && wAttack.reason === 'throttled', wAttack)
  store._advanceClockForTests(store.THROTTLE_MS + 1)
  const rWrongAfter = store.readSave(P3, 'adventure_save', wrong, 'ip-attacker')
  check('after the window the client is back to plain forbidden', !rWrongAfter.ok && rWrongAfter.reason === 'forbidden', rWrongAfter)
  // A success must not wipe the guesser's count (else: guess 9, log into own account, repeat).
  for (let i = 0; i < store.MAX_FAILED_PROOFS - 1; i++) store.readSave(P3, 'adventure_save', wrong, 'ip-mixed')
  store.readSave(P1, 'adventure_save', owner, 'ip-mixed')
  store.readSave(P3, 'adventure_save', wrong, 'ip-mixed')
  const rMixed = store.readSave(P3, 'adventure_save', wrong, 'ip-mixed')
  check("a client's own success does not reset its failure count", !rMixed.ok && rMixed.reason === 'throttled', rMixed)

  // ── council round 1 (grok + codex, 20260926_141619_secure-save) ──
  // History: a stale tab / stolen proof cannot destroy the only copy.
  const P4 = 'slot_history_player_0001'
  const p4 = await deriveSaveProof('history passphrase', P4)
  for (let i = 1; i <= 5; i++) store.writeSave({ playerId: P4, saveType: 'adventure_save', saveData: `V${i}`, proof: p4 })
  const hist = store._historyForTests(P4, 'adventure_save')
  check('the last 3 replaced versions are kept, newest first', JSON.stringify(hist) === '["V4","V3","V2"]', hist)
  const cur = store.readSave(P4, 'adventure_save', p4)
  check('history does not change the current save', cur.ok && cur.saveData === 'V5', cur)

  // A corrupt stored hash must read as a wrong proof, not throw a 503.
  store._corruptOwnerHashForTests(P4, 'abcd')
  const rCorrupt = store.readSave(P4, 'adventure_save', p4, 'ip-corrupt')
  check('a corrupt stored hash is forbidden, not a crash', !rCorrupt.ok && rCorrupt.reason === 'forbidden', rCorrupt)

  // Flooding the throttle table must not free a throttled guesser.
  for (let i = 0; i < store.MAX_FAILED_PROOFS; i++) store.readSave(P3, 'adventure_save', wrong, 'ip-flooder')
  const floodPre = store.readSave(P3, 'adventure_save', wrong, 'ip-flooder')
  for (let i = 0; i < store.MAX_TRACKED_CLIENTS + 5; i++) store.readSave(P3, 'adventure_save', wrong, `ip-flood-${i}`)
  const floodPost = store.readSave(P3, 'adventure_save', wrong, 'ip-flooder')
  check('a throttled client stays throttled after the table is flooded', !floodPre.ok && floodPre.reason === 'throttled' && !floodPost.ok && floodPost.reason === 'throttled', { floodPre, floodPost })
  check('the throttle table stays bounded', store._trackedClientCount() <= store.MAX_TRACKED_CLIENTS, store._trackedClientCount())

  fs.rmSync(dir, { recursive: true, force: true })

  // Production must fail CLOSED when the /data volume is missing, never "save" to /tmp.
  const { spawnSync } = await import('node:child_process')
  const probe = spawnSync(process.execPath, ['--import', 'tsx', '-e', `
    const m = await import(${JSON.stringify(path.resolve('src/lib/cloudSaveStore.ts'))}); const s = m.writeSave ? m : m.default;
    try { const r = s.writeSave({ playerId: 'slot_prod_probe_0001', saveType: 'adventure_save', saveData: 'x', proof: 'A'.repeat(43) }); console.log('RESULT', JSON.stringify(r)) }
    catch (e) { console.log('THREW', e.message) }
  `], { env: { ...process.env, RAILWAY_ENVIRONMENT: 'production', NODE_ENV: 'production', BOBR_CLOUD_DATA_DIR: path.join(os.tmpdir(), 'definitely-missing-volume-xyz') }, encoding: 'utf8' })
  const probeOut = (probe.stdout || '') + (probe.stderr || '')
  check('production with no /data volume refuses (throws), never writes to /tmp', /THREW .*volume/i.test(probeOut), probeOut.slice(0, 300))
}

main().then(() => {
  const failed = results.filter((r) => !r.pass)
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + JSON.stringify(r.detail).slice(0, 300)}`)
  console.log(`cloudSaveStore: ${results.length - failed.length}/${results.length}`)
  process.exit(failed.length ? 1 : 0)
}).catch((e) => { console.error(e); process.exit(1) })
