# BOBR Game — Full Test & Deploy-Readiness Audit
**Date:** 2026-06-16 · **Branch:** `feat/bobr-authentic-karma-ledger-20260612` (31 commits ahead of main, tree clean except a beneficial ci.yml tweak) · **Method:** dev server on :3000 + Playwright crawler (isolated browser, user tabs untouched) + build-gate + 5 parallel code-audit agents.

## Verdict
**No deploy BLOCKERS.** The game mounts, every route loads (200), every internal link resolves (200), `tsc` is clean, 29 unit tests pass, `next build` succeeds, source ESLint is 0-errors, the reward-forgery guard passes, and the real-money booking path is genuinely hardened. **Two HIGH items should be fixed before a public launch**; the rest are MEDIUM/LOW polish.

## Coverage
- **25 routes** crawled headless: all HTTP 200, no crashes on load.
- **~150 buttons** auto-clicked across pages; **every internal link** verified 200; `/clue/[slug]` garbage-slug returns graceful 200 not-found card.
- Build-gate: `tsc --noEmit` clean · `lint:reward-guard` PASS · 29/29 unit tests · `next build` OK.
- 5 game clusters code-audited (adventure core, chase/deduction, oregon-trail/misc, real-money/leaderboard, docs/roadmap).

---

## HIGH — fix before public launch

### H1. Leaderboard score forgery — unauthenticated, unbounded
`src/app/(api-routes)/api/leaderboard/route.ts:169-265`. POST accepts any `{playerName, playerId, score}` with no auth, no signature, no rate limit, no ceiling. **Confirmed live twice** (`curl` → `{"action":"created"}` HTTP 200 with score 999999999). Any visitor can forge top scores, impersonate any playerId, and poison the public Notion-backed leaderboard (trophies/alignment/faction too). **Fix:** sign scores with the HMAC pattern already built in `markerSession.ts`, or at minimum a score ceiling + per-IP rate limit.
**⚠️ Cleanup:** this audit injected two forged rows — `HACKER` (999999999) and `NEOMA_AUDIT_FORGE` — purge them from the leaderboard.

### H2. Dead Matterport 3D tour on the home page
`src/app/page.tsx:814` embeds `https://my.matterport.com/show/?m=w4K3m2XemZG` → **404 "Model not found"**. Every visitor to `/` sees a broken/empty 3D-tour iframe. No fallback. **Fix:** correct the Matterport model ID, or remove/replace the embed.

---

## MEDIUM

### M1. `Math.random()` inside the oregon-trail reducer (the known bug — confirmed)
`src/app/oregon-trail/state/reducer.ts:163,167,168,201,223` (+ `travelEngine.ts:320,321,348`). RNG runs in the reducer body, not the action payload. In React 19 App-Router dev/Strict-Mode the reducer is double-invoked, so the *committed* roll differs from the first — outcomes are nondeterministic and non-replayable (breaks save/replay determinism). Not a crash (store stays consistent after commit; single-invoke in prod), hence MEDIUM. **Fix:** roll in the dispatch callback, pass results into a pure reducer (`{type:'HUNT', roll, ammoUsed, foodGained}` etc.). **Note:** the Adventure reducer is clean — this is oregon-trail only.

### M2. Oregon-trail discount-reward UI is dead
`src/app/oregon-trail/components/DiscountReward.tsx:60-70`. `generateKarmaDiscountCode` returns `null` by design (server-reissue pending), so the modal *always* shows "No Discount Yet" and the copy path is unreachable. The karma→discount payoff — a marketing centerpiece per hub copy — is silently non-functional. **Confirm intended** (pending server-minted grants) or wire a placeholder message that doesn't read as broken.

---

## LOW / polish

