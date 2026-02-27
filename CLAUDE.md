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

## Current State (2026-02-27)

### Deployed (origin/main @ 6eb6f93)
Everything through deep enrichment + interaction stickiness:
- 10 DOS improvements, cross-game karma, Twain narrator, historical content
- Chapters, towns, journal, visual enhancements
- Interaction depth (DOSMessage typewriter, floating numbers, visual effects)
- 4 new explore towns with map positions

### Pending Deploy (PR #2: deploy/feb27-consolidated-polish)
11 commits, +3200 lines, all gates passing:
- Stackable timed buffs + active effects strip
- Personality-based NPC loyalty system
- Wagon repair, special item effects, oxen in shop
- PipBoy menu wiring, context-aware hints
- Critical audit fixes (shop persistence, camp effects, audio, DiscoveryCard)
- Unified game layer (cross-mode narrator, ShareLegacy, ExplorationMap)
- Bedroom 4->6 fix, DOSMessage lint fix

### Wheelwright Tests
10 BOBR tests in `~/.config/neoma/wheel/tests/bobr.*`:
- `bobr.git.quality-gate` — full build gate (bench tier)
