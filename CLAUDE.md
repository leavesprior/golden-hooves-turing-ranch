# BOBR Website — Agent Context

**Live site**: https://backofbeyondranch.farm
**Repo**: github.com/leavesprior/golden-hooves-turing-ranch
**Deploy**: Railway auto-deploys from `origin/main` on push. Never push directly to main — use PRs.

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS, pixel art / retro DOS aesthetic
- Dev: `cd ~/bobr-website && npx next dev --webpack --port 3099`
- Build gate: `npx tsc --noEmit && npm run lint && npm run build`
- Pre-push hook runs full quality gate automatically

## Project Structure

```
src/
  app/
    oregon-trail/     # Prospector's Tale — main trail game
      page.tsx        # Travel/town/camp UI (~2100 lines, core game loop)
      oregonTrailContext.tsx  # Game state, travel, shop, buffs, loyalty
      characterContext.tsx    # Stats, traits, skills, leveling
      karmaWalletContext.tsx  # Karma blockchain integration
      reputationContext.tsx   # Faction reputation system
      mysteryContext.tsx      # Town mysteries, clue collection
      npcContext.tsx          # NPC relationships, disposition
      chapterContext.tsx      # Story chapters, historical content
      narratorContext.tsx     # Cross-mode Twain narrator
      settlementContext.tsx   # Settlement management
      ranchContext.tsx        # Ranch operations
      components/             # TownShop, TownInn, CampMenu, ResearchStation, GameMenu, etc.
      data/                   # encounters, mysteries, chapters, consumableEffects, educationalClues
      lib/                    # audioManager, puzzleGenerator
      phases/                 # CharacterCreation, Investigation, Outfitting, WorldMap, etc.
    adventure/        # RPG Adventure mode
      play/page.tsx   # Adventure gameplay with ExplorationMap
      data/           # locations, quests, discoveries
    explore/          # Open-world exploration
    prologue/         # Character prologues (per-character routes)
    hub/              # Game hub / landing
    neoma/            # Neoma chat interface (dual-mode: Live + Standard)
    karma-market/     # Karma trading
    leaderboard/      # Cross-game leaderboard
    rentals/          # Airbnb rental info (the actual business)
    (api-routes)/api/ # API routes (leaderboard, neoma chat, saves, onboarding)
  components/
    ui/               # DOSMessage, ShareLegacy, DiscoveryCard, PipBoy
    adventure/        # ExplorationMap, ExplorationMapCanvas, LocationView, CampManagement
    karma/            # KarmaToastContainer, KarmaDisplay
    game/             # GameLayout, SaveLoadIntegration
    pixel/            # PixelCharacter, PixelAnimal
    prologue/         # Prologue components
    rpg/              # RPG-specific components
  lib/
    crossGameProgression.ts   # CrossGameStorage — events shared across game modes
    twainCrossMode.ts         # Mark Twain narrator that comments across modes
    crossGameDashboard.ts     # Unified progress dashboard
    saveLoadContext.tsx        # Save/load with Supabase cloud saves
    karmaBlockchain.ts        # Karma blockchain logic
    eventTracker.ts           # Analytics event tracking
```

## Key Patterns

### Context Provider Tree (oregon-trail)
Providers wrap in specific order — changing order breaks state:
`OregonTrailProvider > CharacterProvider > KarmaWalletProvider > ReputationProvider > NarratorProvider > NPCProvider > ChapterProvider > MysteryProvider > SettlementProvider`

### State Persistence
- Game state saves to `localStorage` key `bobr_adventure_state` (adventure) and `golden_frog_local_save` (oregon-trail)
- Cloud saves via Supabase through `saveLoadContext.tsx`
- Cross-game events stored via `CrossGameStorage` in localStorage

### Game Systems (Oregon Trail)
- **Buffs**: Stackable timed effects from inn consumables (`consumableEffects.ts`). Active effects strip shows countdown.
- **NPC Loyalty**: Personality-based modifiers per role (cook values food, mechanic values wagon, etc.)
- **Karma Wallet**: Good/neutral/bad karma tracks player choices. Affects NPC disposition, shop prices, story branches.
- **Mysteries**: Each town has discoverable mysteries with educational clues (research station).
- **Chapters**: 5 historical chapters with location-specific content.
- **Wagon Repair**: `repairWagon()` in context (-1 spare part, +25 condition).

### Cross-Game Layer
- `CrossGameStorage.logEvent()` fires from all game modes — events like `landmark_reached`, `discovery_made`, `greedy_hoarding`
- `twainCrossMode.ts` — Mark Twain narrator that comments on player behavior across modes
- `ShareLegacy` component — shareable legacy card summarizing player journey
- `ExplorationMap` — canvas-rendered map of discovered locations

## Development Rules

