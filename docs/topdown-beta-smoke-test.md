# Top-Down Beta Smoke Test

Date: 2026-05-08
Scope: `/clue/welcome?visual=topdown`

## Purpose

Verify the BOBR top-down RPG beta as a presentation and interaction layer without changing the current live clue game, QR discovery state, or valuable rewards.

## Start

Run the app on any available local port, then test both routes:

```text
/clue/welcome
/clue/welcome?visual=topdown
```

Use the normal route as the control. The beta route should improve the presentation but not fork the underlying clue game.

## Required Checks

### Hand Checklist

Use this checklist for the 2026-05-14 Phase 0 beta stabilization pass:

- Start from a browser profile with known clue-game progress, or record the current `bobr_game_session` value before testing.
- Open `/clue/welcome` and confirm the standard clue scene appears with no top-down beta UI.
- Open `/clue/welcome?visual=topdown` and confirm the top-down scene appears only on that opt-in URL.
- Move between the normal and beta URLs twice; the discovered-location list, reward code fields, and milestone/progression values must not change.
- In browser storage, confirm the beta route does not write keys beginning with `adventure_`, `bobr_`, `gold_country_`, or `marker_`.
- Confirm QR discovery is unchanged after entering and leaving the beta.
- Confirm reward, discount, and milestone state is unchanged after entering and leaving the beta.
- On desktop `1440x900`, confirm the scene, hotspot labels, player sprite, and side panel do not overlap.
- On mobile `375x812`, confirm the map is visible, tap targets are reachable, and panel text stays inside its containers.
- Save screenshots under `docs/screenshots/topdown-beta-20260514/`.

### Normal Route

- `/clue/welcome` loads without the beta scene.
- Existing clue copy, marker behavior, and route layout still work.
- No new beta-only UI appears on the normal route.

### Beta Route

- `/clue/welcome?visual=topdown` loads the RPG ranch scene.
- Gate, path, terrain tiles, props, guide sprite, player sprite, and hotspots are visible.
- Hotspot selection moves the player sprite to the selected point.
- The guide panel updates to the selected hotspot prompt and response.
- Source layer styling is visible for each active hotspot in the scene data.
- Record Evidence increments only the beta journal counter.

### Desktop View

- Suggested viewport: `1440x1000`.
- Map and side panel are both readable.
- No hotspot, sprite, or panel text overlaps incoherently.
- Buttons are easy to click.

### Mobile View

- Suggested viewport: `390x844`.
- Map remains visible before the panel content.
- Hotspot targets can be tapped.
- Text stays inside panels and buttons.
- Panel content scrolls without blocking the whole scene.

### Safety

- Beta route does not grant QR discovery.
- Beta route does not mint, display, or redeem valuable reward codes.
- Leaving and re-entering beta does not alter normal clue progress.
- Any local journal increment is presentation-only.

## Regression Commands

```text
npm run lint -- src/components/beta/TopDownSceneBeta.tsx src/components/beta/welcomeObservationScene.ts src/components/beta/index.ts src/app/clue/[slug]/page.tsx
npx tsc --noEmit --pretty false
```

## Capture

Save these artifacts when cc_agent has the server running:

- desktop screenshot of `/clue/welcome?visual=topdown`;
- mobile screenshot of `/clue/welcome?visual=topdown`;
- desktop screenshot of `/clue/welcome`;
- console errors or hydration warnings, if any;
- route, port, viewport, and commit/worktree status used for the run.

## Pass Condition

The beta passes only if the RPG scene is playable on desktop and mobile while the normal clue route remains unchanged and no valuable reward/progression state is mutated.

## Verification Run - 2026-05-11

Environment:

- App: Next.js dev server on `http://localhost:3099`.
- Browser: `google-chrome-stable` through `puppeteer-core`.
- Desktop viewport: `1440x1000`.
- Mobile viewport: `390x844`, device scale factor `2`.
- Dev-only `nextjs-portal` was hidden in screenshots so the Next.js dev tools badge did not cover app content.

Static checks:

```text
npm run lint -- src/components/beta/TopDownSceneBeta.tsx src/components/beta/welcomeObservationScene.ts src/components/beta/index.ts src/app/clue/[slug]/page.tsx src/lib/bobrCanon.ts
npx tsc --noEmit --pretty false
```

Results:

- TypeScript passed.
- Focused lint passed with zero errors.
- One existing React warning remains in `src/app/clue/[slug]/page.tsx` for synchronous state updates inside the live clue discovery effect.

Route checks:

```text
curl --max-time 30 -sS -o /tmp/bobr-beta-route.html -w "beta %{http_code} %{size_download}\n" "http://localhost:3099/clue/welcome?visual=topdown"
curl --max-time 30 -sS -o /tmp/bobr-normal-route.html -w "normal %{http_code} %{size_download}\n" "http://localhost:3099/clue/welcome"
```

Results:

- `/clue/welcome?visual=topdown` returned `200`.
- `/clue/welcome` returned `200`.

Browser smoke results:

