import type { Hotspot } from './hotspotSchema'

export const WELCOME_HOTSPOTS: Hotspot[] = [
  {
    id: 'entry_gate',
    position: { x: 0.49, y: 0.43 },
    triggerRadius: 0.075,
    evidenceKey: 'welcome.entry_gate.threshold',
    dialogueRef: 'entry_gate',
    sourceLayer: 'gold',
    designerLabel: 'Entry gate threshold',
    designerNote:
      'Existing welcome route and gate/backdrop presentation; no private family-history claim.',
  },
  {
    id: 'water_infrastructure',
    position: { x: 0.77, y: 0.69 },
    triggerRadius: 0.085,
    evidenceKey: 'welcome.water_infrastructure.hidden_systems',
    dialogueRef: 'water_infrastructure',
    sourceLayer: 'silver',
    designerLabel: 'Water and infrastructure cue',
    designerNote:
      "Canon doc and Dad's Book support water systems, wells/tanks, and maintenance themes; public wording still needs verification.",
  },
  {
    id: 'construction_materials',
    position: { x: 0.58, y: 0.71 },
    triggerRadius: 0.085,
    evidenceKey: 'welcome.construction_materials.sweat_equity',
    dialogueRef: 'construction_materials',
    sourceLayer: 'silver',
    designerLabel: 'Construction and material cue',
    designerNote:
      "Canon doc supports sweat equity, practical skill, family help, and long-build themes; exact public phrasing remains unverified.",
  },
  {
    id: 'land_parcel',
    position: { x: 0.28, y: 0.62 },
    triggerRadius: 0.085,
    evidenceKey: 'welcome.land_parcel.growth',
    dialogueRef: 'land_parcel',
    sourceLayer: 'bronze',
    designerLabel: 'Land and parcel growth cue',
    designerNote:
      "The public site says 60 acres while Dad's Book/canon notes say first thirteen acres to fifty-five acres/four parcels; verify the public line.",
  },
  {
    id: 'guest_operations',
    position: { x: 0.47, y: 0.77 },
    triggerRadius: 0.085,
    evidenceKey: 'welcome.guest_operations.current_steward',
    dialogueRef: 'guest_operations',
    sourceLayer: 'silver',
    designerLabel: 'Guest operation and current steward cue',
    designerNote:
      "Canon doc and Dad's Book support Leif as current steward managing guests, rentals, maintenance, water, roads, and animals.",
  },
]
