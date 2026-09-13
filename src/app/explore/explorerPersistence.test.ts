import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { build } from 'esbuild'
import type { ExplorerContextValue, ExplorerProgress, Town } from './explorerContext'
import { normalizeTownWalkSnapshot, stepTownWalk, townWalkMap, isTownWalkPassable, type TownWalkSnapshot } from '../../lib/townWalk'

const STORAGE_KEY = 'gold_country_explorer_progress'
const plain = <T,>(value: T): T => JSON.parse(JSON.stringify(value))
const town: Town = {
  id: 'west_point', name: 'West Point', tagline: '', description: '', townStory: '',
  coordinates: { lat: 38.3965, lng: -120.5269 }, secretAttractions: [],
  attractions: [
    { id: 'wp_trail_camp', name: 'The pack road', icon: '', category: 'adventure', description: '', funFact: 'Flour and rope.', insiderTip: '', xp: 15 },
    { id: 'second_fixture', name: 'Second fixture', icon: '', category: 'adventure', description: '', funFact: 'A second journal entry.', insiderTip: '', xp: 20 },
  ],
}

type Effect = { deps?: unknown[]; run: () => void | (() => void); cleanup?: () => void; pending: boolean }
type StateSlot = { value: unknown; pending: Array<unknown | ((prev: unknown) => unknown)> }

/**
 * Deterministic hook scheduling around the REAL provider, not a copied save
 * implementation. Delay rendering/effects so actions, debounce and pagehide
 * can interleave; replay React updaters and mount effects to catch side effects.
 * The separate browser test covers actual React/DOM lifecycle behavior.
 */
