# Living Trail P1 — Build Spec (2026-07-14)

Presence-gated quest-chain engine + 2 partner-free West Point quests. Design: `~/Documents/BOBR/game_enhancements/VERIFIED_PRESENCE_QUESTLINES_20260714.md`. History: MB `research/bobr_questline_history_20260714`. Integration surface mapped by Explore agent (all file:line refs verified 2026-07-14 on `feat/bobr-visual64-local`).

## Architecture decisions (hub-decided, follow as written)

1. **`useVerifiedPresence()` hook** — NEW `src/app/oregon-trail/lib/useVerifiedPresence.ts`. Extract from `GoldCountryExplore.tsx:83-152` (GPS acquire `:87-106`, haversine `:23-32`). Upgrades over the inline original: keep `pos.coords.accuracy` (the original discards it); per-call radius (meters, not the hard-coded 5 km at `:151`); dwell tracking (caller passes `dwellMs`, hook reports `{ inside, dwelledMs, verified }` — verified = inside continuously ≥ dwellMs with accuracy ≤ 150 m); `watchPosition` with the same options object. Do NOT rewire GoldCountryExplore/GoldCountryLocation to the hook in P1 (keep the diff minimal); leave a `// TODO(P2): consume useVerifiedPresence` at both sites.
2. **Chain data as data** — NEW `src/app/oregon-trail/data/livingTrailChains.ts`. Types:
   ```ts
   interface LivingTrailNode {
     id: string                      // 'lt_wp_marker', unique, lt_ prefix (avoids the west_point id collision — worldMaps.ts:371 owns 'west_point')
     chainId: string                 // 'wp_founders'
     title: string
     geofence: { lat: number; lng: number; radiusM: number }   // radii ≥75-100m per research
     dwellMs: number                 // default 10_000
     timeWindow?: { startHour: number; endHour: number }       // local hours; cemetery node daylight-gated 8-18
     prerequisiteNodeId?: string
     npcId: string                   // GoldCountryNPC id
     microAction: { kind: 'talk' | 'ovation_tap' | 'waypoint'; prompt: string }
     reward: { goodKarma?: number; neutralKarma?: number; clueProgress?: boolean }
     remoteVariant: { enabled: true; karmaScale: 0.5 }         // "by-lantern-light": playable anywhere, half karma
   }
   ```
3. **State slice** — add `livingTrail: { nodes: Record<string, { status: 'locked'|'available'|'completed'; completedAt?: number; verifiedPresence?: boolean }> }` to `OregonTrailState` (`state/types.ts:103-184`, gold-country slice pattern at `:159-166`). NEW `state/livingTrailActions.ts` (mirror `goldCountryActions.ts`): `applyCompleteLivingTrailNode` — sets completed, unlocks children (nodes whose prerequisite is this node), routes reward via the existing karma path. New actions `COMPLETE_LT_NODE` in `state/actions.ts` + reducer cases (`reducer.ts`, near `:346` COMPLETE_QUEST). Persistence is then FREE via `golden_frog_local_save` (page.tsx:180-207) + the slot collector (`SaveLoadIntegration.tsx:30-52`). Guard: LOAD_STATE must default the slice when absent from old saves (same migration choke point used by the `bfcc387` party fix).
4. **Server-authority stub** — NEW `src/lib/livingTrailSync.ts` with `postPresenceCheckin(nodeId, coords, verified)` mirroring `karmaServerSync.postKarmaEvent` (`:51`) shape but posting to `/api/living-trail/checkin` — and NEW route `src/app/(api-routes)/api/living-trail/checkin/route.ts` that validates payload shape and appends to a JSONL file (or SQLite via the `discountCodesDb.ts` pattern) — RECORD ONLY in P1, no gating. Comment loudly: P2 makes this authoritative (signed verdicts) before any real-money reward rides on chains. Client fire-and-forget, fail-soft offline.
5. **Screen + phase** — add `'living_trail'` to `GamePhase` (`types.ts:11-36`); NEW `phases/LivingTrailScreen.tsx`; switch arm in `page.tsx` near `:372`; exclude from `hideFarmButton` check (`page.tsx:412-415`) if appropriate. Entry button in `TownScreen.tsx` next to Open World Map (`:522-534`): visible when `state.currentLandmark === 'West Point'` OR always-visible with 🥾 "Living Trail (real world)" — pick: **always visible from town + settlement screens** (it's the point of the product), with intro copy explaining it's a real-world walk. Also add entry from `SettlementScreen.tsx` (`:15` area). Dispatch new `ENTER_LIVING_TRAIL` via `phaseNavigation.ts` (pattern `:49`).
   Screen layout: chain list → node cards (locked/available/completed), live GPS status strip (reuse the RETRY GPS UX language from GoldCountryExplore:226-232), distance-to-node, and when `verified` flips true → NPC encounter (render via `getNPCsAtLocation` pattern — or directly `getNPCById`) with scripted `dialogueLines`, then micro-action button, then reward toast. Remote variant: a quiet "walk it by lantern-light instead" link on each available node → same NPC dialogue, `karmaScale: 0.5`, `verifiedPresence: false`.
6. **NPCs** — append to `GOLD_COUNTRY_NPCS` (`data/goldCountryNPCs.ts`, helpers `:1726-1778`). Set `location` to the node's `lt_*` id (getNPCsAtLocation keys off string match — the lt_ ids won't collide with gold-country screens). Scripted `dialogueLines` (no LLM in P1; `ollamaPrompt` field filled for P4 readiness).
7. **Rewards** — via `completeQuestWithReward` pattern (`oregonTrailContext.tsx:301`) or directly `earnGood`/`earnNeutral` (`karmaWalletContext.tsx:433/411`) inside the new applier. Clue progress: increment mystery discount counter ONLY via its public API (`mysteryContext.tsx:960/978` getQualifyingTier flow) — if no clean API exists, skip clueProgress in P1 rather than reaching into mystery internals.

