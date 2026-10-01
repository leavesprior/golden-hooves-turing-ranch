import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { WITNESS_DIALOGUES } from './dialogueTrees'

// The trail is spring 1849. The player is time-slipped and carries a Pinkerton badge
// (ChapterIntro: "The Pinkerton agency will not be founded until next year"), so the
// player may say "Pinkerton". The people of 1849 may not know the agency, and there is
// no wire west of Missouri: word goes by letter and courier.
const NO_WIRES = /\b(wires?|wired|telegraph\w*|rustl\w*)\b/i
const KNOWS_AGENCY = /\b(your agency|Pinkertons!|Pinkerton!)/i

let checked = 0
for (const [type, tree] of Object.entries(WITNESS_DIALOGUES)) {
  for (const [nodeId, node] of Object.entries(tree.nodes)) {
    const where = `${type}.${nodeId}`
    if (node.speaker === 'witness') {
      assert.ok(!NO_WIRES.test(node.text), `${where}: 1849 witness mentions wires: ${node.text}`)
      assert.ok(!KNOWS_AGENCY.test(node.text), `${where}: 1849 witness knows the Pinkerton agency: ${node.text}`)
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

// Black Bart worked alone (1875-83). No gang, anywhere on the trail screens.
for (const f of ['./dialogueTrees.ts', '../components/DossierView.tsx']) {
  const src = readFileSync(new URL(f, import.meta.url), 'utf8')
  assert.ok(!/Bart(&apos;|'|’)s gang/i.test(src), `${f} gives Black Bart a gang`)
}
console.log(`dialogueTrees.era1849: ${checked} witness lines, no wires, no known agency, no Bart gang`)
