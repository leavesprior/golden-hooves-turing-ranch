// Puzzle objects that players discover and manipulate throughout the Prologue.
// Each object has boolean state flags that change via transformations,
// inspired by Hitchhiker's Guide to the Galaxy object-state puzzle logic.

export interface PuzzleObjectData {
  id: string
  name: string
  icon: string
  description: string
  character: string // which character finds this
  actNumber: number
  episodeNumber: number
  initialStates: Record<string, boolean>
  canCombineWith?: string[]
}

// ---------------------------------------------------------------------------
// Norseman objects (Erik Thorvaldsson)
// ---------------------------------------------------------------------------

const NORSEMAN_OBJECTS: PuzzleObjectData[] = [
  {
    id: 'runestone_fragment',
    name: 'Runestone Fragment',
    icon: '\u{1FAA8}',
    description:
      'A weathered shard of granite etched with half-visible Elder Futhark runes. ' +
      'The remaining text seems to describe a route south — but the stone must be treated ' +
      'before the full inscription can be read.',
    character: 'norseman',
    actNumber: 1,
    episodeNumber: 1,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      moonlit: false,
    },
    canCombineWith: ['rune_carved_bone'],
  },
  {
    id: 'norse_sunstone',
    name: 'Norse Compass (Sunstone)',
    icon: '\u{1F48E}',
    description:
      'An Iceland spar crystal used by Norse navigators to find the sun on overcast days. ' +
      'In direct sunlight, it projects a faint pattern onto flat surfaces that may encode ' +
      'a celestial heading.',
    character: 'norseman',
    actNumber: 1,
    episodeNumber: 2,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      sunlit: false,
      resonant: false,
    },
    canCombineWith: ['crystal_lens'],
  },
  {
    id: 'meteorite_shard',
    name: 'Meteorite Shard',
    icon: '\u{2604}\u{FE0F}',
    description:
      'A dense, dark lump of meteoric iron, unnaturally heavy for its size. ' +
      'The Beothuk call it "sky-blood." When heated, it glows with a pale blue light ' +
      'and strange symbols appear on its surface.',
    character: 'norseman',
    actNumber: 1,
    episodeNumber: 3,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      mercurial: false,
    },
    canCombineWith: ['obsidian_blade'],
  },
  {
    id: 'leather_map',
    name: 'Leather Map',
    icon: '\u{1F5FA}\u{FE0F}',
    description:
      'A roll of caribou hide with coastlines scratched into the surface. ' +
      'Some markings are visible; others appear only when the leather is dampened. ' +
      'Burial in earth reveals additional paths drawn in soil-reactive dye.',
    character: 'norseman',
    actNumber: 2,
    episodeNumber: 4,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      buried: false,
    },
    canCombineWith: ['shell_navigation_chart'],
  },
  {
    id: 'rune_carved_bone',
    name: 'Rune-Carved Bone',
    icon: '\u{1F9B4}',
    description:
      'A whale rib scrimshawed with runes that do not match any known Norse dialect. ' +
      'When a chant is performed near it the bone hums audibly, and hidden carvings ' +
      'fluoresce under moonlight.',
    character: 'norseman',
    actNumber: 2,
    episodeNumber: 5,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      moonlit: false,
      resonant: false,
    },
    canCombineWith: ['runestone_fragment'],
  },
]

// ---------------------------------------------------------------------------
// Native objects (Soaring Hawk)
// ---------------------------------------------------------------------------

