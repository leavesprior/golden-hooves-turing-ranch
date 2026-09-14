# Slice 9: public doors and the local backroom

Base: `ac8381bd9abb9160a0591eb8e204af8bb0f3bf7e` in the isolated
`feat/local-menu-backend-20260913` worktree. This follows the complete
`OC_AGENT_FULL_BRIEF_20260913.md`, especially sections 1, 5, 11, 14 and 19.

The fresh hub now offers **Book | Play the trail**. Its existing town-interest
reading remains available. After the saved trail victory, More retains the
existing modes, their URLs, quest locks and optional house rules. This reuses
`readArcadeAccess`: recognized victory milestones, legacy Gold Country phases,
or distance at least 2000 all still qualify. This is existing local progression,
not authenticated victory, and legacy saves are not rejected. A ranch-house
QR visitor can return to the full Explorer from More without receiving a trail
victory or unlocking other modes. The four existing single-town peeks remain
available without manufacturing QR access. The main site already had only Book
and Play; its phone label now explicitly says Play trail.

No campaign, character, wallet, ranch, settlement, Explorer or save key is added
or renamed. The existing `DONOR_KEYS`, optional Notion saves, S.A.D.D.L.E.,
`ArcadeLevel = 1 | 2 | 3`, earned My Farm control, livestock and local markets are
preserved. No worker identity, river outcome, portrait, game chat, SSH capability,
Supabase dependency or QSD status is changed.

## Explicitly local backend

Bind the server to loopback, for example `--hostname 127.0.0.1`. All backend
switches default off. Server-only configuration:

- `DM_TABLE_ENABLED=true`: enables the local Keeper entrance and grant endpoint.
- `LOCAL_BACKEND_BRIDGE_SECRET`: explicitly configured random secret, at least
  32 characters after trimming (`openssl rand -hex 32` is suitable). No automatic,
  checked-in or client-exposed fallback.
- `WORKER_TIMESHEETS_ENABLED=true`: additionally enables the existing Mike Fisher
  and Danna trackers and their worker API after the Bridge grant.
- `LOCAL_BACKEND_SLIDES_ENABLED=true`: additionally enables the existing slides
  PDF after the Bridge grant.

The route guard accepts exact `localhost`, `127.0.0.1`, or `[::1]` Host values,
with optional valid ports. Public hosts, prefix spoofs and LAN addresses remain
404 even with all flags enabled. It ignores forwarded hosts and `LAN_CANARY`.
NextRequest normalizes loopback URLs to localhost, so the original strictly
validated Host binds the grant origin; the normalized URL must also be loopback
and use the same port.

Protected route classification decodes percent-escaped aliases and normalizes
dot/duplicate-slash segments without rewriting the request. An explicit matcher
also includes encoded paths that would otherwise match the image exclusions;
ordinary image assets retain their prior bypass. This closes an observed Next
static-file bypass where an unsigned encoded slides URL served the PDF even
though its canonical URL was denied. Actual response checks cover these variants
separately from the helper tests; no PDF contents are copied into artifacts.

The existing OTHER_SERIES Keeper collects its four submitted answers through an
optional callback. Ordinary river encounters omit that callback and retain their
existing success, failure and swallow branches. On local success the page sends
the transcript to `POST /api/local-backend/bridge`. The endpoint requires an exact
same Origin, JSON, a bounded 4096-byte body, four bounded nonempty strings, and
valid answers to the fixed server-side OTHER_SERIES list using the existing
`checkBridgeAnswer` and the existing swallow-reversal rule. That rule is now a
shared pure predicate used by both the Keeper and server: an individual
“African?” or “European?” remains a successful reversal, as does the combined
answer. It only applies to the authored swallow question; it cannot replace any
of the earlier answers. The client cannot choose a question set or destination.

