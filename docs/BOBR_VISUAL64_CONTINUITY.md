# Bobr Visual64 Continuity

## Purpose

This branch upgrades Bobr's local playtest presentation while preserving the complete production game at deployment commit `36730485`.

## Non-negotiable boundaries

- Production progression, reward, quest, economy, event, and LLM security contracts remain authoritative.
- The dirty source worktree at `/media/granny/larger SSD/bobr-website` is reference-only and must not be reset or rebased.
- `/playtest` is a local visual laboratory. It may keep an isolated save during development, but approved outcomes must bridge into `CrossGameStorage` rather than create a second permanent progression system.
- Historical people and places must distinguish sourced history from fictional composites.
- The visual target is a detailed 32/64-bit-era RPG presentation, not larger 8-bit UI.

## Current phase

Completed:

1. Ported the local campaign onto the exact production base.
2. Added the Visual64 scene, party, dialogue, map, casebook, and world-status layer.
3. Completed and verified Volcano as the first production-connected vertical slice.
4. Added a read-only adapter for Where in Time, Oregon Trail, and CrossGameStorage outcomes.
5. Added a device-independent Volcano encounter contract for story, marker, geofence, and AR triggers.
6. Replaced the decorative world map with a sourced Gold Country projection using the canonical town latitude and longitude registry.
7. Replaced the prototype CSS figures with a transparent 32/64-bit-era raster character atlas for the player roles and named Volcano characters.
8. Expanded the market into a deterministic live pulse with eight commodities, supply, demand, price movement, weather, trade-safety, and read-only CrossGame karma influence.
9. Connected free-form NPC questions to the guarded local Ollama route with a 30-second cold-start allowance and an explicit finite fallback state.

Next:

1. Add scene adapters to the production routes without changing their canonical state owners.
2. Fill the documented town-art coverage gaps, beginning with Volcano sublocations.
3. Add a verified commodity-oracle and karma-chain adapter. The current market reads local CrossGame karma only; it does not claim blockchain verification.
4. Replace generated atlas characters with individually art-directed, historically reviewed production portraits as town casting is finalized.

## Resolve Later boundaries

- The market pulse is live within the running game, but it is not connected to an external commodity exchange or verified karma blockchain.
- Free-form NPC questions use the local mini-LLM when Ollama is available. If generation fails, Bobr identifies the authored finite response as a `Resolve Later` fallback instead of presenting it as an original answer.

## Delegation

- cc_agent task: `task_1783794330_90376`
- Grok task: `grok_20260711-112532-93356`
- Focused cc_agent correction review: `task_1783883487_2686093`
- Focused Grok correction review: `grok_20260712-121127-2686094`

No delegated task had returned a completed review when this note was updated on 2026-07-12. Grok remained pending; the focused cc task reported `unknown`. Neither state is review approval.

## Hub correction (2026-07-13, Leif feedback)

Leif rejected the 07-12 hub rework: "different but not better... the hidden ladder link makes no sense. improve upon what was there, not change it entire." The rework had deleted the scenic gorge landscape, leaving the hidden rope bridge floating between two photos with nothing to cross. Corrected per `feedback-improve-means-elevate-not-replace`:

- Restored the original hub verbatim (amber identity, header, journey strip, full scenic landscape with the rope bridge spanning the gorge to /neoma).
- Kept only the true elevations, applied inside the original design: place-art banners on all nine game cards, and journey step `4. Gold Country: Volcano -> /playtest` in the original chip style.
- The rejected rework is preserved at `docs/hub-rework-rejected-20260713.tsx.txt` for reference. Do not reintroduce the photo-split block or the restyled dark palette on /hub.
- Dev server on 127.0.0.1:3102 was serving a stale turbopack cache; restarted with `--webpack` per repo rule.
- Matterport 3D walkthrough on the homepage remains blocked: model `w4K3m2XemZG` returns 404 from Matterport's own API (scan deleted or unpublished). Needs a new share URL from Leif's Matterport account; CSP already allows the embed.

## Oregon Trail test upgrade (2026-07-13 evening, Leif directive "proceed with the test upgrade")

Elevate-in-place, gameplay untouched. Verified in-browser on :3102 (New Game → outfit → SADDLE creation → travel → event → Day 2):

- **Graphics tier unlock (the big one):** players were stuck at `retro_4bit` forever — `getGraphicsTier` (3 games + 10 outlaws → ultra_64bit) was exported but never applied, so the entire 757-line Graphics64bit scene system was dead code. DEFAULT_STATE now starts `ultra_64bit`; LOAD_STATE pins it so old saves don't drag players back. Presentation is not progression currency in the visual64 copy.
- **Real place art:** LandmarkScene now layers `PlaceBackdrop` raster art when a confident match exists (Independence, Fort Kearny, Truckee Pass→Donner art, Sacramento Valley, West Point, Gold Country); every unmatched stop keeps its authored SVG scene — no stop shows wrong art. OutfittingScreen (Matt's General Store) fronts `ch1_independence`.
- **Covered wagon:** the traveling scene's wagon was a shipped shopping-cart placeholder (🛒). New shared `CoveredWagonSprite` (mirrors the title screen's authored wagon) drives the trail and waits outside Independence. River crossings keep the ferry.
- **Bug:** "-2% to landmark" progress (formula assumed 100-mile landmark spacing) now clamped 0–100.
- Title screen sunset kept untouched (beloved authored asset).

Gaps logged, next pass: art for the 15 unmapped landmarks (Chimney Rock, Fort Laramie, South Pass…), per-segment progress denominator, TownScreen deep-dive, chapter-keyed terrain in TravelingScene. tsc GREEN, eslint 0 errors (warnings pre-existing).