const NATIVE_OBJECTS: PuzzleObjectData[] = [
  {
    id: 'clay_tablet',
    name: 'Clay Tablet',
    icon: '\u{1FAB5}',
    description:
      'A flat slab of Cahokian clay impressed with thumb-sized glyphs. ' +
      'The symbols resemble Mississippian shell-gorget motifs — but some are foreign. ' +
      'Fire-hardening the clay would make the marks permanent and reveal a hidden layer.',
    character: 'native',
    actNumber: 1,
    episodeNumber: 1,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      smoked: false,
    },
    canCombineWith: ['tocapu_cloth'],
  },
  {
    id: 'ceremonial_pipe',
    name: 'Ceremonial Pipe',
    icon: '\u{1FAA8}',
    description:
      'A catlinite pipe carved in the shape of a falcon. When sacred tobacco is burned ' +
      'in it, the smoke drifts in unnatural patterns, clinging to surfaces that carry ' +
      'spiritual significance.',
    character: 'native',
    actNumber: 1,
    episodeNumber: 2,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      smoked: false,
      resonant: false,
    },
  },
  {
    id: 'obsidian_blade',
    name: 'Obsidian Blade',
    icon: '\u{1F5E1}\u{FE0F}',
    description:
      'An impossibly thin flake of volcanic glass, sharper than any steel. ' +
      'This obsidian originated hundreds of leagues south in Mesoamerica — proof of ' +
      'continent-spanning trade. Sunlight through it casts prismatic shadows with ' +
      'embedded symbols.',
    character: 'native',
    actNumber: 2,
    episodeNumber: 3,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      sunlit: false,
    },
    canCombineWith: ['meteorite_shard'],
  },
  {
    id: 'feathered_quipu',
    name: 'Feathered Quipu',
    icon: '\u{1FAB6}',
    description:
      'A knotted string with feathers tied at irregular intervals. ' +
      'It records something — perhaps a calendar, perhaps a route. ' +
      'Dream Walkers say that smoke reveals the spirit-weight of each knot.',
    character: 'native',
    actNumber: 2,
    episodeNumber: 4,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      smoked: false,
    },
    canCombineWith: ['quipu_cord'],
  },
  {
    id: 'copper_sun_disk',
    name: 'Copper Sun Disk',
    icon: '\u{1F31E}',
    description:
      'A hammered copper circle engraved with a weeping-eye motif. ' +
      'Great Lakes copper, traded south to Cahokia and beyond. ' +
      'When bathed in mercury it becomes a mirror, and in moonlight the engravings ' +
      'rearrange into a star map.',
    character: 'native',
    actNumber: 3,
    episodeNumber: 5,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      moonlit: false,
      mercurial: false,
    },
    canCombineWith: ['silver_mirror'],
  },
]

// ---------------------------------------------------------------------------
// Califia objects (Queen Califia)
// ---------------------------------------------------------------------------

const CALIFIA_OBJECTS: PuzzleObjectData[] = [
  {
    id: 'golden_medallion',
    name: 'Golden Medallion',
    icon: '\u{1F396}\u{FE0F}',
    description:
      'A disc of Californian gold embossed with a double-headed serpent. ' +
      'One face is visible; the other is coated in pitch. ' +
      'Heat melts the pitch to reveal the second face — a star chart.',
    character: 'califia',
    actNumber: 1,
    episodeNumber: 1,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      bloodied: false,
    },
    canCombineWith: ['jade_warrior_figure'],
  },
  {
    id: 'shell_navigation_chart',
    name: 'Shell Navigation Chart',
    icon: '\u{1F41A}',
    description:
      'An abalone shell with holes drilled at precise intervals. ' +
      'When held over a flat surface in sunlight, the light-points form a navigable ' +
      'constellation chart showing the Pacific coast from Alaska to Peru.',
    character: 'califia',
    actNumber: 1,
    episodeNumber: 2,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      sunlit: false,
      starlit: false,
    },
    canCombineWith: ['leather_map'],
  },
  {
    id: 'tar_sealed_scroll',
    name: 'Tar-Sealed Scroll',
    icon: '\u{1F4DC}',
    description:
      'A bark-cloth scroll encased in La Brea tar. The tar preserves it but hides the ' +
      'contents. Heat softens the seal; water then washes the residue away, revealing ' +
      'pictographs in three different cultural styles.',
    character: 'califia',
    actNumber: 2,
    episodeNumber: 3,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
    },
  },
  {
    id: 'jade_warrior_figure',
    name: 'Jade Warrior Figure',
    icon: '\u{1F9CC}',
    description:
      'A carved jade figurine of a warrior queen wielding a macuahuitl. ' +
      'Mesoamerican in style but found on the Channel Islands. ' +
      'It fits perfectly into a depression on the golden medallion.',
    character: 'califia',
    actNumber: 2,
    episodeNumber: 4,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      buried: false,
    },
    canCombineWith: ['golden_medallion'],
  },
  {
    id: 'woven_star_map',
    name: 'Woven Star Map',
    icon: '\u{1F310}',
    description:
      'A Chumash basket-weave plaque encoding the positions of stars visible from ' +
      'the Channel Islands. Starlight at an observatory site activates phosphorescent ' +
      'fibers woven into the pattern, revealing lines between the stars.',
    character: 'califia',
    actNumber: 3,
    episodeNumber: 5,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      starlit: false,
    },
    canCombineWith: ['quipu_cord'],
  },
]

