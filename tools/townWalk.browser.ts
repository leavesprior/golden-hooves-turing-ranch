import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, type Page } from 'playwright-core'
import { DEFAULT_STATE } from '../src/app/oregon-trail/state/constants'
import { DEFAULT_CROSS_GAME_STATE } from '../src/lib/crossGameProgression'
import { DEFAULT_KARMA_STATE } from '../src/lib/karmaStorage'
import { TOWN_NPCS, VOLCANO_LATER_ATTRACTION_IDS, WEST_POINT_LATER_ATTRACTION_IDS } from '../src/lib/goldCountryEditorial'
import { isTownWalkPassable, townWalkMap, townWalkTileAt, type TownWalkDirection, type TownWalkMap, type TownWalkPosition, type TownWalkSnapshot, type TownWalkTownId } from '../src/lib/townWalk'

// Usage: node --import tsx tools/townWalk.browser.ts [base URL] [label] [case regex]
// Fixtures contain prior campaign data only, never townWalks or earned trail
// completion. Every position is reached through actual keyboard/button/touch
// input; the pure authored maps are used only to plan traversable routes.
const base = process.argv[2] ?? 'http://127.0.0.1:3356'
const label = process.argv[3] ?? 'development'
const output = `artifacts/town-walk/browser-${label}`
const progressKey = 'gold_country_explorer_progress'
const priorNote = { id: 'prior-note', timestamp: 1788220800000, type: 'note', townId: 'angels_camp', title: 'Prior saved note', content: 'Disposable browser fixture: retain this player note.' }
const prior = { totalXP: 43, level: 1, visitedAttractions: ['ac_creek_camp'], visitedTowns: ['angels_camp'], unlockedSecrets: [], badges: [], challenges: [], favoriteAttractions: ['ac_creek_camp'], lastVisitedTown: 'angels_camp', streakDays: 3, lastPlayDate: new Date().toISOString().split('T')[0], mysteries: [], historicalDepthScore: 3, historicalDepthLevel: 'Newcomer', journalEntries: [priorNote] }
const fixtures: Record<string, string> = {
  [progressKey]: JSON.stringify(prior),
  golden_frog_local_save: JSON.stringify({ savedAt: '2026-09-01T00:00:00.000Z', state: { ...DEFAULT_STATE, phase: 'traveling', day: 40, distance: 451, food: 270, oxen: 2, wagonLeader: 'Mae Cedar', party: [{ id: 'mae', name: 'Mae Cedar', role: 'leader', health: 83, isSick: false }] } }),
  bobr_ranch_state: JSON.stringify({ unlocked: false, livestock: { pigs: 2 }, feedStock: 17, products: { Eggs: 7 }, gameDay: 70, ownedParcels: ['pine_bench'], soilMetrics: { pine_bench: { quality: 71 } } }),
  bobr_ot_character: JSON.stringify({ name: 'Mae Cedar', level: 2, experience: 17, traits: ['patient'] }),
  oregon_trail_karma_wallet: JSON.stringify({ balance: { good: 12, neutral: 400, bad: 2 }, walletMode: 'continue', alignment: { lawfulChaotic: 0, goodEvil: 0 } }),
  bobr_unified_karma: JSON.stringify(DEFAULT_KARMA_STATE),
  bobr_cross_game_progression: JSON.stringify(DEFAULT_CROSS_GAME_STATE),
}
const keys = Object.keys(fixtures)
const deltas: Record<TownWalkDirection, TownWalkPosition> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }
const directions = Object.keys(deltas) as TownWalkDirection[]
const arrow: Record<TownWalkDirection, string> = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }
const wasd: Record<TownWalkDirection, string> = { up: 'w', down: 's', left: 'a', right: 'd' }
const xp: Record<string, number> = { vol_canvas_flat: 15, vol_soldiers_gulch: 15, vol_cemetery: 20, wp_trail_camp: 15 }
type Input = 'keyboard' | 'touch' | 'button'
type ProbeEvent = { kind: string; at: number; document: number; target?: string; key?: string; raw?: string | null }
type Saved = { values: Record<string, string | null>; events: ProbeEvent[] }
type WalkUi = Pick<TownWalkSnapshot, 'townId' | 'roomId' | 'position'>
type Step = { townId: string; roomId: string; input: Input; direction: TownWalkDirection; key: string | null; from: TownWalkPosition; to: TownWalkPosition; blocked: boolean }
const results: Record<string, unknown>[] = []

