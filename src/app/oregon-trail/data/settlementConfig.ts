/**
 * Gold Country Settlement Configuration
 *
 * Fallout-inspired endgame settlement building system.
 * Players can purchase high-ticket items and develop property
 * after arriving in Gold Country at 2000 miles.
 */

// ============================================================
// PROPERTY TIERS (mirrors fence tier progression)
// ============================================================

export type PropertyTier = 0 | 1 | 2 | 3 | 4 | 5;

export interface PropertyTierConfig {
  tier: PropertyTier;
  name: string;
  description: string;
  neutralKarmaCost: number;
  goodKarmaRequired: number;
  daysRequired: number;       // Minimum days in settlement to achieve
  reputationRequired: number; // 0-100
  unlocksBuildings: BuildingType[];
  visualAsset: string;
}

export const PROPERTY_TIERS: Record<PropertyTier, PropertyTierConfig> = {
  0: {
    tier: 0,
    name: 'No Property',
    description: 'Living on the trail, no permanent stake in Gold Country.',
    neutralKarmaCost: 0,
    goodKarmaRequired: 0,
    daysRequired: 0,
    reputationRequired: 0,
    unlocksBuildings: [],
    visualAsset: 'property-none',
  },
  1: {
    tier: 1,
    name: 'Staked Claim',
    description: 'A basic plot of land. Your first foothold in the frontier.',
    neutralKarmaCost: 50,
    goodKarmaRequired: 0,
    daysRequired: 1,
    reputationRequired: 0,
    unlocksBuildings: [],
    visualAsset: 'property-claim',
  },
  2: {
    tier: 2,
    name: 'Homestead',
    description: 'A small cabin with fencing. A place to call home.',
    neutralKarmaCost: 200,
    goodKarmaRequired: 10,
    daysRequired: 30,
    reputationRequired: 10,
    unlocksBuildings: ['cabin'],
    visualAsset: 'property-homestead',
  },
  3: {
    tier: 3,
    name: 'Small Ranch',
    description: 'A proper house with barn. Room for livestock and growth.',
    neutralKarmaCost: 500,
    goodKarmaRequired: 25,
    daysRequired: 60,
    reputationRequired: 25,
    unlocksBuildings: ['cabin', 'house', 'barn'],
    visualAsset: 'property-small-ranch',
  },
  4: {
    tier: 4,
    name: 'Established Ranch',
    description: 'Full buildings, workshop, and storehouse. A respected establishment.',
    neutralKarmaCost: 1200,
    goodKarmaRequired: 50,
    daysRequired: 120,
    reputationRequired: 50,
    unlocksBuildings: ['cabin', 'house', 'barn', 'workshop', 'storehouse'],
    visualAsset: 'property-established',
  },
  5: {
    tier: 5,
    name: 'Gold Country Estate',
    description: 'The finest property in the region. A true legend of the frontier.',
    neutralKarmaCost: 3000,
    goodKarmaRequired: 100,
    daysRequired: 365,
    reputationRequired: 95,
    unlocksBuildings: ['cabin', 'house', 'barn', 'workshop', 'storehouse'],
    visualAsset: 'property-estate',
  },
};

// ============================================================
// BUILDINGS
// ============================================================

export type BuildingType = 'cabin' | 'house' | 'barn' | 'workshop' | 'storehouse';

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  description: string;
  neutralKarmaCost: number;
  goodKarmaRequired: number;
  buildDays: number;
  prerequisite?: BuildingType;
  benefits: string[];
  emoji: string;
}

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  cabin: {
    type: 'cabin',
    name: 'Log Cabin',
    description: 'A sturdy one-room cabin. Shelter from the elements.',
    neutralKarmaCost: 100,
    goodKarmaRequired: 0,
    buildDays: 7,
    benefits: ['+10 morale', 'Weather protection'],
    emoji: '🏚️',
  },
  house: {
    type: 'house',
    name: 'Frontier House',
    description: 'A proper two-story house with multiple rooms.',
    neutralKarmaCost: 300,
    goodKarmaRequired: 15,
    buildDays: 14,
    prerequisite: 'cabin',
    benefits: ['+25 morale', 'Guest quarters', 'Required for Family endings'],
    emoji: '🏠',
  },
  barn: {
    type: 'barn',
    name: 'Barn',
    description: 'Storage for feed and shelter for horses and livestock.',
    neutralKarmaCost: 250,
    goodKarmaRequired: 10,
    buildDays: 10,
    benefits: ['Horse storage (max 4)', '+200 feed capacity', 'Livestock shelter'],
    emoji: '🏗️',
  },
  workshop: {
    type: 'workshop',
    name: 'Workshop',
    description: 'Tools and workspace for repairs and crafting.',
    neutralKarmaCost: 200,
    goodKarmaRequired: 5,
    buildDays: 7,
    prerequisite: 'cabin',
    benefits: ['Wagon repair', 'Equipment maintenance', 'Craft ammunition'],
    emoji: '🔧',
  },
  storehouse: {
    type: 'storehouse',
    name: 'Storehouse',
    description: 'Secure storage for goods, supplies, and valuables.',
    neutralKarmaCost: 150,
    goodKarmaRequired: 0,
    buildDays: 5,
    benefits: ['+300 feed/product storage', 'Secure gold storage'],
    emoji: '📦',
  },
};

