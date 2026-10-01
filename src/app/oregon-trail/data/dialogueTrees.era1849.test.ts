import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { WITNESS_DIALOGUES } from './dialogueTrees'
import { getPersonality } from './npcPersonalities'

// The trail is spring 1849. The player is time-slipped and carries a Pinkerton badge
// (ChapterIntro: "The Pinkerton agency will not be founded until next year"), so the
// player may say "Pinkerton". The people of 1849 may not know the agency, and there is
// no wire west of Missouri: word goes by letter and courier.
const NO_WIRES = /\b(wires?|wired|telegraph\w*|rustl\w*)\b/i
// A witness who names Pinkerton must show they have never heard of it.
const SAYS_PINKERTON = /Pinker/i
const NEVER_HEARD = /never heard|Pinker-who/i

let checked = 0
for (const [type, tree] of Object.entries(WITNESS_DIALOGUES)) {
  for (const [nodeId, node] of Object.entries(tree.nodes)) {
    const where = `${type}.${nodeId}`
    if (node.speaker === 'witness') {
      assert.ok(!NO_WIRES.test(node.text), `${where}: 1849 witness mentions wires: ${node.text}`)
      assert.ok(!SAYS_PINKERTON.test(node.text) || NEVER_HEARD.test(node.text), `${where}: 1849 witness knows the Pinkerton agency: ${node.text}`)
      checked++
    }
    for (const r of node.responses ?? []) {
      for (const t of [r.text, r.alternateText].filter(Boolean) as string[]) {
        assert.ok(!NO_WIRES.test(t), `${where}.${r.id}: player line mentions wires: ${t}`)
      }
    }
  }
}
assert.ok(checked > 60, `only ${checked} witness lines checked; the walk is broken`)

// Other 1849 trail text the dialogue walk does not reach (council 10-01, codex).
const TRAIL_TEXT = ['./clueTemplates.ts', './worldMaps.ts', './townPuzzles.ts', '../state/constants.ts']
for (const f of TRAIL_TEXT) {
  const src = readFileSync(new URL(f, import.meta.url), 'utf8')
  for (const phrase of [/Sent a wire/i, /telegraph operator/i, /\brustlers\b/i, /Ten cents a word/i]) {
    assert.ok(!phrase.test(src), `${f} still says ${phrase}`)
  }
}
// The live-model persona for the same witness (advisor 10-01): the chat must not talk telegraph either.
{
  const p = getPersonality('telegraph_operator')
  const said = JSON.stringify([p.archetype, p.name, p.description, p.speechPatterns, p.quirks, p.knowledgeAreas, p.exampleExchanges, p.systemPromptAdditions])
  assert.ok(!/\b(telegra\w*|morse|wires?)\b/i.test(said.replace(/no telegraph anywhere west of Missouri/g, '')), `live persona still talks telegraph: ${said.slice(0, 200)}`)
}
console.log(`dialogueTrees.era1849: ${checked} witness lines, no wires, no known agency; trail text has no wires or rustlers`)