async function instrument(page: Page) {
  await page.addInitScript({ content: `(() => {
    if (window.top !== window) return;
    const fixtures = ${JSON.stringify(fixtures)}, keys = ${JSON.stringify(keys)};
    const storage = window.localStorage, session = window.sessionStorage;
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    if (!get.call(storage, 'town-walk-browser-seeded')) {
      for (const [key, raw] of Object.entries(fixtures)) set.call(storage, key, raw);
      set.call(storage, 'town-walk-browser-seeded', 'yes');
    }
    const events = JSON.parse(get.call(session, 'town-walk-browser-events') || '[]');
    const documentId = performance.timeOrigin;
    const record = event => { events.push({ at: Date.now(), document: documentId, ...event }); set.call(session, 'town-walk-browser-events', JSON.stringify(events)); };
    window.__townWalkProbe = { snapshot: () => ({ values: Object.fromEntries(keys.map(key => [key, get.call(storage, key)])), events: events.slice() }) };
    Storage.prototype.setItem = function(key, raw) {
      if (this === storage && keys.includes(String(key))) record({ kind: 'set', key: String(key), raw: String(raw) });
      return set.call(this, key, raw);
    };
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest('button, a') : null;
      if (target) record({ kind: 'click', target: target.getAttribute('data-testid') || target.textContent.trim() });
    }, true);
    document.addEventListener('keydown', event => {
      if (event.target instanceof Element && event.target.getAttribute('data-testid') === 'town-walk-map') record({ kind: 'key', target: event.key });
    }, true);
    window.addEventListener('pagehide', () => record({ kind: 'pagehide' }));
    record({ kind: 'document-start' });
  })();` })
}

async function saved(page: Page, settle = false): Promise<Saved> {
  if (settle) await page.waitForTimeout(1250)
  return page.evaluate('window.__townWalkProbe.snapshot()')
}
function value(record: Saved, key = progressKey) { return JSON.parse(record.values[key] ?? 'null') }
function samePosition(a: TownWalkPosition, b: TownWalkPosition) { return a.x === b.x && a.y === b.y }
function distance(a: TownWalkPosition, b: TownWalkPosition) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) }
function positionKey(position: TownWalkPosition) { return `${position.x},${position.y}` }

function route(map: TownWalkMap, start: TownWalkPosition, goal: (position: TownWalkPosition) => boolean): TownWalkDirection[] {
  const queue = [{ position: start, path: [] as TownWalkDirection[] }]
  const seen = new Set([positionKey(start)])
  while (queue.length) {
    const current = queue.shift()!
    if (goal(current.position)) return current.path
    for (const direction of directions) {
      const delta = deltas[direction]
      const next = { x: current.position.x + delta.x, y: current.position.y + delta.y }
      if (!isTownWalkPassable(map, next) || seen.has(positionKey(next))) continue
      seen.add(positionKey(next))
      queue.push({ position: next, path: [...current.path, direction] })
    }
  }
  throw new Error(`No authored route from ${map.townId}/${map.roomId}:${positionKey(start)}`)
}

async function ui(page: Page): Promise<WalkUi> {
  return page.evaluate(() => {
    const scene = document.querySelector('[data-testid="town-walk-scene"]')!
    const player = document.querySelector('[data-testid="town-walk-player"]')!
    return { townId: scene.getAttribute('data-town'), roomId: scene.getAttribute('data-room'), position: { x: Number(player.getAttribute('data-x')), y: Number(player.getAttribute('data-y')) } }
  }) as Promise<WalkUi>
}
async function expectUi(page: Page, expected: WalkUi) {
  await page.waitForFunction(expected => {
    const scene = document.querySelector('[data-testid="town-walk-scene"]')
    const player = document.querySelector('[data-testid="town-walk-player"]')
    return scene?.getAttribute('data-town') === expected.townId && scene?.getAttribute('data-room') === expected.roomId
      && Number(player?.getAttribute('data-x')) === expected.position.x && Number(player?.getAttribute('data-y')) === expected.position.y
  }, expected)
  assert.deepEqual(await ui(page), expected)
}