// ============================================================
// WAGONS
// ============================================================

export type WagonType = 'basic' | 'covered' | 'freight';

export interface WagonConfig {
  type: WagonType;
  name: string;
  description: string;
  neutralKarmaCost: number;
  goodKarmaRequired: number;
  cargoCapacity: number;  // Pounds
  speedMultiplier: number;
  durability: number;     // 0-100 starting condition
  emoji: string;
}

export const WAGONS: Record<WagonType, WagonConfig> = {
  basic: {
    type: 'basic',
    name: 'Basic Wagon',
    description: 'A simple wooden cart. Gets the job done.',
    neutralKarmaCost: 150,
    goodKarmaRequired: 0,
    cargoCapacity: 1000,
    speedMultiplier: 1.0,
    durability: 70,
    emoji: '🛻',
  },
  covered: {
    type: 'covered',
    name: 'Covered Wagon',
    description: 'Canvas-topped prairie schooner. Protection from weather.',
    neutralKarmaCost: 400,
    goodKarmaRequired: 10,
    cargoCapacity: 2000,
    speedMultiplier: 1.1,
    durability: 85,
    emoji: '🚐',
  },
  freight: {
    type: 'freight',
    name: 'Freight Wagon',
    description: 'Heavy-duty hauler. Massive cargo capacity.',
    neutralKarmaCost: 800,
    goodKarmaRequired: 30,
    cargoCapacity: 4000,
    speedMultiplier: 0.9,
    durability: 95,
    emoji: '🚚',
  },
};

// ============================================================
// HORSES
// ============================================================

export interface HorseConfig {
  name: string;
  description: string;
  neutralKarmaCost: number;
  goodKarmaRequired: number;
  feedPerDay: number;
  travelSpeedBonus: number; // Percentage
  maxOwned: number;
  requiresBarn: boolean;
  emoji: string;
}

export const HORSE_CONFIG: HorseConfig = {
  name: 'Draft Horse',
  description: 'Strong and reliable. Essential for ranch work and travel.',
  neutralKarmaCost: 200,
  goodKarmaRequired: 5,
  feedPerDay: 2,
  travelSpeedBonus: 15,
  maxOwned: 4,
  requiresBarn: true,
  emoji: '🐴',
};

// ============================================================
// SADDLES
// ============================================================

export type SaddleType = 'work' | 'silver';

export interface SaddleConfig {
  type: SaddleType;
  name: string;
  description: string;
  neutralKarmaCost: number;
  goodKarmaRequired: number;
  ridingBonus: number;
  prestige: number;
  emoji: string;
}

export const SADDLES: Record<SaddleType, SaddleConfig> = {
  work: {
    type: 'work',
    name: 'Work Saddle',
    description: 'Practical leather saddle for daily use.',
    neutralKarmaCost: 50,
    goodKarmaRequired: 0,
    ridingBonus: 5,
    prestige: 0,
    emoji: '🪑',
  },
  silver: {
    type: 'silver',
    name: 'Silver-Mounted Saddle',
    description: 'Ornate saddle with silver inlay. A mark of success.',
    neutralKarmaCost: 200,
    goodKarmaRequired: 20,
    ridingBonus: 10,
    prestige: 25,
    emoji: '👑',
  },
};

// ============================================================
// RIFLES
// ============================================================

export type RifleType = 'muzzleloader' | 'repeater' | 'sharps';

export interface RifleConfig {
  type: RifleType;
  name: string;
  description: string;
  neutralKarmaCost: number;
  goodKarmaRequired: number;
  huntingMultiplier: number;
  accuracy: number;     // 0-100
  ammoCapacity: number;
  emoji: string;
}

