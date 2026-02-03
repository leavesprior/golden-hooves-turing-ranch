/**
 * Static terrain shape data for map SVG rendering.
 * All paths use viewBox coordinates (0-100).
 */

import { type GraphicsTier } from '../../oregonTrailContext'

export type TerrainFeatureType = 'river' | 'mountain_range' | 'desert' | 'forest' | 'grassland' | 'foothill' | 'mine_tailings' | 'canyon'

export interface TerrainFeature {
  id: string
  type: TerrainFeatureType
  d: string  // SVG path data
  patternRef: string  // pattern id from MapSVGDefs
  minTier: GraphicsTier  // minimum tier to show this feature
  opacity?: number
}

export interface PathControlPoint {
  from: string  // location id
  to: string    // location id
  cx1: number   // control point 1 x
  cy1: number   // control point 1 y
  cx2?: number  // control point 2 x (cubic only)
  cy2?: number  // control point 2 y (cubic only)
}

// Tier ordering for comparison
const TIER_ORDER: Record<GraphicsTier, number> = {
  retro_4bit: 0,
  classic_8bit: 1,
  enhanced_16bit: 2,
  modern_32bit: 3,
  ultra_64bit: 4,
}

export function meetsMinTier(current: GraphicsTier, minimum: GraphicsTier): boolean {
  return TIER_ORDER[current] >= TIER_ORDER[minimum]
}

// ============================================
// CHAPTER 1 TERRAIN: Journey West
// ============================================

export const CHAPTER_1_TERRAIN: TerrainFeature[] = [
  // Rivers
  {
    id: 'river-kansas',
    type: 'river',
    d: 'M90,44 Q89,46 88,48 Q87,50 86,52 Q85,53 84,54',
    patternRef: 'pattern-water',
    minTier: 'classic_8bit',
    opacity: 0.8,
  },
  {
    id: 'river-platte',
    type: 'river',
    d: 'M82,44 Q78,43 75,45 Q72,44 68,42 Q65,43 62,42',
    patternRef: 'pattern-water',
    minTier: 'classic_8bit',
    opacity: 0.7,
  },
  {
    id: 'river-humboldt',
    type: 'river',
    d: 'M18,28 Q17,29 15,32 Q14,33 12,35 Q11,37 10,40',
    patternRef: 'pattern-water',
    minTier: 'classic_8bit',
    opacity: 0.6,
  },
  {
    id: 'river-truckee',
    type: 'river',
    d: 'M8,45 Q7,48 6,52 Q6,53 6,55',
    patternRef: 'pattern-water',
    minTier: 'enhanced_16bit',
    opacity: 0.7,
  },
  // Mountain ranges
  {
    id: 'mountains-rockies-main',
    type: 'mountain_range',
    d: 'M45,28 L48,22 L50,26 L53,20 L56,25 L58,19 L60,24 L62,20 L64,28 Q55,30 45,28',
    patternRef: 'pattern-mountains',
    minTier: 'retro_4bit',
  },
  {
    id: 'mountains-rockies-south',
    type: 'mountain_range',
    d: 'M34,26 L36,22 L38,25 L40,20 L42,24 L44,28 Q39,30 34,26',
    patternRef: 'pattern-mountains',
    minTier: 'classic_8bit',
  },
  {
    id: 'mountains-sierra-nevada',
    type: 'mountain_range',
    d: 'M4,38 L6,32 L8,36 L10,30 L12,35 L14,28 L16,34 L18,38 Q11,40 4,38',
    patternRef: 'pattern-mountains',
    minTier: 'retro_4bit',
  },
  {
    id: 'mountains-sierra-south',
    type: 'mountain_range',
    d: 'M4,42 L5,38 L7,40 L9,36 L11,40 L12,42 Q8,44 4,42',
    patternRef: 'pattern-mountains',
    minTier: 'enhanced_16bit',
  },
  // Forty Mile Desert
  {
    id: 'desert-forty-mile',
    type: 'desert',
    d: 'M8,36 Q10,35 13,36 Q14,38 12,40 Q10,42 8,40 Q7,38 8,36',
    patternRef: 'pattern-desert',
    minTier: 'retro_4bit',
    opacity: 0.6,
  },
  {
    id: 'desert-great-basin',
    type: 'desert',
    d: 'M14,30 Q17,28 20,30 Q22,32 20,34 Q17,36 14,34 Q12,32 14,30',
    patternRef: 'pattern-desert',
    minTier: 'classic_8bit',
    opacity: 0.4,
  },
  // Forest clusters
  {
    id: 'forest-missouri',
    type: 'forest',
    d: 'M92,44 Q94,42 96,44 Q98,46 96,48 Q94,50 92,48 Q90,46 92,44',
    patternRef: 'pattern-forest',
    minTier: 'classic_8bit',
    opacity: 0.5,
  },
  {
    id: 'forest-platte-valley',
    type: 'forest',
    d: 'M76,40 Q78,38 80,40 Q82,42 80,44 Q78,45 76,43 Q75,42 76,40',
    patternRef: 'pattern-forest',
    minTier: 'enhanced_16bit',
    opacity: 0.4,
  },
  {
    id: 'forest-sierra-west',
    type: 'forest',
    d: 'M3,48 Q5,46 7,48 Q8,50 7,52 Q5,54 3,52 Q2,50 3,48',
    patternRef: 'pattern-forest',
    minTier: 'classic_8bit',
    opacity: 0.6,
  },
  // Grasslands
  {
    id: 'grass-great-plains',
    type: 'grassland',
    d: 'M65,38 Q72,35 82,38 Q88,40 92,42 Q92,52 88,54 Q80,55 70,52 Q65,48 65,38',
    patternRef: 'pattern-grass',
    minTier: 'enhanced_16bit',
    opacity: 0.25,
  },
  {
    id: 'grass-nebraska',
    type: 'grassland',
    d: 'M68,36 Q73,34 78,36 Q80,38 78,40 Q73,42 68,40 Q66,38 68,36',
    patternRef: 'pattern-grass',
    minTier: 'modern_32bit',
    opacity: 0.2,
  },
  // Additional detail features
  {
    id: 'canyon-south-pass',
    type: 'canyon',
    d: 'M33,30 Q35,28 37,30 L37,34 Q35,36 33,34 Z',
    patternRef: 'pattern-mountains',
    minTier: 'modern_32bit',
    opacity: 0.5,
  },
]

