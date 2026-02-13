// Puzzle transformations — actions that change object state flags.
// Each transformation declares the preconditions (required states, locations, objects)
// and the resulting state changes. The puzzle engine in prologuePuzzleContext.tsx
// evaluates these to determine which transformations are currently available.

export interface PuzzleTransformation {
  id: string
  name: string
  icon: string
  description: string
  requiresState?: Record<string, boolean>
  appliesState: Record<string, boolean>
  requiresLocation?: string
  requiresObject?: string
  // Narrative feedback shown to the player
  successMessage: string
  failureMessage?: string
}

// ---------------------------------------------------------------------------
// 1. Water — reveals hidden inscriptions on porous materials
// ---------------------------------------------------------------------------
export const TRANSFORM_WATER: PuzzleTransformation = {
  id: 'transform_water',
  name: 'Water',
  icon: '\u{1F4A7}',
  description:
    'Soak the object in water. Porous surfaces absorb moisture unevenly, ' +
    'causing hidden dye-work and mineral deposits to stand out.',
  requiresState: { wet: false },
  appliesState: { wet: true, inscribed: true },
  successMessage:
    'Water seeps into the surface. Faint lines darken and new symbols emerge — ' +
    'invisible when dry, they were drawn in mineral ink that reacts with moisture.',
  failureMessage:
    'The object is already saturated. More water will not reveal anything new.',
}

// ---------------------------------------------------------------------------
// 2. Fire / Heat — activates temperature-sensitive materials
// ---------------------------------------------------------------------------
export const TRANSFORM_FIRE: PuzzleTransformation = {
  id: 'transform_fire',
  name: 'Fire / Heat',
  icon: '\u{1F525}',
  description:
    'Hold the object near an open flame or heated coals. ' +
    'Pitch melts, clay hardens, and metallic oxides change color under heat.',
  requiresState: { heated: false },
  appliesState: { heated: true },
  successMessage:
    'Heat licks across the surface. The material transforms — ' +
    'what was hidden beneath wax or pitch is now exposed, glowing faintly.',
  failureMessage:
    'The object is already heat-treated. Further heating risks damage.',
}

// ---------------------------------------------------------------------------
// 3. Moonlight — reveals silver-reactive markings at night
// ---------------------------------------------------------------------------
export const TRANSFORM_MOONLIGHT: PuzzleTransformation = {
  id: 'transform_moonlight',
  name: 'Moonlight',
  icon: '\u{1F319}',
  description:
    'Expose the object to direct moonlight at a nighttime location. ' +
    'Silver compounds and phosphorescent minerals glow under lunar illumination.',
  requiresState: { moonlit: false },
  appliesState: { moonlit: true },
  successMessage:
    'Under the moon\'s pale gaze, silver threads in the object flare to life. ' +
    'Patterns that were invisible by day now shine with cold blue light.',
  failureMessage:
    'The moon has already revealed what it can. The markings persist.',
}

// ---------------------------------------------------------------------------
// 4. Sunlight — activates crystal and mirror objects at solar-aligned sites
// ---------------------------------------------------------------------------
export const TRANSFORM_SUNLIGHT: PuzzleTransformation = {
  id: 'transform_sunlight',
  name: 'Sunlight',
  icon: '\u{2600}\u{FE0F}',
  description:
    'Position the object in direct sunlight at a solar-aligned location. ' +
    'Crystals refract, mirrors project, and photosensitive inks darken.',
  requiresState: { sunlit: false },
  appliesState: { sunlit: true, inscribed: true },
  requiresLocation: 'solar_aligned',
  successMessage:
    'Sunlight lances through the object. Brilliant patterns splash across ' +
    'the ground — a projection encoded in the crystal\'s facets, waiting centuries for this moment.',
  failureMessage:
    'The angle is wrong, or the object has already absorbed what the sun can give.',
}

// ---------------------------------------------------------------------------
// 5. Combine — merge two compatible objects into something greater
// ---------------------------------------------------------------------------
export const TRANSFORM_COMBINE: PuzzleTransformation = {
  id: 'transform_combine',
  name: 'Combine',
  icon: '\u{1F517}',
  description:
    'Fit two compatible objects together. Mortise-and-tenon, key-and-lock, ' +
    'or chemical bonding — the ancients designed these to be reunited.',
  requiresState: { combined: false },
  appliesState: { combined: true },
  successMessage:
    'The objects slide together with a satisfying click. Separate, they were ' +
    'mysterious; united, their meaning is unmistakable.',
  failureMessage:
    'These objects do not fit together. Perhaps there is another pairing.',
}

