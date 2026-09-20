# oc_agent instructions — BOBR game: ascii2 → voxel → Unreal ladder (1849 towns)

**From:** grok_2 (chair, this seat) for Leif → **oc_agent**  
**Date:** 2026-09-17  
**Grok is doing:** local playable checkout **now** (`bobr-volcano-1849-wt` on `127.0.0.1:3103`; visual64 already on `:3099`).  
**You own:** the stepped graphics + 1849 town reconstruction pipeline below. Do **not** redo grok_1 listing insert-guard. Do **not** collide PRs **92/93** (Angels Walk / investigation rooms — oversight only). Do **not** push `main`. Do **not** WoL Tower. Do **not** steal `:3338`.

If you cannot write (sandbox read-only), **stop and say so**.

Read first (do not skip):
- `/media/granny/larger SSD/bobr-website/docs/OC_AGENT_FULL_BRIEF_20260913.md` — still in force. This file **adds** a graphics/save ladder; it does not replace SADDLE, 1849 honesty, or Notion.
- `docs/OREGON_TRAIL_CORE_TO_LEVEL2_EXPLORE_VISUAL_PLAN.md` — **Google Maps law**.
- `src/data/goldCountryCanon.ts` — one id per real place; fiction flagged; sources required.
- `src/lib/goldCountryStreet.ts` + `goldCountryAlley.ts` + `oregon-trail/data/asciiArt.ts` + `oregon-trail/state/graphicsTier.test.ts`.

Start from a **new worktree** under `/media/granny/larger SSD/bobr-worktrees/` off `origin/main`. **Never** mix `~/bobr-visual64` onboard-404 `bead30e`. ArcadeLevel stays `1 | 2 | 3`.

---

## 0. One sentence

Build a **stepped presentation** of each Gold Rush town (start **Volcano**, then **West Point**): colored **ascii2 first-person walk** → **Minecraft-1.0.8-style voxels in Rust** → optional **Unreal** on fat devices — while the **Next.js farm stays the website mirror**, Railway steps **down** the ladder, and **game saves stay on Notion** (`/api/saves`) plus local SQLite. Do not scrape Google Maps tiles.

---

## 1. What Grok already verified locally (do not rebuild)

