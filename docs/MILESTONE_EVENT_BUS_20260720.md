# The Cross-Game Milestone Event Bus — Taxonomy & Questline Substrate

**Date:** 2026-07-20
**Scope:** `CrossGameStorage` milestones in `src/lib/crossGameProgression.ts` as a cross-game
**event bus** — the shared vocabulary that lets one game's accomplishments gate another's content.
**Purpose:** catalog every milestone constant (emitter, consumer, status) so the dead ones become
**design substrate** for the presence-gated Living-Trail questlines, not silent noise.

All file:line references below were produced by grep against the working tree on 2026-07-20 **after**
the unlock-chain fixes in this same session (which changed two consumers — noted inline).

---

## How the bus works

- **Writer:** any game calls `CrossGameStorage.recordMilestone(id, sourceGame, metadata?)` (or the
  React wrapper `useCrossGame().recordMilestone`). This appends to
  `localStorage.bobr_cross_game_progression.milestones` (deduped by id) and dispatches a synchronous
  `StorageEvent`, so the `CrossGameProgressionProvider` state updates in-tab and cross-tab.
- **Reader/gate:** `isGameUnlocked(gameId, milestones)` evaluates a `GAME_UNLOCK_CONFIGS` condition
  (`always | milestone | milestones_all | milestones_any | composite`). Some milestones are also read
  ad-hoc as narrative signals (e.g. `bobrJourneyAdapter`).
- **Milestone id set** is the `MilestoneId` union (`crossGameProgression.ts:35-76`). A constant can be
  in the union yet never emitted and never consumed — that's dead vocabulary, not a live event.

---

## Milestone-by-milestone ledger

Status legend: **LIVE** = emitted AND consumed · **ORPHAN** = emitted, never consumed ·
**DECLARED-ONLY** = in the type union but never emitted and never consumed (no true "phantom /
consumed-but-never-emitted" cases exist in the tree — every gate references a milestone that has at
least one emitter).

### Prospector's Tale (trail)

| Milestone | Emitted at | Consumed at | Status |
|---|---|---|---|
| `reached_west_point` | `chapterContext.tsx:158` (visit west_point), `:312` (advance to gold_country chapter), **`GoldCountryArrivalScreen.tsx:27` (NEW this session — the 2000mi trail-victory path)**, `bobrPlaytestBridge.ts:12` | `crossGameProgression.ts:143` → gates **ranch_treasure_hunt** (hub reads `ranchHuntUnlocked`); `bobrJourneyAdapter.ts:72` (reachedGoldCountry signal) | **LIVE** (the fix that made trail-victory→ranch unlock work) |
| `completed_journey_west` | `chapterContext.tsx:309` | `bobrJourneyAdapter.ts:67` (trailComplete signal) | **LIVE** (signal only, not an unlock gate) |
| `completed_gold_country` | `chapterContext.tsx:315` | `bobrJourneyAdapter.ts:73` (reachedGoldCountry signal) | **LIVE** (signal only) |
| `captured_black_bart` | `chapterContext.tsx:162` | — | **ORPHAN** |

### RPG Adventure

| Milestone | Emitted at | Consumed at | Status |
|---|---|---|---|
| `adventure_chapter_1` | `adventure/play/page.tsx:1526` | — | **ORPHAN** |
| `adventure_chapter_2` | `adventure/play/page.tsx:1527` | — | **ORPHAN** |
| `adventure_chapter_3` | `adventure/play/page.tsx:1528` | — | **ORPHAN** |
| `adventure_chapter_4` | `adventure/play/page.tsx:1529` | — | **ORPHAN** |
| `adventure_chapter_5` | `adventure/play/page.tsx:1530` | — | **ORPHAN** *(was the clue_game gate; this session moved that gate to `clue_game_unlocked` for single-writer/single-reader, which orphaned chapter_5. Re-adopt it as the canonical "finished the RPG" event — see proposal.)* |
| `time_chase_complete` | `adventure/where-in-time/page.tsx:88` | `bobrJourneyAdapter.ts:65` (timeChaseComplete signal) | **LIVE** (signal only) |

### Clue Game (Cynthia's Treasure Hunt)

| Milestone | Emitted at | Consumed at | Status |
|---|---|---|---|
| `clue_game_unlocked` | `ClueGameUnlock.tsx:54` (accept Cynthia's quest — worthy karma + 5 chapters), `clue-game/page.tsx:23` (one-time legacy read-migration) | `crossGameProgression.ts:156` → gates **clue_game** (hub `clueGameUnlocked` + `/clue-game` page); `ClueGameUnlock.tsx:42` (own display) | **LIVE** (single writer / single reader after this session's fix) |

### Prologue

| Milestone | Emitted at | Consumed at | Status |
|---|---|---|---|
| `booking_verified` | `BookingGate.tsx:59` (fresh code verify), **`BookingGate.tsx:39` (NEW this session — session-restore of an existing verified booking)** | `crossGameProgression.ts:137` → **prologue** config condition | **CONFIG-DEFINED, LATENT** — the prologue hub card no longer reads `isUnlocked('prologue')` (this session removed the hub deadlock; the in-page `BookingGate` is now the sole gate). The config entry + milestone remain the correct hook for **future** questline gating, so it is kept live and emitted, but nothing currently *unlocks* on it. |
| `prologue_norseman_complete` | `prologueContext.tsx:230` | — | **ORPHAN** |
| `prologue_native_complete` | `prologueContext.tsx:230` | — | **ORPHAN** |
| `prologue_califia_complete` | `prologueContext.tsx:230` | — | **ORPHAN** |
| `prologue_incan_complete` | `prologueContext.tsx:230` | — | **ORPHAN** |
| `prologue_convergence_complete` | `prologue/convergence/play/page.tsx:122` | — | **ORPHAN** |

