# Slice 5: 1849 / Today on the same ground

West Point and the ranch now have an explicit 1849 / Today view inside the
existing Explore town. The default is the historical painting. Today shows an
official Google Maps embed for West Point or the existing ranch exterior photo.
The ranch's modern-house painting remains available through its own button.
Returning to 1849 restores the existing pins, NPCs, readings, and selections.
Other towns retain their existing presentation.

`placeSceneFor` resolves every supported alias through `townRegistry` and uses
its existing coordinates: West Point `38.3965,-120.5269`, ranch
`38.3947,-120.5269`. These are game map points, not surveyed entrances or camera
locations. View toggles only change local component state: they do not move the
wagon, change its year, award exploration, or unlock the farm.

## Source and era distinctions

- **2026 review:** `src/lib/townRegistry.ts` is the source of canonical identity
  and geographic coordinates; no new destination list was added.
- **2026 embed:** the exact iframe URL was copied from Google Maps' official
  Share → Embed a map interface at the canonical West Point coordinate. This
  follows [Google Maps Help](https://support.google.com/maps/answer/7101463).
  The iframe keeps Google's own map and attribution; no tile imagery was
  downloaded, cached, or added to the repository. The application CSP adds only
  `https://www.google.com/maps/embed` to its existing `frame-src` directive.
- **Existing property photograph:** `public/cabin-photos/cabin-2.jpg`, introduced
  with the Airbnb listing material in commit `4d5dd34`, visibly shows the timber
  house and glass porch. It is labeled a property photograph, without claiming
  a capture date or exact camera position. `cabin-1.jpg` is the hot tub, despite
  older gallery labels; it is not used for this scene.
- **1849 illustrations:** the West Point cabin arrangement is invented scene
  staging. The new ranch oak camp is explicitly fictional, not a documented
  settlement. Both entries carry `fictional: true` and explanatory notes. The
  modern glass-porch house is kept in the Today view.

If the iframe is blocked, 1849 and the external map link remain available. If a
property picture fails, descriptive fallback text and the painting/photo switch
remain usable. Historical pins stay off the modern map and photo. The 16:9
historical frame keeps pins relative to the illustration at desktop and phone
sizes. The existing enlarged Look view remains fullscreen; the oak camp is
upscaled with explicit nearest-neighbor rendering.

## New art provenance

Generated on 2026-09-13 using the built-in image generation tool. Original:
`/home/granny/.codex/generated_images/01a09154-2c68-7b80-a947-29bfcdee5492/exec-adb50bb9-1ff6-4442-8c7b-e514058cd8c1.png`.
The original was inspected and preserved. The repository export is
`public/place-art/editorial/bobr_oak_camp_1849.png`: 320×180, indexed PNG,
22,008 bytes, resized using Sharp's nearest-neighbor kernel.

Prompt:

> Use case: historical-scene. Asset: Golden Frog Trail, an explicitly fictional
> 1849 camp on the oak foothills near West Point, California. Generate a new
> landscape 16:9 warm pixel-art background composed on a 320x180 grid, crisp
> square pixel clusters, nearest-neighbor look, no smooth painted gradients.
> Warm amber evening, muted purple distant ridges, slate shadows, gold and green
> valley oaks. A quiet small canvas shelter, a few rough wooden crates, a low
> stone fire circle with gentle fire, an open dirt clearing and winding footpath
> among spreading valley oak silhouettes. No house, glass porch, electricity,
> roads with paving, signs, modern objects, people, graves, text, logos or
> watermarks. The central clearing and campfire at roughly 50% horizontal and
> 68% vertical should be readable as a place to stop. Gentle and inviting, a
> family game, no menace. This is invented camp staging, not a surveyed
> historical reconstruction or a claim of a documented settlement. Output exact
> 320x180 if supported.

## Verification

`npm run test:place-scene` checks registry aliases, unsupported-place fallback,
embedded and external map coordinate parity, the selected photograph, existing
painting retention, fictional-scene notes, and the new PNG's dimensions. The
suite is registered in `npm test`.

`node --import tsx tools/placeScene.browser.ts <base URL> <label>` exercises
West Point and ranch at desktop and 390px, blocked map, blocked photograph,
and the existing Volcano ASCII path. It checks real content, keyboard/button
controls, settled gameplay state and intermediate storage writes, existing Look,
and leave/revisit behavior. Artifacts are local under ignored
`artifacts/place-scene/`.

The initial browser run also reproduced a pre-existing Explorer persistence
bug: attraction details and local karma appeared, while visited attraction,
journal, and XP changes were replaced by stale stored progress. The unchanged
provider and original failures are recorded in
`artifacts/place-scene/BASELINE_FINDINGS.md`. This requires its own save fix;
results containing it must not be reported as an unqualified gameplay pass.

The Explorer save defect was repaired separately in PR84, and this slice was
rebased onto that repair. Final production verification requires persistence to
succeed rather than tolerating the earlier baseline defect: all seven cases
passed, with no baseline findings and zero uncaught page errors. This includes
exact first-visit XP 7 → 22, one journal entry, stable repeated visits, and native
Google logo/copyright/Terms visibility on desktop and 390px phone. Evidence:
`artifacts/place-scene/browser-production-verified/`.

Full `npm test`, non-incremental TypeScript, normal production build and lint
passed (zero lint errors, 471 warnings). An initial production browser run used
a string-form wait helper blocked by the production CSP. The harness now uses a
function predicate; the application's CSP was not weakened. The failed run is
preserved in `artifacts/place-scene/browser-production/`.
