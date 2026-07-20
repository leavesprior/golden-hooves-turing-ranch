# Bobr Visual64 Build Notes

## Baseline

- Production base: `36730485e8d051853092fb92f8e20602508fc63e`
- Worktree: `/home/granny/bobr-visual64`
- Branch: `feat/bobr-visual64-local`
- Dirty source worktree remains untouched.

## Implemented

- Local campaign ported onto the deployed production base.
- Existing production `/api/llm/generate` security controls preserved.
- Playtest save remains isolated under `bobr_local_campaign_v1`.
- Production progression bridge is explicit and defaults off.
- Visual64 shell is route-scoped so other production routes do not change.
- Production journey continuation reads canonical milestones, Where in Time traits, and Oregon Trail evidence without modifying source saves.
- Volcano now has a versioned device-independent encounter definition with bounded LLM and reward authority.
- Gold Country town placement is projected from the canonical latitude/longitude registry; the playtest no longer uses the world-map artwork.
- Player roles and named Volcano characters use `public/sprites/visual64-character-atlas.png`, a transparent late-32-bit/early-64-bit-style raster atlas.
- The world market now reprices eight commodities on a 15-second pulse and exposes supply, demand, direction, and the factors behind each quote.
- CrossGame karma influences the market through a bounded read-only signal. A verified blockchain/commodity adapter is explicitly marked `Resolve Later`.
- Free-form NPC questions use the guarded `/api/llm/generate` route and local Ollama when available. The 30-second provider timeout accommodates local model cold starts; failed generation is labeled as a finite authored fallback.

## Validation ledger

- `npm test`: green, including production suites, local campaign, and bridge safety.
- Changed-file ESLint: green for the Visual64 campaign, map, market signal, and LLM routes.
- `npx tsc --noEmit`: green.
- `npm run build`: green; 57 routes generated and `/playtest` included.
- Browser desktop, 1440x1000: golden path reached Volcano and the future finale; no console errors or horizontal overflow; raster atlas loaded.
- Browser mobile, 390x844: same full path and checks green; raster atlas loaded.
- Both viewports staged six figures in Volcano, retained six casebook entries and five good karma, and wrote zero Visual64 events into production progression while isolated mode was active.
- Both viewports verified seven projected Gold Country towns, eight market commodities, market repricing, and the explicit chain-adapter `Resolve Later` state.
- Screenshots: `artifacts/visual64-desktop.png` and `artifacts/visual64-mobile.png`.
- Production-continuation browser path: resumes at `arrival`, imports three evidence entries, preserves zero good karma and all neutral currency, and leaves canonical milestones/events unchanged.
- Production-continuation screenshot: `artifacts/visual64-production-continuation.png`.
- Local server: `http://127.0.0.1:3102/playtest`.
- Known environment issue resolved: Turbopack rejects a dependency symlink outside the worktree root, so this worktree uses a local `node_modules` copy.

## Agent work

- cc_agent architecture/regression review: `task_1783794330_90376`
- Grok art-direction/immersion review: `grok_20260711-112532-93356`
- Durable cc_agent lifecycle review: `task_1783797771_2256710`
- Focused cc_agent correction review: `task_1783883487_2686093`
- Focused Grok correction review: `grok_20260712-121127-2686094`
- As of 2026-07-12, no delegated review had returned completed findings. Grok remained pending; the focused cc task reported `unknown`.

## Next expansion order

1. Production journey adapters for Where in Time and Oregon Trail outcomes.
2. Remaining chapter scene adapters.
3. Town-specific asset coverage gaps and individually art-directed character portraits.
4. Verified commodity-oracle and karma-chain adapter.
5. Field-pilot trigger clients for the existing device-independent encounter schema.

## Gameplay elevation wave — 2026-07-13 (cc_agent/Neoma, hub)

Raised the local campaign toward the long-strived gameplay standard (choices-matter, Carmen deduction, survivable peril, repairable karma, time pressure). Engine stays a pure deterministic reducer; all authority bounds unchanged.