## Team-of-agents elevation wave (2026-07-13 night, Leif self-directed latitude)

Four-agent fan-out (tests / surfaces survey / art pipeline / fun-feel research) + hub synthesis:

- **Tests:** full suite green; NEW `src/app/oregon-trail/state/graphicsTier.test.ts` (16th suite entry in package.json) guards the ultra_64bit default + LOAD_STATE pin.
- **Research (MB `research/oregon_trail_fun_mechanics_20260713`):** 8 guardrails from primary sources (Bouchard). Key: travel screen is THE iconic screen — elevate, never replace; uniform fidelity; no animation may tax the decision loop; run stays ~1hr; naming + epitaphs sacred.
- **Art pipeline:** tools/place-art fully local (ComfyUI + SDXL + pixel-art-xl installed at /media/granny/larger SSD/ComfyUI; server must be started manually). 11 new `ot_*` places.json entries authored (coords approximate/recall — noted; historical_photo null — attach LOC refs before img2img). Batch queued at MB `tower_tasks/ot_landmark_art_batch_20260713` (_conf=-1 pending). Wire PLACE_ART/LANDMARK_PLACE_ART only AFTER PNGs exist. Zero defensible reuse from existing 35 PNGs (agent-verified) — SVG fallbacks remain the safe state.
- **Applied S-effort wins (tsc+lint+suite green; /investigations verified in-browser):** CharacterSheet wagon tab 🛒→CoveredWagonSprite · /clue-game unlocked hero → bobr_cabin art · /investigations 10 case cards → town-art thumbnails · /ranch-treasure-hunt welcome hero → bobr_cabin · /game AT THE RANCH → bobr_cabin banner · /karma-market header → jackson banner.
- **Ranked 20-item worklist** (survey agent, full text in agent transcript; top remaining): #1 background portraits via existing characterPortraits.ts plumbing (M) · #3 GoldCountryLocation NPC dialogue keeps PlaceBackdrop + portraits (M) · #4 Adventure DialogueView ← port /clue JRPG pattern (M) · #8 DB32 PIXEL_SCENES flag default-on decision (S-M) · #10 ExplorationMap art layer (L) · #13 Prologue needs original illustration (L) · #14 orphaned 541-line rpg/DialogueBox.tsx — revive/merge/delete decision · #18 GoldCountryExplore hardcoded enhanced_16bit — design call (CRT radar look may be intentional) · #19 delete dead getGraphicsTier in oregon-trail types.

## Continue-as-ideal slice 2 (2026-07-13 late night)

- **#8 DECIDED — PIXEL_SCENES tested and REJECTED.** Flag flipped ON in the lab, /investigations compared in-browser: DB32 canvas scenes are visibly cruder than the photo-derived PNGs and mix fidelity across cards (G6 violation). Flag reverted; PNG path stays default. Morning-queue item "flip NEXT_PUBLIC_PIXEL_SCENES=1" (06-29) is CLOSED with evidence — MB `decisions/pixel_scenes_flag_tested_rejected_20260713`. DB32 renderer remains at /pixel-preview.
- **#3 (code half) DONE:** GoldCountryLocation NPC dialogue keeps the location's PlaceBackdrop on screen (was dropping to flat green gradient). Portrait half still needs art.
- **#1 SCOPED:** playtest atlas covers only 4/7 backgrounds honestly (sleuth/doctor/priest/miner; other 3 slots are NAMED Volcano characters — not generic). Per G6, do NOT ship partial portraits. 3 missing sprites (frontier_scout, army_officer, gambler) added to the Tower batch (`tower_tasks/ot_landmark_art_batch_20260713`, now 2 batches); wire BACKGROUND_PORTRAITS atomically when all 7 exist.
- **#19 DONE:** dead `getGraphicsTier(gamesCompleted, outlawsCaught)` deleted from state/types.ts + context re-export (the Adventure-mode sibling in rpgContext.tsx is live and untouched). tsc + full suite green.

## Landmark art LANDED (2026-07-14 morning — Leif directive executed)

Tower batch ran 76 min: 528 candidates, all style-pass, 11 landmarks. Hub vision-judged (the pipeline's designed judge seat):
- 9/11 first-pass. Humboldt Sink re-picked (cand_r5_s6849 — muted palette; several alts had out-of-region saguaros). Fort Laramie REJECTED round 1 (round huts), prompt made architecture-explicit, 8-min re-run (48 cands) → cand_r11_s12849 shipped as acceptable-not-ideal (adobe wall + river); img2img upgrade queued for when a LOC ref photo is attached.
- All 11 PNGs (640x480) in public/place-art/ot_*.png; wired in PLACE_ART + LANDMARK_PLACE_ART.
- **Finding: river-type landmarks never reach LandmarkScene** (phase 'river' → RiverScreen/RiverCrossing). Art wired there too (id derived from riverName; unknown rivers render nothing). Kansas River arrival verified live in-browser.
- tsc + eslint(0 err) + full suite green. Tower ComfyUI left UP for phase 2 (3 character sprites — still pending in tower_tasks stub).
- Tower ~/place-art/places.json is filtered to ot_* (full manifest at places.full.json there); canonical manifest lives HERE in tools/place-art/.

## Resume point

Worktree: `/home/granny/bobr-visual64`

Branch: `feat/bobr-visual64-local`

Run `git status --short --branch`, read this file, then read `docs/BOBR_VISUAL64_BUILD_NOTES.md` before editing.
