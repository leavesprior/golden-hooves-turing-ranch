import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LANDMARKS } from '../state/constants'
import { WITNESS_PERSONALITIES } from './clueTemplates'
import { getDialogueTree } from './dialogueTrees'
import { GOLD_COUNTRY_NPCS, getNPCById, getNPCsAtLocation } from './goldCountryNPCs'
import { investigationNPCsFor, investigationRoomsFor, investigationTownId, TOWN_INVESTIGATION } from './investigationTowns'
import { getCharacter } from '@/app/(api-routes)/api/neoma/data/characters'

const npcIds = (name: string) => investigationNPCsFor(name).map(npc => npc.id)
const varied = { diplomacy: 7, expertise: 7, luck: 7, goodKarma: 1, badKarma: 1 }

test('Volcano retains its existing four authored people in distinct camp places', () => {
  const expected = ['volcano_placer_ortiz', 'volcano_miwok_ana', 'volcano_saloon_bell', 'volcano_express_trask']
  assert.deepEqual(npcIds('Volcano'), expected)
  const rooms = investigationRoomsFor('Volcano')
  assert.ok(rooms.some(room => room.id === 'canvas_saloon'))
  assert.deepEqual(rooms.flatMap(room => room.npcIds ?? []).sort(), [...expected].sort())
  assert.ok(rooms.every(room => room.witnesses.length === 0))
})

test('West Point has the documented Sandy Gulch reconstruction, not later ghosts', () => {
  const town = LANDMARKS.find(landmark => landmark.name === 'West Point')!
  assert.deepEqual(npcIds(town.name), ['sandy_gulch_carsners_1849'])
  assert.deepEqual(npcIds('west_point'), npcIds(town.name))
  assert.notDeepEqual(investigationRoomsFor(town.name), investigationRoomsFor('Volcano'))
  assert.deepEqual(investigationRoomsFor(town.name).map(room => room.id), ['sandy_gulch_diggings'])
  const npc = getNPCsAtLocation('west_point')[0]
  assert.equal(npc.name, 'William & Dan Carsner')
  assert.match(npc.portrayalNote!, /reconstructed conversation, not recorded words/)
  assert.equal(npc.investigationClue?.isTrue, true)
  assert.match(npc.investigationClue!.text, /1849/)
  assert.ok(!JSON.stringify(investigationRoomsFor(town.name)).includes('smith_camp'))
})

test('exact registry names, IDs and source aliases resolve to the same cast', () => {
  for (const alias of ['West Point', 'west_point', 'ch4_west_point', ' WEST POINT ']) {
    assert.deepEqual(getNPCsAtLocation(alias), getNPCsAtLocation('west_point'), alias)
  }
  assert.deepEqual(npcIds('ch2_volcano_main'), npcIds('Volcano'))
  assert.deepEqual(npcIds('angels_camp_expanded'), npcIds('Angels Camp'))
  assert.equal(investigationTownId('Sandy Gulch'), 'west_point')
  assert.deepEqual(npcIds('Sandy Gulch'), npcIds('West Point'))
})

test('Living Trail keeps its original ghosts at their own node IDs', () => {
  assert.deepEqual(getNPCsAtLocation('lt_wp_marker').map(npc => npc.id), ['lt_npc_john_r_smith'])
  assert.deepEqual(getNPCsAtLocation('lt_wp_sandy_gulch').map(npc => npc.id), ['lt_npc_carsner_brothers'])
  assert.deepEqual(investigationNPCsFor('lt_wp_marker'), [])
  assert.deepEqual(investigationNPCsFor('lt_wp_sandy_gulch'), [])
})

test('all existing exact NPC locations still resolve their full cast', () => {
  for (const location of new Set(GOLD_COUNTRY_NPCS.map(npc => npc.location))) {
    assert.deepEqual(getNPCsAtLocation(location).map(npc => npc.id), GOLD_COUNTRY_NPCS.filter(npc => npc.location === location).map(npc => npc.id), location)
  }
})