// ============================================
// CHAPTER 2 TERRAIN: Gold Country
// ============================================

export const CHAPTER_2_TERRAIN: TerrainFeature[] = [
  // Mokelumne River
  {
    id: 'river-mokelumne',
    type: 'river',
    d: 'M55,30 Q50,35 45,40 Q40,45 35,50 Q30,52 25,50',
    patternRef: 'pattern-water',
    minTier: 'classic_8bit',
    opacity: 0.7,
  },
  {
    id: 'river-mokelumne-fork',
    type: 'river',
    d: 'M45,40 Q48,42 50,45 Q52,48 55,50',
    patternRef: 'pattern-water',
    minTier: 'enhanced_16bit',
    opacity: 0.5,
  },
  // Foothill ridges
  {
    id: 'foothills-east',
    type: 'foothill',
    d: 'M60,20 L62,16 L65,19 L67,14 L70,18 L72,22 Q66,24 60,20',
    patternRef: 'pattern-mountains',
    minTier: 'classic_8bit',
    opacity: 0.6,
  },
  {
    id: 'foothills-west',
    type: 'foothill',
    d: 'M10,30 L12,26 L14,28 L16,24 L18,27 L20,30 Q15,32 10,30',
    patternRef: 'pattern-mountains',
    minTier: 'classic_8bit',
    opacity: 0.5,
  },
  {
    id: 'foothills-south',
    type: 'foothill',
    d: 'M20,58 L22,54 L25,56 L28,52 L30,55 L32,58 Q26,60 20,58',
    patternRef: 'pattern-mountains',
    minTier: 'enhanced_16bit',
    opacity: 0.5,
  },
  // Forest near Big Trees
  {
    id: 'forest-big-trees',
    type: 'forest',
    d: 'M10,38 Q14,34 18,38 Q20,42 18,46 Q14,50 10,46 Q8,42 10,38',
    patternRef: 'pattern-forest',
    minTier: 'classic_8bit',
    opacity: 0.6,
  },
  {
    id: 'forest-volcano',
    type: 'forest',
    d: 'M52,32 Q55,30 58,32 Q60,34 58,36 Q55,38 52,36 Q50,34 52,32',
    patternRef: 'pattern-forest',
    minTier: 'enhanced_16bit',
    opacity: 0.4,
  },
  // Mine tailings
  {
    id: 'tailings-kennedy',
    type: 'mine_tailings',
    d: 'M68,56 Q70,54 73,56 Q74,58 73,60 Q70,62 68,60 Q66,58 68,56',
    patternRef: 'pattern-mine',
    minTier: 'enhanced_16bit',
    opacity: 0.5,
  },
  {
    id: 'tailings-sandy-gulch',
    type: 'mine_tailings',
    d: 'M56,22 Q58,20 60,22 Q61,24 60,26 Q58,27 56,26 Q55,24 56,22',
    patternRef: 'pattern-mine',
    minTier: 'modern_32bit',
    opacity: 0.4,
  },
  // Canyons
  {
    id: 'canyon-mokelumne',
    type: 'canyon',
    d: 'M38,42 Q40,40 42,42 L42,48 Q40,50 38,48 Z',
    patternRef: 'pattern-mountains',
    minTier: 'modern_32bit',
    opacity: 0.4,
  },
  // Grassland
  {
    id: 'grass-foothills',
    type: 'grassland',
    d: 'M25,35 Q35,30 45,35 Q50,40 45,45 Q35,50 25,45 Q20,40 25,35',
    patternRef: 'pattern-grass',
    minTier: 'enhanced_16bit',
    opacity: 0.2,
  },
]

// ============================================
// PATH CONTROL POINTS: Bezier curves for connections
// ============================================