function harness(code: string, storage = new Map<string, string>(), onRender?: (context: ExplorerContextValue) => void) {
  const slots: unknown[] = []
  const states: StateSlot[] = []
  const effects: Effect[] = []
  const timers = new Map<number, () => void>()
  const listeners = new Map<string, Set<() => void>>()
  const calls: Array<{ name: string; args: unknown[] }> = []
  let cursor = 0
  let nextTimer = 0
  let rendering = false
  let updating = false
  let value: ExplorerContextValue
  const depsMatch = (a?: unknown[], b?: unknown[]) => !!a && !!b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]))
  const assertEffectsAllowed = () => {
    assert.equal(rendering || updating, false, 'storage/reward callbacks must not run during render or a React updater')
  }
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    createElement: (_type: unknown, props: { value: ExplorerContextValue }) => ({ props }),
    useContext: () => value,
    useState(initial: unknown) {
      const index = cursor++
      if (!slots[index]) {
        const slot: StateSlot = { value: typeof initial === 'function' ? initial() : initial, pending: [] }
        slots[index] = slot
        states.push(slot)
      }
      const slot = slots[index] as StateSlot
      return [slot.value, (next: unknown) => { slot.pending.push(next) }]
    },
    useRef(initial: unknown) {
      const index = cursor++
      if (!slots[index]) slots[index] = { current: initial }
      return slots[index]
    },
    useCallback(callback: unknown, deps: unknown[]) {
      const index = cursor++
      const slot = slots[index] as { deps: unknown[]; callback: unknown } | undefined
      if (!slot || !depsMatch(slot.deps, deps)) slots[index] = { deps, callback }
      return (slots[index] as { callback: unknown }).callback
    },
    useEffect(run: Effect['run'], deps?: unknown[]) {
      const index = cursor++
      let effect = slots[index] as Effect | undefined
      if (!effect) {
        effect = { run, deps, pending: true }
        slots[index] = effect
        effects.push(effect)
      } else if (!depsMatch(effect.deps, deps)) {
        effect.run = run
        effect.deps = deps
        effect.pending = true
      }
    },
  }
  const crossGame = new Proxy({}, { get: (_target, name) => (...args: unknown[]) => {
    assertEffectsAllowed()
    calls.push({ name: String(name), args })
  } })
  const compiled = { exports: {} as { ExplorerProvider: (props: unknown) => { props: { value: ExplorerContextValue } } } }
  const actualRequire = createRequire(import.meta.url)
  runInNewContext(code, {
    module: compiled, exports: compiled.exports,
    require: (id: string) => id === 'react' ? react : actualRequire(id),
    __crossGame: crossGame,
    process: { env: {} }, console,
    localStorage: {
      getItem(key: string) { assertEffectsAllowed(); return storage.get(key) ?? null },
      setItem(key: string, saved: string) { assertEffectsAllowed(); storage.set(key, saved) },
      removeItem(key: string) { assertEffectsAllowed(); storage.delete(key) },
    },
    window: {
      addEventListener(name: string, callback: () => void) {
        if (!listeners.has(name)) listeners.set(name, new Set())
        listeners.get(name)!.add(callback)
      },
      removeEventListener(name: string, callback: () => void) { listeners.get(name)?.delete(callback) },
    },
    setTimeout(callback: () => void) { timers.set(++nextTimer, callback); return nextTimer },
    clearTimeout(id: number) { timers.delete(id) },
  })
  function render() {
    cursor = 0
    rendering = true
    try {
      value = compiled.exports.ExplorerProvider({
        children: null, towns: [town],
        onBadgeEarned: (badge: unknown) => { assertEffectsAllowed(); calls.push({ name: 'badge', args: [badge] }) },
      }).props.value
      onRender?.(value)
    } finally { rendering = false }
  }
  function flushEffects() {
    for (const effect of effects) {
      if (!effect.pending) continue
      effect.pending = false
      effect.cleanup?.()
      effect.cleanup = effect.run() || undefined
    }
  }
  function settle() {
    for (let count = 0; count < 30; count++) {
      if (!states.some(slot => slot.pending.length) && !effects.some(effect => effect.pending)) return
      for (const slot of states) {
        for (const update of slot.pending.splice(0)) {
          if (typeof update === 'function') {
            updating = true
            try {
              const first = update(slot.value)
              const second = update(slot.value)
              assert.deepEqual(plain(first), plain(second), 'React updater replay must be pure')
              slot.value = second
            } finally { updating = false }
          } else slot.value = update
        }
      }
      render()
      flushEffects()
    }
    throw new Error('Provider did not settle')
  }
  return {
    storage, calls,
    get value() { return value },
    mount(earlyTown?: string, replayEffects = true, childEffect?: (context: ExplorerContextValue) => void) {
      render()
      // InteractiveTown visits in a child layout effect, before provider effects.
      if (earlyTown) value.visitTown(earlyTown)
      childEffect?.(value)
      flushEffects()
      settle()
      if (replayEffects) {
        for (const effect of effects) effect.cleanup?.()
        for (const effect of effects) { effect.cleanup = undefined; effect.pending = true }
        if (earlyTown) value.visitTown(earlyTown)
        childEffect?.(value)
        flushEffects()
        settle()
      }
    },
    settle,
    debounce() {
      for (const [id, callback] of [...timers]) { timers.delete(id); callback() }
      settle()
    },
    pagehide() { for (const callback of listeners.get('pagehide') ?? []) callback() },
    unmount() { for (const effect of effects) effect.cleanup?.() },
    saved(): ExplorerProgress { return JSON.parse(storage.get(STORAGE_KEY)!) },
  }
}