// ---------------------------------------------------------------------------
// Incan objects (Yachay Wasi)
// ---------------------------------------------------------------------------

const INCAN_OBJECTS: PuzzleObjectData[] = [
  {
    id: 'quipu_cord',
    name: 'Quipu Cord',
    icon: '\u{1F9F6}',
    description:
      'A knotted quipu of dyed alpaca fiber. Standard Inca accounting — except for ' +
      'three knots tied with an unknown technique. When dampened, the dyed fibers change ' +
      'color, revealing a second layer of encoded data.',
    character: 'incan',
    actNumber: 1,
    episodeNumber: 1,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      resonant: false,
    },
    canCombineWith: ['feathered_quipu', 'woven_star_map'],
  },
  {
    id: 'silver_mirror',
    name: 'Silver Mirror',
    icon: '\u{1FA9E}',
    description:
      'A polished silver disk from a Tiwanaku temple. It was made to catch sunlight ' +
      'and project it into darkened chambers. At solar-aligned sites, the reflection ' +
      'reveals architectural alignments invisible to the naked eye.',
    character: 'incan',
    actNumber: 1,
    episodeNumber: 2,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      sunlit: false,
      mercurial: false,
    },
    canCombineWith: ['copper_sun_disk'],
  },
  {
    id: 'tocapu_cloth',
    name: 'Tocapu-Painted Cloth',
    icon: '\u{1F9F5}',
    description:
      'A fragment of cumbi cloth painted with tocapu — Inca geometric symbols that ' +
      'may constitute a writing system. Some squares match Mayan glyphs. ' +
      'Burial in earth triggers a chemical reaction that darkens certain tocapu, ' +
      'highlighting the cross-cultural symbols.',
    character: 'incan',
    actNumber: 2,
    episodeNumber: 3,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      buried: false,
    },
    canCombineWith: ['clay_tablet'],
  },
  {
    id: 'carved_condor',
    name: 'Carved Condor',
    icon: '\u{1F985}',
    description:
      'A stone condor figurine with outstretched wings from Nazca. ' +
      'Its wingspan is precisely calibrated: when held at arm\'s length it frames ' +
      'specific Nazca lines. Chanting near it causes it to vibrate at a frequency ' +
      'that shatters lesser stone — breaking it reveals a hidden chamber inside.',
    character: 'incan',
    actNumber: 2,
    episodeNumber: 4,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      resonant: false,
    },
  },
  {
    id: 'crystal_lens',
    name: 'Crystal Lens',
    icon: '\u{1F52E}',
    description:
      'A perfectly ground quartz lens found at Puma Punku. ' +
      'It focuses sunlight to a burning point and, at night, concentrates starlight ' +
      'enough to project images onto smooth surfaces. Combined with the Norse sunstone, ' +
      'it becomes a trans-hemispheric navigation instrument.',
    character: 'incan',
    actNumber: 3,
    episodeNumber: 5,
    initialStates: {
      wet: false,
      heated: false,
      inscribed: false,
      broken: false,
      combined: false,
      sunlit: false,
      starlit: false,
    },
    canCombineWith: ['norse_sunstone'],
  },
]

// ---------------------------------------------------------------------------
// All objects combined
// ---------------------------------------------------------------------------

export const ALL_PUZZLE_OBJECTS: PuzzleObjectData[] = [
  ...NORSEMAN_OBJECTS,
  ...NATIVE_OBJECTS,
  ...CALIFIA_OBJECTS,
  ...INCAN_OBJECTS,
]

// Lookup helpers

export function getPuzzleObjectById(id: string): PuzzleObjectData | undefined {
  return ALL_PUZZLE_OBJECTS.find(obj => obj.id === id)
}

export function getPuzzleObjectsByCharacter(character: string): PuzzleObjectData[] {
  return ALL_PUZZLE_OBJECTS.filter(obj => obj.character === character)
}

export function getPuzzleObjectsByAct(actNumber: number): PuzzleObjectData[] {
  return ALL_PUZZLE_OBJECTS.filter(obj => obj.actNumber === actNumber)
}

export function getCompatibleObjects(objectId: string): PuzzleObjectData[] {
  const obj = getPuzzleObjectById(objectId)
  if (!obj?.canCombineWith) return []
  return obj.canCombineWith
    .map(id => getPuzzleObjectById(id))
    .filter((o): o is PuzzleObjectData => o !== undefined)
}