export const RIFLES: Record<RifleType, RifleConfig> = {
  muzzleloader: {
    type: 'muzzleloader',
    name: 'Muzzleloader Rifle',
    description: 'Single-shot percussion rifle. Reliable but slow.',
    neutralKarmaCost: 75,
    goodKarmaRequired: 0,
    huntingMultiplier: 1.2,
    accuracy: 60,
    ammoCapacity: 1,
    emoji: '🔫',
  },
  repeater: {
    type: 'repeater',
    name: 'Henry Repeater',
    description: 'Lever-action rifle. 15-round capacity changes the game.',
    neutralKarmaCost: 250,
    goodKarmaRequired: 15,
    huntingMultiplier: 1.5,
    accuracy: 75,
    ammoCapacity: 15,
    emoji: '🎯',
  },
  sharps: {
    type: 'sharps',
    name: 'Sharps Buffalo Rifle',
    description: 'Long-range precision. Can drop a buffalo at 500 yards.',
    neutralKarmaCost: 500,
    goodKarmaRequired: 30,
    huntingMultiplier: 2.0,
    accuracy: 90,
    ammoCapacity: 1,
    emoji: '🦬',
  },
};

// ============================================================
// MINING CLAIMS
// ============================================================

export interface MiningClaimConfig {
  name: string;
  description: string;
  neutralKarmaCost: number;
  maxOwned: number;
  dailyGoldRange: [number, number]; // Min-max karma per day
  artifactChance: number;           // 0-1, chance to find mystery clue
  workHoursRequired: number;        // Hours per day to work claim
  emoji: string;
}

export const MINING_CLAIM: MiningClaimConfig = {
  name: 'Gold Mining Claim',
  description: 'Registered claim on gold-bearing creek. Work it for daily income.',
  neutralKarmaCost: 100,
  maxOwned: 3,
  dailyGoldRange: [5, 50],
  artifactChance: 0.05,
  workHoursRequired: 4,
  emoji: '⛏️',
};

// ============================================================
// FARMLAND
// ============================================================

export interface FarmlandConfig {
  name: string;
  description: string;
  costPerAcre: number;
  maxAcres: number;
  yieldPerAcre: number; // Karma per season
  workDaysPerAcre: number;
  emoji: string;
}

export const FARMLAND: FarmlandConfig = {
  name: 'Farm Acres',
  description: 'Fertile valley land. Plant crops for seasonal harvest.',
  costPerAcre: 10,
  maxAcres: 100,
  yieldPerAcre: 5,
  workDaysPerAcre: 2,
  emoji: '🌾',
};

// ============================================================
// VICTORY ENDINGS
// ============================================================

export type EndingType =
  | 'departed'
  | 'survivor'
  | 'homesteader'
  | 'rancher'
  | 'prospector'
  | 'tycoon'
  | 'legend'
  | 'detective'
  | 'gambler'
  | 'golden_hooves';

export interface EndingConfig {
  type: EndingType;
  name: string;
  description: string;
  requirements: EndingRequirements;
  badge: string;
  color: string;
  ranchReference?: string;      // How this ending references the real Airbnb ranch
  discountPresentation?: string; // How the discount code is thematically presented
}

export interface EndingRequirements {
  minPropertyTier?: PropertyTier;
  minDays?: number;
  minReputation?: number;
  minNetWorth?: number;
  requiredBuildings?: BuildingType[];
  minLivestock?: number;
  minMiningClaims?: number;
  minGoldMined?: number;
  mysterySolved?: boolean;
  allCasesSolved?: boolean;
  outlawCaught?: boolean;
  minLuck?: number;
  chaotic?: boolean;
  minBusinessTier?: number;
}

