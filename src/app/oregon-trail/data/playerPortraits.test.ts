import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BACKGROUND_BONUSES, BACKGROUND_DESCRIPTIONS, type CharacterBackground } from '../characterContext'
import { PLAYER_BACKGROUND_PORTRAITS, getPlayerBackgroundPortrait } from './playerPortraits'
import { getPassingPlayerPortrait } from './passingPlayerPortrait'
import { PlayerPortrait } from '../components/PlayerPortrait'
import { CHARACTER_PORTRAITS, PLACEHOLDER_PORTRAIT } from './characterPortraits'
import { DONOR_KEYS, readDepthDonor } from '@/lib/bobrDepthDonor'
import type { PartyMember } from '../state/types'

const expectedBonuses = {
  pinkerton_veteran: { Shrewdness: 2, Expertise: 2 },
  frontier_scout: { Agility: 2, Expertise: 2 },
  army_officer: { Diplomacy: 2, Durability: 2 },
  gambler: { Luck: 2, Shrewdness: 2 },
  doctor: { Shrewdness: 2, Durability: 2 },
  preacher: { Diplomacy: 2, Luck: 2 },
  outlaw_reformed: { Agility: 2, Luck: 2 },
}
assert.deepEqual(BACKGROUND_BONUSES, expectedBonuses, 'art preserves all seven existing role bonuses')
assert.deepEqual(Object.keys(PLAYER_BACKGROUND_PORTRAITS).sort(), Object.keys(BACKGROUND_BONUSES).sort())
assert.equal(CHARACTER_PORTRAITS.preacher, PLACEHOLDER_PORTRAIT, 'player art does not replace the preacher NPC archetype')
assert.equal(CHARACTER_PORTRAITS.tobias, '/sprites/tobias-portrait.png', 'Tobias retains his own identity')
assert.equal(CHARACTER_PORTRAITS.coconut_run_captain, PLACEHOLDER_PORTRAIT, 'adult art is never assigned to the child captain')
for (const missing of [null, undefined, '', 'miner', 'annie_oakley', 'constructor', '__proto__']) {
  assert.equal(getPlayerBackgroundPortrait(missing), undefined)
}

const stats = { Shrewdness: 13, Agility: 8, Durability: 12, Diplomacy: 10, Luck: 9, Expertise: 15 }
const storage = new Map<string, string>([
  [DONOR_KEYS.visits, JSON.stringify({ 'West Point': 3, Volcano: 2 })],
  [DONOR_KEYS.wallet, JSON.stringify({ balance: { neutral: 29, good: 7, bad: 2 } })],
])
const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
Object.defineProperty(globalThis, 'window', { configurable: true, value: {
  localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: () => assert.fail('portrait resolution must not write donor state') },
} })
const pngHashes = new Set<string>()
const originalRandom = Math.random
Math.random = () => { throw new Error('Portraits must not consume gameplay RNG') }
try {
  for (const background of Object.keys(expectedBonuses) as CharacterBackground[]) {
    const savedCharacter = { name: 'Mae Reed', background, stats, traits: ['eagle_eye'], level: 4, experience: 71 }
    const raw = JSON.stringify(savedCharacter)
    storage.set(DONOR_KEYS.character, raw)
    const before = [...storage]
    const donor = readDepthDonor()
    const portrait = getPlayerBackgroundPortrait(donor.background)!
    assert.equal(portrait, getPlayerBackgroundPortrait(JSON.parse(raw).background), 'same portrait after legacy save reload')
    assert.equal(portrait.label, BACKGROUND_DESCRIPTIONS[background].name)
    assert.deepEqual(donor.saddle, stats)
    assert.deepEqual(donor.traits, ['eagle_eye'])
    assert.deepEqual(donor.visits, { 'West Point': 3, Volcano: 2 })
    assert.deepEqual(donor.wallet, { tacos: 29, cookies: 7, coal: 2 })
    assert.deepEqual([...storage], before, 'selecting and resolving art preserves the complete donor save')

    const png = readFileSync(new URL('../../../../public' + portrait.src, import.meta.url))
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.equal(png.readUInt32BE(16), 96)
    assert.equal(png.readUInt32BE(20), 128)
    let paletteSize = 0
    for (let offset = 8; offset < png.length;) {
      const bytes = png.readUInt32BE(offset)
      if (png.toString('ascii', offset + 4, offset + 8) === 'PLTE') paletteSize = bytes / 3
      offset += bytes + 12
    }
    assert.ok(paletteSize > 0 && paletteSize <= 64, 'portrait export has a limited palette')
    pngHashes.add(createHash('sha256').update(png).digest('hex'))

    const markup = renderToStaticMarkup(React.createElement(PlayerPortrait, { name: donor.name!, background }))
    assert.ok(markup.includes(portrait.src))
    assert.ok(markup.includes('image-rendering:pixelated'), 'image itself overrides descendant smoothing')
    assert.ok(markup.includes('Mae Reed') && markup.includes(portrait.label), 'alt identifies the player and background')
    assert.equal(markup.includes('player-portrait-fallback'), false)
  }
  assert.equal(pngHashes.size, 7, 'all seven roles have distinct portraits')
  const fallback = renderToStaticMarkup(React.createElement(PlayerPortrait, { name: 'Unknown Traveler', background: 'unregistered' }))
  assert.ok(fallback.includes('player-portrait-fallback') && fallback.includes('Unknown Traveler'))
  assert.equal(fallback.includes('<img'), false, 'unknown backgrounds use an accessible emoji, never another person')
} finally {
  Math.random = originalRandom
  if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow)
  else Reflect.deleteProperty(globalThis, 'window')
}

