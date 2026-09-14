# Slice 6 — walk Volcano and West Point

After opening either town's existing Look view, **Walk the camp** opens a small
local grid. The original paintings, attraction readings, NPC dialogue and
Volcano ASCII interiors remain accessible. Back to Look restores the exterior.
West Point's Today view suspends walking and returns to the same saved position
when 1849 is selected. Other towns keep their existing views.

Both towns have distinct authored 20×11 exteriors and enterable shelters. The
320×176 SVG uses existing warm theme colors and crisp pixel geometry. Props,
water and NPC cells block movement. The player uses arrow/WASD keys on the
focused map or native 44px direction buttons. Clicking the map focuses it;
it does not teleport. Adjacent targets offer explicit Look, Talk, Enter or
Return actions. Merely moving near something does not trigger it.

## Existing systems retained

- `InteractiveTown` supplies the same present-era attraction and NPC allowlists
  used by Look. Activation rechecks both eligibility and physical adjacency.
  Later places and locked secrets cannot be reached through a new grid target.
- Attraction and NPC actions use their existing IDs/callbacks. Re-entering or
  reading a previously visited attraction does not award another XP/journal
  record. Walking itself grants no reward, presence or farming eligibility.
- Optional `townWalks` snapshots live inside `gold_country_explorer_progress`.
  The repaired Explorer accepted-state/save path owns these positions; there is
  no second progression store or provider. Legacy saves without positions keep
  their existing shape until the player moves.
- A versioned snapshot stores town, room, position and the exact exterior
  approach used for an entrance. Enter → immediate reload inside → Return
  restores that approach. Each town keeps its own position. Invalid positions
  recover to a safe spawn without resetting the surrounding campaign.

## Historical limits and art provenance

All four maps carry `fictional: true`, descriptive notes and source-file
references. Their road bends, paths, furniture, shelter placement, plank crossing
and marker arrangement are invented gameplay scenery, not a surveyed 1849 map
or a GPS destination. Existing town identity, attraction IDs and dialogue come
from `townRegistry`, `ExploreClient`, `goldCountryEditorial`, and
`townAsciiInterior`. The 2026-09-13 brief and existing art bible guide the warm
presentation. Code-native SVG was drawn for the map; no external raster artwork,
Google imagery or copyrighted game assets were copied.

Volcano's existing ASCII saloon, gulch and cemetery remain authored readings.
They were not interpreted as universal collision maps: their identical glyphs
can represent different things. West Point uses its own pack-road attraction
and Packer; it does not borrow the ranch as a substitute town.

## Verification

`npm run test:town-walk` checks every target's reachability from spawn, reciprocal
doors, water/prop/NPC/bounds collisions, orthogonal movement, exact current IDs,
and invalid or cross-town snapshot recovery. The existing provider test adds
six walking cases (16 total) for pending moves, immediate flush, separate towns,
room reloads, copied return coordinates and recovery without campaign loss.

`node --import tsx tools/townWalk.browser.ts <base URL> <label>` plans routes from
the pure map and executes them through real keyboard/touch controls. It never
seeds or teleports the walking position. The initial four development cases
passed with 174 actual inputs, including all current actions, blocked cells,
inside-room reload, exact return, repeated visits, original ASCII access,
West Point Today suspension and separate town saves. No page errors occurred.

The initial phone screenshots exposed direction controls below the visible
scroll area after dialogue. The final phone layout uses a 20vh map and caps the
scrollable reading panel at 24vh while walking; desktop and ordinary Look retain
their original reading space. Both strict phone cases passed after this fix:
the map, every 44px direction control and adjacent actions remain visible and
hit-testable after Talk, long exterior readings, room reload and indoor Read.
Those checks use no automatic scrolling to hide clipping. They also repeat 87
actual movement inputs and verify immediate saves before the debounce. Evidence
under ignored `artifacts/town-walk/` retains the original failures and the final
`browser-mobile-layout-fixed/` results.

The final production browser run passed all four scenarios and repeated 174
actual movement inputs. The strict phone checks passed after long readings and
room reloads, and pagehide saves completed 19–39ms after movement, before the
1000ms debounce. No uncaught page errors, console errors or remote reward
requests occurred. Evidence is in `artifacts/town-walk/browser-production/`;
its provenance records feature commit `887dee38` with the reviewed slice 5 base.

Full `npm test`, non-incremental TypeScript and the normal production build
passed. ESLint reported zero errors and 471 existing warnings. The browser
harness SHA-256 is
`7ab6db8f3965991fba9c5c08b610d4b5bcd0913449760d6f6e9eba5a84f3f3e8`.
