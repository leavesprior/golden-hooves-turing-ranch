/**
 * ascii2-mutant-probe.ts — a behaviour fingerprint for scripts/ascii2-mutants.mjs.
 *
 * Prints one JSON line describing what the ascii2 rung DOES for a fixed set of
 * inputs: every frame (glyphs AND colours, both widths), every walk outcome, the
 * ghost placements, and the policy. A mutant that leaves this line unchanged did
 * not change behaviour, so it is not scored — caught or not, it proved nothing.
 */
import { ABSENCE_BLOCKS_DEFAULT, ascii2Forward, ascii2Look, buildAscii2Scene, placeLaterSites, renderFrame, type Heading } from '../src/lib/ascii2Walk'
import { ascii2TownFor } from '../src/lib/ascii2Towns'
import { normalizeTownWalkSnapshot, type TownWalkTarget } from '../src/lib/townWalk'

const headings: Heading[] = ['up', 'right', 'down', 'left']
const out: unknown[] = [ABSENCE_BLOCKS_DEFAULT]
for (const townId of ['volcano', 'west_point']) {
  const snap = normalizeTownWalkSnapshot(townId, undefined)!
  for (const opts of [{}, { absenceBlocks: true }] as { absenceBlocks?: boolean }[]) {
    const scene = buildAscii2Scene(ascii2TownFor(townId)!, snap, opts)!
    out.push(scene.ghosts.map((g) => [g.id, g.position.x, g.position.y]))
    // Synthetic sites aimed at every real target, so the target guard is observable.
    for (const t of scene.map.targets) {
      const aim = { id: 'aim', label: 'aim', notYet: 'aim', x: (t.position.x / (scene.map.width - 1)) * 100, y: (t.position.y / (scene.map.height - 1)) * 100 }
      out.push(placeLaterSites(scene.map, [aim]).map((g) => [t.id, g.position.x, g.position.y]))
    }
    const onlyExits = (t: TownWalkTarget) => t.kind === 'exit'
    for (let y = 0; y < scene.map.height; y++) {
      for (let x = 0; x < scene.map.width; x++) {
        for (const h of headings) {
          const f = ascii2Forward(scene, { x, y }, h)
          out.push([x, y, h, f.position.x, f.position.y, f.blocked ?? '', ascii2Look(scene, { x, y }, h).kind])
          if ((x + y) % 3 === 0) {
            for (const cols of [80, 40]) {
              for (const allowed of [undefined, onlyExits]) {
                const fr = renderFrame(scene, { x, y }, h, allowed, { cols })
                out.push(fr.rows.map((r) => r.map((c) => c.ch + c.color).join('')).join('\n'))
              }
            }
          }
        }
      }
    }
  }
}
const s = JSON.stringify(out)
let hash = 0
for (let i = 0; i < s.length; i++) hash = (Math.imul(hash, 31) + s.charCodeAt(i)) | 0
console.log(JSON.stringify({ fingerprint: (hash >>> 0).toString(16), bytes: s.length }))
