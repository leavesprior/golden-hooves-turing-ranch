/**
 * BOBR Ranch Configuration
 *
 * Lords of the Realm II-inspired building and livestock system.
 * Players can build up their ranch at the BOBR destination (West Point).
 */

// Fence Tiers (adapted from Lords II castle progression)
export type FenceTier = 1 | 2 | 3 | 4 | 5;

export interface FenceConfig {
  tier: FenceTier;
  name: string;
  description: string;
  neutralKarmaCost: number;
  goodKarmaRequired: number; // Premium tier requires Good Karma
  maxLivestock: number;
  birthRateMultiplier: number;
  predatorResistance: number; // 0-1, chance to prevent predator attack
  escapeResistance: number; // 0-1, chance to prevent livestock escape
  upgradeTime: number; // Days to build/upgrade
  visualAsset: string; // CSS class or asset reference
}

export const FENCE_TIERS: Record<FenceTier, FenceConfig> = {
  1: {
    tier: 1,
    name: 'Basic Wire Fence',
    description: 'A simple wire fence. Better than nothing, but not by much.',
    neutralKarmaCost: 50,
    goodKarmaRequired: 0,
    maxLivestock: 15,
    birthRateMultiplier: 1.0,
    predatorResistance: 0.3,
    escapeResistance: 0.5,
    upgradeTime: 1,
    visualAsset: 'fence-wire',
  },
  2: {
    tier: 2,
    name: 'Wooden Corral',
    description: 'Sturdy wooden posts and rails. Keeps most critters in.',
    neutralKarmaCost: 150,
    goodKarmaRequired: 0,
    maxLivestock: 30,
    birthRateMultiplier: 1.15,
    predatorResistance: 0.5,
    escapeResistance: 0.7,
    upgradeTime: 3,
    visualAsset: 'fence-wooden',
  },
  3: {
    tier: 3,
    name: 'Rail Fence',
    description: 'Professional split-rail construction. A proper ranch.',
    neutralKarmaCost: 300,
    goodKarmaRequired: 0,
    maxLivestock: 50,
    birthRateMultiplier: 1.25,
    predatorResistance: 0.7,
    escapeResistance: 0.85,
    upgradeTime: 5,
    visualAsset: 'fence-rail',
  },
  4: {
    tier: 4,
    name: 'Stone Fence',
    description: 'Solid stone walls. Built to last generations.',
    neutralKarmaCost: 500,
    goodKarmaRequired: 0,
    maxLivestock: 75,
    birthRateMultiplier: 1.4,
    predatorResistance: 0.85,
    escapeResistance: 0.95,
    upgradeTime: 10,
    visualAsset: 'fence-stone',
  },
  5: {
    tier: 5,
    name: 'Premium Ranch',
    description: 'The finest ranch money can buy. Requires good standing.',
    neutralKarmaCost: 1000,
    goodKarmaRequired: 50, // Requires 50 Good Karma
    maxLivestock: 150,
    birthRateMultiplier: 1.6,
    predatorResistance: 0.95,
    escapeResistance: 0.99,
    upgradeTime: 20,
    visualAsset: 'fence-premium',
  },
};

// Livestock Types
export type LivestockType = 'cattle' | 'chickens' | 'horses' | 'goats';

export interface LivestockConfig {
  type: LivestockType;
  name: string;
  namePlural: string;
  description: string;
  neutralKarmaCost: number;
  foodPerDay: number; // Feed units consumed per day
  produces: LivestockProduct[];
  breedingCycle: number; // Days between potential births
  offspringRange: [number, number]; // Min-max offspring per birth
  slaughterValue: number; // Karma earned from slaughter
  specialBonus?: string; // Special gameplay effect
  emoji: string;
}

export interface LivestockProduct {
  name: string;
  productionRate: number; // Units per day (can be fractional)
  karmaValue: number; // Karma earned per unit sold
}

