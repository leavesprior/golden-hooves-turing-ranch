# Player background portraits — slice 8, 2026-09-13

Seven fictional adult faces now follow the existing player background in character creation, the S.A.D.D.L.E. sheet, the trail Bridge encounter and Passing. There is no new identity, stat, background, save key or portrait-choice state. The investigator remains `pinkerton_veteran`; all seven existing bonus tables stay unchanged. The named-NPC portrait map and the child Coconut Run captain are untouched.

## Assets and provenance

| Existing background ID | Atlas column, row (zero-based) | Export |
| --- | --- | --- |
| pinkerton_veteran | 0, 0 | /sprites/player-backgrounds/pinkerton_veteran.png |
| frontier_scout | 1, 0 | /sprites/player-backgrounds/frontier_scout.png |
| army_officer | 2, 0 | /sprites/player-backgrounds/army_officer.png |
| gambler | 3, 0 | /sprites/player-backgrounds/gambler.png |
| doctor | 0, 1 | /sprites/player-backgrounds/doctor.png |
| preacher | 1, 1 | /sprites/player-backgrounds/preacher.png |
| outlaw_reformed | 2, 1 | /sprites/player-backgrounds/outlaw_reformed.png |

The text-only source was generated once using built-in `image_gen.imagegen` on 2026-09-13, with no reference images or reused NPC art. Original preserved at:

`/home/granny/.codex/generated_images/01a092a3-91af-7282-a2d2-5db38f58deb1/exec-3a9ed06f-a257-4996-82ca-14abb80ba884.png`

A workspace copy, exact prompt and detailed manifest remain under:

`/home/granny/neoma-grok-workspace/artifacts/portrait-atlas-20260913/`

Source PNG: 1536 × 1024 RGBA; SHA-256 `c0ab0610b2393c9907aafbe4cea32c10a3b00060caa258ad1ea98574ee09b26a`. Each source cell is 384 × 512. The integration exports crop those exact cells and resize to **96 × 128 using nearest-neighbor**, followed by indexed PNG encoding with at most 64 colors (root export script: `/tmp/bobr-export-player-portraits.cjs`). These delivered sprites are derived exports, not lossless copies of the larger cell pixels.

The original atlas was visually inspected: seven adult faces in the required order, consistent warm light and framing, no visible text, modern badges, goggles, stethoscope, weapons or named character likenesses. Backgrounds are softly shaded rather than perfectly flat, and the original did not establish a strict logical pixel grid. The final exports intentionally reduce that rendering to a small limited-palette sprite. These are fictional game illustrations with intended period-plausible clothing, not verified 1849 costume plates, historical identities, or assets accompanied by a third-party/public-domain license claim.

## Behavior and identity limits

- `PlayerPortrait` resolves the saved background on each render and sets `imageRendering: 'pixelated'` on the image itself, overriding the shell's descendant smoothing rule. A missing/failed image uses the established role emoji with a useful accessible label. Changing the image source resets a failed-image state.
- Creation retains native buttons and Enter/Space activation, adds the selected-state announcement and visible keyboard focus, and uses compact portraits inside the existing responsive grid. The sheet reads the same saved character.
- The Bridge portrait is an optional prop; the standalone DM-table encounter can continue without a player background. The dialog scrolls within the viewport so the additional portrait does not trap controls below a mobile screen.
- Passing keeps the recorded deceased name, marker, cause and heir behavior. A memorial face is allowed only when an explicit valid passing record uniquely matches a dead leader in the current roster and the saved player/legacy owner. A companion death, duplicate names, missing roster or old save without an explicit passing record gets a **separate labeled family portrait** if the saved player matches the legacy owner. A stale/mismatched player save supplies no face. The portrait on the heir panel is the family owner, not an invented likeness for the new heir.
- A passing record contains a name, not a stable deceased-character ID or a companion portrait. This change does not invent those missing appearances or claim that ambiguous records identify a face.

## Verification

`src/app/oregon-trail/data/playerPortraits.test.ts` covers all seven role assets and PNG dimensions/palettes, unchanged bonus tables, named-NPC separation, complete donor save preservation across all backgrounds, saved-background lookup after JSON reload, useful portrait labels, explicit pixelated rendering, unknown-background fallback, and memorial/family identity cases including duplicate names and stale saves.

Full validation passed on the uncommitted portrait worktree based on `f43a209c9c491fa7423e8f5995873ec5847671eb`:

| Check | Result |
| --- | --- |
| `npm test` (including registered `test:player-portraits`) | PASS |
| `npm run lint` | Exit 0; 471 repository warnings, 0 errors; new portrait files are lint-clean |
| `npx tsc --noEmit --incremental false` | PASS |
| Normal `npm run build` | PASS; build ID `QbnmSvzbYFqR8eBn68-5C` |
| Development browser suite | 14/14 PASS, 30 screenshots |
| Production browser suite on isolated localhost :3359 | 14/14 PASS, 30 screenshots |

The frozen browser harness is `tools/playerPortraits.browser.ts`, SHA-256 `972fb314298d77c5164577f28a54a557fdd6ceb0d777b6287edbf7f11409756d`. It covers all seven actual keyboard/touch selections and bonus displays, each role's creation/save/reload sheet, real Bridge wrong-answer deaths, player versus companion memorial placement, explicit old/duplicate-name terminal fixtures, and blocked-image fallback/recovery. At 390 × 568 the production Bridge dialog scrolled 110 pixels and its controls remained usable. No browser runtime or hydration/render-update errors were observed; source/asset hash maps matched before and after each final run.

