/**
 * jev answer bank (npcAnswerBank.ts): the no-model voice for street NPCs.
 *
 *   A1  jev sorts questions into the right category
 *   A2  answers are filled with the NPC's own name, title and town (no {braces} left)
 *   A3  a clue question returns the NPC's own clue hint when it has one
 *   A4  unsorted questions walk the canon lines in turn
 *   A5  three turns in one category give three different answers
 *   A6  1849 era guard: no bank line names a later era (angelsCampSlice LATER)
 *
 *   node_modules/.bin/tsx src/lib/npcAnswerBank.test.ts
 * Exit code 0 = all pass, 1 = at least one failure.
 */
import { answerFromBank, classifyQuestion, type AnswerBankNpc } from './npcAnswerBank'

let failed = 0
let passed = 0
function check(name: string, ok: boolean, detail = ''): void {
  if (ok) { passed++; console.log(`PASS ${name}`) } else { failed++; console.log(`FAIL ${name} ${detail}`) }
}

const npc: AnswerBankNpc = {
  name: 'Robert Service',
  title: 'The Bard of the Yukon',
  town: 'Mokelumne Hill',
  canonLines: ['Line zero.', 'Line one.', 'Line two.'],
}

// A1
const cases: [string, string][] = [
  ['Who are you?', 'identity'],
  ['Who are you, friend?', 'identity'],
  ['How did you come to this town?', 'identity'],
  ['Where is this town?', 'place'],
  ['Is there gold in the creek?', 'gold'],
  ['Have you seen the outlaw?', 'clue'],
  ['What year is it?', 'time'],
  ['Do you know anyone here?', 'people'],
  ['How much for whiskey?', 'trade'],
  ['Thanks, goodbye', 'farewell'],
  ['Sing me a verse', 'other'],
]
for (const [q, want] of cases) {
  const got = classifyQuestion(q)
  check(`A1 "${q}" -> ${want}`, got === want, `got ${got}`)
}

// A2
for (const q of ['Who are you?', 'Where is this town?', 'Goodbye']) {
  for (let turn = 1; turn <= 3; turn++) {
    const { text } = answerFromBank(npc, q, turn)
    check(`A2 filled "${q}" t${turn}`, !/[{}]/.test(text), text)
  }
}
check('A2 town used', answerFromBank(npc, 'Where is this town?', 1).text.includes('Mokelumne Hill'))
check('A2 missing town has a fallback', !answerFromBank({ ...npc, town: undefined }, 'Where is this town?', 1).text.includes('undefined'))

// A3
const withHint = { ...npc, clueHint: 'The laundry marks tell you whose shirt it was.' }
check('A3 clue hint used', answerFromBank(withHint, 'Any clue about the thief?', 1).text === withHint.clueHint)
check('A3 no hint -> bank', answerFromBank(npc, 'Any clue about the thief?', 1).category === 'clue')

// A4
const others = [1, 2, 3].map(t => answerFromBank(npc, 'Sing me a verse', t).text)
check('A4 canon lines in turn', others.join('|') === 'Line one.|Line two.|Line zero.', others.join('|'))

// A5
const ids = [1, 2, 3].map(t => answerFromBank(npc, 'Who are you?', t).text)
check('A5 no repeat in a category', new Set(ids).size === 3, ids.join(' / '))

// A6: every bank line, for every category, filled
const LATER = /\b(Twain|Clemens|Jubilee|1855|1865|1928|stone hotel|Moaning Cavern|Jim Smiley|Pinkerton)\b/i
const probes = cases.map(c => c[0])
let leaks = 0
for (const q of probes) for (let t = 1; t <= 3; t++) if (LATER.test(answerFromBank(npc, q, t).text)) leaks++
check('A6 no later-era names', leaks === 0, `${leaks} leaks`)

console.log(JSON.stringify({ test: 'npcAnswerBank', passed, total: passed + failed, failed }))
process.exit(failed > 0 ? 1 : 0)