async function step(page: Page, direction: TownWalkDirection, input: Input, steps: Step[], blocked = false) {
  const before = await ui(page)
  const delta = deltas[direction]
  const destination = { x: before.position.x + delta.x, y: before.position.y + delta.y }
  const map = townWalkMap(before.townId, before.roomId)!
  assert.equal(isTownWalkPassable(map, destination), !blocked, 'planned input exercises its declared collision case')
  const key = input === 'keyboard' ? steps.length % 2 ? wasd[direction] : arrow[direction] : null
  if (key) await page.getByTestId('town-walk-map').press(key)
  else if (input === 'touch') await page.getByTestId(`town-walk-${direction}`).tap()
  else await page.getByTestId(`town-walk-${direction}`).click()
  const expected = { ...before, position: blocked ? before.position : destination }
  await expectUi(page, expected)
  steps.push({ townId: before.townId, roomId: before.roomId, input, direction, key, from: before.position, to: expected.position, blocked })
}

async function walkTo(page: Page, goal: (position: TownWalkPosition) => boolean, input: Input, steps: Step[]) {
  const current = await ui(page)
  const map = townWalkMap(current.townId, current.roomId)!
  for (const direction of route(map, current.position, goal)) await step(page, direction, input, steps)
}

async function nearby(page: Page) {
  const current = await ui(page)
  const map = townWalkMap(current.townId, current.roomId)!
  const expected = map.targets.filter(target => distance(target.position, current.position) <= 1).map(target => target.id).sort()
  const actual = await page.locator('[data-testid^="town-walk-action-"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-testid')!.replace('town-walk-action-', '')).sort())
  assert.deepEqual(actual, expected, 'only orthogonally adjacent targets expose actions')
  const visibleTargets = await page.getByTestId('town-walk-art').locator('[data-target-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-target-id')).sort())
  assert.deepEqual(visibleTargets, map.targets.map(target => target.id).sort(), 'only the current authored targets render')
}

function rewards(record: Saved, earned: Set<string>, talks: number) {
  const progress = value(record)
  assert.equal(progress.totalXP, 43 + [...earned].reduce((sum, id) => sum + xp[id], 0), 'only an actual first attraction action earns XP')
  assert.deepEqual(new Set(progress.visitedAttractions), new Set([...prior.visitedAttractions, ...earned]))
  assert.equal(progress.visitedAttractions.length, prior.visitedAttractions.length + earned.size, 'visits cannot duplicate')
  assert.equal(progress.journalEntries.length, 1 + earned.size, 'one journal entry per actual first attraction action')
  assert.deepEqual(progress.journalEntries[0], priorNote)
  for (const id of earned) assert.equal(progress.journalEntries.filter((entry: { id: string }) => entry.id.startsWith(`attraction_${id}_`)).length, 1)
  assert.equal(progress.historicalDepthScore, 3 + earned.size)
  assert.deepEqual(progress.favoriteAttractions, prior.favoriteAttractions)
  assert.equal(progress.streakDays, 3)
  assert.equal(value(record, 'bobr_unified_karma').history.length, earned.size + talks, 'walking and repeat inspections create no automatic Karma action')
  for (const key of ['golden_frog_local_save', 'bobr_ranch_state', 'bobr_ot_character', 'oregon_trail_karma_wallet']) {
    const donor = value(record, key)
    if (donor && typeof donor === 'object') delete donor.lastUpdated
    assert.deepEqual(donor, JSON.parse(fixtures[key]), `unrelated campaign donor remains intact: ${key}`)
  }
  assert.ok(!value(record, 'bobr_cross_game_progression').milestones.some((milestone: { id: string }) => milestone.id === 'reached_west_point'), 'walking does not earn Golden Frog Trail completion')
}

