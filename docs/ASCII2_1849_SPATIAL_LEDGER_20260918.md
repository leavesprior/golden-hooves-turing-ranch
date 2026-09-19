# 1849 walk: spatial and historical ledger

**2026-09-18 · cc_agent (Neoma) · branch `feat/ascii2-1849-volcano-westpoint-20260917` · PR #94 (draft)**
Brief: `~/neoma-grok-workspace/CC_AGENT_ASCII2_NEXT_PASS_20260918.md` and its accuracy extension
`CC_AGENT_ASCII2_SPATIAL_HISTORY_20260918.md`. Leif's instruction: *"the most important element is
spacial accuracy with google maps and historical accuracy."*

This ledger keeps three things apart, because passing one says nothing about the others:
**§1 where things are (spatial)**, **§2 when things were (historical)**, **§3 what the game now draws and
how it is tested**. §4 lists what is still not known. Nothing here is Leif's look; that gate is still owed.

---

## 1. Spatial evidence

### 1.1 Sources, and what each is allowed to prove

| Source | Used for | Not used for |
|---|---|---|
| **OpenStreetMap** (ODbL), Overpass API, read 2026-09-18 | Today's roads, Sutter Creek centreline, cemetery and St. George footprints, Hwy 26 geometry | Anything about 1849 |
| **USGS 3DEP** via the Elevation Point Query Service | Ground heights for the horizon (433 samples per town) and the bowl-vs-ridge landform | Vegetation, buildings, 1849 cuts and fills |
| **California OHP** landmark records No. 29, 253, 268, 715 | Where each marker stands | Where an 1849 tent or trail stood |
| **Google Maps** (map, terrain and satellite views, viewed in a headless browser) | A visual cross-check of the OSM geometry | Stored geometry. No Google tiles or coordinates are kept in the repo, and none were traced |

Google views checked (2026-09-18):
- Volcano map, z17, centred 38.44264,−120.63143. Visible: Sutter Creek running ENE→WSW just south of Main St, Pine Grove Volcano Rd crossing it southward, St George St at Main, cemeteries N/NE, Soldiers Memorial Park W of Main. Agrees with OSM.
- Volcano terrain, z15. Visible: steep slopes W/NW, a valley opening NE/E where **Pioneer Creek** joins Sutter Creek, and the outlet WSW. Agrees with the USGS ring samples.
- West Point satellite and terrain, z14. Visible: town on a forested ridge, Hwy 26 winding SSW, and **"Sandy Gulch" labelled south-southwest on Hwy 26**, where the OSM road walk put it.