## P1 content — chain `wp_founders` ("The Founders of Indian Gulch"), 3 nodes

All history VERIFIED in MB research (citations there). Coordinates come from the geofence-coordinates agent table (docs appendix / hub message) — if a coordinate is UNKNOWN, geofence on the town-center with radiusM 300 and mark `// COORD-TODO`.

- **Node 1 `lt_wp_marker` — "The Marker at Indian Gulch"** (no prerequisite)
  NPC: ghost of **John R. Smith**, West Point Main St blacksmith c. 1890 (real, calaverashistory.org). Dialogue: founded 1852 as Indian Gulch, renamed West Point 1854; the Kit Carson terminus story told AS tradition ("the marker says... old-timers argued"); Bret Harte "passed through, they say" (tradition-framed). Micro-action: talk. Reward: +3 good karma. Geofence: CHL #268 marker, radius 75 m, dwell 10 s.
- **Node 2 `lt_wp_sandy_gulch` — "The Carsner Nuggets"** (prereq: node 1)
  NPC: **William & Dan Carsner** (real, found the Sandy Gulch nuggets 1849, HMDB m=11975). Dialogue: 1849 trading center, Hangman's Tree, Mi-Wuk presence spoken of with respect (no Mi-Wuk ghost NPCs — research recommendation). Micro-action: talk. Reward: +3 good karma. Geofence: Sandy Gulch marker (~3 mi west of WP), radius 100 m, dwell 10 s.
- **Node 3 `lt_wp_cemetery_gate` — "Rest, Properly"** (prereq: node 2; timeWindow 8-18 — daylight only)
  NPC: the **Gatekeeper** (composite/fictional, labeled so in dialogue: "call me the one who minds the gate"). REVERENCE RULES: geofence centers on the cemetery GATE/entrance, not interior; dialogue asks the player to stand quietly for a moment (the dwell IS the mechanic); no rewards "on graves," reward granted at the gate waypoint. Micro-action: waypoint (a "stand with them a moment" button enabled after dwell). Reward: +5 good karma + chain completion flourish (Twain line). Geofence: West Point Cemetery entrance, radius 75 m, dwell 20 s.

Chain completion → one `CrossGameStorage.logEvent('living_trail_chain_completed', ...)` (fire-and-forget, `src/lib/crossGameProgression.ts`) for the future town-memory layer.

## Constraints
- Branch `feat/bobr-visual64-local`, never main. Gate: `npx tsc --noEmit` 0 errors. Do not touch karmaWalletContext's poll/useMemo, place-art, QA doc.
- Verify live (dev :3102, chrome_eval_trusted; GPS can't be real in QA — add a dev-only mock: `?ltMock=lat,lng` query param that useVerifiedPresence honors ONLY when `process.env.NODE_ENV === 'development'`; verify node 1→2→3 unlock flow + remote variant + old-save compat via the mock).
- Fiction disclaimer line in the LivingTrailScreen footer: "Ghost stories are fiction woven around real history — sources in the credits."
- Commit message ends: Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

## Appendix — Geofence coordinates (fetched + source-verified 2026-07-14; full table w/ Volcano P2 sites in MB research + hub transcript)

P1 nodes:
| Node | Lat | Lng | radiusM | Precision |
|---|---|---|---|---|
| lt_wp_marker (CHL #268, SR-26 × Main St island) | 38.39725 | -120.52766 | 75 | marker-exact (state landmark registry) |
| lt_wp_sandy_gulch (HMDB m=11975, SR-26 roadside) | 38.38018 | -120.53230 | 100 | marker-exact (HMDB 38°22.811′N 120°31.938′W) |
| lt_wp_cemetery_gate (290 Cemetery Lane) | 38.40104 | -120.53218 | 75 | geocoded-address ~gate-level (OSM interpolation; no cemetery polygon exists) |

Notes for the builder: Sandy Gulch is a highway pullout — dialogue should tell players to park safely off SR-26 before the encounter (add a one-line safety notice on that node card). Cemetery is an active community cemetery — reverence rules in the spec are mandatory. P2 Volcano sites (Old Abe 38.44260/-120.63137, Cobblestone 38.44179/-120.63071, Masonic Cave marker 38.44053/-120.63047, St. George 38.44175/-120.63058) cluster within ~120 m — radii ≤40 m there; NOT part of P1.
