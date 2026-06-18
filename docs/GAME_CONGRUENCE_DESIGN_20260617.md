# BOBR Game Congruence Design — fold old into new, Where-in-Time as the bar

**Date:** 2026-06-17 · **From:** Leif's directive — "Where in Time (#2) is exactly how Level 2 should be; fold the original parts under old menus carefully into the recent changes; keep Oregon Trail; one coherent map; reach my farm; the castle builder needs parcels/crops/livestock/furlough per season." Synthesized from 3 deep-research passes (maps, castle/farm, where-in-time/menus).

## The five "ones" (the whole design in a frame)
1. **One spine** — `/oregon-trail` ("The Prospector's Tale", 1849 journey). **KEEP DISTINCT, never fold.** Everything funnels into it.
2. **One menu** — `/hub` "PLAY THE COMPLETE JOURNEY" top-3: **1 Prologue (600–1500)** → **2 Where in Time (the chase)** → **3 The Journey (1849 = Oregon Trail)**. Repoint the global nav "Quest" (currently → old `/game` menu) and the home page to this. Retire `/game` as a launcher.
3. **One quality bar** — the **Where-in-Time pattern**: grounded eras/places → witness-delivered **real-attribute clues** (easy + costed-hard "Observe") → real **place-art backdrop** → finite-resource phase loop → **filling evidence panel** → **win hands off to the journey spine**. (`src/app/adventure/where-in-time/`.)
4. **One investigation corpus, elevated** — `src/app/explore/data/townMysteries.ts` (1274 lines) is **already research-deep** (Black Bart at West Point/San Andreas, Twain's frog swindle at Angels Camp, Old Abe cannon at Volcano, Kennedy Mine 1922…). It just renders emoji, not the **30+ place-art PNGs that already exist** for these exact towns. Render it through the Where-in-Time shell with the existing art → towns become Level-2.
5. **One map** — the SVG `ChapterMap` becomes the canonical engine with a **state → county → local** zoom hierarchy (higher-res unlocked later). Fold `/explore`'s town detail in as the LOCAL zoom; retire the buggy Pixi free-roam as default. Oregon-Trail's linear trail map stays a *distinct journey spine*.

## The /hub top-3 (confirmed)
| # | Label | Route | Note |
|---|---|---|---|
| 1 | The Prologue · 600–1500 | `/prologue` | 4 civilizations; gated behind verify-booking. Timeline head. |
| 2 | Where in Time? · the chase | `/adventure/where-in-time` | **The gold standard.** |
| 3 | The Journey · 1849 | `/oregon-trail` | The Oregon-Trail spine (what you saw "return to the golden frog"). KEEP. |

## Maps — current sprawl & unification
**Three map systems on three datasets** for the same Gold Country towns:
- A) Adventure `ChapterMap` (SVG, works) + `ExplorationMap`/Canvas (Pixi free-roam, **buggy**) — data `chapterLocations.ts` (x/y).
- B) `/explore` "Gold Country Explorer" pin map (lat/lng, **no travel** — static pins + attractions) — the `/hub` "Gold Country Explorer" + nav "🗺️ Map" both land here.
- C) Oregon-Trail `WorldMapScreen` (linear 1849 spine) + a 3rd Gold-Country dataset `goldCountryLocations.ts`.

**"Movement under explore often fails" = CONFIRMED BUG** in the Pixi free-roam: WASD nulls `targetLocationId` so arrival never fires (`ExplorationMap.tsx:283` vs `:358`); and the inline `locations` array (`play/page.tsx:1764`) makes the player-reset effect snap the player home on any re-render mid-walk.
- **DONE (2026-06-17):** default `explorationMode=false` so the *working* SVG map is the default Explore surface (`play/page.tsx:797`). Free-roam parked behind the toggle.
- **Plan:** canonical = ChapterMap + `zoomLevel` state (state/county/local); fold `/explore` TownDrawer in as LOCAL zoom; collapse the 3 datasets into ONE location registry keyed by town id (coords + connectedTo + services/danger + NPCs/quests + attractions/mysteries); keep Oregon-Trail spine separate but have its Gold-Country phase use the unified graph.

