/**
 * Per-town investigation rooms and who is actually there.
 * Generic saloon/stable/store in every town is the hole the 1849 design named.
 * Witness lists vary by town AND by the player's stats/karma.
 */
import type { WitnessType } from './clueTemplates'
import { getNPCsAtLocation, resolveNPCTownId } from './goldCountryNPCs'

export interface InvestigationRoom {
  id: string
  name: string
  icon: string
  witnesses: WitnessType[]
  npcIds?: string[]
}

export interface InvestigationVarianceInput {
  diplomacy?: number
  expertise?: number
  luck?: number
  goodKarma?: number
  badKarma?: number
}

const GENERIC: InvestigationRoom[] = [
  { id: 'saloon', name: 'Saloon', icon: '🍺', witnesses: ['bartender', 'drunk', 'traveler'] },
  { id: 'stable', name: 'Stable', icon: '🐴', witnesses: ['stable_hand'] },
  { id: 'general_store', name: 'General Store', icon: '🏪', witnesses: ['shopkeeper'] },
  { id: 'telegraph', name: 'Telegraph Office', icon: '⚡', witnesses: ['telegraph_operator'] },
  { id: 'church', name: 'Church', icon: '⛪', witnesses: ['preacher'] },
  { id: 'street', name: 'Street', icon: '🛤️', witnesses: ['settler', 'child', 'traveler'] },
]

/** Reconstructed camp places, not a surveyed inventory of historical buildings. */
export const TOWN_INVESTIGATION: Readonly<Record<string, readonly InvestigationRoom[]>> = {
  volcano: [
    { id: 'canvas_saloon', name: 'Canvas saloon', icon: '⛺', witnesses: [], npcIds: ['volcano_saloon_bell'] },
    { id: 'basin_diggings', name: 'Basin diggings', icon: '⛏️', witnesses: [], npcIds: ['volcano_placer_ortiz'] },
    { id: 'basin_overlook', name: 'Basin overlook', icon: '🌄', witnesses: [], npcIds: ['volcano_miwok_ana'] },
    { id: 'express_tent', name: 'Express tent', icon: '✉️', witnesses: [], npcIds: ['volcano_express_trask'] },
  ],
  west_point: [
    { id: 'sandy_gulch_diggings', name: 'Sandy Gulch diggings', icon: '⛏️', witnesses: [], npcIds: ['sandy_gulch_carsners_1849'] },
  ],
  angels_camp: [
    { id: 'trading_post', name: 'Creek trading post', icon: '🏪', witnesses: ['shopkeeper', 'settler'] },
    { id: 'creek', name: 'Creek diggings', icon: '⛏️', witnesses: ['settler', 'traveler'] },
    { id: 'saloon', name: 'Canvas saloon', icon: '🍺', witnesses: ['bartender', 'drunk'] },
  ],
  jackson: [
    { id: 'spring', name: 'Botilleas spring', icon: '♨️', witnesses: ['traveler', 'stable_hand'] },
    { id: 'crossroads', name: 'Crossroads', icon: '🛤️', witnesses: ['settler', 'shopkeeper'] },
    { id: 'saloon', name: 'Saloon', icon: '🍺', witnesses: ['bartender'] },
  ],
  fort_kearny: [
    { id: 'parade', name: 'Parade ground', icon: '🏰', witnesses: ['settler'] },
    { id: 'blacksmith', name: 'Post blacksmith', icon: '⚒️', witnesses: ['stable_hand'] },
    { id: 'sutler', name: 'Sutler', icon: '🏪', witnesses: ['shopkeeper', 'traveler'] },
  ],
  fort_laramie: [
    { id: 'trader', name: 'Post trader', icon: '🏪', witnesses: ['shopkeeper', 'traveler'] },
    { id: 'sick_tent', name: 'Sick tent', icon: '⚕️', witnesses: ['preacher'] },
    { id: 'parade', name: 'Parade ground', icon: '🏰', witnesses: ['settler'] },
  ],
  independence_missouri: [
    { id: 'outfitter', name: 'Outfitter row', icon: '🎒', witnesses: ['shopkeeper', 'settler'] },
    { id: 'square', name: 'Square', icon: '🛤️', witnesses: ['traveler', 'child', 'preacher'] },
    { id: 'saloon', name: 'Saloon', icon: '🍺', witnesses: ['bartender', 'drunk'] },
  ],
  sacramento_regional_gateway: [
    { id: 'embarcadero', name: 'Embarcadero', icon: '🚢', witnesses: ['traveler', 'shopkeeper'] },
    { id: 'assay', name: 'Assay office', icon: '⚖️', witnesses: ['shopkeeper', 'settler'] },
    { id: 'saloon', name: 'Saloon', icon: '🍺', witnesses: ['bartender'] },
  ],
}

function extraWitnesses(input: InvestigationVarianceInput): WitnessType[] {
  const extra: WitnessType[] = []
  if ((input.diplomacy ?? 0) >= 7) extra.push('preacher')
  if ((input.expertise ?? 0) >= 7) extra.push('shopkeeper')
  if ((input.luck ?? 0) >= 7) extra.push('traveler')
  if ((input.goodKarma ?? 0) > 0) extra.push('sheriff_deputy')
  if ((input.badKarma ?? 0) > 0) extra.push('drunk')
  return extra
}

export function investigationTownId(landmarkName: string): string {
  const id = resolveNPCTownId(landmarkName)
  // Campaign staging in nearby Sandy Gulch; not a new geographic registry alias.
  if (id === 'sandy_gulch') return 'west_point'
  if (id === 'independence') return 'independence_missouri'
  return id
}

export function investigationNPCsFor(landmarkName: string) {
  // Living Trail's later ghosts retain their exact node IDs and presence flow.
  return getNPCsAtLocation(investigationTownId(landmarkName)).filter(npc => !npc.id.startsWith('lt_'))
}

export function investigationRoomsFor(
  landmarkName: string,
  variance: InvestigationVarianceInput = {},
): InvestigationRoom[] {
  const id = investigationTownId(landmarkName)
  const base = Object.hasOwn(TOWN_INVESTIGATION, id) ? TOWN_INVESTIGATION[id] : GENERIC
  // Authored casts stay authored. Their existing dialogue checks handle rapport.
  const extras = investigationNPCsFor(landmarkName).length ? [] : extraWitnesses(variance)
  return base.map((room, i) => {
    const witnesses = [...new Set([...room.witnesses, ...(i === 0 ? extras : [])])]
    return { ...room, witnesses, ...(room.npcIds ? { npcIds: [...room.npcIds] } : {}) }
  })
}