// ---------------------------------------------------------------------------
// 6. Break — split composite objects to reveal hidden interiors
// ---------------------------------------------------------------------------
export const TRANSFORM_BREAK: PuzzleTransformation = {
  id: 'transform_break',
  name: 'Break',
  icon: '\u{1F528}',
  description:
    'Deliberately fracture the object. Some artifacts were designed with hidden ' +
    'chambers or layered construction that can only be accessed by breaking the shell.',
  requiresState: { broken: false },
  appliesState: { broken: true },
  successMessage:
    'The object fractures along a hidden seam — not random destruction, but a designed ' +
    'break-point. Inside: a smaller artifact, perfectly preserved.',
  failureMessage:
    'This object cannot be broken safely, or has already been opened.',
}

// ---------------------------------------------------------------------------
// 7. Smoke — ceremonial smoke reveals spiritual properties
// ---------------------------------------------------------------------------
export const TRANSFORM_SMOKE: PuzzleTransformation = {
  id: 'transform_smoke',
  name: 'Ceremonial Smoke',
  icon: '\u{1F32B}\u{FE0F}',
  description:
    'Pass the object through sacred tobacco or copal smoke. ' +
    'The smoke clings to spiritually significant surfaces and reveals ' +
    'residues of past ritual use.',
  requiresState: { smoked: false },
  appliesState: { smoked: true },
  requiresObject: 'ceremonial_pipe',
  successMessage:
    'Smoke curls around the object, clinging to certain surfaces and ' +
    'refusing to touch others. The pattern of adherence reveals which parts ' +
    'were anointed in past ceremonies — a map of sacred intention.',
  failureMessage:
    'The smoke passes through without clinging. This object carries no spiritual residue, ' +
    'or has already been revealed.',
}

// ---------------------------------------------------------------------------
// 8. Mercury — mercury pools activate metallic objects (Teotihuacan)
// ---------------------------------------------------------------------------
export const TRANSFORM_MERCURY: PuzzleTransformation = {
  id: 'transform_mercury',
  name: 'Mercury Bath',
  icon: '\u{1F4A0}',
  description:
    'Submerge a metallic object in liquid mercury found beneath Teotihuacan\'s pyramids. ' +
    'The mercury amalgamates with certain metals, changing their reflective properties ' +
    'and revealing engravings filled with cinnabar.',
  requiresState: { mercurial: false },
  appliesState: { mercurial: true, inscribed: true },
  requiresLocation: 'templo_mayor',
  successMessage:
    'The mercury slides across the metal like a living thing, pooling in ' +
    'the finest engraved lines. As it settles, red cinnabar pigment — trapped in the ' +
    'grooves for centuries — rises to the surface. A detailed map emerges.',
  failureMessage:
    'The mercury beads off without adhering. This object is not metallic, or has already been treated.',
}

// ---------------------------------------------------------------------------
// 9. Starlight Alignment — at observatory locations
// ---------------------------------------------------------------------------
export const TRANSFORM_STARLIGHT: PuzzleTransformation = {
  id: 'transform_starlight',
  name: 'Starlight Alignment',
  icon: '\u{2728}',
  description:
    'Position the object at an ancient observatory during a clear night. ' +
    'Phosphorescent materials and precisely drilled holes create star-maps ' +
    'when exposed to specific constellations.',
  requiresState: { starlit: false },
  appliesState: { starlit: true },
  requiresLocation: 'observatory',
  successMessage:
    'Stars pour through the object\'s apertures, casting pinpoints of light ' +
    'in a precise pattern. It is a star chart — not of the sky you see tonight, ' +
    'but of a sky centuries past. A date is encoded in the drift.',
  failureMessage:
    'The sky is clouded, or this object has no star-reactive properties.',
}