1. **Never push directly to main** — Railway auto-deploys. Use feature branches + PRs.
2. **Pre-push hook** runs typecheck + lint + build + route verification. Don't bypass it.
3. **Dev server** must use `--webpack` flag: `npx next dev --webpack --port 3099`
4. **JSX unicode**: Use `{'\u2190'}` not bare `\u2190` — bare renders literal text.
5. **Root ownership**: Claude Code runs as root. Files created will be root-owned. Run `sudo chown -R granny:granny .` if needed before commits.
6. **Lint policy**: 0 errors allowed. Warnings are acceptable (mostly react-hooks/exhaustive-deps).
7. **Branch naming**: `feat/`, `fix/`, `deploy/` prefixes.

## Game Cohesion Contract

**Read before touching any game route** (`/game`, `/clue/*`, `/adventure/*`, `/oregon-trail`, `/prologue`, `/karma-market`, `/clue-game`, `/explore`, `/ranch-treasure-hunt`):
- `~/Documents/BOBR/marketing/BOBR_GAME_CONTINUITY_ARCHITECTURE_20260502.md` — 5 grammars (character / color / UI / sound / world) + 3 cross-game guarantees. New scenes compose from `ClueSceneV2`, route assets through `BACKDROP_BY_SLUG` / `SPRITE_BY_CHARACTER`, and cross-game state goes through `crossGameProgressionContext` (dual-written to legacy localStorage keys).

## Current State (2026-05-03)

### Deployed (origin/main @ 4b9dd33, 2026-05-02)
Recent shipped wave (May 2 session):
- Visual upgrade on `/clue/[slug]` — real-photo backdrops + Tobias portrait + JRPG dialogue UI (`b87e770`)
- Marker-4 early-bird `BOBR-EARLY` direct-booking discount unlock (`8fd6b11`)
- ClueGameUnlock migrated to `ClueSceneV2` — first cross-game cohesion proof (`4b9dd33`)
- Adventure error boundary + `ClueSceneV2` 16:9 + ignore copyrighted music (`eeddd0e`)
- Real property photo gallery + lightbox on `/rentals` (8 photos, `cb9b34d`)
- 8-bug bundle — unlock-path repairs + UX cleanups (`34674d4`)
- Hub: Mystery Game card locked — broken external URL → hidden Easter-egg (`bf0a789`)
- UTM-tag booking links + May availability hero callout (`c9d0033`)
- Acreage corrected to 60 site-wide + Matterport iframe `allow` (`88d5e01`)
- Matterport 3D walkaround on homepage (`ea3b268`)

Earlier baseline still live: 10 DOS improvements, cross-game karma, Twain narrator, historical chapters/towns/journal, stackable timed buffs + active effects strip, personality-based NPC loyalty, wagon repair, ShareLegacy, ExplorationMap.

### Stale branches (do not revive)
- `feat/game-facelift` — DELETED 2026-05-03 (local + origin). Marker-4 + visual upgrade re-coded onto main as `8fd6b11` / `b87e770` / `4b9dd33` / `eeddd0e`.
- `feat/neoma-dual-mode-chat` — has dialogueTrees, dreamingEngine, expanded liveNeomaContext. **Do NOT merge directly** — it's behind main and would delete newer work. Cherry-pick only.

### Open audit findings (2026-05-03)
Navigation bypass audit found gates are client-side only — direct URL typing or localStorage forgery defeats most progression locks (`/prologue/[character]/play`, `/clue-game`, `/adventure/play` ch5, `/ranch-treasure-hunt`, marker-4 `BOBR-EARLY` redemption). No `middleware.ts`, `PixelNavigation` exposes all routes regardless of progress. Tier-1 client-side redirect guards (small patch) and Tier-2 server-side `middleware.ts` + Supabase milestone signing (Grok-before required) both pending greenlight.

### Standing Goal: DECOMPOSE BEFORE NEXT FEATURES
The codebase has drifted from Turing's small machine principle. Before adding new features, decompose:

| File | Lines | Problem | Target |
|------|-------|---------|--------|
| `oregonTrailContext.tsx` | 2336 | 10+ concerns in one context | TravelMachine, ShopMachine, BuffMachine, LoyaltyMachine, WagonMachine, MarketMachine |
| `page.tsx` (oregon-trail) | 2143 | One `TravelScreen` function does everything | TravelView, TownView, CampView, GameOverView, VictoryView (each <300 lines) |
| `crossGameProgression.ts` | 1026 | Event storage + dashboard + tracking in one file | CrossGameEventLog (fire-and-forget) + separate readers |
| Context providers | 9 nested | Fragile ordering, tight coupling | Evaluate which truly need nesting vs independent state |

**Principle**: Each component does one thing, communicates through simple interfaces. Emergence from composition, not monoliths. See MB: `bobr_adventure_overhaul/standing_goal_decomposition`

### Wheelwright Tests
10 BOBR tests in `~/.config/neoma/wheel/tests/bobr.*`:
- `bobr.git.quality-gate` — full build gate (bench tier)
