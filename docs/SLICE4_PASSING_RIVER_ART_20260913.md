# Slice 4 — Passing and river outcome art

Base: `origin/main` at `bc54675c801cdf92b755cbef64466fe30ea33492` (slices 1–3 shipped). Scope follows the entire 377-line `OC_AGENT_FULL_BRIEF_20260913.md`; slices 5–9 remain separate work.

## Behavior

Town deaths receive a stone memorial. Recorded river and trail deaths receive a wooden cross and cairn. The memorial keeps the fallen name, actual resolved cause, stable existing death-pool epitaph, gentle additional epitaph, and existing two-stage heir continuation. Older saves without provenance explicitly say the place of passing was not recorded. A stale town landmark never proves a town death.

Existing lethal river/event damage enters Passing when resolved and retains that outcome. Travel endings keep the calculated party health. This does not alter damage amounts, crossing odds, random draws, SADDLE fields, or stat values. The Bridge Keeper currently deals 15 party damage for a wrong answer; it is fatal only when that existing damage kills the party. The brief's description of every wrong answer as fatal differs from the base implementation; changing lethality is deferred beyond this illustration slice.

River outcome scenes are authored reconstructions attached to existing resolver branches: critical failed ford → rocks; ordinary failed ford at low water → mud, at normal/high water → drifting; failed caulk → drifting. These establish scene presentation, not a new geographic feature or additional mechanical loss. Successful crossings, waiting, guides, and ferry outcomes do not acquire unsupported wagon-damage pictures. The complete outcome text is carried into the travel state and, if fatal, its memorial. A missing picture leaves accessible descriptive text and controls available.

The existing Luggage Use Item sent the bottle's discovery ID, whereas its consumable catalog expects a drink ID. A narrow alias now reaches the existing drink action while retaining the owned-bottle check. Both IDs and the unowned case have actual-hook tests.

## Art provenance

Generated with the built-in image tool on 2026-09-13. These are generic fictional period-style illustrations, not documented views of named sites. Each source image is retained in `/home/granny/.codex/generated_images/01a09154-2c68-7b80-a947-29bfcdee5492/`. Export used Sharp nearest-neighbor resize to 320×180 and an indexed 32-color PNG palette. CSS scales with `image-rendering: pixelated`; no gameplay depends on image delivery.

### grave-town

Final: `public/trail-outcomes/grave-town.png`.
Source: `exec-fa8e010e-194b-412d-98a0-719344e72af1.png`.

Prompt:

> Use case: historical-scene. Asset type: in-game Golden Frog Trail outcome illustration. Create one standalone landscape 16:9 scene in warm 16/32-bit pixel art, authored as a 320 by 180 pixel composition, crisp square pixel clusters and nearest-neighbor edges, constrained 32-color palette of sunset amber, parchment cream, muted purple, teal, slate-blue. Layered foreground/midground/distant silhouettes. Family-facing, gently humorous, nostalgic and humane, never horror or grimdark. 1849 pioneer material culture, wooden prairie schooner with cream canvas where requested, no modern architecture, no text, letters, numbers, logos, border, UI, watermark, no people, no bodies, no injured or dead animals. Output exact 320x180 pixels if supported. A single simple grey stone grave marker in foreground at the edge of a modest 1849 canvas-and-log camp, empty unlettered stone face, small wildflowers and dry grass, an old path curves onward through ochre tents and a distant ridge. Warm sunset and a little golden light. Quiet continuation and affectionate remembrance, not a ruined cemetery. Marker is large enough to read as stone at small scale.

### grave-trail

Final: `public/trail-outcomes/grave-trail.png`.
Source: `exec-4b3f14b3-f543-400a-b7d8-35581309d29f.png`.

Prompt:

> Use case: historical-scene. Asset type: in-game Golden Frog Trail outcome illustration. Create one standalone landscape 16:9 scene in warm 16/32-bit pixel art, authored as a 320 by 180 pixel composition, crisp square pixel clusters and nearest-neighbor edges, constrained 32-color palette of sunset amber, parchment cream, muted purple, teal, slate-blue. Layered foreground/midground/distant silhouettes. Family-facing, gently humorous, nostalgic and humane, never horror or grimdark. 1849 pioneer material culture, wooden prairie schooner with cream canvas where requested, no modern architecture, no text, letters, numbers, logos, border, UI, watermark, no people, no bodies, no injured or dead animals. Output exact 320x180 pixels if supported. A single handmade wooden cross planted in a small cairn of rounded stones beside an unpaved wagon trail. Large marker in foreground, one tiny sprig of wildflowers. Open grass and dust, low hills fading toward warm sunset. Sparse generic trail landscape that does not pretend to identify a specific geographic site. A road continues beyond the marker. No stone headstone or buildings.

### river-mud

Final: `public/trail-outcomes/river-mud.png`.
Source: `exec-91f4e0d9-d1ab-4bcb-a6a6-e12ebe188412.png`.

Prompt:

> Use case: historical-scene. Asset type: in-game Golden Frog Trail outcome illustration. Create one standalone landscape 16:9 scene in warm 16/32-bit pixel art, authored as a 320 by 180 pixel composition, crisp square pixel clusters and nearest-neighbor edges, constrained 32-color palette of sunset amber, parchment cream, muted purple, teal, slate-blue. Layered foreground/midground/distant silhouettes. Family-facing, gently humorous, nostalgic and humane, never horror or grimdark. 1849 pioneer material culture, wooden prairie schooner with cream canvas where requested, no modern architecture, no text, letters, numbers, logos, border, UI, watermark, no people, no bodies, no injured or dead animals. Output exact 320x180 pixels if supported. A covered wooden prairie schooner on the near riverbank, its wheels buried to the hubs in thick brown mud. Wagon upright, intact cream canvas, clearly stuck on the shore in mud, water visible behind it. A fallen bucket and neat muddy wheel ruts imply an exasperating but survivable delay. Amber evening sky, reeds and willow silhouettes. No grave, no people, no animals, no disaster imagery.

