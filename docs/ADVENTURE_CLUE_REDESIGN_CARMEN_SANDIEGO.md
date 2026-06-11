# Adventure Clue Redesign — Carmen Sandiego Grammar for the Vane Chase

**Date:** 2026-06-11 (staged 2026-06-10, written on /loop continuation — Leif's direct ask)
**Scope:** `src/app/adventure` + `src/components/adventure` (Prospector's Tale, the LIVE game per REALIGNMENT 2026-06-04). Oregon Trail is explicitly OUT of scope for this doc's changes.
**Provenance note:** This doc is a reconstruction from the staged spec (end-of-day 2026-06-10) plus the code as it exists on `feat/direct-booking-phase0-1-20260603`. The original drafting conversation was not available at write time; where this doc asserts intent, verify against Leif's memory of that session before treating it as canon. Sections follow the staged outline exactly.

---

## 1. Independence is the trailhead

Two senses, both load-bearing:

**Literal:** Independence is where the trail starts. In the cross-game geography (Oregon Trail → Gold Country → the Ranch), every journey the player takes begins at a known, fixed anchor and moves toward the unknown. The chase loop inherits this: Vane's trail always has a *trailhead* — a first clue planted at a place the player already knows — and the chase is the act of walking outward from the known into deduction.

**Design principle:** the player's *independence* is the trailhead of the whole redesign. Today travel between chapter locations is effectively a railroad: the next location is given, not deduced. The Carmen Sandiego insight is that the chase only feels like a chase when the player **chooses where to go and can choose wrong**. Every mechanic below exists to convert "click next" into "I figured out where Vane went." Independence — free, informed, consequential travel choice — is where the redesign begins, exactly as the town is where the trail begins.

## 2. The Carmen four-rule clue grammar

| # | Rule | What it means | What it forbids |
|---|------|---------------|-----------------|
| 1 | **Point at the next place, never name it** | A clue describes an attribute of the *destination* (landmark, trade, river, reputation, person) and the player resolves it to a location | Clues that say "Vane went to Angels Camp"; riddles about the *current* location |
| 2 | **Diegetic witnesses only** | Clues come from named in-world people who plausibly saw Vane pass — barkeeps, ferrymen, claim clerks. The witness's voice carries flavor and reliability | Disembodied narrator hints; UI tooltips that leak the answer |
| 3 | **Difficulty = obscurity, not mechanics** | Easy clue: "headed where the two lakes meet." Hard clue: a period-accurate detail you learn by playing (a mine's nickname, a stage line's route). The player gets smarter about the world, not better at puzzle UI | Logic-puzzle minigames gating travel; randomized clue salads |
| 4 | **Wrong guesses cost time, never the trail** | A wrong travel pick burns supplies/days and the trail "cools" — but a fresh witness at the wrong town redirects you. The chase is always recoverable | Dead ends, fail states, or losing collected dossier traits on a miss |

## 3. Gap analysis (current code vs. the grammar)

- **No deduction step exists.** `ChapterMap.tsx` / `ExplorationMap*.tsx` present locations as a fixed progression; `chapterLocations.ts` encodes order, not alternatives. Rule 1 has nothing to attach to.
- **Clue text exists but is ambient.** `quests.ts` / `dialogues.ts` contain clue-flavored lines, but they decorate the path rather than determine it. Witnesses (Rule 2) exist as dialogue NPCs but never function as trail-witnesses.
- **Cynthia's clue gate is a different organ.** `ClueGameUnlock.tsx` gates the *physical-ranch* QR treasure hunt on karma alignment + 5 chapters. It's the reward door, not the chase loop — keep it, don't conflate it.
- **No dossier.** Nothing accumulates Vane's traits; `AdventureRewardTracker.tsx` tracks rewards, not evidence. Rule-3 difficulty scaling has no spine without it.
- **No cost model for wrong travel.** Supplies/time exist (`CampManagement.tsx`) but aren't wired to travel choice, so Rule 4 is currently unfalsifiable.
- **Text was unreadable.** Clue/dialogue surfaces rendered at 7–9px (fixed — see §6). A deduction game where the clues can't be read fails before design starts.

## 4. The four redesign workstreams

### R-A — Trail-word clues
Embed one **trail word** (the deducible attribute) per witness line in `dialogues.ts` / `quests.ts`. Schema: each clue object gains `{ pointsTo: locationId, trailWord: string, obscurity: 1|2|3, witness: npcId }`. Authoring rule: the trail word must be resolvable from in-game knowledge (a location's `description` in `chapterLocations.ts` / `locations.ts` must actually contain or imply the attribute). No orphan clues.

### R-B — Informed travel
`ChapterMap` / `LocationView` travel UI offers **2–3 candidate destinations** instead of one. The player picks; the pick is checked against the active clue's `pointsTo`. Right: trail stays hot, small narrative reward. Wrong: day/supply cost via the existing camp-resources path, trail cools one step, wrong-town witness issues a corrective clue (Rule 4). Pure-updater discipline applies — the impure-updater sweep (2026-06-05) is the cautionary tale; travel resolution must not side-effect inside React state updaters.

### R-C — Wanted-poster dossier
New component (sibling of `QuestLog.tsx`): a wanted poster for **Vane** that fills in traits as witnesses reveal them (hat, horse, habit, alias — Carmen's warrant mechanic). Confrontation (`ConfrontationView.tsx`) checks dossier completeness: confronting with a thin dossier lets Vane slip away (time cost, not death — Rule 4). Traits persist via `crossGameProgression` so the chase can span games (Tares Trail connective tissue — see the Living Ranch vision, Grok-before still pending).

### R-D — Keep listing clues
Every collected clue stays reviewable: a "Trail Journal" tab in `QuestLog.tsx` listing each clue verbatim with its witness and where it was heard. Deduction games die when the player must remember instead of reason. No clue is ever consumed or hidden once heard.

## 5. Visual layering (3 steps) + stale-demo note

1. **Ground layer — real place.** Backdrop photographs of the actual ranch/Gold Country sites (pattern already proven in `ClueGameUnlock.tsx` → `INN_BACKDROP = '/cabin-photos/cabin-2.jpg'`).
2. **Character layer — DB32 pixel art.** Witness/NPC sprites in the Level-2 DB32 palette composited over the photo ground (sprite-drop pattern already stubbed: `/sprites/cynthia.png` one-prop migration).
3. **Reading layer — clue UI.** Trail journal, wanted poster, and travel picker as the top layer, at the **post-sweep readable sizes** (§6), never below 10px.

**Stale demo-file note:** `demo/32-64bit-visual-layer.html` is the *sandbox* renderer (2026-06-04). Per REALIGNMENT 2026-06-04 it is reference material only — port its look INTO the live game; do not extend the demo. Treat any behavior that exists only in the demo file as stale until it lands in `src/`.

## 6. Text-fix record (applied 2026-06-11, this branch, uncommitted)

Sweep applied across all `*.tsx` under `src/app/adventure` + `src/components/adventure`:

| Before | After |
|--------|-------|
| `text-[7px] sm:text-[8px]` | `text-[10px] sm:text-[11px]` |
| `text-[8px] sm:text-[9px]` | `text-[11px] sm:text-[12px]` |
| `text-[8px] sm:text-[10px]` | `text-[11px] sm:text-[12px]` |
| `text-[9px] sm:text-[10px]` | `text-[12px] sm:text-[13px]` |
| `text-[7px]` (bare) | `text-[10px]` |
| `text-[8px]` (bare) | `text-[11px]` |
| `text-[9px]` (bare) | `text-[12px]` |

Verified: 206 occurrences → **0** remaining `text-[7-9px]` in the two dirs; `tsc --noEmit` clean; `eslint --quiet` on both dirs → 0 errors; diff-of-`git status` confirms only adventure-dir files newly touched. **NOT committed** (standing hold). Oregon Trail untouched.

## 7. Order of work

1. ✅ **Text fix** (§6) — done, awaiting commit with the rest of the branch.
2. **R-D Trail Journal** first — lowest risk, pure-UI, makes existing clue text legible *as a system* and gives R-A authored clues a home.
3. **R-A trail-word authoring pass** over `dialogues.ts`/`quests.ts` — data-only, no component risk; validate every `pointsTo` against location data in a script (same pattern as `scripts/test-*.mts`).
4. **R-B informed travel** — the real mechanic; behind a flag until playtested (people are playing the live game — nothing ships under-tested).
5. **R-C wanted-poster dossier** + ConfrontationView completeness check.
6. **Visual layering** steps 1→3, porting from the demo per §5.
7. Gate the whole arc on: live playtest of each step + Grok response to `grok_le_grange_queue/bobr_living_ranch_vision_20260610` (Carmen/Vane loop is question 1 of that consult — if Grok finds it cheapens Oregon Trail depth, R-B/R-C get redesigned before build).
