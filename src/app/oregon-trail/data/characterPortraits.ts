/**
 * Character Portrait Map
 *
 * Plain data module (NO React imports) mapping character id/name -> portrait
 * image asset path under /public. Use `getPortrait(id)` to resolve a path with
 * a guaranteed fallback to the shared placeholder.
 *
 * Keys are sourced from the live NPC rosters:
 *   - src/app/oregon-trail/data/goldCountryNPCs.ts   (top-level NPC ids)
 *   - src/app/oregon-trail/data/npcPersonalities.ts  (archetype keys)
 *   - src/lib/npcLegends.ts                          (Hall-of-Fame legend playerIds)
 *   - Tobias                                         (game protagonist)
 *
 * Only `tobias` currently has real art. Every other entry points at the shared
 * placeholder and is marked `// TODO: needs art` until a portrait is produced.
 *
 * NOTE: The `portrait` field on NPC objects in goldCountryNPCs.ts is an EMOJI,
 * not an image path. This module is the image-path layer that lives alongside it.
 */

/** Shared fallback used whenever a character has no dedicated portrait yet. */
export const PLACEHOLDER_PORTRAIT = '/sprites/tobias-placeholder.png' as const;

/** Map from character id (or canonical name key) -> portrait image path. */
export const CHARACTER_PORTRAITS: Record<string, string> = {
  // --- Protagonist (HAS ART) ---
  tobias: '/sprites/tobias-portrait.png',

  // --- Gold Country NPCs (goldCountryNPCs.ts top-level ids) ---
  ranch_hand_jake: PLACEHOLDER_PORTRAIT, // TODO: needs art
  cynthia_owner: PLACEHOLDER_PORTRAIT, // TODO: needs art
  bartender_ben: PLACEHOLDER_PORTRAIT, // TODO: needs art
  prospector_old_pete: PLACEHOLDER_PORTRAIT, // TODO: needs art
  frog_jockey_lily: PLACEHOLDER_PORTRAIT, // TODO: needs art
  vintner_pierre: PLACEHOLDER_PORTRAIT, // TODO: needs art
  historian_margaret: PLACEHOLDER_PORTRAIT, // TODO: needs art
  deputy_walsh: PLACEHOLDER_PORTRAIT, // TODO: needs art
  cave_guide_hector: PLACEHOLDER_PORTRAIT, // TODO: needs art
  geologist_chen: PLACEHOLDER_PORTRAIT, // TODO: needs art
  spelunker_max: PLACEHOLDER_PORTRAIT, // TODO: needs art
  crystal_collector_ada: PLACEHOLDER_PORTRAIT, // TODO: needs art
  ranger_sarah: PLACEHOLDER_PORTRAIT, // TODO: needs art
  naturalist_william: PLACEHOLDER_PORTRAIT, // TODO: needs art
  old_miner_giuseppe: PLACEHOLDER_PORTRAIT, // TODO: needs art
  foreman_harris: PLACEHOLDER_PORTRAIT, // TODO: needs art
  ghost_hunter_edgar: PLACEHOLDER_PORTRAIT, // TODO: needs art
  innkeeper_rosa: PLACEHOLDER_PORTRAIT, // TODO: needs art
  winemaker_frank: PLACEHOLDER_PORTRAIT, // TODO: needs art
  curator_james: PLACEHOLDER_PORTRAIT, // TODO: needs art
  sheriff_thorn: PLACEHOLDER_PORTRAIT, // TODO: needs art
  telegraph_operator_wong: PLACEHOLDER_PORTRAIT, // TODO: needs art
  prospector_tom: PLACEHOLDER_PORTRAIT, // TODO: needs art
  geologist_petra: PLACEHOLDER_PORTRAIT, // TODO: needs art
  ranch_matriarch_sarah: PLACEHOLDER_PORTRAIT, // TODO: needs art
  endurance_rider_kai: PLACEHOLDER_PORTRAIT, // TODO: needs art
  miwok_elder_nina: PLACEHOLDER_PORTRAIT, // TODO: needs art
  solar_builder_thomas: PLACEHOLDER_PORTRAIT, // TODO: needs art

  // --- Personality archetypes (npcPersonalities.ts keys) ---
  bartender: PLACEHOLDER_PORTRAIT, // TODO: needs art
  shopkeeper: PLACEHOLDER_PORTRAIT, // TODO: needs art
  stable_hand: PLACEHOLDER_PORTRAIT, // TODO: needs art
  traveler: PLACEHOLDER_PORTRAIT, // TODO: needs art
  settler: PLACEHOLDER_PORTRAIT, // TODO: needs art
  native_trader: PLACEHOLDER_PORTRAIT, // TODO: needs art
  telegraph_operator: PLACEHOLDER_PORTRAIT, // TODO: needs art
  sheriff_deputy: PLACEHOLDER_PORTRAIT, // TODO: needs art
  prostitute: PLACEHOLDER_PORTRAIT, // TODO: needs art
  preacher: PLACEHOLDER_PORTRAIT, // TODO: needs art
  drunk: PLACEHOLDER_PORTRAIT, // TODO: needs art
  child: PLACEHOLDER_PORTRAIT, // TODO: needs art

  // --- Hall-of-Fame legends (npcLegends.ts playerIds) ---
  npc_black_bart: PLACEHOLDER_PORTRAIT, // TODO: needs art
  npc_captain_shaw: PLACEHOLDER_PORTRAIT, // TODO: needs art
  npc_cynthia_marsh: PLACEHOLDER_PORTRAIT, // TODO: needs art
  npc_running_deer: PLACEHOLDER_PORTRAIT, // TODO: needs art
  npc_joaquin_murrieta: PLACEHOLDER_PORTRAIT, // TODO: needs art

  // --- Coconut Run captain ---
  // PROJECT RULE (feedback-coconut-run-captain-is-kid): the Coconut Run captain
  // is a KID / boy captain, NOT an adult. Any AI-photoreal adult render is WRONG.
  // No Coconut Run captain art or character id exists in this repo yet.
  // TODO: needs art — a KID / boy captain portrait (NOT an adult render)
  coconut_run_captain: PLACEHOLDER_PORTRAIT, // TODO: needs art (kid/boy captain)
};

/**
 * Resolve a portrait path for a character id/name, falling back to the shared
 * placeholder when no dedicated art is registered.
 */
export function getPortrait(idOrName: string): string {
  return CHARACTER_PORTRAITS[idOrName] ?? PLACEHOLDER_PORTRAIT;
}

/** True when the character has a dedicated (non-placeholder) portrait. */
export function hasPortrait(idOrName: string): boolean {
  const path = CHARACTER_PORTRAITS[idOrName];
  return path !== undefined && path !== PLACEHOLDER_PORTRAIT;
}
