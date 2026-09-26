/**
 * Hall of Fame on /data (2026-09-26): replaces Notion (unconfigured in prod as of 2026-09-26).
 *   npx tsx src/lib/leaderboardStore.test.ts
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'leaderboard-test-'))
  process.env.BOBR_ALLOW_TEST_DB = '1'
  process.env.BOBR_DB_PATH_FOR_TESTS = path.join(dir, 'lb.db')
  const lb = await import('./leaderboardStore')

  check('empty board lists nothing', lb.listEntries(50).length === 0)
  const c = lb.submitEntry({ playerName: 'Tobias', playerId: 'player_a', score: 500, trophies: ['first_ford', 7, 'bridge'], chapter: 2, level: 3 })
  check('first submit creates', c.action === 'created', c)
  const low = lb.submitEntry({ playerName: 'Tobias', playerId: 'player_a', score: 400 })
  check('a lower score is skipped', low.action === 'skipped', low)
  check('lower score did not replace', lb.listEntries(50)[0].score === 500)
  const up = lb.submitEntry({ playerName: 'Tobias II', playerId: 'player_a', score: 900 })
  check('a higher score updates', up.action === 'updated', up)
  lb.submitEntry({ playerName: 'Ysabel', playerId: 'player_b', score: 700 })
  const list = lb.listEntries(50)
  check('one row per player, sorted by score', list.length === 2 && list[0].playerId === 'player_a' && list[0].score === 900 && list[1].score === 700, list)
  lb.submitEntry({ playerName: 'Delphine', playerId: 'player_e', score: 10, trophies: ['a', 7, 'b', null] })
  const e = lb.listEntries(50).find((x) => x.playerId === 'player_e')
  check('non-string trophies are dropped, count follows', !!e && JSON.stringify(e.trophies) === '["a","b"]' && e.trophyCount === 2, e)
  check('entries are never marked NPC', list.every((e) => e.isNPC === false))
  check('limit is honored', lb.listEntries(1).length === 1 && lb.listEntries(1)[0].playerId === 'player_a')
  check('since filter excludes older rows', lb.listEntries(50, '2999-01-01').length === 0)
  const bad = [
    lb.submitEntry({ playerName: '', playerId: 'player_c', score: 1 }),
    lb.submitEntry({ playerName: 'X', playerId: 'has spaces', score: 1 }),
  ]
  check('empty name / bad id are skipped', bad.every((r) => r.action === 'skipped'), bad)
  lb.submitEntry({ playerName: 'N'.repeat(500), playerId: 'player_d', score: 1 })
  check('names are capped at 40', lb.listEntries(50).find((e) => e.playerId === 'player_d')?.playerName.length === 40)

  const weird = [
    lb.submitEntry({ playerName: 'NaN', playerId: 'player_nan', score: NaN }),
    lb.submitEntry({ playerName: 'Neg', playerId: 'player_neg', score: -5 }),
    lb.submitEntry({ playerName: 'Inf', playerId: 'player_inf', score: Infinity }),
  ]
  check('NaN / negative / infinite scores are skipped', weird.every((r) => r.action === 'skipped'), weird)
  check('none of them reached the board', !lb.listEntries(50).some((e) => ['player_nan', 'player_neg', 'player_inf'].includes(e.playerId)))

  fs.rmSync(dir, { recursive: true, force: true })
}

main().then(() => {
  const failed = results.filter((r) => !r.pass)
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + JSON.stringify(r.detail).slice(0, 300)}`)
  console.log(`leaderboardStore: ${results.length - failed.length}/${results.length}`)
  process.exit(failed.length ? 1 : 0)
}).catch((e) => { console.error(e); process.exit(1) })
