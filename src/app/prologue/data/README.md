# BOBR Prologue Game Data

Complete data files for the pre-Columbian Prologue game (1000-1400 CE).

## Files Created

### Core Data
- **characters.ts** - 4 playable characters with full definitions, stats, and unique mechanics
  - Erik Thorvaldsson (Norseman, 1000 CE) - Fylgjur Spirit Tracking
  - Soaring Hawk (Native, 1000-1100 CE) - Dream Walking
  - Queen Califia (Chumash, 1200 CE) - Warrior Strategy
  - Yachay Wasi (Incan, 1400 CE) - Quipu-Hieroglyph Cipher

### Location Networks
- **locations/norseman.ts** - 15 locations (L'Anse aux Meadows → Maine → Great Lakes → Cahokia)
- **locations/native.ts** - 12 locations (Cahokia → Sacred Sites → Chaco Canyon)
- **locations/califia.ts** - 12 locations (Channel Islands → California Coast → Great Basin)
- **locations/incan.ts** - 12 locations (Lake Titicaca → Tiwanaku → Nazca → Tenochtitlan)
- **locations/convergence.ts** - 8 locations (Tenochtitlan convergence, all characters)

**Total: 59 unique locations across 5 acts**

### Mystery System
- **clues/artifactTraits.ts** - 14 artifacts with trait-based identification system
  - Material, culture, age, purpose, symbol, provenance traits
  - Artifact matching and anomaly detection functions
- **clues/witnessTypes.ts** - 30+ witness types with reliability/quality ratings
  - Cultural affiliations, biases, special abilities

### Educational Content
- **guide/entries.ts** - 28 AI Guide encyclopedia entries (Douglas Adams style)
  - Gold tier: Verified archaeological facts
  - Silver tier: Scholarly speculation
  - Bronze tier: Fringe theories (Stargate-level fun)
  - Topics: Tenochtitlan, Nazca Lines, Puma Punku, Cahokia, Serpent Mound, etc.

### Meta Systems
- **easterEggs.ts** - 7 Time Echo easter eggs linking Prologue to 1849 game
- **portalNetwork.ts** - 6-node Ancient Portal Network (fast travel system)
  - Serpent Mound (power source), Cahokia (hub), Chaco (waypoint)
  - Channel Islands (gateway), Tiwanaku (anchor), Tenochtitlan (convergence)
- **historicalFacts.ts** - 40+ historical facts in three-tier system
  - Gold: Verified facts, Silver: Speculation, Bronze: Fringe

### Utility
- **index.ts** - Central export module with helper functions

## Statistics

- **Total Lines of Code:** ~4,000
- **Total Locations:** 59
- **Total Characters:** 4
- **Total Artifacts:** 14
- **Total Witness Types:** 30+
- **Total Guide Entries:** 28
- **Total Historical Facts:** 40+
- **Total Easter Eggs:** 7
- **Total Portal Nodes:** 6

## Content Quality

All files contain:
- ✅ Rich, engaging descriptions
- ✅ Historical accuracy with citations
- ✅ Douglas Adams-style humor in guide entries
- ✅ Proper TypeScript types and exports
- ✅ Helper functions for game logic
- ✅ Educational value (three-tier fact system)
- ✅ Easter eggs connecting to main 1849 game

## Usage

```typescript
import {
  PROLOGUE_CHARACTERS,
  getAllLocationsForCharacter,
  PROLOGUE_ARTIFACTS,
  GUIDE_ENTRIES,
  TIME_ECHOES,
} from '@/app/prologue/data'

// Get character data
const erik = PROLOGUE_CHARACTERS.norseman

// Get all locations for a character
const norsemanLocations = getAllLocationsForCharacter('norseman')

// Find artifacts by trait
const norseArtifacts = getArtifactsByTrait('origin_culture', 'norse')

// Get guide entry
const cahokiaEntry = getGuideEntry('cahokia')
```

## Historical Approach

The Prologue balances three information tiers:

1. **Gold (Verified)** - Real archaeological evidence
   - L'Anse aux Meadows Norse settlement
   - Cahokia population and Monks Mound scale
   - Puma Punku precision stonework

2. **Silver (Speculation)** - Reasonable scholarly debate
   - Extent of Norse exploration beyond L'Anse
   - Cahokia-Mesoamerica cultural exchange
   - Trans-Pacific contact (chicken/sweet potato evidence)

3. **Bronze (Fringe/Fun)** - Stargate-level speculation
   - Kensington Runestone authenticity
   - Ancient lost technology theories
   - Portal network sacred geometry

This approach:
- Educates players about real pre-Columbian history
- Acknowledges legitimate archaeological debates
- Has fun with fringe theories while labeling them clearly
- Respects both historical accuracy and game enjoyment

## Design Patterns

Follows existing adventure game patterns from `src/app/adventure/data/`:
- Location network with connections and danger levels
- Witness/NPC types with reliability ratings
- Multi-tier information reveal system
- Artifact trait-based mysteries
- Progressive unlock mechanics

## Next Steps

These data files are ready for:
1. Integration with React contexts (CharacterProvider, LocationProvider, etc.)
2. UI components (map view, artifact examination, guide reader)
3. Game mechanics (travel, investigation, puzzles)
4. Save/load state management