- Beta desktop loaded with no browser console errors or page errors.
- Beta mobile loaded with no browser console errors or page errors.
- Normal desktop loaded with no browser console errors or page errors.
- Normal mobile loaded with no browser console errors or page errors.
- Hotspot selection moved the player marker to the selected hotspot.
- `Record Evidence` updated only the local beta journal counter and disabled the active evidence button.
- The normal `/clue/welcome` route did not render beta-only UI.
- The beta route did not create `bobr_game_session`, did not add discovered locations, and did not expose reward/redeem/code UI during the smoke pass.

Captured artifacts:

- `/tmp/bobr-browser-results-clean.json`
- `/tmp/bobr-beta-desktop-clean-1440x1000.jpg`
- `/tmp/bobr-beta-mobile-clean-top-390x844.jpg`
- `/tmp/bobr-beta-mobile-clean-panel-390x844.jpg`
- `/tmp/bobr-normal-desktop-clean-1440x1000.jpg`
- `/tmp/bobr-normal-mobile-clean-390x844.jpg`

Current pass status:

- Presentation and interaction pass for the welcome top-down beta.
- Reward/progression safety pass for this smoke run.
- Production build remains a separate gate because earlier build attempts were blocked by the external Google Fonts fetch for `Press Start 2P`.

## Phase 0 Stabilization Run - 2026-05-14

Environment:

- App: Next.js dev server on `http://localhost:3099`.
- Browser: `google-chrome-stable` through `puppeteer-core`.
- Desktop viewport: `1440x900`.
- Mobile viewport: `375x812`, device scale factor `2`.
- Screenshots and machine-readable browser results saved under `docs/screenshots/topdown-beta-20260514/`.

Static checks:

```text
npm run lint
npx tsc --noEmit
```

Results:

- TypeScript passed.
- ESLint passed with existing warnings and zero errors.

Route checks:

- `/clue/welcome?visual=topdown` rendered the top-down scene on desktop and mobile.
- `/clue/welcome` rendered the standard clue route on desktop and mobile.
- Beta route did not show reward or redemption text.
- Normal route remained the QR/progression route and discovered `welcome` for the seeded test session, as expected.

Storage isolation check:

- Before beta entry, the seeded prod-prefixed state contained only `bobr_game_session` with `discoveredLocations: []` and `score: 0`.
- After beta entry and hotspot click, `bobr_game_session` was byte-for-byte unchanged.
- After beta entry and hotspot click, no new keys were written under `adventure_*`, `bobr_*`, `gold_country_*`, or `marker_*`.
- The beta route did not create QR discovery, reward, or milestone deltas in this smoke run.

Captured artifacts:

- `docs/screenshots/topdown-beta-20260514/welcome-topdown-desktop-1440x900.jpg`
- `docs/screenshots/topdown-beta-20260514/welcome-topdown-mobile-375x812.jpg`
- `docs/screenshots/topdown-beta-20260514/welcome-normal-desktop-1440x900.jpg`
- `docs/screenshots/topdown-beta-20260514/welcome-normal-mobile-375x812.jpg`
- `docs/screenshots/topdown-beta-20260514/phase0-browser-smoke-results.json`

Notes:

- A recurring dev-console `[engine] ... NotFound` message appeared in both normal and beta routes, but no page errors were reported and the route UI rendered.

## Second Scene Run - 2026-05-11

Scope:

- Beta route: `/clue/game-room?visual=topdown`
- Control route: `/clue/game-room`
- Scene: House / Built Ranch, implemented as the second opt-in beta lane while the live game-room clue remains unchanged.

Static checks:

```text
npm run lint -- src/components/beta/TopDownSceneBeta.tsx src/components/beta/houseObservationScene.ts src/components/beta/index.ts src/app/clue/[slug]/page.tsx
npx tsc --noEmit --pretty false
```

Results:

- TypeScript passed.
- Focused lint passed with zero errors.
- The same pre-existing React warning remains in `src/app/clue/[slug]/page.tsx`.

Route checks:

- `/clue/game-room?visual=topdown` returned `200`.
- `/clue/game-room` returned `200`.
- `/clue/welcome?visual=topdown` still returned `200` after adding the second beta scene.

Browser smoke results:

- Desktop House beta loaded with no browser console errors or page errors.
- Mobile House beta loaded with no browser console errors or page errors.
- Normal `/clue/game-room` loaded without beta-only UI.
- Hotspot coordinates were adjusted after the first screenshot showed the central labels were too tightly clustered.
- Retest confirmed `Inspect Guest Readiness` became the active hotspot, moved the player marker to `70% / 48%`, and recorded evidence locally.
- Retest confirmed the beta route did not create `bobr_game_session`.

Captured artifacts:

- `/tmp/bobr-house-browser-results-adjusted.json`
- `/tmp/bobr-house-beta-desktop-adjusted-1440x1000.jpg`
- `/tmp/bobr-house-beta-mobile-adjusted-top-390x844.jpg`
- `/tmp/bobr-house-beta-mobile-adjusted-panel-390x844.jpg`
- `/tmp/bobr-game-room-normal-desktop-1440x1000.jpg`
