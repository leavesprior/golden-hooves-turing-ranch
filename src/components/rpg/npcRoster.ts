/**
 * Client-safe NPC display metadata + per-clue-location host mapping.
 *
 * IMPORTANT: NO system prompts / canon / agendas here — those live server-side
 * in the route's characters.ts and must never ship to the client bundle. This
 * file holds only what the chat panel needs to render: id, name, portrait, intro.
 */

import { getPortrait } from '@/app/oregon-trail/data/characterPortraits'

export interface NpcDisplay {
  characterId: string
  name: string
  portrait: string
  intro: (locationName: string) => string
}

export const NPC_DISPLAY: Record<string, NpcDisplay> = {
  tobias: {
    characterId: 'tobias',
    name: 'Tobias',
    portrait: getPortrait('tobias'),
    intro: (loc) =>
      `An old prospector lingers near ${loc}. He looks like he has been here a very long time, and is in no hurry to leave.`,
  },
  ben_coon: {
    characterId: 'ben_coon',
    name: 'Ben Coon',
    portrait: getPortrait('bartender_ben'),
    intro: (loc) =>
      `A barkeep holds court near ${loc}, polishing a glass he never quite sets down. He has the look of a man with a story he is dying to tell.`,
  },
}

// Which NPC hosts each clue location (slug -> characterId). Unmapped slugs
// default to Tobias, the ranch's founding spirit.
const LOCATION_HOST: Record<string, string> = {
  'game-room': 'ben_coon',
}

export function getLocationHost(slug: string): NpcDisplay {
  const id = LOCATION_HOST[slug] ?? 'tobias'
  return NPC_DISPLAY[id] ?? NPC_DISPLAY.tobias
}