async function layout(page: Page) {
  const bounds = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }))
  assert.ok(bounds.documentWidth <= bounds.width + 1 && bounds.bodyWidth <= bounds.width + 1, `no horizontal page overflow: ${JSON.stringify(bounds)}`)
  const map = page.getByTestId('town-walk-map')
  if (await map.isVisible()) {
    const box = await map.boundingBox()
    assert.ok(box && box.width >= 300 && box.height >= 140, 'walk map remains a useful size')
    assert.equal(await page.getByTestId('town-walk-art').getAttribute('viewBox'), '0 0 320 176')
    assert.equal(await page.getByTestId('town-walk-art').getAttribute('shape-rendering'), 'crispEdges')
    const controls = []
    for (const direction of directions) {
      const button = page.getByTestId(`town-walk-${direction}`)
      const target = await button.boundingBox()
      assert.ok(target && target.width >= 44 && target.height >= 44, 'direction controls retain 44px touch targets')
      controls.push({ id: `town-walk-${direction}`, box: target })
    }
    if (bounds.width < 600) {
      const scrollArea = await map.locator('../..').boundingBox()
      assert.ok(scrollArea)
      const visible = (rect: { x: number; y: number; width: number; height: number }) => rect.x >= scrollArea.x - 1 && rect.y >= scrollArea.y - 1
        && rect.x + rect.width <= scrollArea.x + scrollArea.width + 1 && rect.y + rect.height <= scrollArea.y + scrollArea.height + 1
      assert.ok(visible(box), `mobile map remains fully visible with controls: ${JSON.stringify({ map: box, scrollArea })}`)
      const actions = page.locator('[data-testid^="town-walk-action-"]')
      for (let index = 0; index < await actions.count(); index++) {
        const action = actions.nth(index)
        const actionBox = await action.boundingBox()
        assert.ok(actionBox)
        controls.push({ id: (await action.getAttribute('data-testid'))!, box: actionBox })
      }
      for (const control of controls) {
        assert.ok(visible(control.box), `${control.id} remains fully visible beside the map, without automated scrolling: ${JSON.stringify({ control: control.box, scrollArea })}`)
        const front = await page.evaluate(point => document.elementFromPoint(point.x, point.y)?.closest('[data-testid]')?.getAttribute('data-testid'), { x: control.box.x + control.box.width / 2, y: control.box.y + control.box.height / 2 })
        assert.equal(front, control.id, `${control.id} is not covered by the dialogue/footer`)
      }
      return { ...bounds, map: box, scrollArea, controls }
    }
    return { ...bounds, map: box, controls }
  }
  return bounds
}