Success issues an origin-bound HMAC-SHA256 grant for 260 seconds in an HttpOnly,
SameSite=Strict, host-only cookie. Secure is enabled on HTTPS; local HTTP is
supported. Worker pages, worker APIs and the exact slides PDF require that grant
on direct requests as well as their flags. Missing configuration, changed
signature, changed origin, future issuance and expiration fail closed. Backend
responses are private/no-store. Unrelated Neoma assets and ordinary
`/api/neoma/chat` remain available under their existing behavior.
Unsafe worker methods also require the exact same Origin. SameSite alone is
insufficient for this because localhost ports are same-site. These checks are
tested by invoking middleware, without changing any real payroll rows.

The DM page shows its existing intro only after the server grant succeeds, then
offers only the enabled local tool links. No local backend link is added to
public/farm chrome. Its existing one-tab slot and 4:20 timer remain.

**Boundary:** the questions are known game answers, not passwords or user
authentication. The signed cookie enforces this local progression step; it does
not establish identity, secure a LAN, authorize a public deployment, or replace
operating-system access control. Keep the process bound to loopback. No browser
SSH or other host-management channel is introduced.

## Verification

Run `npm run test:local-backend` with Node 22. The pure boundary suite covers the
host/flag matrix, original-origin binding, malformed/forged/expired grants and
unaffected game paths. The route suite invokes the actual POST handler and
middleware, including direct worker/PDF requests, wrong/empty transcripts,
cross-origin requests, bounded payloads, cookie attributes and missing secret.
The existing Bridge answers suite also remains required.

Actual browser evidence is recorded separately under
`artifacts/local-menu-backend/`; seeded completed saves, where used, represent
prior player progress and are not evidence of newly earning trail completion.
Worker browser checks are read-only and must not record payroll contents or
submit/delete entries. Final build, typecheck, lint and browser status should be
recorded with the tested commit; no later rebase is covered by an older run.

### Verified G checkpoint, 2026-09-13

These results cover the uncommitted G overlay on the base above, before any
integration rebase. Node 22.15.0, Next 16.1.6 normal Turbopack production build,
and fresh Chrome 151.0.7922.71 contexts were used. The preview was bound to
`127.0.0.1:3369`, with all three local flags enabled and a disposable random
secret held only in the server process environment.

- Full `npm test`: PASS, including 305 local route/host checks plus grant
  signature/expiry assertions, the actual POST/middleware suite, and 26 existing
  and shared-reversal Bridge checks.
- Full `npm run lint`: PASS, 0 errors and 470 existing warnings.
- Normal `npm run build`, standalone `npx tsc --noEmit`, and `git diff --check`:
  PASS after the encoded-path fix.
- Production Chrome: 7/7 PASS, with zero page or console errors. Fresh and prior
  completed desktop/390px hubs, actual QR entry, and desktop/390px Keeper flows
  retain the expected links and fit the viewport. Wrong answers do not grant
  access; the actual four-answer success opens the enabled tools. Direct URLs
  reject missing/forged cookies and public Host headers even with a real grant.
  The PDF returns `200 application/pdf` only after the successful local grant.
  All seven donor keys retain their values across the exercised navigation and
  reloads, with zero observed writes during these hub/DM flows. The final desktop
  Keeper uses the existing single “African?” reversal and the phone uses
  “European?”, verifying both receive the promised server grant.
- Raw production HTTP: 90/90 unsigned path/Host cases blocked, plus 3/3 ordinary
  image controls still `200 image/jpeg`. Final responses were 84 plain-text
  404s, 3 HTML 404s for an invalid NUL suffix, and 3 image-optimizer 400s. Nine
  redirect chains end at a denial. The matrix includes encoded letters,
  directories, separators and extensions; dot and duplicate-slash segments;
  repeated encoding; trailing slashes; and `_next/image`.

Final artifacts:

- `artifacts/local-menu-backend/browser-production-final/results.json`
  and its seven desktop/phone screenshots.
