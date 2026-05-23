import type { SourceLayer } from './hotspotSchema'

export type GreggoryLineStage = 'first' | 'second' | 'redirect'

export interface GreggoryLine {
  stage: GreggoryLineStage
  text: string
  sourceLayer: SourceLayer
  verificationQuestion?: string
}

export const GREGGORY_LINES: Record<string, GreggoryLine[]> = {
  entry_gate: [
    // gold: Existing welcome route/gate threshold; no private family-history claim.
    {
      stage: 'first',
      sourceLayer: 'gold',
      text:
        'A gate is not the answer. It is where you stop guessing and start noticing what the ranch makes you solve first.',
    },
    // gold: Existing welcome route/gate threshold; no private family-history claim.
    {
      stage: 'second',
      sourceLayer: 'gold',
      text:
        'Look at the threshold: road, fence, shade, and sightline. A real place tells you how people and work move through it.',
    },
    // gold: Existing welcome route/gate threshold; no private family-history claim.
    {
      stage: 'redirect',
      sourceLayer: 'gold',
      text:
        'Do not try to solve it at the gate. Check the water setup or the work yard and ask what had to function before guests arrived.',
    },
  ],
  water_infrastructure: [
    // silver: Canon doc names water systems as observation cues; Dad's Book supports wells, tanks, and maintenance, pending public wording.
    {
      stage: 'first',
      sourceLayer: 'silver',
      text:
        'Water is not scenery on a ranch. If the animals, guests, and buildings need it, somebody had to make the hidden system reliable.',
    },
    // silver: Dad's Book supports redundant ranch water systems; exact public detail still needs verification.
    {
      stage: 'second',
      sourceLayer: 'silver',
      text:
        'A tank, a pipe run, or a cleared access path can matter more than a pretty sign. The useful clue is usually the thing that keeps working.',
    },
    // silver: Canon doc supports water systems as clues; line redirects without solving.
    {
      stage: 'redirect',
      sourceLayer: 'silver',
      text:
        'If the water clue feels too quiet, compare it with the guest-operation corner. Maintenance leaves a trail in both places.',
    },
  ],
  construction_materials: [
    // silver: Canon doc supports sweat equity, practical skill, family help, and long-build themes.
    {
      stage: 'first',
      sourceLayer: 'silver',
      text:
        'Posts, boards, sheds, and utility edges are not decoration. They are the handwriting of people who built before the place looked finished.',
    },
    // silver: Dad's Book supports long construction and sweat-equity themes; exact public wording still needs verification.
    {
      stage: 'second',
      sourceLayer: 'silver',
      text:
        'Sweat equity means you pay with evenings, weekends, repairs, and patience. The clue is not what is new. It is what had to be kept going.',
    },
    // silver: Canon doc supports construction/material cues; line redirects without solving.
    {
      stage: 'redirect',
      sourceLayer: 'silver',
      text:
        'You might check the gate again after this. A threshold looks different when you have noticed the work behind it.',
    },
  ],
  land_parcel: [
    // bronze: User requested 60-acre growth, while Dad's Book/canon notes say first thirteen acres to fifty-five acres/four parcels.
    {
      stage: 'first',
      sourceLayer: 'bronze',
      verificationQuestion:
        'Should the public line say 60 acres, fifty-five acres/four parcels, or a softer "parcel by parcel" growth phrase?',
      text:
        'The land story needs Leif checked before we carve it in. For now, treat the clue as growth by pieces, not a number to brag about.',
    },
    // bronze: Exact acreage and public wording need Leif/Greg confirmation before promotion.
    {
      stage: 'second',
      sourceLayer: 'bronze',
      verificationQuestion:
        'Can the game say the ranch grew from the first thirteen acres to the current public acreage?',
      text:
        'I have seen notes that point to first acres, later parcels, and a larger working ranch. I do not know the public number - ask Leif.',
    },
    // bronze: Redirect preserves uncertainty and avoids solving or asserting an unverified acreage.
    {
      stage: 'redirect',
      sourceLayer: 'bronze',
      verificationQuestion:
        'Should unverified acreage lines redirect players to stewardship and systems instead of naming acreage?',
      text:
        'If the acreage starts sounding too exact, step over to the water or guest systems. Those clues do not need a disputed number to be useful.',
    },
  ],
  guest_operations: [
    // silver: Canon doc and Dad's Book support Leif as current steward managing guests, rentals, maintenance, animals, water systems, fences, and roads.
    {
      stage: 'first',
      sourceLayer: 'silver',
      text:
        'The old work only matters because somebody keeps the place running now. A guest sees comfort; a steward sees the checklist behind it.',
    },
    // silver: Dad's Book supports Leif handling Airbnb, rentals, maintenance, guests, and broken things; public wording still needs verification.
    {
      stage: 'second',
      sourceLayer: 'silver',
      text:
        'If a renter needs something or a system breaks, the ranch does not care what time it is. That is stewardship, not a title.',
    },
    // silver: Current-steward cue redirects to other systems without solving.
    {
      stage: 'redirect',
      sourceLayer: 'silver',
      text:
        'You might check the water cue next. Guest work and infrastructure usually point at the same person keeping things steady.',
    },
  ],
}

const FALLBACK_LINE: GreggoryLine = {
  stage: 'redirect',
  sourceLayer: 'bronze',
  verificationQuestion: 'Add verified lines for this hotspot before public release.',
  text: "I don't know that one - ask Leif.",
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }

  return hash
}

function stageForInteraction(interactionCount: number): GreggoryLineStage {
  if (interactionCount <= 1) return 'first'
  if (interactionCount === 2) return 'second'
  return 'redirect'
}

export function pickLine(hotspotId: string, interactionCount: number): GreggoryLine {
  const lines = GREGGORY_LINES[hotspotId]
  if (!lines || lines.length === 0) return FALLBACK_LINE

  const stage = stageForInteraction(Math.max(1, interactionCount))
  const candidates = lines.filter(line => line.stage === stage)
  const stageLines = candidates.length > 0 ? candidates : lines
  const index = fnv1a(`${hotspotId}:${interactionCount}`) % stageLines.length

  return stageLines[index] ?? FALLBACK_LINE
}

export function getBronzeLines(): Array<{ hotspotId: string; line: GreggoryLine }> {
  return Object.entries(GREGGORY_LINES).flatMap(([hotspotId, lines]) =>
    lines
      .filter(line => line.sourceLayer === 'bronze')
      .map(line => ({ hotspotId, line })),
  )
}