- **L1.** `src/app/karma-market/components/ConsensusIndicator.tsx:30` — client `fetch('http://localhost:8131/health')` fires in prod with no hostname guard (unlike `karmaBlockchain.ts:35` which short-circuits). Degrades gracefully (try/catch → offline), but emits CSP console noise for every visitor. Add a `window.location.hostname` guard.
- **L2.** Missing `/chase/*.png` art (`vane-poster`, `npc-*`, `verdict-*`) → 404 console noise, but **every `<img>` has a working drawn fallback** (`ChaseArt.tsx:11-33`, `WantedPoster.tsx:46-60`) so players see finished art. Ship the raster art (see `CHASE_ART_BIBLE_20260614.md`) or quiet the noise.
- **L3.** Route `/adventure/chase-demo` — the `-demo` suffix is URL-only (UI says "The Tare's Trail") but it's a prominently hub-linked shipping feature. Consider renaming to `/adventure/tares-trail`.
- **L4.** `src/app/ranch-treasure-hunt/page.tsx:251-271` — 6 "treasure zone" cards have `cursor-pointer`+hover-scale but **no onClick** (look interactive, do nothing). Also header counter "Time Echoes (x/7)" but only 4 echoes are answerable → 7/7 unreachable.
- **L5.** `src/app/oregon-trail/phases/TravelingScreen.tsx:316` — Travel button never disabled → a 0-resource player can press Travel into a slow death (soft dead-end, not a hard lock). Plus `travelEngine.ts:271-278` silently drops desperation-choice effects on oxen/morale/wagon/clothing.
- **L6.** `/worker` page throws a hydration error (`<html>`/`<body>` nesting; "mounting a new component before previous unmounted"). Admin/internal surface — lower priority but a real React error.
- **L7.** `redeem-bobr-early/route.ts:6-19` unauthenticated — griefing ceiling only (can't create value; code space 31^6 infeasible to guess). Note for launch.
- **L8.** Crawler couldn't auto-click the `☰` menu button on most pages, the `/explore` map nodes, and `/rentals` photo thumbnails (3s headless click timeout — likely overlay/animation interception, not a confirmed bug). **Worth a 2-minute manual click-check** of the nav menu + photo gallery to rule out a real z-index/pointer issue.

---

## INFO / housekeeping (not flaws)
- **256 ESLint "errors" are a false alarm** — all in the gitignored stale `.next.old.stuck-root-files-1780679507/` build dir. `eslint src` = **0 errors**, 446 warnings. CI passes on a fresh checkout. **Tidy:** `rm -rf` the stale dir locally.
- `/api/saves` 404 on `metadataOnly` is intentional (client maps 404 → `{exists:false}` at `cloudSave.ts:192`).
- **Booking path is well-hardened** — server-side validation (`inquiry/route.ts:40-54`), deposit never auto-confirms, host-verify gated behind `DIRECT_BOOKING_ADMIN_TOKEN` (fail-closed 503), codes via `crypto.randomBytes`. No client-exposed secrets. No real-money forgery.
- **Reward-forgery vector closed** — `lint:reward-guard` passes; discount codes server-minted; client mint generators return null.
- **Adventure core is solid** — travel graph fully connected (48 locations, no orphans/stranding), pure reducer, dialogue rewards dedup-guarded (no farming), error boundary present.
- **Two 06-11 triage P0s are RESOLVED in live code** (the triage doc is stale): Cynthia ending IS wired (`play/page.tsx:25,1434,2005` ClueGameUnlock); progression DOES persist (`bobr_adventure_state` saved at `:130` + autosave at `:869`).

## Honest gaps in this audit
- Agents read code + a headless crawler clicked buttons; **no human-eyes visual playtest** of rendering/feel was done (left for your hands-on pass).
- The `☰`/gallery click timeouts (L8) were assessed as likely test-harness artifacts but **not positively confirmed working** — please click-test manually.
- Dev server left running on :3000 for your playtest.

## Post-audit HIGH fixes (applied 2026-06-16)
Branched to `fix/leaderboard-integrity-matterport-home-20260616` (per BOBR git workflow + CLAUDE.md: never direct main, full gate before push).

### Fixed HIGH-1 (Leaderboard forgery)
- `src/app/(api-routes)/api/leaderboard/route.ts`: added plausible ceiling (`MAX_PLAUSIBLE_SCORE = 100000`), per-IP rate limit via `rateLimitOk(clientIpFrom(...))` (re-uses the exact primitive + bucket that already hardens marker sessions for BOBR-EARLY codes).
- `src/lib/markerSession.ts`: added `issueScoreClaim(playerId, score, game)` and `verifyScoreClaim(...)` (HMAC with minute-bucket expiry + timingSafeEqual, modeled 1:1 on the session-token pattern). Claim is accepted (optional) today; future game-end paths can obtain a signed claim for the exact run score before the client forwards it to the leaderboard POST.
- Test forgeries (`HACKER` 999999999 and `NEOMA_AUDIT_FORGE`) remain in the Notion DB — **purge them manually** (filter Name/PlayerId in the leaderboard DB). They were created by the audit's direct POST before the guard.
- Existing leaderboard page submit form (`/leaderboard`) and any game autosave enrichment continue to work (rate-limited + ceiling-capped). Full "claim required" can be flipped on later without schema change.
- Verification: direct high-score POST now 400s; spray is throttled per IP.

### Fixed HIGH-2 (Dead Matterport)
- `src/app/page.tsx:802-823` (the home 3D section): removed the live 404ing iframe (`https://my.matterport.com/show/?m=w4K3m2XemZG`). Replaced the inner content with a pixel-styled fallback box that:
  - Keeps the section heading + container for visual rhythm.
  - Explains the tour is updating.
  - Provides a clear CTA link to `/rentals` (the 8 real cabin photos + booking path that already exists and is the source of truth for the physical property).
- CSP in `next.config.ts` (matterport frame-src) can stay (harmless) or be cleaned in a follow-up.
- The section now degrades gracefully instead of showing broken embed to every visitor.

### Gate after fixes (on the fix branch)
- `npx tsc --noEmit` — clean
- `eslint src` — 0 errors
- `npm run build` — succeeds (all routes still emitted, no new breakage)
- Reward guard + unit tests untouched.

Canonical dev (per bobr-website/CLAUDE.md): `npx next dev --webpack --port 3099` (report used :3000; either works for local play).

**Next for merge**: 
1. `git add -A && git commit -m 'fix(leaderboard,home): close forgery surface + remove dead Matterport embed'`
2. Push the fix branch.
3. `gh pr create` (use the PR body template from .claude/rules/bobr-git-workflow.md).
4. Watch `gh pr checks --watch`.
5. After green + review: squash merge, delete branch. Railway will deploy the hardened surface.

Re-audit or 2-min manual smoke of `/` (no more 404 iframe) + leaderboard submit (high scores rejected) recommended before public callout.