// ---------------------------------------------------------------------------
// 10. Earth Burial — temporary state change through soil contact
// ---------------------------------------------------------------------------
export const TRANSFORM_EARTH_BURIAL: PuzzleTransformation = {
  id: 'transform_earth_burial',
  name: 'Earth Burial',
  icon: '\u{1FAB1}',
  description:
    'Bury the object in soil for a period. Minerals in the earth react with ' +
    'dyes and inks, causing hidden patterns to surface. Some materials ' +
    'darken; others bleach. The transformation is chemical and irreversible.',
  requiresState: { buried: false },
  appliesState: { buried: true, inscribed: true },
  successMessage:
    'You unearth the object after a night in the soil. The earth has stained it ' +
    'unevenly — but not randomly. Tannins and iron oxides have reacted with the original ' +
    'pigments, bringing a second layer of imagery to the surface.',
  failureMessage:
    'The soil has no further effect. The chemical reaction is already complete.',
}

// ---------------------------------------------------------------------------
// 11. Sound / Chant — vibration reveals resonant properties
// ---------------------------------------------------------------------------
export const TRANSFORM_SOUND: PuzzleTransformation = {
  id: 'transform_sound',
  name: 'Sound / Chant',
  icon: '\u{1F3B6}',
  description:
    'Perform a rhythmic chant or strike the object to test its resonance. ' +
    'Certain frequencies cause sympathetic vibrations that reveal hidden chambers, ' +
    'crack deliberate fault lines, or activate acoustic properties.',
  requiresState: { resonant: false },
  appliesState: { resonant: true },
  successMessage:
    'A low hum builds as you chant. The object vibrates in sympathy — and then ' +
    'something shifts inside it. A hidden compartment loosens, or hairline cracks ' +
    'appear along intentional fault lines. Sound was the key all along.',
  failureMessage:
    'The object remains inert. It does not resonate at this frequency.',
}

// ---------------------------------------------------------------------------
// 12. Blood Offering — ancient inscriptions respond to life-essence
// ---------------------------------------------------------------------------
export const TRANSFORM_BLOOD_OFFERING: PuzzleTransformation = {
  id: 'transform_blood_offering',
  name: 'Blood Offering',
  icon: '\u{1FA78}',
  description:
    'A drop of blood — freely given — on the object\'s surface. ' +
    'Across Mesoamerican and Andean cultures, blood sacrifice was the ultimate act of ' +
    'devotion. Certain artifacts were sealed with coatings that dissolve only in blood, ' +
    'a final test of the seeker\'s commitment.',
  requiresState: { bloodied: false },
  appliesState: { bloodied: true, inscribed: true },
  successMessage:
    'The blood spreads impossibly fast, racing along channels too fine to see. ' +
    'As it fills the microscopic grooves, a complete glyph-text appears — ' +
    'written to be read only by one willing to give of themselves.',
  failureMessage:
    'The blood beads on the surface without spreading. This object does not demand such sacrifice.',
}

// ---------------------------------------------------------------------------
// All transformations collected
// ---------------------------------------------------------------------------

export const ALL_TRANSFORMATIONS: PuzzleTransformation[] = [
  TRANSFORM_WATER,
  TRANSFORM_FIRE,
  TRANSFORM_MOONLIGHT,
  TRANSFORM_SUNLIGHT,
  TRANSFORM_COMBINE,
  TRANSFORM_BREAK,
  TRANSFORM_SMOKE,
  TRANSFORM_MERCURY,
  TRANSFORM_STARLIGHT,
  TRANSFORM_EARTH_BURIAL,
  TRANSFORM_SOUND,
  TRANSFORM_BLOOD_OFFERING,
]

// Lookup helpers

export function getTransformationById(id: string): PuzzleTransformation | undefined {
  return ALL_TRANSFORMATIONS.find(t => t.id === id)
}

export function getApplicableTransformations(
  objectStates: Record<string, boolean>,
  currentLocation?: string,
  inventoryIds?: string[],
): PuzzleTransformation[] {
  return ALL_TRANSFORMATIONS.filter(t => {
    // Check required states: object must have these states with matching values
    if (t.requiresState) {
      for (const [flag, value] of Object.entries(t.requiresState)) {
        if (objectStates[flag] !== value) return false
      }
    }

    // Check applied states: at least one must differ from current state
    // (otherwise the transformation has already been applied)
    const wouldChange = Object.entries(t.appliesState).some(
      ([flag, value]) => objectStates[flag] !== value,
    )
    if (!wouldChange) return false

    // Check location requirement (caller passes location tag, not raw ID)
    if (t.requiresLocation && currentLocation !== t.requiresLocation) return false

    // Check required companion object
    if (t.requiresObject && inventoryIds && !inventoryIds.includes(t.requiresObject)) return false

    return true
  })
}