export const PATH_CONTROL_POINTS: PathControlPoint[] = [
  // Chapter 1: Journey West
  { from: 'independence', to: 'kansas_river', cx1: 92, cy1: 47 },
  { from: 'kansas_river', to: 'fort_kearny', cx1: 83, cy1: 44, cx2: 79, cy2: 45 },
  { from: 'fort_kearny', to: 'chimney_rock', cx1: 70, cy1: 42, cx2: 66, cy2: 41 },
  { from: 'chimney_rock', to: 'fort_laramie', cx1: 58, cy1: 38, cx2: 55, cy2: 37 },
  { from: 'fort_laramie', to: 'independence_rock', cx1: 48, cy1: 35, cx2: 45, cy2: 34 },
  { from: 'independence_rock', to: 'south_pass', cx1: 39, cy1: 32, cx2: 37, cy2: 31 },
  { from: 'south_pass', to: 'fort_bridger', cx1: 32, cy1: 32, cx2: 30, cy2: 33 },
  { from: 'fort_bridger', to: 'raft_river', cx1: 26, cy1: 31, cx2: 24, cy2: 30 },
  { from: 'raft_river', to: 'city_of_rocks', cx1: 20, cy1: 28, cx2: 19, cy2: 28 },
  { from: 'city_of_rocks', to: 'humboldt_river', cx1: 17, cy1: 29, cx2: 16, cy2: 30 },
  { from: 'humboldt_river', to: 'humboldt_sink', cx1: 14, cy1: 33, cx2: 13, cy2: 34 },
  { from: 'humboldt_sink', to: 'forty_mile_desert', cx1: 11, cy1: 37, cx2: 10, cy2: 38 },
  { from: 'forty_mile_desert', to: 'truckee_pass', cx1: 9, cy1: 42, cx2: 8, cy2: 43 },
  { from: 'truckee_pass', to: 'sacramento_valley', cx1: 7, cy1: 49, cx2: 6, cy2: 52 },
  { from: 'sacramento_valley', to: 'west_point', cx1: 20, cy1: 45, cx2: 35, cy2: 35 },

  // Chapter 2: Gold Country
  { from: 'west_point', to: 'mokelumne_hill', cx1: 46, cy1: 36, cx2: 43, cy2: 42 },
  { from: 'west_point', to: 'sandy_gulch', cx1: 55, cy1: 26 },
  { from: 'mokelumne_hill', to: 'san_andreas', cx1: 38, cy1: 48, cx2: 36, cy2: 52 },
  { from: 'mokelumne_hill', to: 'jackson', cx1: 43, cy1: 52, cx2: 44, cy2: 56 },
  { from: 'san_andreas', to: 'angels_camp', cx1: 31, cy1: 53, cx2: 28, cy2: 52 },
  { from: 'san_andreas', to: 'jackson', cx1: 38, cy1: 57, cx2: 42, cy2: 59 },
  { from: 'jackson', to: 'volcano', cx1: 50, cy1: 52, cx2: 53, cy2: 45 },
  { from: 'angels_camp', to: 'big_trees', cx1: 21, cy1: 46, cx2: 17, cy2: 44 },
  { from: 'angels_camp', to: 'carson_hill', cx1: 23, cy1: 52 },
  { from: 'volcano', to: 'west_point', cx1: 53, cy1: 34 },
  { from: 'volcano', to: 'indian_grinding_rock', cx1: 58, cy1: 37 },
  { from: 'mokelumne_hill', to: 'chinese_tunnels', cx1: 41, cy1: 43 },
  { from: 'chinese_tunnels', to: 'volcano', cx1: 48, cy1: 40 },
]

/**
 * Look up Bezier control points for a connection between two locations.
 * Returns the control point(s) or undefined if no curve data exists (fall back to straight line).
 */
export function getPathControlPoints(fromId: string, toId: string): PathControlPoint | undefined {
  return PATH_CONTROL_POINTS.find(
    p => (p.from === fromId && p.to === toId) || (p.from === toId && p.to === fromId)
  )
}

/**
 * Build an SVG path `d` attribute for a connection between two points,
 * using Bezier control points if available.
 */
export function buildConnectionPath(
  x1: number, y1: number,
  x2: number, y2: number,
  controlPoints?: PathControlPoint,
  tier: GraphicsTier = 'classic_8bit',
): string {
  // Retro tier: always straight lines
  if (tier === 'retro_4bit' || !controlPoints) {
    return `M${x1},${y1} L${x2},${y2}`
  }

  // Classic/Enhanced: quadratic Bezier (one control point)
  if (tier === 'classic_8bit' || tier === 'enhanced_16bit') {
    return `M${x1},${y1} Q${controlPoints.cx1},${controlPoints.cy1} ${x2},${y2}`
  }

  // Modern/Ultra: cubic Bezier if two control points available
  if (controlPoints.cx2 !== undefined && controlPoints.cy2 !== undefined) {
    return `M${x1},${y1} C${controlPoints.cx1},${controlPoints.cy1} ${controlPoints.cx2},${controlPoints.cy2} ${x2},${y2}`
  }

  // Fallback to quadratic
  return `M${x1},${y1} Q${controlPoints.cx1},${controlPoints.cy1} ${x2},${y2}`
}
