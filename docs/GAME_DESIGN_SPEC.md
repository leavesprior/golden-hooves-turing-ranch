# BOBR RPG - D&D 3.5 Style Game Design Specification

## Historical Setting: California Gold Rush (1848-1855)

### Primary Location: Tuolumne County, California
- **Columbia** - "Gem of the Southern Mines" - Major mining town
- **Angels Camp** - Famous for Mark Twain's "Jumping Frog" story
- **Jamestown** - Gateway to the Mother Lode
- **Carson Hill** - Site of largest gold nugget found (195 lbs)
- **Volcano** - Historical mining settlement
- **Back of Beyond Ranch** - Fictional homestead destination

### Historical Context
The player begins their journey in 1849, arriving via the California Trail as part of the mass migration known as the "Forty-Niners." The game explores themes of:
- Fortune seeking vs. sustainable living
- Exploitation vs. stewardship of the land
- Individual ambition vs. community building
- Indigenous displacement and its consequences
- The transition from mining to ranching/farming

---

## Character System (D&D 3.5 Adaptation)

### Core Attributes (1-20 scale, start at 10)

| Attribute | Gold Rush Application | Gameplay Effect |
|-----------|----------------------|-----------------|
| **Strength (STR)** | Mining, hauling, physical labor | Mining yield, carrying capacity, combat |
| **Dexterity (DEX)** | Panning technique, riding, shooting | Panning efficiency, mount handling, ranged |
| **Constitution (CON)** | Endurance, disease resistance | HP, stamina, poison/disease saves |
| **Intelligence (INT)** | Geology, languages, business | Claim assessment, NPC dialogue options |
| **Wisdom (WIS)** | Intuition, survival, land reading | Danger sense, finding water/shelter |
| **Charisma (CHA)** | Negotiation, leadership, trust | Prices, NPC attitudes, companion loyalty |

### Derived Stats

```
Hit Points (HP) = 10 + (CON modifier × level)
Stamina = 100 + (CON modifier × 10)
Carrying Capacity = STR × 10 (in lbs)
Gold Dust Capacity = DEX × 5 (in oz)
```

### Attribute Modifiers (D&D 3.5 Standard)
```
Score  Modifier
1      -5
2-3    -4
4-5    -3
6-7    -2
8-9    -1
10-11   0
12-13  +1
14-15  +2
16-17  +3
18-19  +4
20     +5
```

---

## Skills System

### Mining Skills
| Skill | Key Attribute | Description |
|-------|--------------|-------------|
| **Prospecting** | INT | Finding gold deposits, reading terrain |
| **Panning** | DEX | Efficiency at placer mining |
| **Hardrock Mining** | STR | Extracting ore from rock |
| **Assaying** | INT | Evaluating gold quality and value |

### Survival Skills
| Skill | Key Attribute | Description |
|-------|--------------|-------------|
| **Wilderness Survival** | WIS | Finding food, water, shelter |
| **Animal Handling** | CHA | Working with horses, mules, livestock |
| **Navigation** | INT | Trail-finding, map reading |
| **Foraging** | WIS | Finding edible plants, hunting |

### Social Skills
| Skill | Key Attribute | Description |
|-------|--------------|-------------|
| **Diplomacy** | CHA | Negotiating, persuading |
| **Intimidate** | STR/CHA | Threatening, coercing |
| **Gather Information** | CHA | Learning news, rumors |
| **Sense Motive** | WIS | Detecting lies, reading people |

### Trade Skills
| Skill | Key Attribute | Description |
|-------|--------------|-------------|
| **Appraise** | INT | Valuing goods, detecting fraud |
| **Craft (Blacksmithing)** | INT | Making/repairing tools |
| **Craft (Cooking)** | WIS | Preparing food, preserving |
| **Profession (Ranching)** | WIS | Animal husbandry, land management |

### Skill Advancement
- Start with (INT modifier + 4) skill points
- Gain (INT modifier + 2) skill points per level
- Max skill rank = level + 3
- Cross-class skills cost 2 points per rank

---

## Feats & Traits