## Farm / homestead + the "castle builder"
The "castle building game" = the **Settlement/Ranch system in Oregon Trail** (`SettlementContext` = property tiers/buildings/farmland; `RanchContext` = livestock/fences/feed/**crops+seasons**). The homestead is `bobr_cabin` "Back of Beyond Ranch".
- **Farm was unreachable** (only a West-Point-gated button; `unlockRanch` never called). **DONE (2026-06-17):** persistent "🏡 My Farm" button in `oregon-trail/page.tsx` → `unlockRanch()` + `openRanchManagement()` from any gameplay phase.
- **Crops/seasons already exist in code but have NO planting UI** (`plantCrop`/`harvestCrops`/`CROPS` in `ranchContext.tsx`; only a read-only display). **Parcels/fields/fallow are absent.**
- **Parcels design (to build):** extend `RanchContext` with `Parcel` (id/name/acres/soilQuality) + `ParcelAssignment` (per-season use: **crop** / **livestock graze** / **fallow/furlough**). Add a **"Fields" tab** to `RanchManagement.tsx` showing each parcel with a Crop/Livestock/Fallow selector; reuse existing `CROPS`/seasons/`harvestCrops`. **Smallest slice:** 3 starter parcels, crop+fallow only, one Fields tab. Seasons already advance.

## Old-menu fold table (merge / retire / keep)
| Surface | Verdict |
|---|---|
| `/oregon-trail` Prospector's Tale | **KEEP-DISTINCT** (spine) |
| `/game` "Location Hunt" launcher | **RETIRE** as a menu; repoint nav "Quest"→`/hub`; fold QR hunt into `/ranch-treasure-hunt` |
| `/adventure` inline character creator (dead RPGProvider path) + dup `/adventure/character` | **RETIRE**; canonical = `/adventure/character-creation` |
| `/clue-game` | **MERGE** into `/ranch-treasure-hunt` (one gated on-property hunt) |
| `/clue-preview` | **RETIRE** after harvesting its real-photo+sprite look for towns |
| `/explore` Gold Country Explorer | **KEEP + ELEVATE** to Where-in-Time bar (drop in place-art; Observe clues; evidence panel; bind to spine) |
| `/prologue` | **KEEP-DISTINCT** (timeline head, hub #1) |
| `/leaderboard` / `/adventure/leaderboard` | already consolidated (redirect) — no action |
| `/karma-market` treats | already unified with ranch — no action |
| home `/` scattered cards | **MERGE** into the hub top-3 banner messaging |
| `/worker`, `/worker/danna` | **KEEP-DISTINCT** (utility) — but fix the `<html>/<body>` hydration error |

## Towns → Level-2 depth (incremental)
1. **Drop in existing place-art** on `/explore` town panels + mystery briefings (`<PlaceBackdrop id={townArtId}/>`). Near-zero new content, biggest quality jump.
2. **Pilot one town through the Where-in-Time shell** — West Point / Black Bart (`westpoint_robbery`, has `west_point.png`).
3. Add **two-tier "Observe" clue grammar** + a finite investigation budget per town.
4. Add the **filling Case-File evidence panel**.
5. **Bind each solved town to the spine** (`recordMilestone` + "Return to the Journey ▶").
6. Reconcile `townMysteries.ts` (explore) ↔ `goldCountryLocations.ts` (oregon) into one canonical town registry.

## Done today (live on :3000)
- Bounties pay into spendable balance + ±karma from the act · chapters unlock from live progress · RPG travel permissive · Oregon one-way edges + no-silent-fail · explore defaults to the working map · persistent "My Farm" button.

## Gates (carry forward)
- Where-in-Time's data header flags **MAJOR loop changes = Grok-before deploy**; family-era content = **Leif per-item approval**. The map-unification + town-elevation + parcels are sizable — build on the dev branch, Grok-before any production deploy.
- Cherry-pick the 6-case chase onto this branch (it's still single-Vane on :3000).