async function openTown(page: Page, town: TownWalkTownId, navigate = true) {
  if (navigate) await page.goto(`${base}/explore?town=${town}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.getByTestId('explore-town-face').waitFor({ state: 'visible', timeout: 120000 })
  assert.equal(await page.getByTestId('explore-town-face').getAttribute('data-town'), town)
  await page.waitForTimeout(600)
}

async function startWalk(page: Page, town: TownWalkTownId, expected?: WalkUi) {
  if (!await page.getByTestId('town-walk-scene').isVisible()) await page.getByTestId('town-walk-start').click()
  await page.getByTestId('town-walk-map').waitFor({ state: 'visible' })
  if (expected) await expectUi(page, expected)
  else await expectUi(page, { townId: town, roomId: 'exterior', position: townWalkMap(town)!.spawn })
}

function rapid(record: Saved, target: string, kind: 'click' | 'key' = 'click') {
  const action = record.events.filter(event => event.kind === kind && event.target === target).at(-1)
  assert.ok(action)
  const pagehide = record.events.find(event => event.kind === 'pagehide' && event.document === action.document && event.at >= action.at)
  assert.ok(pagehide, 'observe actual navigation/reload, not a synthetic lifecycle event')
  const milliseconds = pagehide.at - action.at
  assert.ok(milliseconds < 1000, `reload occurs before the save debounce (${milliseconds}ms)`)
  return { milliseconds, action, pagehide }
}

async function run() {
  await mkdir(output, { recursive: true })
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  try {
    for (const town of ['volcano', 'west_point'] as const) for (const phone of [false, true]) {
      const id = `${town}-${phone ? 'phone390' : 'desktop'}`
      if (process.argv[4] && !new RegExp(process.argv[4]).test(id)) continue
      const input: Input = phone ? 'touch' : 'keyboard'
      const context = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1365, height: 960 }, hasTouch: phone, isMobile: phone, serviceWorkers: 'block' })
      const page = await context.newPage()
      page.setDefaultTimeout(30000)
      const errors: string[] = [], consoleErrors: string[] = [], remoteRewards: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
      page.on('request', request => { if (/\/api\/(?:issue-bobr|record-bobr|karma\/event)/.test(request.url())) remoteRewards.push(request.url()) })
      await page.route('**/api/karma/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"local browser fixture"}' }))
      await instrument(page)
      const steps: Step[] = [], earned = new Set<string>()
      let talks = 0
      const evidence: Record<string, unknown> = { id, base, label, browser: browser.version(), steps }
      try {
        await openTown(page, town)
        assert.equal(await page.getByTestId('town-walk-scene').count(), 0, 'town opens its original Look view first')
        assert.equal(await page.getByTestId('place-picture-open').isVisible(), true, 'original painting and Look interaction remain available')
        const excluded = [...(town === 'volcano' ? VOLCANO_LATER_ATTRACTION_IDS : WEST_POINT_LATER_ATTRACTION_IDS), ...TOWN_NPCS[town].filter(npc => npc.period === 'later').map(npc => npc.id), ...(town === 'volcano' ? ['vol_tunnels'] : [])]
        for (const future of excluded) {
          assert.equal(await page.locator(`[data-testid="explore-spot-${future}"], [data-testid="explore-npc-${future}"]`).count(), 0, `${future} is not an 1849 pin`)
        }
        await page.getByTestId('place-picture-open').click({ position: { x: 12, y: 12 } })
        await page.getByTestId('place-picture-front').waitFor({ state: 'visible' })
        await page.getByTestId('place-picture-close').click()
        const initial = await saved(page, true)
        evidence.initial = initial
        assert.equal(value(initial).townWalks?.[town], undefined, 'fixture and opening Look do not seed a walking position')
        rewards(initial, earned, talks)
        await startWalk(page, town)
        const exterior = townWalkMap(town)!
        const spawn = await ui(page)
        await page.getByTestId('town-walk-map').click({ position: { x: 12, y: 12 } })
        await expectUi(page, spawn)
        const npc = exterior.targets.find(target => target.kind === 'npc')!
        await page.getByTestId('town-walk-art').locator(`[data-target-id="${npc.id}"]`).click()
        await expectUi(page, spawn)
        assert.equal(await page.getByTestId(`town-walk-action-${npc.id}`).count(), 0, 'distant NPC click does not expose its action or teleport')
        await nearby(page)
        evidence.initialLayout = await layout(page)
        await page.screenshot({ path: `${output}/${id}-exterior.png` })
        // Exercise the second input path too: real buttons on desktop, a real
        // keyboard event on the touch context. The remaining route uses input.
        await step(page, 'up', phone ? 'keyboard' : 'button', steps)
        const obstacle = town === 'volcano' ? { x: 8, y: 7 } : { x: 6, y: 7 }
        const approach = { x: obstacle.x, y: obstacle.y + 1 }
        await walkTo(page, position => samePosition(position, approach), input, steps)
        assert.equal(townWalkTileAt(exterior, obstacle)?.terrain === 'water', town === 'volcano')
        await step(page, 'up', input, steps, true)
        assert.match(await page.getByTestId('town-walk-feedback').innerText(), town === 'volcano' ? /creek blocks/i : /fire blocks/i)
        rewards(await saved(page, true), earned, talks)
        await page.screenshot({ path: `${output}/${id}-blocked.png` })
        await walkTo(page, position => distance(position, npc.position) === 1, input, steps)
        await nearby(page)
        const byNpc = await ui(page)
        const intoNpc = directions.find(direction => samePosition({ x: byNpc.position.x + deltas[direction].x, y: byNpc.position.y + deltas[direction].y }, npc.position))!
        await step(page, intoNpc, input, steps, true)
        assert.match(await page.getByTestId('town-walk-feedback').innerText(), /Someone is standing there/)
        rewards(await saved(page, true), earned, talks)
        await page.getByTestId(`town-walk-action-${npc.id}`).click()
        talks++
        const authoredNpc = TOWN_NPCS[town].find(item => item.id === npc.id)!
        await page.getByTestId('explore-town-face').locator('aside').getByText(`${authoredNpc.name}: “${authoredNpc.line}”`, { exact: true }).waitFor({ state: 'visible' })
        rewards(await saved(page, true), earned, talks)
        await layout(page)
        await page.screenshot({ path: `${output}/${id}-talk.png` })
        for (const target of exterior.targets.filter(target => target.kind === 'attraction')) {
          await walkTo(page, position => distance(position, target.position) <= 1, input, steps)
          await nearby(page)
          rewards(await saved(page, true), earned, talks)
          await page.getByTestId(`town-walk-action-${target.id}`).click()
          if (target.kind === 'attraction') earned.add(target.attractionId)
          rewards(await saved(page, true), earned, talks)
          assert.match(await page.getByTestId('town-walk-feedback').innerText(), /reading is below/i)
          await layout(page)
          await page.getByTestId(`town-walk-action-${target.id}`).click()
          rewards(await saved(page, true), earned, talks)
        }
        console.log(`CHECK ${id} movement, collision, nearby Look/Talk`)
        const entrance = exterior.targets.find(target => target.kind === 'entrance')!
        assert.equal(entrance.kind, 'entrance')
        if (entrance.kind !== 'entrance') throw new Error('Missing entrance')
        await walkTo(page, position => samePosition(position, entrance.position), input, steps)
        await nearby(page)
        rewards(await saved(page, true), earned, talks)
        const outside = await ui(page)
        evidence.exactApproach = outside
        await page.getByTestId(`town-walk-action-${entrance.id}`).click()
        earned.add(entrance.attractionId)
        const inside: WalkUi = { townId: town, roomId: entrance.destination.roomId, position: entrance.destination.position }
        await expectUi(page, inside)
        await page.reload({ waitUntil: 'domcontentloaded' })
        await openTown(page, town, false)
        assert.equal(await page.getByTestId('town-walk-scene').count(), 0, 'reload opens Look rather than auto-entering Walk')
        await startWalk(page, town, inside)
        const insideSaved = await saved(page, true)
        evidence.insideReload = insideSaved
        evidence.insideRapid = rapid(insideSaved, `town-walk-action-${entrance.id}`)
        const storedInside = value(insideSaved).townWalks[town]
        assert.deepEqual(storedInside, { version: 1, ...inside, exteriorReturnPosition: outside.position })
        rewards(insideSaved, earned, talks)
        await layout(page)
        await page.screenshot({ path: `${output}/${id}-inside-reloaded.png` })
        const shelter = townWalkMap(town, 'shelter')!
        const reading = shelter.targets.find(target => target.kind === 'attraction')!
        await walkTo(page, position => distance(position, reading.position) <= 1, input, steps)
        await nearby(page)
        rewards(await saved(page, true), earned, talks)
        await page.getByTestId(`town-walk-action-${reading.id}`).click()
        rewards(await saved(page, true), earned, talks)
        await layout(page)
        await page.screenshot({ path: `${output}/${id}-inside-reading.png` })
        const exit = shelter.targets.find(target => target.kind === 'exit')!
        await walkTo(page, position => distance(position, exit.position) <= 1, input, steps)
        await page.getByTestId(`town-walk-action-${exit.id}`).click()
        await expectUi(page, outside)
        assert.notDeepEqual(outside.position, exit.destination.position, 'saved approach differs from fixed exit fallback')
        const outsideSaved = await saved(page, true)
        assert.deepEqual(value(outsideSaved).townWalks[town], { version: 1, ...outside })
        rewards(outsideSaved, earned, talks)
        // Repeat actual Enter/Exit, not a storage rewrite or direct provider call.
        await page.getByTestId(`town-walk-action-${entrance.id}`).click()
        await expectUi(page, inside)
        await page.getByTestId(`town-walk-action-${exit.id}`).click()
        await expectUi(page, outside)
        rewards(await saved(page, true), earned, talks)
        await page.getByTestId('town-walk-look').click()
        await page.getByTestId('place-picture-open').waitFor({ state: 'visible' })
        assert.equal(await page.getByTestId('town-walk-map').count(), 0)
        await page.getByTestId(`explore-spot-${entrance.attractionId}`).click()
        if (town === 'volcano') {
          const ascii = page.getByTestId('explore-canvas-interior')
          await ascii.waitFor({ state: 'visible' })
          const text = await ascii.innerText()
          assert.equal(text.split('\n').length, 22, 'original authored 22-row ASCII reading remains available')
          assert.match(text, /#{20}/)
          await page.screenshot({ path: `${output}/${id}-original-ascii.png` })
        } else await page.getByRole('heading', { name: 'The pack road', exact: true }).waitFor({ state: 'visible' })
        rewards(await saved(page, true), earned, talks)
        await startWalk(page, town, outside)
        if (town === 'west_point') {
          const beforeToday = await saved(page, true)
          await page.getByTestId('town-walk-today').click()
          await page.getByTestId('place-scene-map').waitFor({ state: 'visible' })
          assert.equal(await page.getByTestId('town-walk-map').count(), 0, 'Today unmounts the keyboard movement surface')
          assert.equal(await page.getByTestId('town-walk-up').count(), 0)
          await page.keyboard.press('ArrowUp')
          await page.keyboard.press('d')
          const afterToday = await saved(page, true)
          assert.deepEqual(value(afterToday).townWalks, value(beforeToday).townWalks, 'Today key input cannot move saved walkers')
          rewards(afterToday, earned, talks)
          await layout(page)
          await page.getByTestId('place-scene-1849').click()
          await expectUi(page, outside)
          evidence.todayRestored = await ui(page)
        } else assert.equal(await page.getByTestId('town-walk-today').count(), 0)
        console.log(`CHECK ${id} exact room return, immediate reload, original Look/era views`)
        const firstTownSave = value(await saved(page, true)).townWalks[town]
        const other: TownWalkTownId = town === 'volcano' ? 'west_point' : 'volcano'
        const next = page.getByTestId('explore-interest-next').locator('a')
        assert.equal(await next.getAttribute('href'), `/explore?town=${other}`)
        await next.click()
        await page.waitForURL(`**/explore?town=${other}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
        await openTown(page, other, false)
        await startWalk(page, other)
        assert.deepEqual(value(await saved(page, true)).townWalks[town], firstTownSave)
        const otherBefore = await ui(page)
        await step(page, 'up', input, steps)
        const otherMoved = { ...otherBefore, position: { x: otherBefore.position.x, y: otherBefore.position.y - 1 } }
        await page.reload({ waitUntil: 'domcontentloaded' })
        await openTown(page, other, false)
        assert.equal(await page.getByTestId('town-walk-scene').count(), 0)
        await startWalk(page, other, otherMoved)
        const bothSaved = await saved(page, true)
        const last = steps.at(-1)!
        evidence.moveRapid = rapid(bothSaved, last.key ?? `town-walk-${last.direction}`, last.key ? 'key' : 'click')
        assert.deepEqual(value(bothSaved).townWalks[town], firstTownSave)
        assert.deepEqual(value(bothSaved).townWalks[other], { version: 1, ...otherMoved })
        rewards(bothSaved, earned, talks)
        await page.goBack({ waitUntil: 'domcontentloaded' })
        await openTown(page, town, false)
        await startWalk(page, town, outside)
        const final = await saved(page, true)
        assert.deepEqual(value(final).townWalks, value(bothSaved).townWalks, 'the two towns retain separate saved positions after returning')
        rewards(final, earned, talks)
        evidence.final = final
        evidence.finalLayout = await layout(page)
        evidence.earned = [...earned]
        evidence.talks = talks
        assert.ok(steps.filter(step => !step.blocked).length > 25, 'the browser actually traversed a nontrivial route')
        if (town === 'volcano') assert.ok(steps.some(step => step.townId === town && step.roomId === 'exterior' && townWalkTileAt(exterior, step.to)?.terrain === 'planks'), 'actual route crosses the creek using the authored planks')
        assert.deepEqual(errors, [], 'no uncaught application errors')
        assert.ok(!consoleErrors.some(error => /hydration|hydrating|Cannot update a component/.test(error)), 'no hydration or render-update errors')
        assert.deepEqual(remoteRewards, [], 'no remote settlement calls')
        await page.screenshot({ path: `${output}/${id}-complete.png` })
        await page.getByRole('button', { name: 'Leave town', exact: true }).click()
        await page.waitForURL('**/hub', { waitUntil: 'domcontentloaded', timeout: 120000 })
        evidence.leaveUrl = page.url()
        evidence.status = 'passed'
        console.log(`PASS ${id} (${steps.length} actual inputs)`)
      } catch (error) {
        evidence.status = 'failed'
        evidence.error = error instanceof Error ? error.stack : String(error)
        evidence.failureSnapshot = await saved(page).catch(() => null)
        await page.screenshot({ path: `${output}/${id}-failure.png` }).catch(() => {})
        console.error(`FAIL ${id}: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        evidence.errors = errors
        evidence.consoleErrors = consoleErrors
        evidence.remoteRewards = remoteRewards
        await writeFile(`${output}/${id}.json`, JSON.stringify(evidence, null, 2))
        results.push(evidence)
        await context.close()
      }
    }
    assert.ok(results.length > 0, 'at least one selected scenario ran')
    const failedCases = results.filter(result => result.status === 'failed').length
    await writeFile(`${output}/results.json`, JSON.stringify({ status: failedCases ? 'failed' : 'passed', base, label, cases: results.length, failedCases, results }, null, 2))
    if (failedCases) process.exitCode = 1
  } finally { await browser.close() }
}

run().catch(error => { console.error(error); process.exitCode = 1 })