### Gold Country Explorer

| Milestone | Emitted at | Consumed at | Status |
|---|---|---|---|
| `explorer_first_mystery_solved` | `explorerContext.tsx:951`, `bobrPlaytestBridge.ts:23` | — | **ORPHAN** |
| `explorer_all_mysteries_solved` | `explorerContext.tsx:954` | — | **ORPHAN** |
| `explorer_legendary_level` | `explorerContext.tsx:472` | — | **ORPHAN** |
| `explorer_spiritual_awareness` | — | — | **DECLARED-ONLY** |
| `explorer_twain_scholar` | — | — | **DECLARED-ONLY** |
| `explorer_califia_seeker` | — | — | **DECLARED-ONLY** |
| `explorer_miwok_historian` | — | — | **DECLARED-ONLY** |
| `explorer_ranch_pioneer` | — | — | **DECLARED-ONLY** |

### Karma Marketplace (all declared, none wired)

| Milestone | Emitted / Consumed | Status |
|---|---|---|
| `first_donation` | — / — | **DECLARED-ONLY** |
| `treat_all_animals` | — / — | **DECLARED-ONLY** |
| `momento_collector` | — / — | **DECLARED-ONLY** |
| `complete_momentos` | — / — | **DECLARED-ONLY** |
| `karma_good_alignment` | — / — | **DECLARED-ONLY** |
| `karma_lawful_good` | — / — | **DECLARED-ONLY** |
| `karma_total_1000` | — / — | **DECLARED-ONLY** |

---

## Summary counts

- **LIVE-consumed (real unlock gates):** `reached_west_point` → ranch_treasure_hunt, `clue_game_unlocked` → clue_game. (2 true unlock gates.)
- **LIVE as narrative signals only** (`bobrJourneyAdapter`, no unlock): `completed_journey_west`, `completed_gold_country`, `time_chase_complete`.
- **CONFIG-LATENT:** `booking_verified` (emitted + config-defined; no current UI consumer after the deadlock fix).
- **ORPHAN (emitted, never consumed):** `captured_black_bart`, `adventure_chapter_1..5`, `prologue_norseman_complete`, `prologue_native_complete`, `prologue_califia_complete`, `prologue_incan_complete`, `prologue_convergence_complete`, `explorer_first_mystery_solved`, `explorer_all_mysteries_solved`, `explorer_legendary_level` — **13 orphans**, every one already firing reliably at a meaningful moment. These are the richest substrate.
- **DECLARED-ONLY (dead vocabulary):** 12 constants — 5 explorer + 7 karma/momento — never emitted, never read.

---

## Proposed canonical questline-gating vocabulary

The Living-Trail presence-gated questlines need a **stable, deliberately-emitted** event set. Rank by
"already fires reliably at a real accomplishment" (orphans are gold — the emit work is done):

**Tier 1 — adopt as-is (already emitted at exactly the right beat, just wire consumers):**
1. `reached_west_point` — completed the trail. (Already a live gate; keep as the canonical "trail done".)
2. `clue_game_unlocked` — earned Cynthia's trust (5 chapters + worthy karma). (Already a live gate.)
3. `captured_black_bart` — signature trail bounty; perfect gate for a "lawman" questline.
4. `adventure_chapter_5` — finished the RPG. Re-adopt as the canonical "adventure done" event (it was
   just displaced as the clue gate; it should gate adventure-epilogue questlines, not the clue game).
5. `time_chase_complete` — finished Where-in-Time. Promote from signal-only to a real gate.
6. `booking_verified` — real-world presence proof (a booking). This is the **keystone** for
   presence-gated content; keep it emitted (both fresh + restore paths now do) and gate Living-Trail
   chains on it.

**Tier 2 — emitted, adopt for "collector/lore" questlines:**
7. `completed_journey_west`, `completed_gold_country` (trail arc beats).
8. `prologue_{norseman,native,califia,incan}_complete` + `prologue_convergence_complete` — a natural
   `milestones_all` composite for an "ancient-portals" meta-questline (all four acts → convergence reward).
9. `explorer_first_mystery_solved`, `explorer_all_mysteries_solved`, `explorer_legendary_level` —
   explorer-mastery gates.

**Tier 3 — DECLARED-ONLY: decide emit-or-delete, don't leave half-declared:**
- The 5 unemitted `explorer_*` and 7 `karma_*`/momento constants are aspirational. Either wire an
  emitter (e.g. `karma_total_1000` from the shared karma pool crossing 1000; `first_donation` from the
  first karma-market donation) **or delete them from the `MilestoneId` union.** A declared id with no
  emitter is a phantom gate waiting to mislead a future questline author into gating on something that
  can never fire.

### Guardrail (so this doesn't rot again)
The unlock bug this session fixed had one root cause: **the writer minted a different milestone than
the config read** (writer `clue_game_unlocked` vs config `adventure_chapter_5`), and a second reader
(the legacy `bobr_clue_game_unlocked` key) desynced from both. The rule going forward:
**one milestone id = one canonical writer + config as the single reader.** Ad-hoc localStorage flags
and per-component secret checks are what let hub, page, and gate drift out of agreement.
