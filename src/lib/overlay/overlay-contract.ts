/**
 * Overlay contract for the recovered ASCII three-plane renderer.
 *
 * Complementary to oc_agent's feat/party-trail-encounters-20260904 work.
 * Do not merge this into that dirty tree while Codex is live-writing it.
 *
 * Laws:
 * - ASCII is the permanent wire format (asciiGrid.ts). Pixels are a pure function.
 * - Middleground is a sparse {glyph,x,y,ref} list. Out-of-time NPCs live here.
 * - era + provenance on every inspect/NPC/prop (Verified Presence addendum).
 * - Carmen clue grammar: trail-word points at a place/era, never names it.
 * - No client mint. route_authority false. state_write_authority false.
 * - Arcade L1–L3 stays one 1849 season. Later eras overlay; they are not a sequel number.
 */

export const OVERLAY_CONTRACT = {
  schema: 'bobr.overlay.v1',
  route_authority: false,
  state_write_authority: false,
  client_mint: false,
  consume_via: 'player + existing reducer',
  planes: {
    bg: 'dense 40x22 authored grid, area identity, immutable at runtime',
    mg: 'sparse MgEntity list — the ONLY glyphs a DM/NPC may place: n ! * x $',
    fg: 'player paper doll, no grid',
  },
  camera: { cell: 32, view: [20, 14], pixels: [640, 448] },
  numbering: {
    arcade: '1|2|3 only (MAX_DISCOUNT_LEVEL=3). Do not stamp this pack "Level 4".',
    becomes: 'stone-town interiors are the becomes layer, not a hunt sequel',
  },
} as const

export type EraTag =
  | { year: number }
  | { start: number; end: number }
  | { present: true }

export type Provenance = 'document' | 'testimony' | 'legend' | 'forgery'

export type CarmenClue = {
  trailWord: string
  /** location id the player should deduce; never spoken in the trailWord */
  pointsTo: string | null
  obscurity: 1 | 2 | 3
  witness: string
}

export type OverlayInspect = {
  id: string
  kind: 'river' | 'storm' | 'snow' | 'town' | 'snake' | 'illness' | 'interior'
  landmark?: string
  era: EraTag
  provenance: Provenance
  carmen: CarmenClue
  finding: string
  fact: string
  sources: { title: string; url?: string }[]
}

export type OverlayNpc = {
  id: string
  glyph: 'n'
  era: EraTag
  provenance: Provenance
  title: string
  /** When this glyph may appear. Never bedroom / bath / hot-tub. */
  appearsWhen: {
    dusk?: boolean
    verifiedPresence?: boolean
    landmarkIncludes?: string[]
    goldCountry?: boolean
    townPause?: boolean
  }
  inspect: string
  carmen: CarmenClue
  arShowpiece?: boolean
}
