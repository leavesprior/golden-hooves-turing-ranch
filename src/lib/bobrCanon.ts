export type BobrCanonCharacterId =
  | 'greggory_pryor'
  | 'cynthia_ghost'
  | 'leif_pryor'
  | 'heather_pryor'
  | 'theresa_pryor'
  | 'grey'
  | 'ryan'
  | 'aiden'
  | 'frank'
  | 'wanda'
  | 'tobias_goldsworth'

export type BobrCanonStage = 'initial' | 'later' | 'legacy_placeholder'

export interface BobrCanonCharacter {
  id: BobrCanonCharacterId
  displayName: string
  sourceName?: string
  stage: BobrCanonStage
  role: string
  gameUse: string
  verification: string
}

export const BOBR_DADS_BOOK_LORE_DOC =
  '/home/granny/Documents/BOBR/marketing/BOBR_DADS_BOOK_GAME_CANON_20260506.md'
export const BOBR_DADS_BOOK_CANON_DOC = BOBR_DADS_BOOK_LORE_DOC

export const BOBR_DADS_BOOK_SOURCE = {
  title: 'Blood, Sweat, and Soil',
  currentManuscript: '/home/granny/Documents/Dads_Book/Blood_Sweat_and_Soil_v6.5.md',
  status:
    "Dad's Book is a potential family lore and history reservoir for BOBR characters and observation beats; final game canon still needs public-wording verification.",
} as const

export const BOBR_CANON_CHARACTERS: Record<BobrCanonCharacterId, BobrCanonCharacter> = {
  greggory_pryor: {
    id: 'greggory_pryor',
    displayName: 'Greggory Pryor',
    sourceName: 'Greg Pryor / spelling pending Leif verification',
    stage: 'initial',
    role: 'Primary guide, builder, and ranch-memory anchor',
    gameUse:
      'Replaces Tobias as the first guide concept for the observation-game beta; teaches players to notice construction, stewardship, fire/forest knowledge, water systems, and practical ranch choices.',
    verification:
      "Leif directed Greggory as the working guide. Dad's Book offers supporting family-history material and identifies the memoir narrator as Greg Pryor; final public spelling must be verified before launch.",
  },
  cynthia_ghost: {
    id: 'cynthia_ghost',
    displayName: 'Cynthia',
    sourceName: 'Cyndee / spelling and public display pending verification',
    stage: 'initial',
    role: 'Ghost narrator from beyond the grave',
    gameUse:
      'Carries emotional memory and beyond-the-grave narration. Must stay specific to family/ranch memory, not generic spooky narration.',
    verification:
      "Leif directed Cynthia as ghost narrator. Dad's Book offers potential supporting history and uses Cyndee for Greg's first wife and Leif/Heather's mother; display spelling and relationship need verification.",
  },
  leif_pryor: {
    id: 'leif_pryor',
    displayName: 'Leif Pryor',
    stage: 'initial',
    role: 'Living bridge and current ranch steward',
    gameUse:
      "Present-day operator tying family lore, Neoma, guests, maintenance, water systems, rentals, animals, and ranch continuity together.",
    verification:
      "Dad's Book is potential supporting material for Leif's maintenance and operations role; verify exact public wording before launch.",
  },
  heather_pryor: {
    id: 'heather_pryor',
    displayName: 'Heather Pryor',
    stage: 'initial',
    role: 'Endurance, trail, animal, and movement memory',
    gameUse:
      'Supports observation mechanics around trails, stamina, terrain, horses, animal tells, and attention under strain.',
    verification:
      "Dad's Book is potential supporting material for Heather's ranch horses, endurance, athletics, and outdoor-work story beats.",
  },
  theresa_pryor: {
    id: 'theresa_pryor',
    displayName: 'Theresa Pryor',
    stage: 'later',
    role: 'Airbnb catalyst, diplomacy, family cohesion, and later adventure layer',
    gameUse:
      'Later canon character for BOBR becoming an Airbnb and for broader travel/adventure/family cohesion arcs.',
    verification:
      "Dad's Book is potential supporting material for Theresa's Airbnb, travel, and family-cohesion story beats.",
  },
  grey: {
    id: 'grey',
    displayName: 'Grey',
    stage: 'later',
    role: 'Later canon character',
    gameUse: "Reserved for future canon once Leif provides details or Dad's Book yields verified lore/history material.",
    verification: 'User-provided later character; source details pending.',
  },
  ryan: {
    id: 'ryan',
    displayName: 'Ryan',
    stage: 'later',
    role: 'Later family character',
    gameUse: 'Later canon character for family, scouting, advocacy, and ranch-adjacent stories.',
    verification:
      "Dad's Book is potential supporting material for Ryan's blended-family, scouting, advocacy, and ranch-adjacent story beats.",
  },
  aiden: {
    id: 'aiden',
    displayName: 'Aiden',
    stage: 'later',
    role: 'Later family character',
    gameUse: 'Later canon character for family, scouting, and blended-family story arcs.',
    verification:
      "Dad's Book is potential supporting material for Aiden's blended-family, scouting, and family-support story beats.",
  },
  frank: {
    id: 'frank',
    displayName: 'Frank',
    stage: 'later',
    role: 'Grandfather / construction mentor',
    gameUse:
      'Later canon character for construction, electrical, practical knowledge, and the property across the road.',
    verification:
      "Dad's Book is potential supporting material for Frank's construction, electrical, practical knowledge, and property-history story beats.",
  },
  wanda: {
    id: 'wanda',
    displayName: 'Wanda',
    stage: 'later',
    role: 'Grandmother and property-history character',
    gameUse:
      'Later canon character for the property Leif now lives on and the Fortuna move story after source verification.',
    verification:
      "User-provided lore says Frank and Wanda bought the property Leif now lives on; quick Dad's Book search did not verify Wanda/Fortuna yet.",
  },
  tobias_goldsworth: {
    id: 'tobias_goldsworth',
    displayName: 'Tobias Goldsworth',
    stage: 'legacy_placeholder',
    role: 'Legacy prototype guide',
    gameUse:
      "Do not use as future canon guide. Existing route text may still reference Tobias until the ranch-family conversion is implemented safely.",
    verification:
      "Superseded by Leif direction on 2026-05-06: BOBR's guide concept moves toward Pryor family characters, with Dad's Book as potential lore/history support.",
  },
}

export const BOBR_CANON_PRIMARY_GUIDE = BOBR_CANON_CHARACTERS.greggory_pryor
export const BOBR_CANON_GHOST_NARRATOR = BOBR_CANON_CHARACTERS.cynthia_ghost
export const BOBR_LEGACY_PLACEHOLDER_GUIDE = BOBR_CANON_CHARACTERS.tobias_goldsworth

export function getBobrCanonCharacter(id: BobrCanonCharacterId): BobrCanonCharacter {
  return BOBR_CANON_CHARACTERS[id]
}
