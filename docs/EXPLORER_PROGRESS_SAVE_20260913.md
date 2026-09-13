# Explorer progress persistence — 2026-09-13

Looking at a new attraction displayed its detail and updated local karma, but
the save path then restored stale XP, attraction visits, and journal entries.
`saveProgress` selected stored progress whenever the visited-town counts tied.
Revisiting a town before the debounce could also reload that stale snapshot.
This was reproduced while testing slice 5, with the provider unchanged from
main `57d9b94`.

The provider now reads storage once, before its first action or mount effect,
then owns the current accepted snapshot. Every existing state transformer
updates that snapshot synchronously in an action/effect callback and passes a
value to React. Autosave, explicit save, and pagehide flush that snapshot
directly. A child town's layout effect still sees the prior saved campaign;
StrictMode cannot replay storage/reward effects inside a React updater.

Explicit load and reset remain replacements. Favorites can be removed; this is
not an append-only union of every old field. No save keys, reward amounts,
progression gates, remote services, or public testing hooks were added.

## Evidence

`npm run test:explorer-persistence` executes the actual provider callbacks in a
deterministic hook scheduler. It controls pending renders, mount replay, save
debounce and pagehide, and asserts storage/reward calls stay outside render and
React updaters. Ten scenarios cover initial/legacy load, visit persistence,
rapid revisits, pending saves, favorites, explicit load, reset and streak
initialization. It reproduced XP 7 instead of 22 before the fix and passes after.
This scheduler complements the actual React browser checks below.

`node --import tsx tools/explorerPersistence.browser.ts <base URL> <label>` uses
fresh Chrome contexts and prior-save fixtures. All four cases failed before the
patch with saved XP 43 instead of 58, and passed afterward in development.
They exercise actual attraction buttons, repeated visits, next-town links,
Leave town, reload and back navigation. XP progresses 43 → 58 → 73, journal
entries remain unique, and both towns survive. The immediate-exit cases flush
before the 1,000ms debounce: 529ms Leave on phone, 59ms reload, 87ms cross-town.
There were zero browser runtime errors.

The browser preserves seeded favorites and unrelated campaign data. Favorite
add/remove and reset have no reachable public controls in the current Explore
surface, so those mutations are verified by the provider test rather than
invented UI hooks. These fixtures do not claim earned physical presence, a new
trail completion, or remote reward settlement.

Local raw results and screenshots remain under ignored
`artifacts/explorer-progress-save/browser-baseline/` and
`browser-after-development/`.

Final full `npm test`, non-incremental TypeScript, and normal production build
passed. Full lint passed with zero errors and 471 warnings. All four unchanged
production browser cases passed with zero page/console errors and zero reward
requests. Immediate production pagehide occurred at 50ms (Leave on phone), 22ms
(reload), and 46ms (next town), all before the save debounce. Production evidence
is in `artifacts/explorer-progress-save/browser-production/`.