- **Deduction:** Volcano choices are now investigations (45 min each; first 2 free, further ones spend a lead; party members' approaches available — companions carry knowledge). New ACCUSE step with 3 suspects; verdict strength scales with evidence gathered. Carmen rule enforced: a wrong accusation costs 30 min + trust + bad karma and clears that suspect — the case stays open, never the trail.
- **Repairable karma:** MAKE_AMENDS after a wrong accusation (−2 supplies, +60 min, +8 trust, once). The bad mark stays on the ledger; unamended harm mechanically drags the final trust verdict (−3/badKarma) — karma reads back both ways.
- **Peril:** deterministic travel events (seed/mode/weather/rush) with two counterplay options each; `rush` on the trail guarantees road_agents ahead. Survivable by design: supply shortfall converts to time, never failure; slower options yield a lead.
- **Trail echoes (structural):** fair_trade shortens travel 15%; stop_thieves makes help_stage_manager low-risk with a warmer clue; rush makes the witness skittish.
- **Curtain deadline:** 7:00 PM day 1; resolving before/after changes verdict trust (+4) and scene copy. CurtainClock UI in Volcano.
- **Ceremony:** ResolvedView names exactly what the verdict changed (evidence weight, curtain outcome, trust, amends state).
- **Save:** LOCAL_CAMPAIGN_VERSION 1→2 — old isolated playtest saves reset cleanly on load (by design; production saves untouched). accuse_miner removed from the encounter action schema (accusation is a deduction step now).

Validation: full `npm test` GREEN (campaign suite rewritten to the deduction flow + new coverage for peril determinism/survivability, accusation gating, amends, bidirectional karma, echoes, curtain arithmetic, v1-save normalization). `npx tsc --noEmit` GREEN. ESLint changed files: 0 errors. Browser golden path via Playwright on :3102: setup→test-jump→investigate×2→accuse(vane_method)→resolved; ceremony panel rendered; trust math verified on-screen (62/100 = 30+32 exact); zero console errors.

Files: src/lib/bobrLocalCampaign.ts · src/lib/bobrLocalCampaign.test.ts · src/lib/bobrEncounter.ts · src/components/playtest/BobrLocalCampaign.tsx (left uncommitted alongside the worktree's in-flight state; hub integrates on Leif's go).

## Home + Hub facelift, retreat link paused — 2026-07-13 (cc_agent/Neoma)
- Home hero: retreat (A/B) booking button HIDDEN behind `NEXT_PUBLIC_RETREAT_LIVE==='1'` (one env flip restores it); primary CTA now "Book Your Stay · Sleeps 12" → `airbnb.com/h/backofbeyondranch` (verified live 302 → rooms/30045739 = ACTIVE listing); "Two ways to stay" chip → single-stay copy; fixed "10 Acres" → "60 Acres" (site-wide 60 per 88d5e01).
- Hub: visual64 treatment — welcome_gate.png header w/ gold top bar + cyan eyebrow, deep dark palette replacing flat amber, journey strip rebuilt as the one-game ladder cards (Prologue → Where in Time → Journey 1849 → **Gold Country: Volcano (/playtest)** → Tare's Trail). Rope-bridge easter egg untouched.
- Verified: tsc GREEN, eslint 0 errors, hydrated-DOM checks via Playwright (retreat text/id = 0 occurrences; only /h/backofbeyondranch hrefs; new copy present; hub ladder renders; 0 console errors). NOTE: home/hub bodies are client-rendered — static-HTML checks are NOT valid evidence for these pages.

## Hub facelift v2 — Leif's correction applied (2026-07-13)
Leif: "improve" = elevate the 8-bit-era parts to the visual64 standard while KEEPING the beloved real-ranch imagery; the improved copy absorbs the whole old game (original untouched). Redo:
- Header backdrop → REAL ranch photo (/cabin-photos/cabin-1.jpg), visual64 framing.
- Emoji/CSS diorama REPLACED by the "one land, two renderings" band: real cabin photo beside place-art/bobr_cabin.png, rope-bridge easter egg PRESERVED on the seam (still → /neoma).
- GameCards: visual64 panels fronted by real place-art per game (9 cards mapped); locked = desaturated.
- All remaining amber-era panels (sidebar/quiz/discount/CTA bar) → visual64 style.
- Verified: tsc GREEN, lint 0 errors, screenshot-confirmed live on :3102 (first screenshot caught a stale compile — re-verified fresh).
STANDING DIRECTIVE (Leif): absorb ENTIRE old game (oregon-trail, adventure, prologue, explore, etc.) into the improved copy at this standard — logical menu, one consistent theme, no 8-bit leftovers. Original build never modified. Next targets: oregon-trail play surface, prologue, explore.