- `artifacts/local-menu-backend/paths-production-final/results.json`.
- Historical baseline:
  `artifacts/local-menu-backend/paths-baseline-encoded-paths/results.json` records
  the same 90 cases before the fix: 15 unsigned `200 application/pdf` bypasses.
  Its explicit `baseline_capture` status is not a passing result. Earlier
  browser-only runs did not cover those aliases and do not establish the final
  route boundary.

Reproduce with `node --import tsx tools/localMenuBackend.browser.ts
http://127.0.0.1:3369 production-final` and
`node --import tsx tools/localBackendPaths.http.ts http://127.0.0.1:3369
production-final` after starting the configured loopback preview. The
raw-path harness is strict by default; baseline capture requires both an
explicit `baseline` argument and a `baseline-` label.

Limits: fresh cases mean fresh browser contexts with non-complete donor saves;
completed fixtures represent prior local progress, not a new trail win.
Grant expiry and flag combinations use deterministic unit/route tests; the
browser does not wait through 260 seconds or restart the server for each flag.
Worker checks only read pages/API responses, and no payroll contents, cookie
values, answer transcripts or secrets are recorded. Ordinary chat remains on
its existing route; the browser substitutes a local response and does not test
remote model quality. This checkpoint is not evidence for a later rebase or a
public/LAN deployment.


### Integrated G checkpoint

Verified commit `f63982abdbaefd56c5035acfdfd7b20de526ead5`, one G feature commit
on F `5058e28` (which includes transport E `755aef1`, B place scenes and D walking).
The product tree was clean throughout these runs. This checkpoint supersedes
older G browser evidence for the combined components; it does not retroactively
change the historical encoded-path baseline.

The integration retains the complete package test union, the Keeper's
`CharacterBackground`/`PlayerPortrait` presentation and optional transcript, and
B's exact `frame-src https://www.google.com/maps/embed` public policy. The B
middleware test awaits the async guard inside its existing environment-restoring
try/finally. A real production request with `Host: bobr.example` to the West Point
Explorer returned HTTP 200 with that exact frame-src directive.

- Full `npm test`: PASS, including the local-backend, portrait, transport,
  town-walk, place-scene and existing gameplay suites.
- Normal production `npm run build`, standalone `npx tsc --noEmit`, and diff
  check: PASS. Full lint: PASS, 0 errors and 463 warnings.
- Integrated production menu/backend Chrome: 7/7 PASS, zero page/console errors;
  donor keys retained with zero observed writes during the measured hub/DM flows.
- Integrated raw HTTP: 90/90 unsigned path/Host cases denied, zero bypasses;
  3/3 ordinary image controls return 200.
- Ordinary river Keeper portrait regression: desktop and short phone390 cases
  2/2 PASS, zero runtime/hydration errors. Each case enters the actual Kansas
  Keeper, displays the saved player's portrait, submits a wrong name using the
  real controls, resolves the existing death outcome, reloads Passing, and
  continues as the same family's heir without changing the donor character.
  The short phone dialog actually scrolls 93px to its controls. These cases do
  not inject an answer outcome, change gameplay RNG, or earn a completion flag.

Evidence:

- `artifacts/local-menu-backend/browser-integrated-f63982a/results.json`
- `artifacts/local-menu-backend/paths-integrated-f63982a/results.json`
- `artifacts/player-portraits/browser-integrated-g-f63982a/results.json`, six
  screenshots, and unchanged source-start/source-end hashes.
- `artifacts/local-menu-backend/browser-integrated-f63982a/checks.json` records
  the combined checkpoint and tested source hashes.

The original F browser harness limits its preview ports to 3358/3359. Its
unchanged Bridge scenarios were run from a temporary copy permitting the assigned
G port3369 and resolving the same source imports against G. No scenario fixture,
UI action, assertion or tracked harness was changed. The adapter and its hash
manifest are preserved with the portrait evidence. The process used disposable
server-only local configuration and was stopped after verification. There were
no product edits, commits, rebases or pushes by this verification pass.
