# Oregon Trail → Level 2 Explore: Canonical Coherent Game Plan (v2)

**Date:** 2026-06-16  
**Status:** Authoritative plan incorporating direct refinements and legal cautions.  
**Branch note:** Work only on properly branched changes per BOBR workflow (feat/fix/). First fix the two HIGH launch issues (leaderboard forgery + dead Matterport) before or in parallel with visual work.  
**Owners:** cc_agent (primary logic, state, flow, milestones, integration) + oc_agent (rendering layer, PlaceScene, asset mapping, effects, visual QA).  
**Core principle:** Oregon Trail remains the body of the journey (Level 1 survival). Reaching Gold Country is the unlock/gateway into Level 2 Explore/free-roam on the same land. High-resolution era-aware imagery (old/modern/future) is the visible proof that the land persists across time.

**One critical caution (non-negotiable):** For “modern picture from Google Maps,” the safe path is **not** to scrape or store Google imagery as game art. Use official embeds/APIs with attribution, **or** use owned/licensed photography as the stored high-res backdrop. Google’s current terms restrict extracting, caching, rehosting, and creating derivative content from Maps content. Sources: Google Maps Platform Terms (https://cloud.google.com/maps-platform/terms) and Google Geo Guidelines (https://about.google/brand-resource-center/products-and-services/geo-guidelines/).

---

## How It Renders Now (Observed Architecture)

Current display path (confirmed via direct reads):

**state/action → reducer → phase screen → React DOM/SVG/img/canvas → browser compositor/GPU → screen**

Key confirmed files and lines (using canonical larger-SSD paths for precision):

- Oregon Trail phase switch lives in `/media/granny/larger SSD/bobr-website/src/app/oregon-trail/page.tsx:251` (`renderPhaseContent`).
- The natural handoff to Gold Country happens when distance reaches 2000 in `/media/granny/larger SSD/bobr-website/src/app/oregon-trail/state/travelEngine.ts:293-294`:
  ```ts
  if (newDistance >= 2000) {
    return { ..., phase: 'gold_country_arrival' as GamePhase, ... }
  }
  ```
- Gold Country phases already exist in the state model (`/media/granny/larger SSD/bobr-website/src/app/oregon-trail/state/types.ts:29-33`):
  - `'gold_country_arrival'`
  - `'gold_country_explore'`
  - `'gold_country_location'`
  - `'gold_country_travel'`
- The free-roam transitions are already pure actions in `/media/granny/larger SSD/bobr-website/src/app/oregon-trail/state/goldCountryActions.ts:7+` (`applyEnterGoldCountryExplore`, `applyVisitGoldCountryLocation`, `applyStartGoldCountryTravel`, etc.).
- The image/backdrop system already exists as `/media/granny/larger SSD/bobr-website/src/components/PlaceBackdrop.tsx:3` (keyed to `/public/place-art/*.png`, with explicit comment about historical photo or Google Maps reference + pixel-downscale).

Supporting visuals: `LandmarkScene.tsx` (SVG dioramas + effects), `Graphics64bit.tsx` (time/weather/particles/tier filters), shared `map/*` SVG primitives, `chapterContext.tsx`, `oregonTrailContext.tsx` + reducer, `GoldCountry*` components and phases.

The architecture is already coherent. We formalize and elevate it rather than rewrite.

---

## Coherent Game Plan

1. **Keep Oregon Trail as Level 1**: survival, resources, party health, pace, rations, weather, random events, rivers, towns, scarcity, moral choices. All existing mechanics (reducer purity, karma, narrator, saves, cross-game) stay intact.

2. **Treat reaching Gold Country as the unlock moment, not just “the end.”** At the point in `travelEngine.ts:294` where the game moves to `gold_country_arrival`, that screen must explicitly become the **gateway into Level 2 Explore**. Arrival should surface carried resources/karma/stats and offer a clear “Enter Level 2 Explore” path.

3. **Level 2 must reuse** `gold_country_explore`, `gold_country_location`, and `gold_country_travel` — **not** create a separate gameplay island. The existing map (SVG node interaction) remains the core interaction layer: click nodes, travel between locations, discover, enter locations for investigation.

4. **Add a shared `PlaceScene` layer above `PlaceBackdrop`**. It chooses art by:
   - `era`: 1849, 1883, 1982, present, future
   - `sourceType`: historical_photo, owned_photo, licensed_modern_photo, generated_reconstruction, maps_embed
   - `renderStyle`: old_photo, pixel_downscale, modern_clear, ai_reconstructed, future_overlay

5. **Use high-res images, but keep the game grammar**:
   - Back in time (1849 and earlier eras): old photo, historical illustration, or AI reconstruction based on documented references.
   - Present day: owned/licensed modern photo, ranch photo, or **live Google Maps embed/API surface** (with proper attribution; never scraped/stored derivatives).
   - Future layer: same real place, but with ledger/AI/time-chase overlays (Neoma context, time-echoes, quantum effects).

6. **Google Maps rule (strict)**: Do not scrape or store Google imagery as `/place-art` game assets. Use official Maps embeds/APIs with visible attribution, **or** owned/licensed photos as stored backdrops. This is non-negotiable for legal and governance compliance.

7. **Connect Oregon Trail performance into Explore through cross-game state** (existing `CrossGameStorage` / `crossGameProgression` mechanisms):
   - Survived with good party health → better starting reputation in Level 2.
   - High food/wagon/karma → better Level 2 supplies or starting resources.
   - Reached West Point → unlock ranch treasure hunt / related content.
   - Discovered time echoes → reveal old/future variants of locations (era switching).
   - S.A.D.D.L.E. stats (or equivalent character qualities) → Explorer perks through the existing character-quality bridge.

8. **Build the first vertical slice around one location** (recommended: `bobr_cabin` or `west_point`):
   - Oregon Trail reaches Gold Country (distance >= 2000).
   - Arrival screen shows the player’s carried resources + explicit gateway to Level 2.
   - Player enters Level 2 Explore (reuses existing map).
   - The location screen displays a high-res era-aware backdrop (via the new PlaceScene layer).
   - The map/node interaction remains unchanged.
   - A clue or NPC interaction uses the backdrop as part of the investigation (ties mystery/quest system to visuals).

---

## Implementation Sequence (Follow in Order)

1. **Fix the two HIGH launch issues first**: leaderboard forgery (ceiling + rate limit + claim scaffolding) and dead Matterport embed. (These are blocking public readiness per prior audit.)
2. Add `placeSceneAssets.ts` (or equivalent metadata module) beside `PlaceBackdrop.tsx`. This becomes the single source of truth for era/source/render mappings.
3. Upgrade `PlaceBackdrop` (or introduce `PlaceScene` wrapper) into an era/source-aware renderer. Respect the Google Maps legal rule (embeds or owned/licensed only for modern).
4. Wire `gold_country_arrival` into cross-game milestones and Explorer state (better starting conditions based on trail performance).
5. Add one complete Level 2 location slice (e.g., bobr_cabin or west_point) demonstrating era-aware high-res backdrop + investigation using the backdrop.
6. Expand the asset set location-by-location (prioritize owned/licensed or embed-based for present/future).
7. Verify with screenshots + playthrough:
   - Trail screen (LandmarkScene during travel)
   - Arrival screen (gateway moment)
   - Explore map
   - Location screen (high-res era backdrop in action)
   - Mobile and desktop
   - Cross-game carry-over effects
   - Save/load roundtrip

**Important design point (repeated for emphasis):** Oregon Trail should remain the body of the journey. Level 2 Explore is what naturally happens after arrival. The high-resolution old/modern/future imagery becomes the visible proof that the same land exists across time.

---

## Agent分工 (cc_agent + oc_agent)

- **cc_agent**: State model extensions (if any), reducer/goldCountryActions purity, chapter/arrival gateway logic, cross-game milestone wiring + performance carry-over, save compatibility, full integration of the 8-point plan, narrator/quest ties to era backdrops.
- **oc_agent**: `PlaceScene` / backdrop renderer implementation, asset metadata (`placeSceneAssets`), CSS/SVG layering for different renderStyles, era-aware effects in `Graphics64bit` + `LandmarkScene`, Google Maps embed integration (safe/legal path), visual QA + screenshot verification.

Both must read the key files listed above before coding.

---

## Multi-CLI / Terminal Tab Coordination (New Parallel Workstream)

(The query also requires resolving how all CLIs work directly together.)

Current environment has fragments:
- Session hooks (`tab-signal-stop.sh`, session-inbox, outcome-tracker, etc.).
- `gnome-session` skill for desktop/terminal interaction.
- `delegate-task` skill.
- `huddle` command for consensus.
- Neoma Memory Bridge (ports 8115, etc.) + cli_bus / msgbus for structured envelopes.
- Multiple named agent processes (cc_agent, oc_agent, grok, etc.).

**Proposed clean system (to be formalized in a follow-up doc/skill):**

Name and manage everything as **named Terminal Tabs** (e.g., `tab:cc_agent`, `tab:oc_agent`, `tab:oc_main`, `tab:grok`, `tab:workflow-orchestrator`).

Communication protocol (lightweight + auditable):
- Use Memory Bridge (or cli_dispatch / neoma-msgbus) with `structured_envelope_v1`.
- Standard actions: `send_prompt_to_tab(tabId, prompt, traceId)`, `poll_result(tabId, traceId)`, `broadcast_to_tabs(...)`.
- Every exchange carries `traceId`, `parent_key`, `ternary_conf`, timestamp.
- Results are stored back to MB under a results namespace and can be retrieved/verified by any CLI.

Orderliness & workflow cleanliness:
- Central “workflow bus” namespace in MB (`workflows/`, `terminal_tabs/`, `agent_inboxes/`).
- Each tab registers on start (`register_tab` with capabilities, cwd, pid).
- Workflows are declared as small DAGs or step lists with explicit “input from tab:X”, “wait for output of Y”, “checkpoint”.
- Use existing `huddle` for cross-agent consensus points.
- Visual/tab management: leverage `gnome-session` + ydotool (carefully) or pure CDP/chrome tools when possible; prefer explicit naming over ad-hoc windows.
- Clean handoff: every major step ends with a save to MB + `neoma-narrate` or equivalent self-oversight.
- Tools to build: small orchestrator script (Python/zero-dep or Bun) + new skill `multi-cli-terminal-orchestrator` or enhancement to `delegate-task` + `team-of-agents`.

Immediate next for this workstream (separate from the game visual plan):
- Inventory current running CLIs/tabs and their communication paths (memory bridge namespaces, hooks, tmux/gnome sessions).
- Define the exact envelope schema + tab naming convention.
- Prototype a `send_prompt_to_tab` + `check_output` helper that all agents can call.
- Create the protocol doc + a minimal orchestrator.
- Ensure it composes with existing governance (safe, wise, grounded, no open loops).

This coordination layer will make future multi-agent work (including the Level 2 visual slices) dramatically cleaner and faster.

---

## Next Actions

1. Confirm the two HIGH fixes are in flight or complete (per sequence step 1).
2. Both agents perform the required file reads using the exact larger-SSD paths.
3. Create the `placeSceneAssets.ts` metadata (step 2).
4. Start the `PlaceScene` / era-aware renderer work (step 3), strictly following the Google Maps legal rule.
5. Parallel: Begin the multi-CLI terminal tab coordination protocol (separate tracking).

All changes to bobr-website follow the branch-first + full gate (`tsc --noEmit`, `npm run lint`, `npm run build`) + PR process.

This document is now the canonical reference. Future agents must treat the Google Maps restriction and the “Oregon Trail body → natural Level 2 arrival gateway” framing as load-bearing. 

Update this file (and any companion coordination doc) with status, findings, and screenshots as work proceeds.