Chrome-bridge (Leif's browser) was not used: `list_tabs` timed out twice, so a separate headless Chrome did the viewing. Street View was not opened.

### 1.2 The georeference (`src/lib/townGeo.ts`)

**Volcano: `partial`.**
- **Anchor.** OHP No. 29, *"Intersection of Main and Consolation Streets"*, is the OSM junction node 38.44264, −120.63143. It is placed on the camp's street-and-road junction, **tile (10,5)**. That is a stated choice, not an 1849 survey.
- **Orientation.** North-up: `up` = bearing 0.
- **Scale.** Pine Grove Volcano Road crosses Sutter Creek at 38.440474, −120.632099 (an OSM intersection), 239.5 m south of the anchor. The camp's plank crossing is 2 rows south, so **1 tile = 119.75 m**. The 20×11 camp therefore spans about 2.4 × 1.3 km: the whole bowl, not one lot.

**West Point: `bearing-only`.**
- **Anchor.** OHP No. 268, *"Intersection of State Hwy 26 (P.M. 34.4) and Main St"*. The marker coordinates (38.39723, −120.52767) are attributed to HMDB marker 44371 in a web-search summary; the HMDB page returned 403 and was not read. The point is 15 m from the OSM junction.
- **No scale.** Nothing in the camp exists on the ground to measure one. Reading the camp's pack road off Hwy 26 would be inferring an 1849 trail from asphalt, so only **directions** are claimed at West Point.

### 1.3 Measured error, before and after (tiles; 1 tile = 119.75 m)

| Feature | Evidence | Before this pass | After | 1849 position |
|---|---|---|---|---|
| Plank crossing | OSM road × creek | 0.49 (58 m) | 0.49 (unchanged: it set the scale) | today only |
| Sutter Creek | OSM centreline, 14 samples | straight row 7; up to **5.2 tiles (620 m)** off NE of the crossing, 2.5 SW | every sample inside the camp **≤ 0.75 tile** | **unknown**: hydraulic mining from 1855 |
| Graves / cemetery target | OSM `Protestant Cemetery` (Google: Volcano Pioneer Methodist Cemetery) | **4.07 tiles (488 m)** too far east | **≤ 1 tile** (target at 12,3) | **unknown** |
| St. George fog | OSM building footprint | painted pin at (5,5), about 5.6 tiles W of its ground | geo-placed at (10,6), **≤ 1 tile** | stands from 1863–67 |
| Cobblestone Theatre fog | 16124 Main St; no OSM footprint | painted pin at (10,5) | unchanged. Main St runs about 125 m, so it is within about a tile | stands from 1856 |
| Sandy Gulch | OHP No. 253 + OSM Hwy 26 walk (3,380 m) | inside the camp, "roughly east of the road" | **off the camp**: bearing **210° (SSW), 2,348 m**, shown on the horizon | 1849 trading center (OHP) |
| Observatory, Old Abe | none found | painted pins | unchanged, marked `placedBy: 'painting'` | later |

`src/lib/townGeo.test.ts` recomputes every number in this table from the stored coordinates, and
re-derives the creek tiles from the centreline, so the table and the code cannot drift apart.

### 1.4 Terrain: the horizon (`src/data/towns/horizons.json`)

The horizon is sampled from 1.7 m above each anchor, every 10° at 12 distances from 150 m to 6.5 km, and drawn at true angular scale (90° field of view, no vertical exaggeration).

| | Mean skyline | Highest | Lowest | Reads as |
|---|---|---|---|---|
| Volcano | ~7.4° | 13.4° at 240° (WSW), 11.7–13.2° W to NW | 2.7° at 160° (SSE), 3.0° at 60° (ENE) | a walled bowl, highest to the west |
| West Point | ~1.2° | 3.4° at 50° (NE) | −1.6° at 250° (WSW) | an open ridge-top, the ground falling away S/SW toward the Mokelumne |

The horizon has no parallax: it is seen from the anchor wherever you stand. It is today's landform standing in for 1849's. Mining-era cuts and fills are finer than this sampling.

---

## 2. Historical evidence (each correction cited in the data files)

| Claim before | Now | Source, read 2026-09-18 |
|---|---|---|
| St. George: "The brick hotel is 1862" | **1860s: 1863 or 1867, the records disagree.** The predecessor burned in 1862 | [NRHP nomination 84000757](https://npgallery.nps.gov/NRHP/GetAsset/NRHP/84000757_text): "built in 1867"; 1863–64 per other accounts (HMDB not read directly) |
| Theatre: "an 1850s theatre tradition" | **Built 1856 as a tobacco and cigar shop; theatre company from 1974** | [Volcano Theatre Company, About](https://volcanotheatre.net/about/) |
| Soldiers' Gulch "mined … in 1848" | **Discovered 1848, mined 1849** | [OHP No. 29](https://ohp.parks.ca.gov/ListedResources/Detail/29) |
| Name: "limestone basin, not a volcano" | Named Soldiers Gulch; renamed Volcano in 1850 "because of the volcanic appearance" (**secondary**) | NRHP nomination §8 |
| West Point: "The plaque is 1937" | **Registered 9/3/1937; plaque dedicated 7/3/1949** | [OHP No. 268](https://ohp.parks.ca.gov/ListedResources/Detail/268); [plaque transcription](https://noehill.com/calaveras/cal0268.asp) |
| Carson's pass "is 1844" | **1844 is tradition**; the plaque gives no year | OHP No. 268 |
| General store: "goods come off a pack mule, not a shelf" | **A trading post is recorded; what it looked like is not known** | OHP No. 268 |
| Sandy Gulch "roughly east of the road", in camp | **2.1 mi down Hwy 26 toward Glencoe, SSW**; an 1849 trading center; quartz mining early 1850s | [OHP No. 253](https://ohp.parks.ca.gov/ListedResources/Detail/253) |
| Observatory "1860" | Madeira's observatory, where he found the Great Comet of 1861; 1860 from secondary accounts | [OHP No. 715](https://ohp.parks.ca.gov/ListedResources/Detail/715) |

---

## 3. What the game now draws, and how it is tested

**Shared camp (`townWalk.ts`, both views).** The creek follows its measured course, the graves sit beside the road where the cemetery is, and the street stops at the creek. **Saves:** a save standing on a tile that became creek falls back to spawn (tested). All targets and doors remain reachable (tested).

**Eye-level (`ascii2PixelPaint.ts`).**
- The skyline comes from the USGS horizon for the bearing you face.
- The ground is the camp's own tiles laid out in perspective, so the creek, its banks and the plank crossing appear where the map has them. This replaces a ground model whose perspective was **inverted**: near water was drawn at the horizon.
- A run of canvas tiles is drawn as one **wall tent**: ridge pole, pitched roof, panels, guy-lines, and the doorway flap.
- The camp edge is low scrub, not a wall.
- The pack-road waymark is a signpost, not a cross.
- Texture is pinned to world tiles and clouds to compass bearings, so nothing reshuffles when you step.
- Sandy Gulch stands on the skyline at 210°.

**Status line.** A later site now speaks its own year line at any distance (*"St. George Hotel, 3 paces on: …1863 or 1867, the records disagree."*). A far site speaks its real direction (*"Toward the SSW, 2.3 km off: Sandy Gulch Mine. …"*).

**Gates at this pass.**
- `tsc` clean · `npm test` exit 0 · lint 0 errors (460 pre-existing warnings) · `npm run build` pass.
- Browser check on `:3107`: **65 checks, 0 findings**. New checks: four headings give four skylines, a full turn and a step back return the identical frame, and **a step leaves the sky band unchanged**. That last check was strawmanned: it fails on the previous painter, while the step-back check alone passed on it.
- Mutation suite: **11 scored, 11 caught, 0 no-op**. Three new spatial seeds; the target guard is now exercised directly, because no real site needs it any more.
- `:3107` (a dev server running from this worktree, not started by me) served 200 before and after the build, on the same process.

---

## 4. Still not known, or not done (`_conf=-1` unless stated)

- **Leif's look.** No human has judged whether the bowl, the tent or the creek are recognizable. Machine walks are not that.
- **1849 positions.** No 1849 survey was found for any tent, grave, path or creek channel. The camp matches today's ground to the tolerances above, and nothing more.
- **Soldiers' Gulch** has no independent geometry: GNIS served only its web app, and OSM has no feature by that name. The "Look at Soldiers' Gulch" tile (4,8) is unmeasured.
- **Street View** was not opened. Map, terrain and satellite views only.
- **Pioneer Creek** shows on Google's terrain view joining Sutter Creek from the east, but it is not in the OSM data I queried, so it is not drawn and its position relative to the camp is **unmeasured**. It may fall inside the camp's eastern columns.
- **West Point** has no measured scale, so its camp layout is unaligned by design.
- **HMDB** pages (the St. George and West Point markers) returned 403. Their dates and coordinates here come from other sources or search summaries, as marked.
- **Leads, not facts:** limestone geology (Clark, CDMG Bulletin 193, not retrieved); "oak and grass three to five feet high (Cook, 1849)" (no citation found); "Smith's shop around 1890" (not found on the Calaveras Heritage page the brief cited).
- **Outside this walk, left unchanged:** the explore page's modern-face copy says the St. George is "haunted since 1862" and that Sandy Gulch Mine "operated from 1852-1890 and produced over $2 million". Neither is sourced here.
