/** Slice 4: authored illustrations, not surveyed views of the named landmark.
 * Art direction: docs/CHASE_ART_BIBLE_20260614.md. All assets are generated
 * reconstructions, exported at 320x180 for nearest-neighbor display. */
export const TRAIL_OUTCOME_ART = {
  'grave-town': {
    src: '/trail-outcomes/grave-town.png',
    alt: 'A stone marker and wildflowers at the edge of a canvas camp. The road continues beyond it.',
  },
  'grave-trail': {
    src: '/trail-outcomes/grave-trail.png',
    alt: 'A wooden cross and cairn beside a warm, winding trail at sunset.',
  },
  drifting: {
    src: '/trail-outcomes/river-drifting.png',
    alt: 'A covered wagon partly submerged in the river, with supplies drifting beside it.',
  },
  mud: {
    src: '/trail-outcomes/river-mud.png',
    alt: 'An upright covered wagon with its wheels sunk into mud on the riverbank.',
  },
  rocks: {
    src: '/trail-outcomes/river-rocks.png',
    alt: 'A damaged covered wagon stranded on river rocks, with a broken wooden wheel.',
  },
} as const

export type TrailOutcomeArtId = keyof typeof TRAIL_OUTCOME_ART
export type RiverFailureScene = 'drifting' | 'mud' | 'rocks'

/** These authored beats are attached by the existing crossing resolver. They
 * describe its illustration and add no cost, injury or extra outcome roll. */
export const RIVER_FAILURE_CAPTIONS: Record<RiverFailureScene, string> = {
  drifting: 'The wagon takes on water. It makes a poor submarine.',
  mud: 'The wheels settle into the bank. The mud has claimed a parking space.',
  rocks: 'The wagon meets the rocks. The rocks decline to move.',
}