const leader: PartyMember = { id: 'leader', name: 'Mae Reed', health: 0, isSick: false, role: 'leader' }
const companion: PartyMember = { ...leader, id: 'companion', name: 'June Vale', role: 'companion' }
const player = { name: leader.name, background: 'doctor' as const }
const record = { kind: 'trail' as const, place: 'Platte road', cause: 'The final journey ended.', fallenName: leader.name }
const terminal = { wagonLeader: leader.name, party: [leader, companion], passing: record }
const terminalBefore = JSON.stringify(terminal)
assert.equal(getPassingPlayerPortrait(terminal, player)?.placement, 'memorial', 'explicit unique dead leader may own the memorial face')
assert.deepEqual(getPassingPlayerPortrait(JSON.parse(terminalBefore), player), getPassingPlayerPortrait(terminal, player), 'recorded identity survives reload')
assert.equal(getPassingPlayerPortrait({ ...terminal, passing: { ...record, fallenName: companion.name } }, player)?.placement, 'legacy', 'companion memorial never receives the player face')
assert.equal(getPassingPlayerPortrait({ ...terminal, party: [leader, { ...companion, name: leader.name }] }, player)?.placement, 'legacy', 'duplicate names do not prove the fallen identity')
assert.equal(getPassingPlayerPortrait({ ...terminal, passing: undefined }, player)?.placement, 'legacy', 'old save fallback is not an explicit deceased identity')
assert.equal(getPassingPlayerPortrait({ ...terminal, party: [{ ...leader, health: 10 }] }, player)?.placement, 'legacy', 'living leader cannot be pictured as deceased')
assert.equal(getPassingPlayerPortrait({ ...terminal, party: [] }, player)?.placement, 'legacy', 'absent roster is not memorial evidence')
assert.equal(getPassingPlayerPortrait(terminal, { ...player, name: 'Another Campaign' }), undefined, 'stale player save supplies no family identity')
assert.equal(getPassingPlayerPortrait(terminal, null), undefined)
assert.equal(JSON.stringify(terminal), terminalBefore, 'portrait placement cannot rewrite death or heir state')
console.log('Player portraits: seven assets, unchanged backgrounds/donor state, pixelated rendering, fallback and Passing identity safeguards PASS')