### river-drifting

Final: `public/trail-outcomes/river-drifting.png`.
Source: `exec-f4bd121d-afe9-48e1-9411-54a3b0817530.png`.

Prompt:

> Use case: historical-scene. Asset type: in-game Golden Frog Trail outcome illustration. Create one standalone landscape 16:9 scene in warm 16/32-bit pixel art, authored as a 320 by 180 pixel composition, crisp square pixel clusters and nearest-neighbor edges, constrained 32-color palette of sunset amber, parchment cream, muted purple, teal, slate-blue. Layered foreground/midground/distant silhouettes. Family-facing, gently humorous, nostalgic and humane, never horror or grimdark. 1849 pioneer material culture, wooden prairie schooner with cream canvas where requested, no modern architecture, no text, letters, numbers, logos, border, UI, watermark, no people, no bodies, no injured or dead animals. Output exact 320x180 pixels if supported. A covered wooden prairie schooner partly submerged and drifting broadside in a teal frontier river. Canvas canopy and upper wagon boards remain above water, wheels partly hidden under the surface, a few sealed sacks bob alongside. Gentle uneasy comedy: a wagon has discovered it is a poor boat. Reed-lined banks and low amber hills. No cross or grave, no people, no animals, no injury. The wagon must be visibly afloat in midriver, not on shore.

### river-rocks

Final: `public/trail-outcomes/river-rocks.png`.
Source: `exec-70e0096a-0982-4205-854b-4267821d11fe.png`.

Prompt:

> Use case: historical-scene. Asset type: in-game Golden Frog Trail outcome illustration. Create one standalone landscape 16:9 scene in warm 16/32-bit pixel art, authored as a 320 by 180 pixel composition, crisp square pixel clusters and nearest-neighbor edges, constrained 32-color palette of sunset amber, parchment cream, muted purple, teal, slate-blue. Layered foreground/midground/distant silhouettes. Family-facing, gently humorous, nostalgic and humane, never horror or grimdark. 1849 pioneer material culture, wooden prairie schooner with cream canvas where requested, no modern architecture, no text, letters, numbers, logos, border, UI, watermark, no people, no bodies, no injured or dead animals. Output exact 320x180 pixels if supported. A covered wooden prairie schooner stranded on dark rounded rocks in a shallow frontier river. One wooden wheel is visibly broken beside the tilted wagon, several boards displaced, cream canvas still mostly intact, shallow teal water flowing around the rocks. The mishap is serious but survivable; warm amber dusk, reeds and soft violet hills. No grave, no people, no animals, no corpses, no dramatic horror.

## Verification

- `npm test`: PASS, including the three new suites wired into `test:passing` and all existing suites. Targeted art and hook tests also passed after the review fixes.
- `npx tsc --noEmit --incremental false`: PASS. Production builds before and after the review fixes passed their TypeScript stage too.
- `npm run lint`: PASS, 0 errors and 473 warnings.
- `npm run build`: PASS, including the final heir-family and capsize-caption fixes.
- `node --import tsx src/lib/exploreVolcanoEra.test.ts`: PASS, 132 checks, 4 later-era IDs. Explore, canon, ArcadeLevel, and the existing character/wallet/ranch providers have no diff from the base.
- Browser: 16 bounded scenarios passed in Chrome 151.0.7922.71. Nine river cases ran in the webpack development preview on port 3342; five Passing cases ran in production on 3343; two review regressions ran in the rebuilt production preview on 3344. Desktop 1280px and phone 390px coverage includes real town third-drink and wrong-Bridge-answer actions, exact-cause persistence, both markers, all three river scenes, blocked-image fallback, and normal continuation controls.
- Passing tests continued through the heir, title, intro, menu autosave, and a fresh page. Character, farm, town visits, and all wallet values persisted; comparison excludes only the wallet's normal `lastUpdated` write timestamp. A final companion death now keeps the companion's memorial name while preserving the established wagon-leader family heir. Critical caulk art explicitly labels the pictured aftermath, in both UI and saved prose.
- `git diff --check`: PASS. Independent source review found the companion/heir and capsize-caption issues; both were fixed and verified in actual browser interactions.

These tests seed disposable prior campaign saves, including a previous completion milestone. They do not claim a fresh unseeded trail completion or newly earned farm access. Losses still come from real crossing methods and the existing reducer; only the d20 stream is controlled in river fixtures.

Browser evidence: [two representative screenshots](evidence/slice4/README.md). Full JSON and screenshots remain in `artifacts/passing-river-art/browser-river`, `browser-passing`, and `browser-regression`. Run `node --import tsx tools/passingRiverArt.browser.ts all http://127.0.0.1:3344` against a production preview to reproduce all 16 cases. The Chrome executable path is set near the harness launch.

### Existing development-mode limitation

The initial development-mode Passing run found a preexisting RanchProvider StrictMode startup overwrite: its load effect queues the saved farm, while its unguarded save effect writes the initial default state. Production retained the seeded livestock and passed all donor-preservation assertions. `ranchContext.tsx` is unchanged in this slice. Source and failure evidence are preserved in `artifacts/passing-river-art/ranch-development-baseline.txt` and `artifacts/passing-river-art/browser/`. Production mode is required for the donor-preservation browser checks until that separate hydration issue is fixed.

### Next slice

Slice 5 is the PlaceScene modern overlay for West Point and the ranch, using an attributed Maps embed or owned photography. Slice 6 follows with additive walking after Look in Volcano and West Point. Portraits remain slice 8. Keep one slice per PR.