export const LIVESTOCK_TYPES: Record<LivestockType, LivestockConfig> = {
  cattle: {
    type: 'cattle',
    name: 'Cow',
    namePlural: 'Cattle',
    description: 'Hardy bovines. Produce milk daily, valuable for beef.',
    neutralKarmaCost: 75,
    foodPerDay: 3,
    produces: [
      { name: 'Milk', productionRate: 1, karmaValue: 2 },
    ],
    breedingCycle: 90, // Seasonal breeding
    offspringRange: [1, 1],
    slaughterValue: 50,
    emoji: '🐄',
  },
  chickens: {
    type: 'chickens',
    name: 'Chicken',
    namePlural: 'Chickens',
    description: 'Easy to raise, produce eggs daily, breed quickly.',
    neutralKarmaCost: 10,
    foodPerDay: 0.5,
    produces: [
      { name: 'Eggs', productionRate: 0.7, karmaValue: 1 },
    ],
    breedingCycle: 21,
    offspringRange: [2, 6],
    slaughterValue: 5,
    emoji: '🐔',
  },
  horses: {
    type: 'horses',
    name: 'Horse',
    namePlural: 'Horses',
    description: 'Expensive but grant travel speed bonus. Status symbols.',
    neutralKarmaCost: 200,
    foodPerDay: 4,
    produces: [], // No regular production
    breedingCycle: 120,
    offspringRange: [1, 1],
    slaughterValue: 25, // Low - people don't like horse slaughter
    specialBonus: 'travel_speed_+10%',
    emoji: '🐴',
  },
  goats: {
    type: 'goats',
    name: 'Goat',
    namePlural: 'Goats',
    description: 'Hardy and versatile. Milk daily, cheese weekly.',
    neutralKarmaCost: 40,
    foodPerDay: 1.5,
    produces: [
      { name: 'Goat Milk', productionRate: 0.8, karmaValue: 1 },
      { name: 'Cheese', productionRate: 0.14, karmaValue: 5 }, // ~1/week
    ],
    breedingCycle: 60,
    offspringRange: [1, 3],
    slaughterValue: 20,
    emoji: '🐐',
  },
};

// Feed Types
export type FeedType = 'hay' | 'grain' | 'premium_feed';

export interface FeedConfig {
  type: FeedType;
  name: string;
  description: string;
  neutralKarmaCost: number;
  unitsProvided: number;
  healthBonus: number; // Multiplier to livestock health
  birthBonus: number; // Multiplier to birth rate
}

export const FEED_TYPES: Record<FeedType, FeedConfig> = {
  hay: {
    type: 'hay',
    name: 'Hay',
    description: 'Basic feed. Keeps livestock alive.',
    neutralKarmaCost: 5,
    unitsProvided: 10,
    healthBonus: 1.0,
    birthBonus: 1.0,
  },
  grain: {
    type: 'grain',
    name: 'Grain Mix',
    description: 'Better nutrition. Healthier animals, better breeding.',
    neutralKarmaCost: 15,
    unitsProvided: 10,
    healthBonus: 1.2,
    birthBonus: 1.15,
  },
  premium_feed: {
    type: 'premium_feed',
    name: 'Premium Feed',
    description: 'The best for your animals. Maximum health and breeding.',
    neutralKarmaCost: 30,
    unitsProvided: 10,
    healthBonus: 1.5,
    birthBonus: 1.3,
  },
};

// Seasons
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonConfig {
  name: string;
  daysInSeason: number;
  feedMultiplier: number; // How much more/less feed is consumed
  birthMultiplier: number; // Seasonal breeding adjustment
  predatorRisk: number; // 0-1, higher = more predator attacks
  description: string;
}

export const SEASONS: Record<Season, SeasonConfig> = {
  spring: {
    name: 'Spring',
    daysInSeason: 90,
    feedMultiplier: 1.0,
    birthMultiplier: 1.3, // Peak breeding season
    predatorRisk: 0.15,
    description: 'New life blooms. Prime breeding season.',
  },
  summer: {
    name: 'Summer',
    daysInSeason: 90,
    feedMultiplier: 0.9, // Grazing available
    birthMultiplier: 1.0,
    predatorRisk: 0.1,
    description: 'Warm days. Animals can graze freely.',
  },
  autumn: {
    name: 'Autumn',
    daysInSeason: 90,
    feedMultiplier: 1.1,
    birthMultiplier: 0.8,
    predatorRisk: 0.2, // Predators stocking up
    description: 'Harvest time. Predators grow bold.',
  },
  winter: {
    name: 'Winter',
    daysInSeason: 90,
    feedMultiplier: 1.5, // Need more feed
    birthMultiplier: 0.3, // Very few births
    predatorRisk: 0.25, // Hungry predators
    description: 'Cold and harsh. Extra feed needed.',
  },
};

// Random Events
export interface RanchEvent {
  id: string;
  name: string;
  description: string;
  chance: number; // 0-1 per season
  seasonRestriction?: Season[];
  effect: RanchEventEffect;
}

export interface RanchEventEffect {
  livestockLoss?: {
    type: LivestockType | 'any';
    count: number | 'percentage';
    amount: number;
  };
  livestockGain?: {
    type: LivestockType;
    count: number;
  };
  feedLoss?: number;
  karmaChange?: number;
  fenceDowngrade?: boolean;
  message: string;
}

