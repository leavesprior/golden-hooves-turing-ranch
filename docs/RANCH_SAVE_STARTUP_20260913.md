# Ranch save startup — 2026-09-13

Existing `bobr_ranch_state` could be overwritten by the first render's default
ranch before the mount effect's migrated save committed. Development StrictMode
then made the second load observe that emptied farm. This was found during the
slice 4 Passing browser checks, separately from grave/river rendering.

`RanchProvider` now commits storage readiness together with the loaded state.
Both autosave and explicit `saveRanch` calls wait for that readiness. The existing
legacy deep merge and all farm, economy, and unlock operations remain in place.
A missing key permits a normal fresh save. Invalid JSON, non-object records, and
failed storage reads preserve the saved bytes; the existing explicit reset can
start a fresh ranch. This is a startup ordering fix, not a new save schema.

## Browser regression

Run with a disposable local server and installed Chrome:

```sh
node --import tsx tools/ranchPersistence.browser.ts http://127.0.0.1:3350 development
node --import tsx tools/ranchPersistence.browser.ts http://127.0.0.1:3351 production
```

The harness intercepts every ranch storage write before application scripts run.
It mounts the actual provider through Continue, reloads it, and checks every
record, so a transient default write cannot hide behind correct final state.
Cases cover a partial legacy save on desktop and 390px phone, a fresh locked
ranch, malformed JSON, and a denied storage read. The desktop legacy case buys
10 hay through My Farm → Market: feed 17 → 27, neutral wallet 400 → 395, then
checks the purchase survives reload. Livestock, products, soil, parcels, game
day, character, and unrelated wallet values remain intact.

Fixtures represent previously saved campaigns. They do not prove an unseeded
Golden Frog Trail completion, and this patch does not change the existing
compatibility interpretation of completion milestones.

Evidence is written under ignored `artifacts/ranch-save-startup/`. The slice 4
Passing browser harness also checks the third drink, Bridge death, companion
death, reload, and heir continuation with the nonzero ranch retained.

## Verification record

- Development: all five ranch cases and six Passing cases passed.
- Full `npm test`: passed.
- Full lint: zero errors, 473 existing warnings.
- Normal production build and final non-incremental typecheck: passed.
- Production: all five ranch cases passed, including the paid hay purchase and
  reload. Together with development and Passing checks, 16 browser cases passed.

The initial build rejected a worktree-external `node_modules` symlink. A private
copy of the same lockfile's installed dependencies is used for the normal
Turbopack build. A malformed generated development types cache was preserved
under ignored `.next/` before rebuilding; no application types were weakened.
