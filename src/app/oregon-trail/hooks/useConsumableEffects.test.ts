import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { build } from 'esbuild'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { useConsumableEffects as Hook } from './useConsumableEffects'

async function main() {
  const calls: { drinks: number; food: Array<Array<number | boolean>>; comments: string[] } = { drinks: 0, food: [], comments: [] }
  const fixture = {
    trail: {
      state: { day: 10, inventory: [] as string[] },
      buySupplies() {}, repairWagon() {},
      buyFood: (...args: Array<number | boolean>) => calls.food.push(args),
      drinkGargleBlaster: () => { calls.drinks++ },
    },
    narrator: { comment: (message: string) => calls.comments.push(message) },
  }
  // Exercise the real hook and catalog with React's server renderer. Only the
  // application contexts are replaced; effects over later days are out of scope.
  const result = await build({
    entryPoints: [fileURLToPath(new URL('./useConsumableEffects.ts', import.meta.url))],
    bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'],
    plugins: [{ name: 'consumable-test-contexts', setup(builder) {
      builder.onResolve({ filter: /^\.\.\/(oregonTrailContext|narratorContext)$/ }, args => ({ path: args.path, namespace: 'test-context' }))
      builder.onLoad({ filter: /.*/, namespace: 'test-context' }, args => ({ contents: args.path.endsWith('/oregonTrailContext')
        ? 'export const useOregonTrail = () => __fixture.trail'
        : 'export const useNarrator = () => __fixture.narrator' }))
    } }],
  })
  const compiled = { exports: {} as { useConsumableEffects: typeof Hook } }
  runInNewContext(result.outputFiles[0].text, {
    module: compiled, exports: compiled.exports, require: createRequire(import.meta.url), __fixture: fixture,
  })
  function exerciseItem(itemId: string, owned: boolean) {
    calls.drinks = 0; calls.food = []; calls.comments = []
    fixture.trail.state.inventory = owned ? ['pan_galactic_gargle_blaster'] : []
    let handle: (id: string) => void = () => { throw new Error('Hook did not render') }
    function Harness() { handle = compiled.exports.useConsumableEffects().handleUseConsumable; return null }
    renderToStaticMarkup(createElement(Harness))
    handle(itemId)
  }
  for (const itemId of ['pan_galactic_gargle_blaster', 'pan_galactic_gargle_blaster_drink']) {
    exerciseItem(itemId, true)
    assert.equal(calls.drinks, 1, `${itemId}: owned bottle enters the reducer escalation exactly once`)
    assert.deepEqual(calls.food, [], 'the special drink does not also apply generic instant effects')
    assert.deepEqual(calls.comments, [])
    exerciseItem(itemId, false)
    assert.equal(calls.drinks, 0, `${itemId}: alias cannot bypass bottle ownership`)
    assert.deepEqual(calls.food, [])
    assert.equal(calls.comments.length, 1)
    assert.match(calls.comments[0], /you do not have/)
  }
  exerciseItem('not_a_consumable', true)
  assert.equal(calls.drinks, 0); assert.deepEqual(calls.comments, [])
  exerciseItem('herbal_tea', false)
  assert.equal(calls.drinks, 0)
  assert.deepEqual(calls.food, [[5, 0, 0, true]])
  assert.match(calls.comments[0], /Herbal Tea/)
  console.log('Consumable hook: bottle and drink aliases, ownership guard, special dispatch and ordinary item behavior PASS')
}
void main().catch(error => { console.error(error); process.exitCode = 1 })