async function main() {
  const result = await build({
    entryPoints: [fileURLToPath(new URL('./explorerContext.tsx', import.meta.url))],
    bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'],
    jsx: 'transform', jsxFactory: 'React.createElement',
    plugins: [{ name: 'explorer-test-cross-game', setup(builder) {
      builder.onResolve({ filter: /^@\/lib\/crossGameProgression$/ }, () => ({ path: 'cross-game', namespace: 'test-context' }))
      builder.onLoad({ filter: /.*/, namespace: 'test-context' }, () => ({ contents: 'export const CrossGameStorage = __crossGame' }))
    } }],
  })
  const code = result.outputFiles[0].text
  const initial = { totalXP: 7, visitedTowns: ['angels_camp'], favoriteAttractions: ['kept_favorite'] }
  const seeded = () => new Map([[STORAGE_KEY, JSON.stringify(initial)]])
  let count = 0
  function test(name: string, run: () => void) { run(); count++; console.log(`PASS ${name}`) }

  test('initial save and early child town visit survive mount-effect replay', () => {
    const h = harness(code, seeded())
    h.mount('west_point')
    assert.equal(h.value.progress.totalXP, 7)
    assert.deepEqual(plain(h.value.progress.visitedTowns), ['angels_camp', 'west_point'])
    assert.deepEqual(plain(h.value.progress.favoriteAttractions), ['kept_favorite'])
    assert.deepEqual(plain(h.value.progress.journalEntries), [])
    assert.deepEqual(plain(h.value.progress.mysteries), [])
    assert.equal(h.calls.length, 0, 'opening a town adds no attraction rewards')
    h.unmount()
  })

  test('HUD mount streak check reads the loaded save before provider effects', () => {
    const storage = seeded()
    storage.set(STORAGE_KEY, JSON.stringify({ ...initial, lastPlayDate: new Date().toDateString(), streakDays: 6 }))
    const h = harness(code, storage)
    h.mount(undefined, true, context => context.checkStreak())
    assert.equal(h.value.progress.streakDays, 6)
    assert.equal(h.value.progress.totalXP, 7)
    h.unmount()
    assert.equal(h.saved().streakDays, 6)
  })

  test('debounce saves new XP, visit, journal, depth and badge over a prior save', () => {
    const h = harness(code, seeded())
    h.mount('west_point')
    assert.equal(h.value.visitAttraction('wp_trail_camp', 'west_point').xpGained, 15)
    h.settle()
    h.debounce()
    const saved = h.saved()
    assert.equal(saved.totalXP, 22)
    assert.deepEqual(saved.visitedAttractions, ['wp_trail_camp'])
    assert.equal(saved.journalEntries.length, 1)
    assert.equal(saved.journalEntries[0].content, town.attractions[0].funFact)
    assert.equal(saved.historicalDepthScore, 1)
    assert.equal(saved.badges.filter(b => b.id === 'first_visit').length, 1)
    assert.deepEqual(h.calls.map(call => call.name), ['badge', 'syncKarmaToPool', 'addHistoricalDepth'])
    h.unmount()
    const reloaded = harness(code, h.storage)
    reloaded.mount('west_point')
    assert.deepEqual(plain(reloaded.value.progress), saved)
    reloaded.unmount()
  })

  test('same-town revisit before debounce cannot replace committed attraction progress', () => {
    const h = harness(code, seeded())
    h.mount('west_point')
    h.value.visitAttraction('wp_trail_camp', 'west_point')
    h.settle()
    h.value.visitTown('west_point')
    h.settle()
    assert.equal(h.value.progress.totalXP, 22)
    assert.equal(h.value.progress.journalEntries.length, 1)
    h.debounce()
    assert.equal(h.saved().totalXP, 22)
    h.unmount()
  })

  test('same-turn actions compose and duplicate visits do not repeat reward callbacks', () => {
    const h = harness(code, seeded())
    h.mount('west_point')
    assert.equal(h.value.visitAttraction('wp_trail_camp', 'west_point').xpGained, 15)
    assert.equal(h.value.visitAttraction('wp_trail_camp', 'west_point').xpGained, 0)
    assert.equal(h.value.visitAttraction('second_fixture', 'west_point').xpGained, 20)
    h.value.visitTown('west_point')
    h.value.saveProgress() // Deliberately before any React state/effect flush.
    assert.equal(h.saved().totalXP, 42)
    assert.equal(h.saved().journalEntries.length, 2)
    assert.equal(h.calls.filter(call => call.name === 'badge').length, 1)
    assert.equal(h.calls.filter(call => call.name === 'addHistoricalDepth').length, 2)
    h.settle()
    assert.equal(h.value.progress.totalXP, 42)
    h.unmount()
  })

  test('pagehide and unmount flush pending actions before render or debounce', () => {
    for (const exit of ['pagehide', 'unmount'] as const) {
      const h = harness(code, seeded())
      h.mount('west_point')
      h.value.visitAttraction('wp_trail_camp', 'west_point')
      h[exit]()
      const next = harness(code, h.storage)
      next.mount('volcano')
      assert.equal(next.value.progress.totalXP, 22, exit)
      assert.deepEqual(plain(next.value.progress.visitedTowns), ['angels_camp', 'west_point', 'volcano'])
      assert.equal(next.value.progress.journalEntries.length, 1)
      next.unmount()
    }
  })

  test('new town write includes other actions queued in the same turn', () => {
    const h = harness(code, seeded())
    h.mount('west_point')
    h.value.visitAttraction('wp_trail_camp', 'west_point')
    h.value.visitTown('volcano')
    assert.equal(h.saved().totalXP, 22)
    assert.deepEqual(h.saved().visitedTowns, ['angels_camp', 'west_point', 'volcano'])
    h.unmount()
  })

  test('favorite deletion and reset persist without resurrecting old arrays', () => {
    const h = harness(code, seeded())
    h.mount('west_point')
    h.value.toggleFavorite('kept_favorite')
    h.value.visitTown('west_point')
    h.value.saveProgress()
    assert.deepEqual(h.saved().favoriteAttractions, [])
    h.value.visitAttraction('wp_trail_camp', 'west_point')
    h.value.resetProgress()
    h.pagehide()
    assert.equal(h.saved().totalXP, 0)
    assert.deepEqual(h.saved().visitedTowns, [])
    assert.deepEqual(h.saved().visitedAttractions, [])
    assert.deepEqual(h.saved().journalEntries, [])
    h.unmount()
    const next = harness(code, h.storage)
    next.mount()
    assert.equal(next.value.progress.totalXP, 0)
    assert.deepEqual(plain(next.value.progress.favoriteAttractions), [])
    next.unmount()
  })

  test('explicit load replaces progress and supplies legacy defaults', () => {
    const h = harness(code, seeded())
    h.mount('west_point')
    h.value.visitAttraction('wp_trail_camp', 'west_point')
    h.storage.set(STORAGE_KEY, JSON.stringify({ totalXP: 3, visitedTowns: ['volcano'], historicalDepthScore: 12 }))
    assert.equal(h.value.loadProgress(), true)
    h.value.saveProgress()
    assert.equal(h.saved().totalXP, 3)
    assert.deepEqual(h.saved().visitedTowns, ['volcano'])
    assert.deepEqual(h.saved().visitedAttractions, [])
    assert.deepEqual(h.saved().journalEntries, [])
    assert.equal(h.saved().historicalDepthLevel, 'Student')
    h.unmount()
  })

  test('invalid or absent explicit loads leave current progress intact', () => {
    const h = harness(code, seeded())
    h.mount('west_point')
    h.value.visitAttraction('wp_trail_camp', 'west_point')
    for (const invalid of ['{broken', 'null', '[]']) {
      h.storage.set(STORAGE_KEY, invalid)
      assert.equal(h.value.loadProgress(), false)
    }
    h.storage.delete(STORAGE_KEY)
    assert.equal(h.value.loadProgress(), false)
    h.value.saveProgress()
    assert.equal(h.saved().totalXP, 22)
    h.unmount()
  })

  test('walking getters are render-safe copied defaults without adding visits or save data', () => {
    const h = harness(code, seeded(), context => {
      assert.ok(context.getTownWalk('west_point')) // Reads during render cannot touch storage.
    })
    h.mount()
    const before = plain(h.value.progress)
    const walk = h.value.getTownWalk('west_point')!
    assert.deepEqual(plain(walk.position), townWalkMap('west_point')!.spawn)
    assert.equal(h.value.getTownWalk('bobr_ranch'), undefined)
    walk.position.x = 999
    assert.deepEqual(plain(h.value.getTownWalk('west_point')!.position), townWalkMap('west_point')!.spawn)
    assert.deepEqual(plain(h.value.progress), before)
    h.value.saveProgress()
    assert.equal(h.saved().townWalks, undefined, 'legacy save shape stays unchanged until walking is saved')
    assert.deepEqual(h.calls, [], 'reading a scene cannot award exploration or karma')
    h.unmount()
  })

  test('several walking positions before one render persist the latest copied position', () => {
    const h = harness(code, seeded())
    h.mount()
    let walk = h.value.getTownWalk('west_point')!
    const map = townWalkMap(walk.townId)!
    for (const direction of ['up', 'up', 'left'] as const) {
      const position = stepTownWalk(map, walk.position, direction)
      assert.notDeepEqual(position, walk.position, 'fixture exercises actual successful moves')
      walk = { ...walk, position }
      h.value.saveTownWalk(walk)
    }
    const expected = plain(walk)
    walk.position.x = 999 // The caller must not retain ownership of saved coordinates.
    h.pagehide() // Before React has committed any of those moves.
    assert.deepEqual(h.saved().townWalks?.west_point, expected)
    assert.equal(h.saved().totalXP, 7)
    assert.deepEqual(h.saved().visitedTowns, ['angels_camp'])
    assert.deepEqual(h.calls, [])
    h.settle()
    const returned = h.value.getTownWalk('west_point')!
    returned.position.y = 999
    h.value.saveProgress()
    assert.deepEqual(h.saved().townWalks?.west_point, expected, 'getter results are copies too')
    h.unmount()
  })

  test('same-turn town snapshots compose with attraction progress and favorite deletion', () => {
    const h = harness(code, seeded())
    h.mount('west_point')
    h.value.visitAttraction('wp_trail_camp', 'west_point')
    h.value.toggleFavorite('kept_favorite')
    const expected: Record<string, TownWalkSnapshot> = {}
    for (const townId of ['west_point', 'volcano'] as const) {
      const walk = h.value.getTownWalk(townId)!
      walk.position = stepTownWalk(townWalkMap(townId)!, walk.position, 'up')
      expected[townId] = plain(walk)
      h.value.saveTownWalk(walk)
    }
    h.value.visitTown('volcano') // Its immediate write must include both pending walk saves.
    assert.deepEqual(h.saved().townWalks, expected)
    assert.equal(h.saved().totalXP, 22)
    assert.equal(h.saved().journalEntries.length, 1)
    assert.deepEqual(h.saved().favoriteAttractions, [])
    h.unmount()
    const next = harness(code, h.storage)
    next.mount('west_point')
    assert.deepEqual(plain(next.value.getTownWalk('west_point')), expected.west_point)
    assert.deepEqual(plain(next.value.getTownWalk('volcano')), expected.volcano)
    next.unmount()
  })

  test('room and exact exterior return position survive immediate unmount and reload', () => {
    for (const townId of ['west_point', 'volcano'] as const) {
      const h = harness(code, seeded())
      h.mount()
      const exterior = townWalkMap(townId)!
      const entrance = exterior.targets.find(target => target.kind === 'entrance')!
      if (entrance.kind !== 'entrance') throw new Error('fixture entrance missing')
      const returnPosition = { x: entrance.position.x, y: entrance.position.y + 1 }
      assert.ok(isTownWalkPassable(exterior, returnPosition))
      const inside: TownWalkSnapshot = {
        ...normalizeTownWalkSnapshot(townId, undefined)!,
        roomId: entrance.destination.roomId,
        position: { ...entrance.destination.position },
        exteriorReturnPosition: { ...returnPosition },
      }
      h.value.saveTownWalk(inside)
      inside.exteriorReturnPosition!.x = 999
      h.unmount()
      const next = harness(code, h.storage)
      next.mount()
      const restored = next.value.getTownWalk(townId)!
      assert.equal(restored.roomId, 'shelter')
      assert.deepEqual(plain(restored.position), entrance.destination.position)
      assert.deepEqual(plain(restored.exteriorReturnPosition), returnPosition)
      const { exteriorReturnPosition, ...outside } = restored
      next.value.saveTownWalk({ ...outside, roomId: 'exterior', position: exteriorReturnPosition! })
      next.pagehide()
      assert.deepEqual(next.saved().townWalks?.[townId]?.position, returnPosition)
      assert.equal(next.saved().townWalks?.[townId]?.exteriorReturnPosition, undefined)
      next.unmount()
    }
  })

  test('invalid walking saves recover only walking fields and preserve campaign data', () => {
    const campaign = { ...initial,
      journalEntries: [{ id: 'kept_note', timestamp: 1, type: 'note', townId: 'angels_camp', title: 'Keep', content: 'Prior campaign note' }],
      futureCampaignField: { retained: true },
    }
    const valid = normalizeTownWalkSnapshot('west_point', undefined)!
    const blocked = townWalkMap('west_point')!.props.find(prop => prop.blocksMovement)!.position
    for (const townWalks of [
      { west_point: { ...valid, version: 999 } },
      { west_point: { ...valid, position: blocked } },
      { west_point: { ...valid, position: { x: 'wrong', y: 1 } } },
      { west_point: { ...valid, townId: 'volcano' } },
      { west_point: { ...valid, roomId: 'lost_room' }, unknown_town: valid },
      null, [], 'wrong',
    ]) {
      const storage = new Map([[STORAGE_KEY, JSON.stringify({ ...campaign, townWalks })]])
      const h = harness(code, storage)
      h.mount()
      const restored = h.value.getTownWalk('west_point')!
      assert.equal(restored.roomId, 'exterior')
      assert.deepEqual(plain(restored.position), townWalkMap('west_point')!.spawn)
      h.value.saveProgress()
      const saved = h.saved() as ExplorerProgress & { futureCampaignField: { retained: boolean } }
      assert.equal(saved.totalXP, campaign.totalXP)
      assert.deepEqual(saved.journalEntries, campaign.journalEntries)
      assert.deepEqual(saved.favoriteAttractions, campaign.favoriteAttractions)
      assert.deepEqual(saved.visitedTowns, campaign.visitedTowns)
      assert.deepEqual(saved.futureCampaignField, campaign.futureCampaignField)
      assert.deepEqual(h.calls, [])
      h.unmount()
    }
  })

  test('bad return coordinates are removed without moving a valid saved interior position', () => {
    const h = harness(code, seeded())
    h.mount()
    const room = townWalkMap('west_point', 'shelter')!
    h.value.saveTownWalk({ ...normalizeTownWalkSnapshot('west_point', undefined)!,
      roomId: 'shelter', position: { ...room.spawn }, exteriorReturnPosition: { x: -1, y: 3 },
    })
    h.value.saveProgress()
    assert.equal(h.saved().townWalks?.west_point?.exteriorReturnPosition, undefined)
    assert.deepEqual(h.saved().townWalks?.west_point?.position, room.spawn)
    assert.equal(h.saved().townWalks?.west_point?.roomId, 'shelter')
    h.value.resetProgress()
    h.value.saveProgress()
    assert.equal(h.saved().townWalks, undefined, 'a deliberate reset does not restore old positions')
    h.unmount()
  })

  console.log(`Explorer persistence: ${count} scenarios PASS (controlled hook lifecycle; browser verification separate)`)
}
void main().catch(error => { console.error(error); process.exitCode = 1 })