| Thing | Where | Status 2026-09-17 |
|---|---|---|
| Playable farm (visual64) | `~/bobr-visual64` → **http://127.0.0.1:3099** | `/` `/explore` `/oregon-trail` `/pixel-preview` `/hub` HTTP 200 |
| 1849 worktree (Volcano street drop later brick, #62) | `~/bobr-volcano-1849-wt` @ `982fb3f` → **http://127.0.0.1:3103** | Grok started this for Leif’s checkout |
| Street grammar | `goldCountryStreet.ts` | Fronts + interiors; indoor unnamed until click |
| Alley chase | `goldCountryAlley.ts` | `ascii: boolean` — ascii2-to-pixel flesh is the test name |
| DOS ascii | `asciiArt.ts` | Buildings/terrain; not yet 1st-person walk |
| Pixel scenes | `/pixel-preview` + `PixelScene` | Authored Gold Country rasters |
| Look-not-walk town | `InteractiveTown.tsx` | Exterior painting + pins; ASCII interiors for some Volcano pins |
| Graphics pin | `graphicsTier.test.ts` | Default `ultra_64bit`; LOAD_STATE must not regress to `retro_4bit` lock era |
| Cloud saves | `/api/saves` | **Notion** (the N* tool). Worker DB = SQLite. **No Supabase in package.json.** |
| Explore towns | `ExploreClient.tsx` | Volcano + West Point entries exist |

Honesty gap you **will** hit: `ExploreClient.tsx` Volcano `tagline` is still **“The Town That Wouldn’t Die”** and St. George is 1862 `period: 'later'`. Farm PRs 77–79 named 1849 faces **canvas camp / trail camp / creek camp**. 1849 street must not wear 1862 brick as the default face. `period: 'later'` is load-bearing.

---

## 2. Non-negotiables (fail the PR)

1. Branch-PR-CI-squash. Never direct-to-main. Never visual64 onboard-404.
2. **1849 honesty.** No 1855 hotels, 1867 seats, Twain 1865, frog jubilees on the 1849 street. Later stays `period: 'later'`.
3. **Google Maps / Street View:** embed or live API **with attribution**, or owned/licensed photos. **Do not scrape, cache, or rehost Maps tiles or Street View cubemaps as `/place-art`.** Same law as the 20260913 brief §1.6.
4. **S.A.D.D.L.E. letters only.** No STR/DEX.
5. **Passing** not “Game Over.” Graves are how Passing looks.
6. Named nations: Northern Sierra Miwok (Gold Country). No generic raid table. `chawse_indian_grinding_rock` `needsTribalReview: true` — not a GPS destination.
7. **`/dm-table` LOCAL NEVER-MAIN.** No browser SSH.
8. **Saves = Notion** (`NOTION_API_KEY` + `NOTION_DATABASE_ID`) + localStorage + SQLite karma. Do **not** add Neon/Nile/Supabase unless Leif overrides after you write a one-pager. “N*” in Leif’s ask **is Notion** (already in `/api/saves`). Investigate remaining: encryption, PlayerId+SaveType dedup, per-town slots, Railway env. If Notion rate-limits, document; do not silently switch DBs.
9. QSD yellow. No fake blockchain.
10. **Do not collide PRs 92/93.** Shops-stay-put / investigation rooms — oc may already have them. New work = new branch `feat/ascii2-1849-volcano-westpoint-YYYYMMDD`.
11. **Do not send-keys** into grok_1’s listing-editor compose. **Do not steal `:3338`.**
12. Unreal is **tier 3 local/high only**. It never ships on Railway.

---

## 3. Graphics ladder (the product)

One world model. Four **presentations**. Device / Railway / GitHub Pages-class hosts pick a rung; they do not get a different history.

| Rung | Name | When | Tech |
|---|---|---|---|
| **0** | **ascii2 color 1st-person** | Default on weak devices, Railway free, first paint | Colored Unicode/box-drawing + 40–80 col viewport; WASD; same street graph as `goldCountryStreet` |
| **1** | **Voxel / MC-pixel** | When WASM + RAM ok | Rust crate compiled to WASM; blocks textured from **Minecraft 1.0.8** (or nearest jar Leif has) **as a local asset pack**, not a Minecraft server |
| **2** | **Pixi / ultra_64bit** | Current website | Existing Next + pixi + PlaceScene. **Do not regress** `graphicsTier` pin. |
| **3** | **Unreal** | Local GPU / future kiosk | Unreal project **mirrors** the same town ids. Not the farm. Not Railway. |

**Step down, never fork lore.** If Railway OOMs on WASM, serve rung 0. If a phone has no WebGL, rung 0. If desktop has GPU and Leif launches Unreal, rung 3 **reads the same save** (Notion player id).

Existing `graphicsTier`: `retro_4bit` … `ultra_64bit` is a **presentation pin**, not this ladder. Map:
- ascii2 walk → new flag `present: 'ascii2'` (do not reuse `retro_4bit` as a lock).
- voxel → `present: 'voxel'`
- current pixi → keep `ultra_64bit`
- Unreal → out of process

---

## 4. Town pipeline (repeat per town). Start Volcano, then West Point.

For **each** town id in `goldCountryCanon.ts` (Volcano first — lat 38.4413, lng -120.6294; West Point — 38.3965, -120.5269, Kit Carson marker **Hwy 26 & Main**, not a cemetery campsite):

### 4.1 Modern reference (legal)

- Street View **embed** or Maps JavaScript API with key + attribution in the Explore “today” overlay.
- Optional: Leif-owned photos already in `/place-art/editorial/` (`volcano_main.jpg`, `west_point.jpg`).
- **Forbidden:** downloading Street View tiles/pano into the repo.

### 4.2 1849 extrapolation (data, not a filter)

Write `src/data/towns/<id>.1849.json` (new):

```json
{
  "id": "volcano",
  "era": "1849",
  "face": "The canvas camp",
  "must_not": ["St. George Hotel brick", "Cobblestone Theatre", "Madeira observatory"],
  "may": ["canvas tents", "rope street", "placer workings in the limestone bowl", "named Miwok presence as diplomacy not raid"],
  "sources": ["…public local history only…"],
  "street_graph": { "nodes": [], "edges": [] },
  "ascii2_palette": ["#3b2a1a", "#c4a574", "#2e4a3b"]
}
```

Sources: canon `notes`/`sources`, Calaveras history pages already cited, West Point CHL #268. **No invented 17,000-soul brick Main Street as 1849.** Canvas and rope in 1849 is already in `ExploreClient` `townStory`.

### 4.3 ascii2 1st-person walk

- New module `src/lib/ascii2Walk.ts` (pure) + `Ascii2Viewport.tsx` (color spans, monospace).
- Input: `street_graph` from 4.2. Output: ~24×80 colored frame, heading N/E/S/W, WASD.
- Tests: `ascii2Walk.test.ts` — cannot walk through a `period:'later'` building in 1849 mode; later buildings are fog/absence, not brick.
- Wire **after Look** in `InteractiveTown` — do not replace the exterior painting. Brief 20260913: “Add walk after Look.”

### 4.4 Minecraft 1.0.8 → Rust voxels

**Path is UNMEASURED on 2026-09-17.** Grok searched `/home/granny`, `/media/granny/larger SSD`, `storage_chest_AI`, `.minecraft/versions` — **no 1.0.8 jar found**. You must **locate** (ask Leif / `find` on the chest and larger SSD to depth 6 for `minecraft` / `1.0.8` / `1.8.0`). If missing, **abstain** the voxel rung; do not pirate a jar.

When found:
- Treat as **texture/block-id reference** (terrain.png / blocks in that era).
- New crate `crates/bobr-voxel/` (Rust 2021, zero extra deps if possible; `wasm-bindgen` only at the WASM edge).
- Map 1849 `street_graph` → block columns (dirt, wood, canvas-as-wool, rope). **No anachronistic stained glass.**
- WASM bind: `present: 'voxel'` in the Next app. Tests in Rust (`cargo test`) + a JS glue test that the WASM loads.

**Do not** ship a Minecraft server. **Do not** require the player to own Minecraft at runtime — pack **derived** 16×16 textures you generated, with a NOTICE that the pipeline used a local 1.0.8 jar Leif provided.

### 4.5 Unreal (rung 3)

- **Do not download the Epic installer on Main** unless Leif says “install Unreal now” (100GB+). Record: Unreal **not installed** 2026-09-17 (`UnrealEditor` missing; no `/opt/Unreal*`).
- When authorized: Linux Unreal on a GPU box (Tower only if idle and Leif confirms — **deny_wol** still). Project name `BobrGoldCountry` with one Persistent level per town id.
- Import the **same** `towns/<id>.1849.json` (JSON → DataTable). Ascii2 and voxel remain the Railway path.
- Unreal is a **mirror**, not the source of truth.

---

## 5. Website mirror + Railway

- Farm auto-deploys from `main`. **Never push this ladder to main without PR.**
- Railway: serve Next as today. Detect: `navigator.hardwareConcurrency`, WebGL, `deviceMemory`. Choose rung 0 or 1. Never 3.
- Mirror: `/explore` and `/oregon-trail` keep current chrome; ascii2/voxel is a **mode** behind Look / a “walk the 1849 street” button. Do not hide the ranch site.

---

## 6. Saves (Notion) — investigation still owed

Already: `src/app/(api-routes)/api/saves/route.ts` — encrypted game state as Notion page blocks; metadata in properties; dedup PlayerId+SaveType.

You must:
1. Confirm env `NOTION_API_KEY` / `NOTION_DATABASE_ID` exist locally (do not print secrets).
2. Add **per-town walk position** (`townId`, `heading`, `present`) to the save blob without breaking old saves.
3. Keep localStorage `bobr_game_session` / `bobr_ot_character` as the offline rung.
4. If Notion is down: play local, queue upload. Ternary `_conf=-1` in any Neoma note; do not fake a cloud save.

---

## 7. Slice order (done when)

1. **Volcano 1849 json + ascii2 walk** after Look. Tests. Screenshots in `test-reports/`. Tagline honesty: canvas camp vs “Wouldn’t Die”.
2. **West Point 1849 json + ascii2 walk.** Marker at Hwy 26 & Main. No cemetery-as-campsite.
3. **Minecraft jar locate** or written UNMEASURED + skip voxel.
4. **Rust voxel WASM** for Volcano only if jar found.
5. **Notion save field** for walk position.
6. **Unreal** only after Leif “install Unreal now”.
7. PR with `tsc --noEmit`, lint, build, local :3103 still up.

**Done when:** Leif can walk Volcano then West Point in colored ascii2 1st-person on :3103, later buildings do not spawn as 1849 brick, Railway still serves the farm without Unreal, and Notion still round-trips a save (or documents UNMEASURED if env missing).

---

## 8. What you are not doing

- Guest-access Airbnb paste (grok_1 insert-guard).
- Receipts/Spark (tmux window 4).
- Dual/clear-ready continuity (parked grok_2; 8=8).
- PRs 92/93 merge/fight.
- Scraping Street View.
- Adding Supabase/Neon.

---

## 9. Local URLs for Leif (Grok started these)

- http://127.0.0.1:3103/explore — 1849 worktree (Volcano / West Point on the map)
- http://127.0.0.1:3103/oregon-trail
- http://127.0.0.1:3103/pixel-preview
- http://127.0.0.1:3103/hub
- http://127.0.0.1:3099/… — existing visual64 (do not kill)

Worktree for your branch: clone from the same origin as `bobr-volcano-1849-wt` / farm `leavesprior/golden-hooves-turing-ranch` into `/media/granny/larger SSD/bobr-worktrees/feat-ascii2-1849-…`.