export const ENDINGS: Record<EndingType, EndingConfig> = {
  departed: {
    type: 'departed',
    name: 'The Departed',
    description: 'You chose to leave Gold Country and seek fortune elsewhere.',
    requirements: {},
    badge: '🚶',
    color: 'gray',
  },
  survivor: {
    type: 'survivor',
    name: 'Survivor',
    description: 'You survived the journey and made a modest start in Gold Country.',
    requirements: {
      minPropertyTier: 1,
      minDays: 30,
      minReputation: 10,
    },
    badge: '🌟',
    color: 'bronze',
  },
  homesteader: {
    type: 'homesteader',
    name: 'Homesteader',
    description: 'You built a cabin and established yourself in the frontier.',
    requirements: {
      minPropertyTier: 2,
      minDays: 60,
      requiredBuildings: ['cabin'],
    },
    badge: '🏚️',
    color: 'silver',
  },
  rancher: {
    type: 'rancher',
    name: 'The Rancher',
    description: 'Your ranch prospers with livestock and a proper homestead.',
    requirements: {
      minPropertyTier: 3,
      minDays: 90,
      requiredBuildings: ['house', 'barn'],
      minLivestock: 10,
    },
    badge: '🤠',
    color: 'gold',
    ranchReference: 'You can visit what Tobias built at airbnb.com/h/backofbeyondranch',
    discountPresentation: 'property_deed',
  },
  prospector: {
    type: 'prospector',
    name: 'Prospector',
    description: 'You struck it rich in the gold fields!',
    requirements: {
      minMiningClaims: 2,
      minGoldMined: 1000,
    },
    badge: '⛏️',
    color: 'gold',
  },
  tycoon: {
    type: 'tycoon',
    name: 'Tycoon',
    description: 'You built an empire in Gold Country. A true captain of industry.',
    requirements: {
      minPropertyTier: 4,
      minDays: 180,
      minNetWorth: 5000,
      minBusinessTier: 4,
    },
    badge: '💰',
    color: 'platinum',
  },
  legend: {
    type: 'legend',
    name: 'Legend of Gold Country',
    description: 'Your name will echo through history. The ultimate achievement.',
    requirements: {
      minPropertyTier: 5,
      minDays: 365,
      minReputation: 95,
      requiredBuildings: ['house', 'barn', 'workshop', 'storehouse'],
      mysterySolved: true,
      minBusinessTier: 5,
    },
    badge: '👑',
    color: 'legendary',
  },
  detective: {
    type: 'detective',
    name: 'The Detective',
    description: 'Every case solved. Every outlaw identified. The Pinkerton Agency\'s finest.',
    requirements: {
      allCasesSolved: true,
      outlawCaught: true,
    },
    badge: '🔍',
    color: 'silver',
    ranchReference: 'His case files are hidden at the ranch. Can you find them?',
    discountPresentation: 'wanted_poster',
  },
  gambler: {
    type: 'gambler',
    name: 'The Gambler',
    description: 'Fortune favored you at every turn. Chaos was your ally and luck your lover.',
    requirements: {
      minLuck: 12,
      chaotic: true,
    },
    badge: '🎰',
    color: 'gold',
    ranchReference: 'Tobias won the ranch in a card game. Lady Luck still smiles there.',
    discountPresentation: 'winning_hand',
  },
  golden_hooves: {
    type: 'golden_hooves',
    name: 'The Golden Hooves',
    description: 'The real gold was never in the rivers. It\'s in the sunset painting the deer with golden coats.',
    requirements: {
      minPropertyTier: 5,
      minDays: 365,
      minReputation: 95,
      requiredBuildings: ['house', 'barn', 'workshop', 'storehouse'],
      mysterySolved: true,
      allCasesSolved: true,
    },
    badge: '🦌',
    color: 'legendary',
    ranchReference: 'The golden hooves still dance at dusk. See them at Back of Beyond Ranch.',
    discountPresentation: 'treasure_map',
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getNextPropertyTier(currentTier: PropertyTier): PropertyTier | null {
  if (currentTier >= 5) return null;
  return (currentTier + 1) as PropertyTier;
}

export function canAffordPropertyUpgrade(
  currentTier: PropertyTier,
  neutralKarma: number,
  goodKarma: number,
  daysInSettlement: number,
  reputation: number
): { canAfford: boolean; reason?: string } {
  const nextTier = getNextPropertyTier(currentTier);
  if (!nextTier) return { canAfford: false, reason: 'Already at maximum tier' };

  const config = PROPERTY_TIERS[nextTier];

  if (neutralKarma < config.neutralKarmaCost) {
    return { canAfford: false, reason: `Need ${config.neutralKarmaCost}🌮 (have ${neutralKarma})` };
  }

  if (goodKarma < config.goodKarmaRequired) {
    return { canAfford: false, reason: `Need ${config.goodKarmaRequired}🍪 Good Karma (have ${goodKarma})` };
  }

  if (daysInSettlement < config.daysRequired) {
    return { canAfford: false, reason: `Need ${config.daysRequired} days (spent ${daysInSettlement})` };
  }

  if (reputation < config.reputationRequired) {
    return { canAfford: false, reason: `Need ${config.reputationRequired} reputation (have ${reputation})` };
  }

  return { canAfford: true };
}

export function calculateNetWorth(
  neutralKarma: number,
  propertyTier: PropertyTier,
  buildings: BuildingType[],
  horses: number,
  wagon: WagonType | null,
  rifle: RifleType | null,
  saddle: SaddleType | null,
  miningClaims: number,
  farmAcres: number,
  goldMined: number,
  livestockValue: number
): number {
  let total = neutralKarma;

  // Property value
  total += PROPERTY_TIERS[propertyTier].neutralKarmaCost * 0.8;

  // Buildings
  for (const building of buildings) {
    total += BUILDINGS[building].neutralKarmaCost * 0.7;
  }

  // Horses
  total += horses * HORSE_CONFIG.neutralKarmaCost * 0.8;

  // Wagon
  if (wagon) {
    total += WAGONS[wagon].neutralKarmaCost * 0.6;
  }

  // Rifle
  if (rifle) {
    total += RIFLES[rifle].neutralKarmaCost * 0.7;
  }

  // Saddle
  if (saddle) {
    total += SADDLES[saddle].neutralKarmaCost * 0.5;
  }

  // Mining claims
  total += miningClaims * MINING_CLAIM.neutralKarmaCost;

  // Farm acres
  total += farmAcres * FARMLAND.costPerAcre;

  // Gold mined (tracked separately)
  total += goldMined;

  // Livestock from ranch system
  total += livestockValue;

  return Math.floor(total);
}

export function determineEnding(
  propertyTier: PropertyTier,
  daysInSettlement: number,
  reputation: number,
  netWorth: number,
  buildings: BuildingType[],
  totalLivestock: number,
  miningClaims: number,
  goldMined: number,
  mysterySolved: boolean,
  leftSettlement: boolean,
  allCasesSolved: boolean = false,
  outlawCaught: boolean = false,
  luckStat: number = 5,
  isChaotic: boolean = false,
  businessTier: number = 0
): EndingType {
  if (leftSettlement) return 'departed';

  // Check golden_hooves first (highest priority canonical ending)
  const golden = ENDINGS.golden_hooves.requirements;
  if (
    propertyTier >= (golden.minPropertyTier || 0) &&
    daysInSettlement >= (golden.minDays || 0) &&
    reputation >= (golden.minReputation || 0) &&
    golden.requiredBuildings?.every(b => buildings.includes(b)) &&
    businessTier >= (golden.minBusinessTier || 0) &&
    mysterySolved &&
    allCasesSolved
  ) {
    return 'golden_hooves';
  }

  // Check legend
  const legend = ENDINGS.legend.requirements;
  if (
    propertyTier >= (legend.minPropertyTier || 0) &&
    daysInSettlement >= (legend.minDays || 0) &&
    reputation >= (legend.minReputation || 0) &&
    legend.requiredBuildings?.every(b => buildings.includes(b)) &&
    businessTier >= (legend.minBusinessTier || 0) &&
    (!legend.mysterySolved || mysterySolved)
  ) {
    return 'legend';
  }

  // Check detective
  if (allCasesSolved && outlawCaught) {
    return 'detective';
  }

  // Check gambler
  if (luckStat >= 12 && isChaotic) {
    return 'gambler';
  }

  const tycoon = ENDINGS.tycoon.requirements;
  if (
    propertyTier >= (tycoon.minPropertyTier || 0) &&
    daysInSettlement >= (tycoon.minDays || 0) &&
    netWorth >= (tycoon.minNetWorth || 0) &&
    businessTier >= (tycoon.minBusinessTier || 0)
  ) {
    return 'tycoon';
  }

  const prospector = ENDINGS.prospector.requirements;
  if (
    miningClaims >= (prospector.minMiningClaims || 0) &&
    goldMined >= (prospector.minGoldMined || 0)
  ) {
    return 'prospector';
  }

  const rancher = ENDINGS.rancher.requirements;
  if (
    propertyTier >= (rancher.minPropertyTier || 0) &&
    daysInSettlement >= (rancher.minDays || 0) &&
    rancher.requiredBuildings?.every(b => buildings.includes(b)) &&
    totalLivestock >= (rancher.minLivestock || 0)
  ) {
    return 'rancher';
  }

  const homesteader = ENDINGS.homesteader.requirements;
  if (
    propertyTier >= (homesteader.minPropertyTier || 0) &&
    daysInSettlement >= (homesteader.minDays || 0) &&
    homesteader.requiredBuildings?.every(b => buildings.includes(b))
  ) {
    return 'homesteader';
  }

  const survivor = ENDINGS.survivor.requirements;
  if (
    propertyTier >= (survivor.minPropertyTier || 0) &&
    daysInSettlement >= (survivor.minDays || 0) &&
    reputation >= (survivor.minReputation || 0)
  ) {
    return 'survivor';
  }

  return 'departed';
}