test('fallback towns have distinct rooms keyed to actual landmark names', () => {
  assert.equal(investigationRoomsFor(LANDMARKS[0].name)[0].id, 'outfitter')
  assert.equal(investigationRoomsFor('Fort Kearny')[0].id, 'parade')
  assert.equal(investigationRoomsFor('Fort Laramie')[0].id, 'trader')
  assert.equal(investigationRoomsFor('Sacramento regional gateway')[0].id, 'embarcadero')
  for (const name of ['Independence Rock', 'Sacramento Valley', 'New West Point', 'constructor', '__proto__', 'Unknown Creek', '']) {
    assert.equal(investigationRoomsFor(name)[0].id, 'saloon', name)
    assert.deepEqual(investigationNPCsFor(name), [], name)
  }
})

test('SADDLE and karma add supported witnesses at their precise thresholds', () => {
  const baseline = investigationRoomsFor('Fort Kearny')
  assert.deepEqual(investigationRoomsFor('Fort Kearny', {diplomacy:6, expertise:6, luck:6, goodKarma:0, badKarma:0}), baseline)
  for (const [input, witness] of [
    [{diplomacy:7}, 'preacher'], [{expertise:7}, 'shopkeeper'], [{luck:7}, 'traveler'],
    [{goodKarma:1}, 'sheriff_deputy'], [{badKarma:1}, 'drunk'],
  ] as const) {
    const rooms = investigationRoomsFor('Fort Kearny', input)
    assert.deepEqual(rooms[0].witnesses, ['settler', witness])
    assert.deepEqual(rooms.slice(1), baseline.slice(1))
  }
})

test('player variance neither appends generic people to authored casts nor duplicates witnesses', () => {
  for (const name of ['Volcano', 'West Point', 'Angels Camp', 'Jackson']) {
    assert.deepEqual(investigationRoomsFor(name, varied), investigationRoomsFor(name), name)
  }
  for (const room of investigationRoomsFor('Unknown Creek', varied)) {
    assert.equal(new Set(room.witnesses).size, room.witnesses.length)
  }
})

test('every fallback witness has personality and scripted dialogue; authored room IDs resolve', () => {
  for (const name of [...Object.keys(TOWN_INVESTIGATION), 'Unknown Creek']) {
    for (const room of investigationRoomsFor(name, varied)) {
      for (const witness of room.witnesses) {
        assert.ok(WITNESS_PERSONALITIES[witness], `${name}: ${witness}`)
        const tree = getDialogueTree(witness)
        assert.ok(tree.nodes[tree.startNode], `${name}: ${witness}`)
      }
      for (const id of room.npcIds ?? []) assert.ok(getNPCById(id), id)
    }
  }
})

test('room and witness mutations from one visit cannot affect another player', () => {
  for (const name of ['Unknown Creek', 'Volcano', 'Fort Kearny']) {
    const before = investigationRoomsFor(name)
    const changed = investigationRoomsFor(name, varied)
    changed[0].name = 'Changed'
    changed[0].witnesses.push('child')
    changed[0].npcIds?.push('invented')
    assert.deepEqual(investigationRoomsFor(name), before)
  }
})

test('the new historical reconstruction composes with the existing server character adapter', () => {
  const npc = getNPCById('sandy_gulch_carsners_1849')!
  const character = getCharacter(npc.id)!
  assert.equal(character.personality.id, npc.id)
  assert.equal(character.personality.basePrompt, npc.ollamaPrompt)
  assert.deepEqual(character.personality.canonSamples, [npc.greeting, ...npc.dialogueLines])
  assert.match(character.personality.basePrompt, /historical reconstruction/)
})

test('the reconstructed witness has authored offline questions and a grounded clue path', () => {
  const tree = getNPCById('sandy_gulch_carsners_1849')!.investigationDialogue!
  assert.ok(tree.nodes[tree.startNode])
  assert.equal(tree.nodes.discovery.effect?.grantClue, true)
  assert.ok(tree.nodes.greeting.responses?.some(response => response.skillCheck?.stat === 'Diplomacy'))
  for (const node of Object.values(tree.nodes)) {
    assert.doesNotMatch(node.text, /Black Bart|Pinkerton|telegraph|John R\. Smith/i)
    for (const response of node.responses ?? []) {
      if (response.nextNode) assert.ok(tree.nodes[response.nextNode], response.id)
      if (response.skillCheck?.failNode) assert.ok(tree.nodes[response.skillCheck.failNode], response.id)
    }
  }
})