### Starting Traits (Choose 2)
| Trait | Effect | Prerequisite |
|-------|--------|--------------|
| **Forty-Niner** | +2 Prospecting, start with mining gear | None |
| **Trail Veteran** | +2 Wilderness Survival, resist fatigue | CON 12+ |
| **Silver Tongue** | +2 Diplomacy, better prices | CHA 12+ |
| **Quick Hands** | +2 Panning, faster actions | DEX 12+ |
| **Book Learned** | +2 INT skills, can read/write | INT 12+ |
| **Strong Back** | +50% carrying capacity | STR 14+ |
| **Lucky Strike** | 10% bonus gold from mining | None |
| **Animal Friend** | +2 Animal Handling, mount bonus | WIS 12+ |

### Level-Based Feats (Every 3 levels)

**Level 3 Feats:**
- **Improved Panning**: Double gold from placer mining
- **Keen Eye**: Detect hidden items/passages
- **Hardy**: +20 max HP
- **Haggler**: 15% better buy/sell prices

**Level 6 Feats:**
- **Master Prospector**: Sense gold deposits on map
- **Iron Will**: Resist fear/intimidation
- **Leadership**: Recruit companion NPC
- **Craft Mastery**: Create higher quality items

**Level 9 Feats:**
- **Gold Sense**: Automatically find richest deposits
- **Respected Citizen**: Unlock special dialogues
- **Land Baron**: Purchase property, passive income
- **Legacy**: Unlock epilogue content

---

## Experience & Leveling

### XP Sources
| Activity | XP Reward |
|----------|-----------|
| Complete main quest objective | 500-2000 |
| Complete side quest | 100-500 |
| Discover new location | 50-200 |
| Win dialogue challenge | 25-100 |
| Find gold (per oz) | 5 |
| Collect rare item | 50-150 |
| Help NPC | 25-100 |
| Survive dangerous encounter | 100-300 |

### Level Progression
| Level | XP Required | Total XP | Unlocks |
|-------|-------------|----------|---------|
| 1 | 0 | 0 | Starting abilities |
| 2 | 300 | 300 | +1 attribute point |
| 3 | 600 | 900 | Feat slot |
| 4 | 1000 | 1900 | +1 attribute point |
| 5 | 1500 | 3400 | New area access |
| 6 | 2100 | 5500 | Feat slot |
| 7 | 2800 | 8300 | +1 attribute point |
| 8 | 3600 | 11900 | New area access |
| 9 | 4500 | 16400 | Feat slot |
| 10 | 5500 | 21900 | Epilogue unlock |

---

## Inventory System

### Item Categories
1. **Equipment** - Tools, weapons, clothing
2. **Consumables** - Food, medicine, supplies
3. **Valuables** - Gold, gems, trade goods
4. **Quest Items** - Story-critical items
5. **Documents** - Maps, deeds, letters

### Key Items

**Mining Equipment:**
- Gold Pan (basic) - Standard panning
- Gold Pan (improved) - +25% yield
- Pick (basic) - Can mine soft rock
- Pick (steel) - Can mine hard rock
- Sluice Box - Passive gold generation
- Rocker Cradle - +50% placer yield

**Survival Gear:**
- Bedroll - Rest anywhere
- Canteen - Carry water
- Compass - Reveal map fog
- Lantern - Access dark areas
- Rope (50ft) - Access cliff areas
- Medical Kit - Heal HP

**Trade Goods:**
- General supplies (flour, beans, etc.)
- Luxury items (whiskey, tobacco)
- Equipment for sale

### Item Quality Tiers
- **Worn**: -25% effectiveness
- **Standard**: Normal effectiveness
- **Quality**: +25% effectiveness
- **Masterwork**: +50% effectiveness

---

## Map Progression System

### Area Unlock Requirements

```
Chapter 1: The Trail
├── Starting Camp (Level 1)
├── River Crossing (Requires: Rope OR Diplomacy 3)
└── Volcano Settlement (Requires: Complete river crossing)

Chapter 2: First Stakes
├── Volcano Town (Level 2+)
├── General Store (Always accessible)
├── Mining Claims (Requires: Mining gear + Prospecting 2)
└── Hidden Gulch (Requires: Keen Eye feat OR INT 14+)

Chapter 3: Angels Camp
├── Main Street (Level 3+)
├── Saloon (Always accessible)
├── Assay Office (Requires: Gold to sell)
├── Carson Hill Trail (Requires: STR 12+ OR mount)
└── Secret Mine (Requires: Find map in Chapter 2)

Chapter 4: Building a Life
├── Land Office (Level 5+)
├── Ranch Property (Requires: 500 gold OR Land deed)
├── Neighbor's Farm (Requires: Diplomacy 4)
└── Mountain Pass (Requires: Level 6+ AND survival gear)

Chapter 5: Legacy
├── Established Ranch (Level 7+)
├── Town Council (Requires: Respected Citizen feat)
├── Final Challenge (Level 9+)
└── Epilogue Areas (Level 10, choices matter)
```

