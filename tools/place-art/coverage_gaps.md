# Place-Art Coverage Gaps — the 64-bit pictures still to make

*Generated 2026-06-24 from the PLACE_ART reuse audit. Each location id below currently
**borrows another place's image as a placeholder**. To move the game toward the mental
image ("every place looks like that real place"), each gets its OWN 64-bit picture via
`tools/place-art/` (research real place + year -> Google/Street-View ref -> SDXL+ControlNet+PixelLoRA
-> 640x480 downscale -> verify_place_art.py). Steps per item: (1) add a `places.json` entry
(id, name, address, latlng, year, prompt); (2) GENERATE; (3) VERIFY same-place; (4) drop
`public/place-art/<id>.png`. PlaceBackdrop picks it up with **no code change**.

## Priority by reuse weight (heaviest placeholders first)

### `volcano.png` is standing in for 5 other place(s)
- `ch2_volcano_main` — **needs places.json entry**  →  Volcano main street (St. George Hotel block) — could share, or its own
- `ch2_masonic_lodge` — **needs places.json entry**  →  Volcano Masonic Lodge (oldest in CA), Volcano CA
- `ch2_cobblestone` — **needs places.json entry**  →  Volcano cobblestone/stone storefronts, Volcano CA
- `ch2_miners_camp` — **needs places.json entry**  →  Volcano miners’ camp / Soldiers Gulch, Volcano CA
- `ch2_cemetery` — **needs places.json entry**  →  Volcano pioneer cemetery, Volcano CA

### `bobr_cabin.png` is standing in for 3 other place(s)
- `bobr_ranch` — **needs places.json entry**  →  Back of Beyond Ranch wide view
- `ch4_ranch_site` — **needs places.json entry**  →  The raw 1982 ranch site before building, 700 Deer Ln
- `ch5_ranch_house` — **needs places.json entry**  →  The present ranch house, Back of Beyond Ranch

### `angels_camp.png` is standing in for 2 other place(s)
- `ch3_angels_camp` — **needs places.json entry**  →  (identify the real place + clue year)
- `ch3_jumping_frog` — **needs places.json entry**  →  Angels Camp — Jumping Frog Jubilee / Frogtown

### `murphys.png` is standing in for 2 other place(s)
- `ironstone_vineyards` — **needs places.json entry**  →  Ironstone Vineyards, Murphys CA (its own, not Murphys town)
- `ch3_murphys` — **needs places.json entry**  →  (identify the real place + clue year)

### `big_trees.png` is standing in for 2 other place(s)
- `california_caverns` — **needs places.json entry**  →  California Caverns, Mountain Ranch CA (its own, not Big Trees)
- `ch3_big_trees` — **needs places.json entry**  →  (identify the real place + clue year)

### `vol_st_george.png` is standing in for 1 other place(s)
- `ch2_st_george` — **needs places.json entry**  →  (identify the real place + clue year)

### `ace_angels_hotel.png` is standing in for 1 other place(s)
- `angels_camp_expanded` — **needs places.json entry**  →  Angels Camp expanded street (vs Angels Hotel interior)

### `west_point.png` is standing in for 1 other place(s)
- `ch4_west_point` — **needs places.json entry**  →  (identify the real place + clue year)

### `mokelumne_hill.png` is standing in for 1 other place(s)
- `ch4_mokelumne_hill` — **needs places.json entry**  →  (identify the real place + clue year)

### `moaning_cavern.png` is standing in for 1 other place(s)
- `ch3_moaning_cavern` — **needs places.json entry**  →  (identify the real place + clue year)

### `jackson.png` is standing in for 1 other place(s)
- `ch4_jackson` — **needs places.json entry**  →  (identify the real place + clue year)

### `natural_bridges.png` is standing in for 1 other place(s)
- `ch3_natural_bridges` — **needs places.json entry**  →  (identify the real place + clue year)

### `ch1_sacramento_waterfront.png` is standing in for 1 other place(s)
- `ch1_sacramento_tent_city` — **needs places.json entry**  →  1849 Sacramento tent city (vs waterfront)

## Plus: intentional/no-art
- `era_future` (Where in Time, the Not-Yet) — intentionally imageless. *Optional:* a stylized,
  palette-shifted "present-out-of-time" frame could deepen the finale without naming a place.

**Total distinct placeholder locations needing their own picture: 22.**
These are the highest-leverage additions for the "the full game could have more of this" goal —
all additive, no backend/logic change.
## Oregon Trail landmark backlog (added 2026-07-13, Neoma hub)
11 from-scratch entries added to places.json (ids `ot_*`, games:["oregon"]): kansas_river, chimney_rock, fort_laramie, independence_rock, south_pass, fort_bridger, raft_river, city_of_rocks, humboldt_river, humboldt_sink, forty_mile_desert.
- All currently render via authored SVG fallbacks in LandmarkScene.tsx — safe state, no wrong-art risk. Generation is an upgrade, not a fix.
- BEFORE generation: a research agent should attach verified LOC/archival `historical_photo` refs (W.H. Jackson et al. exist for Chimney Rock / Fort Laramie / Independence Rock). Coords in the entries are approximate (recall) — verify if Street View refs are wanted.
- Generation: ComfyUI is installed locally (`/media/granny/larger SSD/ComfyUI`, SDXL base + pixel-art-xl LoRA present) but the server must be started: `./venv/bin/python main.py --listen 127.0.0.1 --port 8188`. Then `tower_batch.py` or per-place `generate.py --place ot_*`. GPU-heavy — run on Tower overnight or when Main is idle (load-awareness rule).
- AFTER generation+verify: wire ids into PLACE_ART (PlaceBackdrop.tsx) and LANDMARK_PLACE_ART (LandmarkScene.tsx). Do not wire before PNGs exist.
- Fun-feel guardrails for all trail art: MB `research/oregon_trail_fun_mechanics_20260713` (G5: travel screen is sacred — elevate, never replace; G6: uniform fidelity).
