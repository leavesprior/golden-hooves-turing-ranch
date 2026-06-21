# The Tare's Trail — Art Bible (two-register)

**Status:** spec / direction. Derived from Leif's reference set in `/media/granny/larger SSD/Downloads_main/` (2026-06-14) + the family/land canon. Governs all art for the chase and is the template for the wider Golden Frog Trail.

Leif's direction (2026-06-14): **"Both, split by context."** Two registers, used deliberately:

| Register | Used for | Reference |
|---|---|---|
| **Pixel art** (16/32-bit, warm) | the explorable world, the map, towns, gameplay UI, the Wanted Poster portrait | `6vMWs.jpg` (gold-rush wagon at sunset), `lOevM.jpg` (ranch pup / wolf-shadow, "LASSIE") |
| **Storybook illustration** (flat, magical-realist) | narrative beats — the opening, the Reckoning/verdict, apparitions (ghosts/spirits) | `in_the_woods_spirit_Seirra_inspired.jpg` (Sierra forest-spirit, glowing orb, fox) |

## Palette & mood (both registers)
- **Warm core:** sunset orange/amber/gold; firelight.
- **Cool dusk:** muted purple, teal, slate-blue (mountains, night, shadow).
- **Accents:** pink/rose moon; soft gold/white light-motes and stars; parchment cream for poster/UI.
- **Mood:** atmospheric, nostalgic, a little magical. **Ghosts and spirits are rendered WARM, not scary** — gentle, luminous, melancholy. This is family-facing; friendlier than the old "Fallout-grim / Sega-CD" docs.

## Pixel-art spec (world)
- Author at a small buffer (e.g. **320×180**), upscale **nearest-neighbor** (crisp pixels). DB32-ish constrained palette tuned to the warm/dusk set above.
- Density and light per `6vMWs.jpg`: layered silhouettes (foreground brush → mid homesteads → distant ridges), a low warm sun, scattered stars, a winding trail.
- Per-town backdrops must read as the REAL place (honest-grounding rule — see below).

## Storybook spec (narrative beats)
- Flat shapes, soft gradients, rim-light and particle glow per the Sierra-spirit piece. Vignetted, illustrative.
- Apparitions: luminous core, dithered/feathered edge (carries the proven AR-ghost edge-weighted-dither technique), faint halo for figure-ground separation.

## Character & motif notes (canon-grounded)
- **Cyrus Vane "the Tare":** a soft-spoken gentleman of the road — well-dressed, polite, *on foot* (afraid of horses), a dime novel in hand. The "tare" = counterfeit wheat; render him *almost* respectable, the wrongness subtle. Pixel portrait for the Wanted Poster; storybook for the Reckoning.
- **The ranch dog / wolf-heritage motif** (`lOevM.jpg`): a tri-color ranch pup that casts a great wolf's shadow. Canon-anchored — Cyndee bred wolf-hybrid pups; **Lobo** the taxidermied Alaskan wolf lives in the ranch game room; **Pilot** is the kid-facing stock dog. Use this pup/wolf-shadow as a recurring emblem of the ranch's real story. Never gated, kid-safe.
- **Gentle apparitions for the wider game** (not the chase): **Cynthia** (the ghost narrator — Cyndee, who really passed away) and **Elias Cole** the flood-lost post-rider (the Great Flood winter of 1861-62 is real). Warm, luminous, melancholy — never horror.

## Honest-grounding rule (hard)
Every depicted place is REAL and must be drawn truthfully: **West Point** (Kit Carson's pre-gold trading post, CHL #268, pine high country), **Sandy Gulch** (1849 strike), **Mokelumne Hill** (stone town, burned thrice), **Jackson** (spring town, the hanging oak, the deepest mines), **San Andreas** (the courthouse where Black Bart was really tried), **Angels Camp** (quartz town, the jumping frog). The land itself is the country that becomes **Back of Beyond Ranch** (the parcel's Stanley-Ranch lineage is oral history pending deed confirmation — depict the land/homestead era generically until confirmed; do not invent the second ranch).

## Asset manifest — chase (`public/chase/`)
Pixel-art (world):
- `town-west_point.png`, `town-mokelumne_hill.png`, `town-jackson.png`, `town-san_andreas.png`, `town-angels_camp.png` + distractors `town-volcano.png`, `town-murphys.png`, `town-sutter_creek.png` — per-town backdrop strips (320×180).
- `vane-poster.png` — the Tare's Wanted-Poster portrait (gentleman, dime novel).
- `map-motherlode.png` or keep the current SVG `ChaseMap` (already on-style — warm route line, shrinking lead).

Storybook (narrative beats):
- `intro-westpoint.png` — the opening (West Point high country, the warrant).
- `verdict-gallows.png`, `verdict-prison.png`, `verdict-mercy.png` — the three Reckoning outcomes. Mercy = warmest (dawn, the wronged made whole); gallows = stark, cold dawn; prison = grey, measured.

## Code integration points (graceful fallback — slots work before assets exist)
- **Verdict illustration slot:** `chase-demo/page.tsx` verdict panel — `<ChaseArt src="/chase/verdict-{kind}.png" fallback={<emblem/>} />`. Implemented this session as a programmatic storybook emblem until the raster art lands.
- **Town backdrop slot:** behind/above `ChaseMap` per `currentId` — `/chase/town-{id}.png` with fallback to the current gradient.
- **Wanted-Poster portrait:** `WantedPoster.tsx` silhouette → `/chase/vane-poster.png` with fallback to the current pixel silhouette.

## Asset generation (next step — needs a pipeline)
This environment has no raster image generator, so assets are produced separately. Options:
1. An image-generation pipeline/agent (prompt-per-asset from this bible).
2. Leif provides assets (he already curates references in Downloads_main).
3. Programmatic SVG/CSS art for simple elements (frames, emblems, the map) — done where it reads as intentional.
Until then, every art slot has a graceful, on-style fallback so the chase always looks finished.