Evidence and copied logs are under `artifacts/player-portraits/`: `BROWSER_QA.md`, `VALIDATION.json`, `browser-development-final/`, and `browser-production/`. Production evidence was captured with Chrome 151.0.7922.71. The tests use disposable local-save fixtures and actual UI actions; they do not claim a complete unseeded campaign, earned trail completion, public-host CSP verification, or a deployment. Initial sandbox IPC/build-write restrictions were rerun successfully with the required filesystem/network permission.

## Combined transport verification

On 2026-09-13, the frozen portrait commit `5058e28855b6891e3df05532912e07796ca67db5` was verified on reviewed transport parent `755aef1e7c4904f6140c250e0b17293ea6d17337`, including merged place-scene and town-walk changes. No product source or harness was changed during this run.

Full `npm test`, normal `npm run build`, `tsc --noEmit --incremental false`, and `npm run lint` passed. Lint reported zero errors and 464 warnings. Production build ID: `zgUqzdMMstKpfQhKSUdOO`.

The existing production browser suite passed all **14 scenarios**, producing 30 screenshots with zero runtime or hydration errors. It used actual title Continue, character creation/selection, save/reload, Bridge wrong-answer deaths, Passing and heir controls, plus the existing legacy/ambiguous-save and missing-image cases. These remain disposable prior-save fixtures, not a full unseeded campaign or an earned-completion claim. Public-host CSP and live account APIs were not exercised by this localhost suite.

All 20 harness-tracked source/asset hashes matched before and after; 13 additional integration hashes also remained unchanged (32 unique files after deduplication), including the accepted-state trail provider, wallet, trip actions, save loader and package registration. The production preview on port 3359 was stopped after QA.

[Combined verification and exact source hashes](./PLAYER_PORTRAITS_INTEGRATED_TRANSPORT_VERIFICATION_20260913.json). Raw browser evidence is in `artifacts/player-portraits/browser-integrated-transport/`; copied logs are in `artifacts/player-portraits/integrated-transport-validation/`. This evidence names the tested commits and does not automatically cover a subsequent rebase.

## Exact generation prompt

```text
Use case: historical-scene.
Asset type: one production-ready character portrait sprite atlas for a warm 16/32-bit pixel-art game set in 1849.

Create ONE cohesive sheet with EXACTLY four equal columns and two equal rows, seven distinct adult head-and-shoulder portraits and the bottom-right cell empty. Final canvas should be 1536 by 1024 pixels (3:2); each of the eight cells occupies exactly 384 by 512 pixels with clean straight crop boundaries. Each portrait is designed on a logical 96 by 128 pixel grid, shown at 4x nearest-neighbor scale. No gutters, no outer margin, no panel borders. Every cell has the SAME flat, very dark warm-brown background. No portrait, hair, hat, shoulder, light or shadow crosses a cell boundary. The last cell is only that plain background.

Style: intentional, beautifully crafted crisp pixel art, restrained warm amber/parchment highlights, russet and muted olive clothing, slate/teal and soft purple shadows. Strong clean silhouettes, expressive readable eyes, clustered square pixels, no smooth gradients, no painterly smearing, no photorealism. All seven belong to one artist's consistent set with identical scale, framing, light direction and detail density. Quiet late-afternoon light from upper left. Friendly, dignified, adventurous, family-safe.

Composition within EACH occupied cell: large unobstructed face, head and shoulders only, hat fully inside the frame, eyes around the upper third, chest ending at the lower edge. Leave a small breathing space over hair/hat. Faces need to remain recognizable when used as small game portraits. Subtle three-quarter turn toward the viewer, looking attentive rather than theatrical. All seven people are fictional adults; no real historical likenesses, no existing game characters.

EXACT order, left to right:
TOP ROW cell 1: investigator, an adult woman about thirty, observant steady eyes, chestnut hair gathered back, practical brown wool coat, plain cream shirt and small brown felt hat. Her character suggests patient deduction and a steady hand; not a glamorous modern spy or a named sharpshooter.
TOP ROW cell 2: frontier scout, an adult Black man about forty, weathered kind face, simple broad-brim felt hat, ochre/brown work shirt and modest neckcloth. No feather headdress.
TOP ROW cell 3: army officer, an adult man about forty-five, fair skin, neatly kept dark moustache, simple dark navy nineteenth-century high-collared wool coat with plain brass buttons. Bare head. No medals, modern badges, emblems, lettering or elaborate gold braid.
TOP ROW cell 4: gambler, an adult woman about thirty-five with warm olive skin and dark hair neatly gathered, a restrained wine-colored waistcoat over a cream high-neck shirt, alert amused expression. No modern casino glamour, no cards or text in the picture.
BOTTOM ROW cell 1: doctor, an adult East Asian man about fifty-five, gentle thoughtful face, short graying hair, sober dark-teal/brown frock coat and plain pale shirt. No stethoscope, no medical insignia, no modern equipment.
BOTTOM ROW cell 2: preacher, an adult woman about sixty, dark skin, calm warm expression, simple gray bonnet and charcoal wool shawl over a plain high-neck dress. No modern clerical collar or ornate church costume.
BOTTOM ROW cell 3: reformed outlaw, an adult man about forty, sun-browned skin, short dark beard, worn olive-brown coat and simple russet neckcloth, quiet guarded but humane expression. Bare head, entire face visible. No threatening pose or costume villainy.
BOTTOM ROW cell 4: completely EMPTY flat background, no person, symbol, object, text or decoration.

Period treatment: plausible simple mid-nineteenth-century wool, cotton, linen and felt clothing. These are fictional 1849 player-role avatars, not historical identities. Avoid goggles, steampunk fittings, electric lamps, zippers, modern uniforms, contemporary detective trenchcoats, modern red spy coats, binocular stethoscopes, guns, knives, smoking, blood, children, logos, signatures, watermarks, labels, numerals, text and UI. Keep the exact seven-person order and equal 4-by-2 atlas geometry.
```