### Revisitable Content

Each area gains new content based on:
1. **Player Level** - Higher level = new NPCs, items, challenges
2. **Story Progress** - Events change based on main quest
3. **Skills** - High skills reveal hidden content
4. **Items** - Certain items unlock interactions
5. **Reputation** - NPC attitudes change over time

---

## AI-Driven NPC System

### NPC Memory Structure
```typescript
interface NPCState {
  id: string;
  name: string;
  attitude: number;        // -100 to +100
  trust: number;           // 0 to 100
  memory: {
    interactions: number;
    giftsReceived: string[];
    questsCompleted: string[];
    insults: number;
    helpGiven: number;
  };
  currentMood: 'friendly' | 'neutral' | 'suspicious' | 'hostile';
  knownFacts: string[];    // What NPC knows about player
}
```

### Dynamic Dialogue Generation

NPCs respond based on:
1. **Attitude Score** - Base disposition
2. **Recent Interactions** - Last 3 conversations
3. **Player Stats** - Intimidate vs Diplomacy approach
4. **World State** - Time, weather, events
5. **Player Inventory** - React to visible items

### Dialogue Skill Checks
```
[Diplomacy 4] "Perhaps we could come to an arrangement..."
[Intimidate 3] "You'd better think carefully about your answer."
[Sense Motive 5] (Detect if NPC is lying)
[Intelligence 14+] "The geological formations here suggest..."
```

### NPC Attitude Thresholds
| Attitude | Range | Behavior |
|----------|-------|----------|
| Hostile | -100 to -50 | Refuses interaction, may attack |
| Unfriendly | -49 to -10 | Minimal help, bad prices |
| Neutral | -9 to +9 | Standard responses |
| Friendly | +10 to +49 | Helpful, good prices, hints |
| Allied | +50 to +100 | Special quests, gifts, secrets |

---

## Puzzle Integration

### Puzzle Types by Attribute

**STR Puzzles:**
- Move heavy obstacles
- Force open doors/containers
- Hold back dangers

**DEX Puzzles:**
- Precision timing
- Navigate narrow paths
- Pick locks

**INT Puzzles:**
- Decode messages
- Solve riddles
- Operate machinery

**WIS Puzzles:**
- Track trails
- Predict weather/danger
- Identify safe paths

### Progressive Puzzle Difficulty
- **Chapter 1-2**: Single attribute check
- **Chapter 3-4**: Multiple checks OR item use
- **Chapter 5**: Complex multi-step with skill combinations

---

## Implementation Priority

### Phase 1: Core Systems
1. Implement 6-attribute system in rpgContext
2. Add skill system with advancement
3. Create XP/leveling mechanism
4. Update save/load for new data

### Phase 2: Content Integration
1. Add skill checks to existing dialogues
2. Create area unlock conditions
3. Implement item quality system
4. Add NPC attitude tracking

### Phase 3: AI Enhancement
1. Dynamic dialogue selection
2. NPC memory persistence
3. Context-aware responses
4. Skill check result variations

### Phase 4: Polish
1. Revisitable area new content
2. Level-gated discoveries
3. Feat special abilities
4. Epilogue variations

---

## Technical Notes

### State Structure Addition
```typescript
interface CharacterState {
  // Core attributes
  attributes: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };

  // Derived stats
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;

  // Progression
  level: number;
  xp: number;
  xpToNext: number;

  // Skills (0-20 ranks)
  skills: Record<string, number>;

  // Feats
  traits: string[];
  feats: string[];

  // Inventory enhancement
  equipment: {
    slot: string;
    item: Item | null;
  }[];
}
```

This design maintains the existing game's charm while adding depth through meaningful character progression and player agency.
