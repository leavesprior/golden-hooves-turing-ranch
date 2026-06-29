# BOBR — Whole-Game Design & Continuity Audit + 64-bit Art Roadmap
*2026-06-24. Deep-thinking pass over the entire game: story flow, every sub-game's clues/quests, continuity, and the 64-bit historical-picture system. Backend and key elements are preserved throughout — every recommendation here is additive or doc-only unless explicitly marked.*

> **Framing (Leif's goal):** Use the existing concept design — all the games, all the clues and quests — and the "Where in Time" 64-bit-picture update (a real local/Google-Maps place rendered in 64-bit game style) as the seed for deepening the *whole* game: make the story, clues, and continuity cohere, and leave clear room for improvement toward the mental image. **Ground rule: the backend stays; this is about depth and cohesion, not rebuilds.**

---

## 1. The unified story, as it actually is (reconstructed from code)

**One real piece of land — West Point → Back of Beyond Ranch — seen across five eras, with one villain wearing each era as a costume.** The thematic spine is honest *presence*: the land's real history (oak truly milled and aged 30 years; power line truly buried by hand; the frog truly counted) is the one thing the villain **Cyrus Vane "the Tare"** can never forge.

The eras (as authored in `whereInTimeData.ts`, ground-truthed):

| Era | Year (in code) | Place art | Vane's costume / crime |
|---|---|---|---|
| Gold Rush | **1849** | `west_point` | Assayer — shaves gold scales |
| The Forester's Trail | **the 1960s** *(Greg's father, Cal Fire — deliberately corrected away from "1883" on 2026-06-15)* | `forester_trail` | False timber surveys |
| The Ranch Begins | **1982** | `bobr_cabin` | Fake solar rebates |
| Back of Beyond | **present** | `welcome_gate` | Fake reviews / counterfeit karma |
| The Not-Yet | **future** | *(none — intentional)* | Forgery of presence itself |

**Intended play arc (hub "Complete Journey"):** Prologue (600–1500) → Where in Time? (temporal chase) → The Journey / Oregon Trail (1849 wagon trail to West Point) → Explore / Town Investigations (real Mother-Lode towns) → Back of Beyond Ranch (present-day QR hunt; the guest becomes a future witness whose real stewardship writes the ledger the *next* player investigates).

**What ties it together (all real, all in code):** `CrossGameStorage` (milestones, shared karma pool, time-echoes, reputation, bounties); D&D 2-axis alignment → discount multiplier; the Qualities bridge mapping D&D ↔ S.A.D.D.L.E. ↔ Oregon-Trail stats; Vane recurring across WIT / chase-demo / investigations; Prologue "time echoes" surfacing as Ranch-Treasure-Hunt riddles.

---

## 2. Continuity audit (ground-truthed — false positives removed)

A parallel agent produced a wide audit; I verified its high-impact claims against the code before recording them. Two were **wrong** and are struck here so they don't drive bad work:

- ❌ **"Clue-game unlock gate is hardcoded off / never written."** FALSE — `src/components/adventure/ClueGameUnlock.tsx:53` writes `localStorage.setItem('bobr_clue_game_unlocked','true')`. The gate is wired; Cynthia's hunt is reachable.
- ❌ **"Forester era should be 1883 (data says 1960s = bug)."** Inverted — the code is the *corrected* canon (forester = Greg's father, ~1960s Cal Fire). Any design doc still saying 1883 is the stale artifact, not the code.

**Genuine continuity items (priority order):**

1. **Two Vane hunts aren't narratively linked.** `where-in-time` (temporal hops) and `chase-demo` + `investigations` (spatial town hops) both star Vane with the same witness→dual-clue→evidence grammar, but each has its own villain object and neither references the other. A player who corners Vane in one then meets him "fresh" in the other — reads as a bug, not the intended "same crime, every costume." *Design intent (per `docs/WHERE_IN_TIME_DESIGN_20260615.md`) is to unify these.* **Grok-before** (cross-game narrative).
2. **Clue-engine Phase 3 not wired.** Phases 1–2 (schema + read-model + adapters, zero-writes) are designed and Grok-reviewed; no `ClueContext`/shared `ClueDisplay` is actually in `src/lib` yet. Clues live in 5 separate data files. Unifying lowers drift risk. **Grok-before** (it was the gated Phase 3).
3. **Town investigations: West Point authored; ~9 towns are stubs.** `/investigations` should show explicit "coming soon / locked" state for unauthored towns rather than implying completeness. Additive UI fix.
4. **Family eras 1883/1982 depth.** 1982 exists as a WIT era; deeper playable family-history beats are canonical but unauthored. Content work, **family-approval + Grok-before** (Dad's-book canon).
5. **Spiritual-awareness buffs defined but application unverified.** `computeSpiritualBuffs()` exists in `crossGameProgression.ts`; no confirmed reader in Oregon-Trail reputation. Needs a verification pass (could be a silent no-op).
6. **Stale design-doc dates.** `WHERE_IN_TIME_DESIGN_20260615.md` still says "1883" where code says 1960s. **Doc-only safe fix.**

**Architecture strengths to preserve:** milestone unlock graph (no cascade bugs seen), the alignment→discount economy, time-echo carry-forward, per-game save isolation, and the new Backroom/CCA-trainer + worker timesheets (PR #40). None of the above touches these.

---

## 3. The 64-bit picture system — it already exists; here's the real gap

Leif's "make a 64-bit picture of the real place from history / Google Maps" is **already the built `tools/place-art/` pipeline** feeding `PlaceBackdrop`:

- **GENERATE** (documented setup): research the real building's period appearance → Google Street-View reference → SDXL + MLSD-ControlNet (keeps the real structure) + Pixel-Art-XL LoRA → 8× nearest-neighbor downscale + palette-quantize to 640×480 (the downscale is what sells the SNES look). Runs locally on the RTX 3080 Ti via ComfyUI, or fal.ai `flux-general` as zero-setup fallback.
- **VERIFY** (built, working — `verify_place_art.py`): a free deterministic *style gate* (small palette + hard pixel edges) + a *place-identity* check (Street-View reference + a vision-LLM "same building, ignoring style?" judge). 1850s caveat: supports a manually-sourced historical photo when Street View shows a demolished/altered building.

**Coverage today:** 35 real images. **WIT's four canon eras all have art**; `era_future` is intentionally imageless. So WIT itself is *done* on art — the "more of this" is the **rest of the game**.

**The concrete work-list (the actual room for improvement):** **13 location ids are sharing another place's image as a placeholder** — each deserves its own real 64-bit historical/Google-Maps picture. Full list in `tools/place-art/coverage_gaps.md`. The heaviest reuse:

- `volcano.png` stands in for **6** Adventure ch.2 sub-locations (masonic_lodge, cobblestone, miners_camp, cemetery, st_george interiors…)
- `bobr_cabin.png` stands in for 4 (ranch_site, ranch_house…)
- `angels_camp`, `murphys`, `big_trees` each cover their own ch.3 duplicates

These are the pictures that, when generated, most visibly move the game toward the mental image — every distinct place finally *looks like that place*.

---

## 4. Prioritized roadmap (what "room for improvement" concretely means)

**Tier A — visible depth, additive, no backend/narrative risk:**
- **A1. Fill the 13 placeholder place-arts** (+ optionally a stylized `era_future`). Run the existing pipeline over `tools/place-art/coverage_gaps.md`; verify each; drop PNGs into `public/place-art/`. Zero code change — `PlaceBackdrop` picks them up. *Needs: Leif's go to run GENERATE (local ComfyUI/SDXL on the 3080 Ti, or fal.ai — external/cost).* 
- **A2. Investigations "locked/coming-soon" state** for unauthored towns (honest UI).
- **A3. Doc-only:** sync the WHERE_IN_TIME design doc dates to the corrected 1960s canon.

**Tier B — cohesion, Grok-before (cross-game narrative):**
- **B1. Unify the Vane hunt:** one shared villain object + a case-board that reflects progress across temporal (WIT) and spatial (chase/investigations) hunts, so "same crime, every costume" reads as designed.
- **B2. Wire clue-engine Phase 3** (the gated read-model/adapters) behind a flag.

**Tier C — content, gated:**
- **C1. Author the remaining town investigations** (public local history only, the West Point pattern).
- **C2. Deepen family eras 1883→1960s/1982** (Dad's-book canon — family approval).
- **C3. Verify/repair spiritual-awareness buff application.**

**Explicitly preserved:** all of `CrossGameStorage`, karma ledger/economy, save slots, the Neoma Backroom + CCA Trainer, worker timesheets, WIT's deterministic (testable) chase logic. Nothing in Tiers A–C removes a key element; each adds depth on top.

---

## 5. Sources
Code ground-truthed this session: `whereInTimeData.ts`, `where-in-time/page.tsx`, `PlaceBackdrop.tsx`, `ClueGameUnlock.tsx`, `tools/place-art/README.md` + pipeline, `crossGameProgression.ts`. Design canon: `docs/WHERE_IN_TIME_DESIGN_20260615.md`. Two-agent map (WIT-deep + whole-game continuity), with the agent's two false positives corrected against code. `_conf=1` for the art-coverage numbers and the corrected continuity facts; `_conf=0` for the spiritual-buff application status (needs a verification pass).