export const RANCH_EVENTS: RanchEvent[] = [
  {
    id: 'wolf_attack',
    name: 'Wolf Attack',
    description: 'Wolves target your livestock.',
    chance: 0.15,
    seasonRestriction: ['autumn', 'winter'],
    effect: {
      livestockLoss: { type: 'any', count: 'percentage', amount: 10 },
      message: 'Wolves attacked! You lost some livestock.',
    },
  },
  {
    id: 'cattle_rustlers',
    name: 'Cattle Rustlers',
    description: 'Outlaws attempt to steal your cattle.',
    chance: 0.1,
    effect: {
      livestockLoss: { type: 'cattle', count: 1, amount: 2 },
      message: 'Cattle rustlers struck in the night!',
    },
  },
  {
    id: 'stray_found',
    name: 'Stray Animal Found',
    description: 'A lost animal wanders onto your ranch.',
    chance: 0.08,
    effect: {
      livestockGain: { type: 'cattle', count: 1 },
      message: 'A stray animal wandered onto your ranch!',
    },
  },
  {
    id: 'disease_outbreak',
    name: 'Disease Outbreak',
    description: 'Sickness spreads through your livestock.',
    chance: 0.05,
    seasonRestriction: ['spring', 'autumn'],
    effect: {
      livestockLoss: { type: 'any', count: 'percentage', amount: 20 },
      message: 'Disease swept through your ranch. Many animals lost.',
    },
  },
  {
    id: 'bumper_breeding',
    name: 'Bumper Breeding',
    description: 'Exceptional breeding season!',
    chance: 0.1,
    seasonRestriction: ['spring'],
    effect: {
      livestockGain: { type: 'chickens', count: 5 },
      message: 'Exceptional breeding season! Extra chicks hatched.',
    },
  },
  {
    id: 'fence_damage',
    name: 'Storm Damage',
    description: 'A storm damages your fences.',
    chance: 0.08,
    seasonRestriction: ['winter', 'spring'],
    effect: {
      livestockLoss: { type: 'any', count: 'percentage', amount: 5 },
      fenceDowngrade: true,
      message: 'Storm damaged your fences! Some animals escaped.',
    },
  },
];

// Helper Functions
export function getNextFenceTier(currentTier: FenceTier): FenceTier | null {
  if (currentTier >= 5) return null;
  return (currentTier + 1) as FenceTier;
}

export function canAffordFenceUpgrade(
  currentTier: FenceTier,
  neutralKarma: number,
  goodKarma: number
): { canAfford: boolean; reason?: string } {
  const nextTier = getNextFenceTier(currentTier);
  if (!nextTier) return { canAfford: false, reason: 'Already at maximum tier' };

  const config = FENCE_TIERS[nextTier];

  if (neutralKarma < config.neutralKarmaCost) {
    return { canAfford: false, reason: `Need ${config.neutralKarmaCost}🌮 (have ${neutralKarma})` };
  }

  if (goodKarma < config.goodKarmaRequired) {
    return { canAfford: false, reason: `Need ${config.goodKarmaRequired}🍪 Good Karma (have ${goodKarma})` };
  }

  return { canAfford: true };
}

export function calculateDailyFeedNeed(
  livestock: Record<LivestockType, number>,
  season: Season
): number {
  const seasonConfig = SEASONS[season];
  let total = 0;

  for (const [type, count] of Object.entries(livestock)) {
    const config = LIVESTOCK_TYPES[type as LivestockType];
    total += config.foodPerDay * count;
  }

  return Math.ceil(total * seasonConfig.feedMultiplier);
}

export function calculateDailyProduction(
  livestock: Record<LivestockType, number>
): Record<string, { amount: number; value: number }> {
  const production: Record<string, { amount: number; value: number }> = {};

  for (const [type, count] of Object.entries(livestock)) {
    const config = LIVESTOCK_TYPES[type as LivestockType];
    for (const product of config.produces) {
      if (!production[product.name]) {
        production[product.name] = { amount: 0, value: 0 };
      }
      production[product.name].amount += product.productionRate * count;
      production[product.name].value += product.productionRate * count * product.karmaValue;
    }
  }

  return production;
}

export function getTotalLivestockCount(livestock: Record<LivestockType, number>): number {
  return Object.values(livestock).reduce((sum, count) => sum + count, 0);
}

export function getCurrentSeason(dayOfYear: number): Season {
  // Day 1-90: Spring, 91-180: Summer, 181-270: Autumn, 271-360: Winter
  if (dayOfYear <= 90) return 'spring';
  if (dayOfYear <= 180) return 'summer';
  if (dayOfYear <= 270) return 'autumn';
  return 'winter';
}

export function getDayOfYear(gameDay: number): number {
  return ((gameDay - 1) % 360) + 1;
}
