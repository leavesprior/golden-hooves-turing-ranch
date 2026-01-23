'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useRPG, Position, SkillName, AttributeName, FeatId, getTileVisibility, TileVisibility, GraphicsTier, getTierIndex } from '@/lib/rpgContext'
import { MAP_FOG_TILES, MAP_HIDDEN_TILES } from '@/lib/chapters'

// CSS Pixel Art Prospector Sprite (16-bit style)
function ProspectorSprite() {
  return (
    <div
      className="relative select-none"
      style={{
        width: '24px',
        height: '28px',
        imageRendering: 'pixelated',
      }}
    >
      {/* Hat */}
      <div
        className="absolute"
        style={{
          top: 0,
          left: '4px',
          width: '16px',
          height: '6px',
          background: 'linear-gradient(180deg, #8B4513 0%, #654321 100%)',
          borderRadius: '2px 2px 0 0',
          boxShadow: 'inset 0 -1px 0 #3d2b1f',
        }}
      />
      {/* Hat brim */}
      <div
        className="absolute"
        style={{
          top: '5px',
          left: '2px',
          width: '20px',
          height: '3px',
          background: 'linear-gradient(180deg, #654321 0%, #3d2b1f 100%)',
        }}
      />
      {/* Face */}
      <div
        className="absolute"
        style={{
          top: '8px',
          left: '6px',
          width: '12px',
          height: '8px',
          background: 'linear-gradient(180deg, #deb887 0%, #d2a679 100%)',
          borderRadius: '1px',
        }}
      />
      {/* Eyes */}
      <div
        className="absolute bg-[#2a1a0a]"
        style={{ top: '10px', left: '8px', width: '2px', height: '2px' }}
      />
      <div
        className="absolute bg-[#2a1a0a]"
        style={{ top: '10px', left: '14px', width: '2px', height: '2px' }}
      />
      {/* Body/Shirt */}
      <div
        className="absolute"
        style={{
          top: '16px',
          left: '4px',
          width: '16px',
          height: '10px',
          background: 'linear-gradient(180deg, #4a6a9a 0%, #3a5a8a 100%)',
          boxShadow: 'inset 0 -1px 0 #2a4a7a',
        }}
      />
      {/* Suspenders */}
      <div
        className="absolute bg-[#8B4513]"
        style={{ top: '16px', left: '6px', width: '2px', height: '8px' }}
      />
      <div
        className="absolute bg-[#8B4513]"
        style={{ top: '16px', left: '16px', width: '2px', height: '8px' }}
      />
      {/* Pickaxe on back (hint of tool) */}
      <div
        className="absolute"
        style={{
          top: '12px',
          left: '18px',
          width: '3px',
          height: '10px',
          background: '#654321',
          transform: 'rotate(-15deg)',
        }}
      />
    </div>
  )
}

// Tile types and their properties
export type TileType =
  // Nature tiles
  | 'grass' | 'forest' | 'mountain' | 'water' | 'path' | 'rock' | 'creek'
  // Structure tiles
  | 'cabin' | 'door' | 'window' | 'hottub' | 'firepit' | 'bridge'
  | 'dock' | 'deck' | 'lookout' | 'campfire' | 'wagon' | 'sign'
  // Town/building tiles
  | 'building' | 'hotel' | 'theatre' | 'stage' | 'saloon' | 'well'
  // Volcano special tiles
  | 'lodge' | 'cobblestone' | 'lantern' | 'cemetery' | 'tombstone' | 'secretdoor'
  // Store tiles
  | 'shelf' | 'barrel' | 'crate' | 'counter' | 'clerk'
  // Mining tiles
  | 'gold' | 'cave' | 'claim' | 'mine' | 'frog' | 'quartz' | 'vein' | 'minecart' | 'tunnel'
  // Angels Camp tiles
  | 'arena' | 'statue' | 'newspaper' | 'stagecoach'
  // Ranch tiles
  | 'barn' | 'corral' | 'garden' | 'windmill' | 'orchard' | 'vineyard' | 'pond'
  // Ranch expansion tiles
  | 'stars' | 'telescope' | 'hearth' | 'piano' | 'trail' | 'gazebo' | 'fountain'

interface TileConfig {
  walkable: boolean
  interactive: boolean
  icon?: string
  dialogueId?: string
}

const tileConfigs: Record<TileType, TileConfig> = {
  // Nature tiles
  grass: { walkable: true, interactive: false },
  forest: { walkable: false, interactive: false, icon: '🌲' },
  mountain: { walkable: false, interactive: false, icon: '⛰️' },
  water: { walkable: false, interactive: false },
  path: { walkable: true, interactive: false },
  rock: { walkable: false, interactive: false, icon: '🪨' },
  creek: { walkable: false, interactive: false },

  // Structure tiles
  cabin: { walkable: false, interactive: false, icon: '🏠' },
  door: { walkable: true, interactive: true, icon: '🚪' },
  window: { walkable: false, interactive: false, icon: '🪟' },
  hottub: { walkable: true, interactive: true, icon: '♨️' },
  firepit: { walkable: true, interactive: true, icon: '🔥' },
  bridge: { walkable: true, interactive: false },
  dock: { walkable: true, interactive: true, icon: '🛶' },
  deck: { walkable: true, interactive: false },
  lookout: { walkable: true, interactive: true, icon: '🔭' },
  campfire: { walkable: true, interactive: true, icon: '🏕️' },
  wagon: { walkable: true, interactive: true, icon: '🐴' },
  sign: { walkable: true, interactive: true, icon: '📜' },

  // Town/building tiles
  building: { walkable: false, interactive: false },
  hotel: { walkable: false, interactive: true, icon: '🏨' },
  theatre: { walkable: false, interactive: true, icon: '🎭' },
  stage: { walkable: true, interactive: true, icon: '🎪' },
  saloon: { walkable: false, interactive: true, icon: '🍺' },
  well: { walkable: true, interactive: true, icon: '💧' },

  // Volcano special tiles
  lodge: { walkable: false, interactive: true, icon: '🏛️' },
  cobblestone: { walkable: true, interactive: false },
  lantern: { walkable: true, interactive: true, icon: '🏮' },
  cemetery: { walkable: true, interactive: false },
  tombstone: { walkable: false, interactive: true, icon: '🪦' },
  secretdoor: { walkable: true, interactive: true, icon: '🚪' },

  // Store tiles
  shelf: { walkable: false, interactive: true, icon: '📚' },
  barrel: { walkable: false, interactive: true, icon: '🛢️' },
  crate: { walkable: false, interactive: true, icon: '📦' },
  counter: { walkable: false, interactive: true, icon: '⚖️' },
  clerk: { walkable: false, interactive: true, icon: '🧑‍🌾' },

  // Mining tiles
  gold: { walkable: true, interactive: true, icon: '✨' },
  cave: { walkable: true, interactive: true, icon: '🕳️' },
  claim: { walkable: true, interactive: true, icon: '⛏️' },
  mine: { walkable: false, interactive: true, icon: '🏔️' },
  frog: { walkable: true, interactive: true, icon: '🐸' },
  quartz: { walkable: true, interactive: true, icon: '💎' },
  vein: { walkable: true, interactive: true, icon: '🌟' },
  minecart: { walkable: true, interactive: true, icon: '🛒' },
  tunnel: { walkable: true, interactive: true, icon: '🚇' },

  // Angels Camp tiles
  arena: { walkable: true, interactive: true, icon: '🏟️' },
  statue: { walkable: false, interactive: true, icon: '🗿' },
  newspaper: { walkable: true, interactive: true, icon: '📰' },
  stagecoach: { walkable: false, interactive: true, icon: '🐎' },

  // Ranch tiles
  barn: { walkable: false, interactive: true, icon: '🏚️' },
  corral: { walkable: false, interactive: true, icon: '🐴' },
  garden: { walkable: true, interactive: true, icon: '🌻' },
  windmill: { walkable: false, interactive: true, icon: '🌀' },
  orchard: { walkable: true, interactive: true, icon: '🍎' },
  vineyard: { walkable: true, interactive: true, icon: '🍇' },
  pond: { walkable: false, interactive: true, icon: '🦆' },

  // Ranch expansion tiles
  stars: { walkable: false, interactive: true, icon: '⭐' },
  telescope: { walkable: false, interactive: true, icon: '🔭' },
  hearth: { walkable: false, interactive: true, icon: '🔥' },
  piano: { walkable: false, interactive: true, icon: '🎹' },
  trail: { walkable: true, interactive: true, icon: '🥾' },
  gazebo: { walkable: true, interactive: true, icon: '🏕️' },
  fountain: { walkable: false, interactive: true, icon: '⛲' },
}

// 16-bit style gradient definitions for tiles
interface TileGradient {
  background: string
  boxShadow?: string
}

// Chapter theme type - defines unique visual identity per chapter
type ChapterTheme = 'oregon_trail' | 'gold_rush_town' | 'mining_camp' | 'pastoral_ranch' | 'twilight_legacy'

interface ChapterPalette {
  // Primary ambient colors
  ambientLight: string
  ambientOverlay: string
  // Nature tile color shifts
  grassPrimary: string
  grassSecondary: string
  grassTertiary: string
  // Path/earth tones
  pathPrimary: string
  pathSecondary: string
  // Water variations
  waterPrimary: string
  waterSecondary: string
  // Sky/atmosphere
  atmosphereGlow: string
  // Accent colors for interactive elements
  interactiveGlow: string
  // Building tones
  buildingPrimary: string
  buildingSecondary: string
}

// Five distinct chapter palettes - true 32-bit Sega Genesis/Saturn style
const CHAPTER_PALETTES: Record<ChapterTheme, ChapterPalette> = {
  // Chapter 1: Oregon Trail - Golden prairie sunset, dusty amber tones
  oregon_trail: {
    ambientLight: 'rgba(255, 200, 120, 0.15)',
    ambientOverlay: 'linear-gradient(180deg, rgba(255, 180, 80, 0.1) 0%, rgba(200, 120, 60, 0.15) 100%)',
    grassPrimary: '#8a9a52',  // Dusty prairie green
    grassSecondary: '#7a8a42',
    grassTertiary: '#6a7a32',
    pathPrimary: '#c9a070',   // Dusty trail
    pathSecondary: '#b99060',
    waterPrimary: '#6a8ab8',  // River blue
    waterSecondary: '#5a7aa8',
    atmosphereGlow: 'rgba(255, 180, 100, 0.2)',
    interactiveGlow: 'rgba(255, 200, 100, 0.5)',
    buildingPrimary: '#8a6a4a',
    buildingSecondary: '#7a5a3a',
  },
  // Chapter 2: Volcano/Gold Rush Town - Deep reds, lantern glow, mining atmosphere
  gold_rush_town: {
    ambientLight: 'rgba(255, 150, 80, 0.2)',
    ambientOverlay: 'linear-gradient(180deg, rgba(200, 100, 50, 0.15) 0%, rgba(100, 50, 30, 0.2) 100%)',
    grassPrimary: '#5a7a4a',  // Darker, more subdued
    grassSecondary: '#4a6a3a',
    grassTertiary: '#3a5a2a',
    pathPrimary: '#9a7050',   // Worn mining town streets
    pathSecondary: '#8a6040',
    waterPrimary: '#5a7a9a',  // Darker, murkier
    waterSecondary: '#4a6a8a',
    atmosphereGlow: 'rgba(255, 120, 60, 0.25)',
    interactiveGlow: 'rgba(255, 180, 80, 0.6)',
    buildingPrimary: '#7a4a3a',  // Weathered wood
    buildingSecondary: '#6a3a2a',
  },
  // Chapter 3: Angels Camp Mining Settlement - Sandy gold, creek blue, earthy tones
  mining_camp: {
    ambientLight: 'rgba(220, 200, 150, 0.15)',
    ambientOverlay: 'linear-gradient(180deg, rgba(200, 180, 120, 0.1) 0%, rgba(180, 150, 100, 0.12) 100%)',
    grassPrimary: '#6a9a52',  // California foothill green
    grassSecondary: '#5a8a42',
    grassTertiary: '#4a7a32',
    pathPrimary: '#c0a060',   // Sandy gold paths
    pathSecondary: '#b09050',
    waterPrimary: '#5a9ac8',  // Clear creek blue
    waterSecondary: '#4a8ab8',
    atmosphereGlow: 'rgba(220, 180, 100, 0.2)',
    interactiveGlow: 'rgba(255, 220, 100, 0.5)',
    buildingPrimary: '#9a7a5a',
    buildingSecondary: '#8a6a4a',
  },
  // Chapter 4: Ranch - Rich pastoral greens, warm earth, blue sky
  pastoral_ranch: {
    ambientLight: 'rgba(150, 220, 180, 0.12)',
    ambientOverlay: 'linear-gradient(180deg, rgba(100, 180, 220, 0.08) 0%, rgba(120, 200, 150, 0.1) 100%)',
    grassPrimary: '#4aaa52',  // Lush pasture green
    grassSecondary: '#3a9a42',
    grassTertiary: '#2a8a32',
    pathPrimary: '#a08060',   // Farm road
    pathSecondary: '#907050',
    waterPrimary: '#5aaad8',  // Clear pond blue
    waterSecondary: '#4a9ac8',
    atmosphereGlow: 'rgba(100, 200, 150, 0.15)',
    interactiveGlow: 'rgba(150, 255, 180, 0.5)',
    buildingPrimary: '#aa5a4a',  // Red barn
    buildingSecondary: '#9a4a3a',
  },
  // Chapter 5: Legacy - Twilight purples, moonlit silver, nostalgic atmosphere
  twilight_legacy: {
    ambientLight: 'rgba(150, 130, 200, 0.18)',
    ambientOverlay: 'linear-gradient(180deg, rgba(100, 80, 150, 0.15) 0%, rgba(60, 50, 100, 0.2) 100%)',
    grassPrimary: '#4a7a6a',  // Moonlit sage
    grassSecondary: '#3a6a5a',
    grassTertiary: '#2a5a4a',
    pathPrimary: '#8a7a8a',   // Silver-tinged path
    pathSecondary: '#7a6a7a',
    waterPrimary: '#6a8aaa',  // Moonlit water
    waterSecondary: '#5a7a9a',
    atmosphereGlow: 'rgba(180, 160, 220, 0.2)',
    interactiveGlow: 'rgba(200, 180, 255, 0.5)',
    buildingPrimary: '#6a5a6a',
    buildingSecondary: '#5a4a5a',
  },
}

// Determine chapter theme from map ID
function getChapterTheme(mapId: string): ChapterTheme {
  if (mapId.startsWith('ch1')) return 'oregon_trail'
  if (mapId.startsWith('ch2')) return 'gold_rush_town'
  if (mapId.startsWith('ch3')) return 'mining_camp'
  if (mapId.startsWith('ch4')) return 'pastoral_ranch'
  if (mapId.startsWith('ch5')) return 'twilight_legacy'
  // Default to oregon_trail for unknown maps
  return 'oregon_trail'
}

// Generate chapter-aware tile gradients
function getChapterTileGradient(tile: TileType, theme: ChapterTheme): TileGradient {
  const palette = CHAPTER_PALETTES[theme]

  // Override specific tiles with chapter-appropriate colors
  switch (tile) {
    case 'grass':
      return {
        background: `linear-gradient(135deg, ${palette.grassPrimary} 0%, ${palette.grassSecondary} 40%, ${palette.grassTertiary} 100%)`,
        boxShadow: `inset 0 -2px 0 ${palette.grassTertiary}, inset 0 2px 0 ${palette.grassPrimary}`
      }
    case 'path':
    case 'trail':
      return {
        background: `linear-gradient(135deg, ${palette.pathPrimary} 0%, ${palette.pathSecondary} 50%, ${adjustColor(palette.pathSecondary, -20)} 100%)`,
        boxShadow: `inset 0 -2px 0 ${adjustColor(palette.pathSecondary, -30)}, inset 0 1px 0 ${adjustColor(palette.pathPrimary, 20)}`
      }
    case 'water':
      return {
        background: `linear-gradient(180deg, ${adjustColor(palette.waterPrimary, 20)} 0%, ${palette.waterPrimary} 50%, ${palette.waterSecondary} 100%)`,
        boxShadow: `inset 0 -2px 0 ${adjustColor(palette.waterSecondary, -20)}, inset 0 2px 0 ${adjustColor(palette.waterPrimary, 30)}`
      }
    case 'creek':
      return {
        background: `linear-gradient(135deg, ${adjustColor(palette.waterPrimary, 30)} 0%, ${palette.waterPrimary} 50%, ${palette.waterSecondary} 100%)`,
        boxShadow: `inset 0 -2px 0 ${palette.waterSecondary}, inset 0 2px 0 ${adjustColor(palette.waterPrimary, 40)}`
      }
    case 'building':
    case 'cabin':
      return {
        background: `linear-gradient(180deg, ${palette.buildingPrimary} 0%, ${palette.buildingSecondary} 50%, ${adjustColor(palette.buildingSecondary, -20)} 100%)`,
        boxShadow: `inset 0 -3px 0 ${adjustColor(palette.buildingSecondary, -30)}, inset 2px 0 0 ${adjustColor(palette.buildingPrimary, 20)}`
      }
    case 'forest':
      // Adjust forest based on chapter atmosphere
      const forestBase = theme === 'twilight_legacy' ? '#1a4a3a' :
                        theme === 'gold_rush_town' ? '#1a4a2a' : '#1e5c2b'
      return {
        background: `linear-gradient(180deg, ${forestBase} 0%, ${adjustColor(forestBase, -10)} 60%, ${adjustColor(forestBase, -20)} 100%)`,
        boxShadow: `inset 0 -3px 0 ${adjustColor(forestBase, -30)}, inset 0 1px 0 ${adjustColor(forestBase, 20)}`
      }
    default:
      // Return base gradient for tiles not affected by chapter theme
      return baseTileGradients[tile] || baseTileGradients.grass
  }
}

// Helper to adjust hex color brightness
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`
}

// Base gradients (used when no chapter override applies)
const baseTileGradients: Record<TileType, TileGradient> = {
  grass: {
    background: 'linear-gradient(135deg, #4a9a52 0%, #3e8948 40%, #357a3d 100%)',
    boxShadow: 'inset 0 -2px 0 #2d6a34, inset 0 2px 0 #5aaa62'
  },
  forest: {
    background: 'linear-gradient(180deg, #1e5c2b 0%, #1e4d2b 60%, #153d20 100%)',
    boxShadow: 'inset 0 -3px 0 #0d2d15, inset 0 1px 0 #2e6c3b'
  },
  mountain: {
    background: 'linear-gradient(180deg, #9a8a7a 0%, #7a6a5a 30%, #5a4a3a 70%, #3a2a1a 100%)',
    boxShadow: 'inset 0 -2px 0 #2a1a0a, inset 2px 0 0 #aa9a8a'
  },
  water: {
    background: 'linear-gradient(180deg, #5a8ac8 0%, #4a7ab8 50%, #3a6aa8 100%)',
    boxShadow: 'inset 0 -2px 0 #2a5a98, inset 0 2px 0 #6a9ad8'
  },
  path: {
    background: 'linear-gradient(135deg, #b09070 0%, #a08060 50%, #907050 100%)',
    boxShadow: 'inset 0 -2px 0 #706040, inset 0 1px 0 #c0a080'
  },
  cabin: {
    background: 'linear-gradient(180deg, #6a5040 0%, #5a4030 50%, #4a3020 100%)',
    boxShadow: 'inset 0 -3px 0 #3a2010, inset 2px 0 0 #7a6050'
  },
  door: {
    background: 'linear-gradient(180deg, #8a6a4a 0%, #7a5a3a 100%)',
    boxShadow: 'inset 0 -2px 0 #5a4a2a, inset 2px 0 0 #9a7a5a'
  },
  window: {
    background: 'linear-gradient(135deg, #8ac0e0 0%, #6aa0c0 100%)',
    boxShadow: 'inset 0 0 4px #4a80a0'
  },
  hottub: {
    background: 'linear-gradient(180deg, #5a9ab8 0%, #4a8aa8 50%, #3a7a98 100%)',
    boxShadow: 'inset 0 -2px 0 #2a6a88, inset 0 2px 0 #6aaac8'
  },
  firepit: {
    background: 'linear-gradient(180deg, #ffaa44 0%, #ff8822 50%, #ee6611 100%)',
    boxShadow: 'inset 0 -2px 0 #cc4400, inset 0 2px 0 #ffcc66'
  },
  dock: {
    background: 'linear-gradient(90deg, #8a7060 0%, #7a6050 50%, #8a7060 100%)',
    boxShadow: 'inset 0 -2px 0 #5a4030'
  },
  deck: {
    background: 'linear-gradient(90deg, #a09080 0%, #908070 50%, #a09080 100%)',
    boxShadow: 'inset 0 -2px 0 #706050'
  },
  lookout: {
    background: 'linear-gradient(180deg, #8a7a6a 0%, #7a6a5a 100%)',
    boxShadow: 'inset 0 -2px 0 #5a4a3a, inset 2px 0 0 #9a8a7a'
  },
  campfire: {
    background: 'radial-gradient(circle at center, #ffcc44 0%, #ff8822 40%, #553311 100%)',
    boxShadow: '0 0 8px #ff6600'
  },
  wagon: {
    background: 'linear-gradient(180deg, #7a5a3a 0%, #6a4a2a 50%, #5a3a1a 100%)',
    boxShadow: 'inset 0 -3px 0 #3a2a0a, inset 2px 0 0 #8a6a4a'
  },
  rock: {
    background: 'linear-gradient(135deg, #8a8a8a 0%, #6a6a6a 50%, #4a4a4a 100%)',
    boxShadow: 'inset 0 -2px 0 #3a3a3a, inset 2px 0 0 #9a9a9a'
  },
  gold: {
    background: 'linear-gradient(135deg, #ffd700 0%, #daa520 50%, #b8860b 100%)',
    boxShadow: 'inset 0 -2px 0 #8b6914, inset 0 2px 0 #ffe44d, 0 0 6px #ffd700'
  },
  cave: {
    background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 70%, #000000 100%)',
    boxShadow: 'inset 0 0 8px #000000'
  },
  bridge: {
    background: 'linear-gradient(90deg, #8a7a5a 0%, #7a6a4a 20%, #7a6a4a 80%, #8a7a5a 100%)',
    boxShadow: 'inset 0 -3px 0 #5a4a2a'
  },
  sign: {
    background: 'linear-gradient(180deg, #5a8a5a 0%, #4a7a4a 100%)',
    boxShadow: 'inset 0 -2px 0 #3a6a3a'
  },

  // Creek - flowing water (lighter than deep water)
  creek: {
    background: 'linear-gradient(135deg, #7aaae8 0%, #5a9ad8 50%, #4a8ac8 100%)',
    boxShadow: 'inset 0 -2px 0 #3a7ab8, inset 0 2px 0 #8abaF8'
  },

  // Town/building tiles
  building: {
    background: 'linear-gradient(180deg, #5a4a3a 0%, #4a3a2a 50%, #3a2a1a 100%)',
    boxShadow: 'inset 0 -3px 0 #2a1a0a, inset 2px 0 0 #6a5a4a'
  },
  hotel: {
    background: 'linear-gradient(180deg, #8a5a4a 0%, #7a4a3a 50%, #6a3a2a 100%)',
    boxShadow: 'inset 0 -3px 0 #4a2a1a, inset 2px 0 0 #9a6a5a, 0 0 4px #aa7a6a'
  },
  theatre: {
    background: 'linear-gradient(180deg, #6a3a5a 0%, #5a2a4a 50%, #4a1a3a 100%)',
    boxShadow: 'inset 0 -3px 0 #3a0a2a, inset 2px 0 0 #7a4a6a, 0 0 4px #8a5a7a'
  },
  stage: {
    background: 'linear-gradient(180deg, #9a7a5a 0%, #8a6a4a 50%, #7a5a3a 100%)',
    boxShadow: 'inset 0 -3px 0 #5a4a2a, 0 0 6px rgba(255, 200, 100, 0.3)'
  },
  saloon: {
    background: 'linear-gradient(180deg, #7a5a3a 0%, #6a4a2a 50%, #5a3a1a 100%)',
    boxShadow: 'inset 0 -3px 0 #3a2a0a, inset 2px 0 0 #8a6a4a, 0 0 4px #aa8822'
  },
  well: {
    background: 'radial-gradient(circle at center, #2a4a6a 0%, #3a5a7a 40%, #5a7a9a 100%)',
    boxShadow: 'inset 0 0 6px #1a3a5a'
  },

  // Store tiles
  shelf: {
    background: 'linear-gradient(180deg, #6a5a4a 0%, #5a4a3a 50%, #4a3a2a 100%)',
    boxShadow: 'inset 0 -2px 0 #3a2a1a, inset 0 -6px 0 #5a4a3a, inset 0 -10px 0 #4a3a2a'
  },
  barrel: {
    background: 'radial-gradient(ellipse at center, #7a5a3a 0%, #5a4a2a 70%, #4a3a1a 100%)',
    boxShadow: 'inset 0 -2px 0 #3a2a0a, inset 2px 0 0 #8a6a4a'
  },
  crate: {
    background: 'linear-gradient(135deg, #8a7a5a 0%, #7a6a4a 50%, #6a5a3a 100%)',
    boxShadow: 'inset 0 -2px 0 #5a4a2a, inset 2px 0 0 #9a8a6a, inset -1px 0 0 #4a3a1a'
  },
  counter: {
    background: 'linear-gradient(180deg, #7a6a5a 0%, #6a5a4a 100%)',
    boxShadow: 'inset 0 -3px 0 #4a3a2a, inset 0 2px 0 #8a7a6a'
  },
  clerk: {
    background: 'linear-gradient(180deg, #9a8a7a 0%, #8a7a6a 100%)',
    boxShadow: 'inset 0 -2px 0 #6a5a4a'
  },

  // Mining tiles
  claim: {
    background: 'linear-gradient(135deg, #8a7a5a 0%, #7a6a4a 50%, #6a5a3a 100%)',
    boxShadow: 'inset 0 -2px 0 #5a4a2a, 0 0 4px #aa8822'
  },
  mine: {
    background: 'radial-gradient(ellipse at 50% 80%, #1a1a1a 0%, #2a2a2a 40%, #4a4a3a 100%)',
    boxShadow: 'inset 0 0 10px #000000'
  },
  frog: {
    background: 'linear-gradient(135deg, #5a9a62 0%, #4a8a52 40%, #3a7a42 100%)',
    boxShadow: 'inset 0 -2px 0 #2a6a32, inset 0 2px 0 #6aaa72'
  },
  quartz: {
    background: 'linear-gradient(135deg, #e8e8f8 0%, #c8c8e8 50%, #a8a8d8 100%)',
    boxShadow: 'inset 0 -2px 0 #8888c8, 0 0 6px rgba(200, 200, 255, 0.5)'
  },
  vein: {
    background: 'linear-gradient(135deg, #ffd700 0%, #daa520 30%, #5a4a3a 60%, #4a3a2a 100%)',
    boxShadow: 'inset 0 -2px 0 #3a2a1a, 0 0 8px #ffd700'
  },

  // Volcano special tiles - 32-bit Sega style
  lodge: {
    background: 'linear-gradient(180deg, #4a4a6a 0%, #3a3a5a 30%, #2a2a4a 60%, #1a1a3a 100%)',
    boxShadow: 'inset 0 -3px 0 #0a0a2a, inset 2px 0 0 #5a5a7a, 0 0 8px rgba(100, 100, 180, 0.4)'
  },
  cobblestone: {
    background: 'repeating-linear-gradient(45deg, #6a6a6a 0%, #5a5a5a 5%, #7a7a7a 10%, #5a5a5a 15%)',
    boxShadow: 'inset 0 -2px 0 #4a4a4a, inset 0 2px 0 #8a8a8a'
  },
  lantern: {
    background: 'radial-gradient(circle at center, #ffcc44 0%, #ff9922 30%, #554433 60%, #443322 100%)',
    boxShadow: '0 0 12px #ffaa22, 0 0 20px rgba(255, 170, 34, 0.4)'
  },
  cemetery: {
    background: 'linear-gradient(135deg, #3a4a3a 0%, #2a3a2a 50%, #1a2a1a 100%)',
    boxShadow: 'inset 0 -2px 0 #0a1a0a, 0 0 4px rgba(100, 150, 100, 0.2)'
  },
  tombstone: {
    background: 'linear-gradient(180deg, #8a8a8a 0%, #6a6a6a 50%, #4a4a4a 100%)',
    boxShadow: 'inset 0 -2px 0 #3a3a3a, inset 1px 0 0 #9a9a9a, 0 0 4px rgba(100, 100, 150, 0.3)'
  },
  secretdoor: {
    background: 'linear-gradient(180deg, #3a3a4a 0%, #2a2a3a 50%, #1a1a2a 100%)',
    boxShadow: 'inset 0 -2px 0 #0a0a1a, 0 0 6px rgba(150, 100, 200, 0.3)'
  },

  // Mining expansion tiles
  minecart: {
    background: 'linear-gradient(180deg, #5a5a5a 0%, #4a4a4a 50%, #3a3a3a 100%)',
    boxShadow: 'inset 0 -2px 0 #2a2a2a, inset 2px 0 0 #6a6a6a, 0 0 4px rgba(200, 150, 50, 0.3)'
  },
  tunnel: {
    background: 'radial-gradient(ellipse at 50% 100%, #0a0a0a 0%, #1a1a1a 50%, #3a3a3a 100%)',
    boxShadow: 'inset 0 0 12px #000000, 0 0 4px rgba(0, 0, 0, 0.5)'
  },

  // Angels Camp tiles - 32-bit Sega style
  arena: {
    background: 'linear-gradient(135deg, #c9a86c 0%, #b89858 30%, #a88848 60%, #987838 100%)',
    boxShadow: 'inset 0 -3px 0 #876828, inset 0 2px 0 #d9b87c, 0 0 6px rgba(200, 160, 80, 0.3)'
  },
  statue: {
    background: 'linear-gradient(180deg, #b8b8b8 0%, #989898 30%, #787878 60%, #585858 100%)',
    boxShadow: 'inset 0 -3px 0 #484848, inset 2px 0 0 #c8c8c8, 0 0 8px rgba(150, 150, 150, 0.4)'
  },
  newspaper: {
    background: 'linear-gradient(135deg, #f8f0e0 0%, #e8e0d0 50%, #d8d0c0 100%)',
    boxShadow: 'inset 0 -2px 0 #c8c0b0, inset 0 2px 0 #ffffff'
  },
  stagecoach: {
    background: 'linear-gradient(180deg, #8a4a2a 0%, #7a3a1a 40%, #6a2a0a 70%, #5a2a0a 100%)',
    boxShadow: 'inset 0 -3px 0 #4a1a00, inset 2px 0 0 #9a5a3a, 0 0 4px rgba(150, 100, 50, 0.3)'
  },

  // Ranch tiles - 32-bit Sega style
  barn: {
    background: 'linear-gradient(180deg, #aa3a2a 0%, #8a2a1a 40%, #6a1a0a 70%, #5a0a00 100%)',
    boxShadow: 'inset 0 -4px 0 #4a0000, inset 2px 0 0 #ba4a3a, 0 0 6px rgba(200, 100, 50, 0.3)'
  },
  corral: {
    background: 'linear-gradient(180deg, #9a7a5a 0%, #8a6a4a 50%, #7a5a3a 100%)',
    boxShadow: 'inset 0 -3px 0 #5a4a2a, inset 2px 0 0 #aa8a6a'
  },
  garden: {
    background: 'linear-gradient(135deg, #5a9a4a 0%, #4a8a3a 30%, #6a5a3a 60%, #5a4a2a 100%)',
    boxShadow: 'inset 0 -2px 0 #3a7a2a, inset 0 2px 0 #6aaa5a'
  },
  windmill: {
    background: 'linear-gradient(180deg, #8a7a6a 0%, #7a6a5a 50%, #6a5a4a 100%)',
    boxShadow: 'inset 0 -3px 0 #4a3a2a, inset 2px 0 0 #9a8a7a, 0 0 6px rgba(150, 150, 150, 0.3)'
  },
  orchard: {
    background: 'linear-gradient(135deg, #4a8a52 0%, #3a7a42 40%, #5a4a3a 70%, #4a3a2a 100%)',
    boxShadow: 'inset 0 -2px 0 #2a6a32, inset 0 2px 0 #5a9a62'
  },
  vineyard: {
    background: 'linear-gradient(135deg, #6a4a8a 0%, #5a3a7a 30%, #4a8a4a 60%, #3a7a3a 100%)',
    boxShadow: 'inset 0 -2px 0 #3a2a6a, 0 0 4px rgba(150, 100, 200, 0.3)'
  },
  pond: {
    background: 'radial-gradient(ellipse at center, #4a8ab8 0%, #3a7aa8 50%, #2a6a98 100%)',
    boxShadow: 'inset 0 0 8px #1a5a88, 0 0 4px rgba(100, 150, 200, 0.3)'
  },

  // Ranch expansion tiles - 32-bit Sega style
  stars: {
    background: 'linear-gradient(180deg, #0a0a2a 0%, #1a1a3a 50%, #2a2a4a 100%)',
    boxShadow: '0 0 8px rgba(100, 100, 200, 0.3)'
  },
  telescope: {
    background: 'linear-gradient(180deg, #5a4a3a 0%, #4a3a2a 100%)',
    boxShadow: 'inset 0 -2px 0 #3a2a1a, 0 0 4px rgba(100, 150, 255, 0.3)'
  },
  hearth: {
    background: 'radial-gradient(circle at center, #ff8844 0%, #cc4422 40%, #4a3020 80%, #3a2010 100%)',
    boxShadow: '0 0 10px #ff6600, inset 0 0 4px #ffaa44'
  },
  piano: {
    background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 50%, #2a2a2a 100%)',
    boxShadow: 'inset 0 -2px 0 #000000, inset 0 2px 0 #3a3a3a, 0 0 4px rgba(255, 255, 255, 0.1)'
  },
  trail: {
    background: 'linear-gradient(135deg, #907050 0%, #806040 50%, #705030 100%)',
    boxShadow: 'inset 0 -2px 0 #604020, inset 0 1px 0 #a08060'
  },
  gazebo: {
    background: 'linear-gradient(180deg, #e8d8c8 0%, #c8b8a8 40%, #a89888 70%, #887868 100%)',
    boxShadow: 'inset 0 -3px 0 #685848, inset 2px 0 0 #f8e8d8, 0 0 6px rgba(200, 180, 150, 0.4)'
  },
  fountain: {
    background: 'radial-gradient(circle at center, #7aaae8 0%, #5a9ad8 30%, #8a8a8a 60%, #6a6a6a 100%)',
    boxShadow: 'inset 0 0 6px #3a7ab8, 0 0 10px rgba(100, 150, 220, 0.5)'
  },
}

// Legacy reference for backwards compatibility
const tileGradients = baseTileGradients

// Graphics tier enhancements - applied progressively as players level up
interface TierEnhancement {
  filter?: string
  opacity?: number
  extraShadow?: string
  animation?: string
}

// Get visual enhancements based on graphics tier
function getTierEnhancement(tier: GraphicsTier, tileType: TileType): TierEnhancement {
  const tierIndex = getTierIndex(tier)

  // Base tier (4-bit) - desaturated, muted
  if (tierIndex === 0) {
    return {
      filter: 'saturate(0.6) contrast(0.9)',
      opacity: 0.9,
    }
  }

  // Classic 8-bit - normal saturation
  if (tierIndex === 1) {
    return {
      filter: 'saturate(0.85) contrast(0.95)',
      opacity: 0.95,
    }
  }

  // Enhanced 16-bit - vibrant, slight glow on interactive
  if (tierIndex === 2) {
    const config = tileConfigs[tileType]
    return {
      filter: 'saturate(1.1) contrast(1.05)',
      opacity: 1,
      extraShadow: config.interactive ? '0 0 4px rgba(255, 215, 0, 0.2)' : undefined,
    }
  }

  // Modern 32-bit - full color, ambient lighting, subtle animations
  return {
    filter: 'saturate(1.2) contrast(1.1)',
    opacity: 1,
    extraShadow: '0 0 2px rgba(255, 255, 255, 0.1)',
    animation: tileType === 'water' ? 'water-shimmer 2s ease-in-out infinite' :
               tileType === 'gold' ? 'gold-glow 1.5s ease-in-out infinite' :
               tileType === 'stars' ? 'twinkle 2s ease-in-out infinite' : undefined,
  }
}

// Get tier-specific texture overlay patterns
function getTierTexture(tier: GraphicsTier, tileType: TileType): string | undefined {
  const tierIndex = getTierIndex(tier)

  // 4-bit and 8-bit: minimal textures
  if (tierIndex < 2) return undefined

  // 16-bit: subtle textures on nature tiles
  if (tierIndex === 2) {
    if (tileType === 'grass') {
      return `
        radial-gradient(circle at 30% 40%, rgba(100, 180, 100, 0.15) 1px, transparent 1px),
        radial-gradient(circle at 70% 70%, rgba(60, 120, 60, 0.15) 1px, transparent 1px)
      `
    }
    if (tileType === 'water' || tileType === 'creek') {
      return `
        linear-gradient(180deg,
          transparent 0%,
          rgba(255, 255, 255, 0.1) 30%,
          transparent 50%
        )
      `
    }
  }

  // 32-bit: rich textures everywhere
  if (tierIndex === 3) {
    if (tileType === 'grass' || tileType === 'frog') {
      return `
        radial-gradient(circle at 20% 30%, rgba(130, 220, 130, 0.2) 1px, transparent 1px),
        radial-gradient(circle at 60% 50%, rgba(80, 150, 80, 0.2) 1px, transparent 1px),
        radial-gradient(circle at 40% 80%, rgba(100, 180, 100, 0.2) 1px, transparent 1px)
      `
    }
    if (tileType === 'water' || tileType === 'creek' || tileType === 'hottub') {
      return `
        linear-gradient(180deg,
          rgba(255, 255, 255, 0.15) 0%,
          transparent 20%,
          rgba(100, 150, 200, 0.1) 50%,
          transparent 80%
        )
      `
    }
    if (tileType === 'path' || tileType === 'trail') {
      return `
        radial-gradient(ellipse at 25% 50%, rgba(180, 150, 100, 0.1) 2px, transparent 2px),
        radial-gradient(ellipse at 75% 40%, rgba(100, 80, 50, 0.1) 2px, transparent 2px)
      `
    }
    if (tileType === 'gold' || tileType === 'vein') {
      return `
        radial-gradient(circle at 30% 30%, rgba(255, 230, 100, 0.3) 1px, transparent 1px),
        radial-gradient(circle at 70% 60%, rgba(255, 200, 50, 0.2) 1px, transparent 1px)
      `
    }
    if (tileType === 'stars') {
      return `
        radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
        radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
        radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.7) 1px, transparent 1px),
        radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.5) 1px, transparent 1px),
        radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.6) 1px, transparent 1px)
      `
    }
  }

  return undefined
}

// Exit requirement types for progression gates
export interface ExitRequirement {
  // Level requirement
  levelMin?: number
  // Attribute requirements (need any one of these)
  attributeCheck?: { attribute: AttributeName; min: number }[]
  // Skill requirements (need any one of these)
  skillCheck?: { skill: SkillName; min: number }[]
  // Item requirement (need any one of these)
  itemRequired?: string[]
  // Feat requirement (need any one of these)
  featRequired?: FeatId[]
  // Must have completed an objective
  objectiveRequired?: string
  // Exit must be explicitly unlocked
  mustUnlock?: boolean
  // Unlock ID (for exits that can be unlocked via dialogue)
  unlockId?: string
  // Message to show when requirements not met
  failMessage?: string
}

export interface MapData {
  id: string
  name: string
  width: number
  height: number
  tiles: TileType[][]
  spawnPoint: Position
  interactionPoints: {
    position: Position
    dialogueId: string
    icon?: string
  }[]
  exits: {
    position: Position
    targetMap: string
    targetSpawn: Position
    requirement?: ExitRequirement
  }[]
}

interface TileMapProps {
  map: MapData
  onInteract?: (position: Position, dialogueId: string) => void
  onExit?: (targetMap: string, targetSpawn: Position) => void
}

export default function TileMap({ map, onInteract, onExit }: TileMapProps) {
  const { session, movePlayer, setPosition, phase, hasItem, hasFeat, isExitUnlocked, isObjectiveComplete, getSkillBonus, graphicsTier } = useRPG()
  const [lockedMessage, setLockedMessage] = useState<string | null>(null)

  // Track tiles that were recently revealed (for animation)
  const [recentlyRevealed, setRecentlyRevealed] = useState<Set<string>>(new Set())
  const prevRevealedRef = useRef<string[]>([])

  // Get fog/hidden tile definitions for this map
  const fogTiles = MAP_FOG_TILES[map.id] || []
  const hiddenTiles = MAP_HIDDEN_TILES[map.id] || []

  // Track newly revealed tiles for animation
  useEffect(() => {
    if (!session?.mapDiscovery?.[map.id]) return

    const currentRevealed = session.mapDiscovery[map.id].revealedTiles || []
    const prevRevealed = prevRevealedRef.current

    // Find newly revealed tiles
    const newlyRevealed = currentRevealed.filter(t => !prevRevealed.includes(t))

    if (newlyRevealed.length > 0) {
      setRecentlyRevealed(prev => new Set([...prev, ...newlyRevealed]))

      // Clear animation class after animation completes (1.5s)
      setTimeout(() => {
        setRecentlyRevealed(prev => {
          const next = new Set(prev)
          newlyRevealed.forEach(t => next.delete(t))
          return next
        })
      }, 1500)
    }

    prevRevealedRef.current = currentRevealed
  }, [session?.mapDiscovery, map.id])

  // Check if an exit's requirements are met
  const checkExitRequirement = useCallback((req: ExitRequirement): { met: boolean; reason: string } => {
    if (!session) return { met: false, reason: 'No active session' }

    // Check level requirement
    if (req.levelMin && session.character.level < req.levelMin) {
      return { met: false, reason: req.failMessage || `Requires level ${req.levelMin}` }
    }

    // Check attribute requirements (OR logic - any one meets it)
    if (req.attributeCheck && req.attributeCheck.length > 0) {
      const anyMet = req.attributeCheck.some(check =>
        session.character.attributes[check.attribute] >= check.min
      )
      if (!anyMet) {
        const attrs = req.attributeCheck.map(c => `${c.attribute.toUpperCase()} ${c.min}`).join(' or ')
        return { met: false, reason: req.failMessage || `Requires ${attrs}` }
      }
    }

    // Check skill requirements (OR logic - any one meets it)
    if (req.skillCheck && req.skillCheck.length > 0) {
      const anyMet = req.skillCheck.some(check =>
        getSkillBonus(check.skill) >= check.min
      )
      if (!anyMet) {
        const skills = req.skillCheck.map(c => `${c.skill.replace('_', ' ')} +${c.min}`).join(' or ')
        return { met: false, reason: req.failMessage || `Requires ${skills}` }
      }
    }

    // Check item requirements (OR logic - any one meets it)
    if (req.itemRequired && req.itemRequired.length > 0) {
      const anyMet = req.itemRequired.some(itemId => hasItem(itemId))
      if (!anyMet) {
        return { met: false, reason: req.failMessage || 'Missing required item' }
      }
    }

    // Check feat requirements (OR logic - any one meets it)
    if (req.featRequired && req.featRequired.length > 0) {
      const anyMet = req.featRequired.some(featId => hasFeat(featId))
      if (!anyMet) {
        return { met: false, reason: req.failMessage || 'Missing required feat' }
      }
    }

    // Check objective completion
    if (req.objectiveRequired && !isObjectiveComplete(req.objectiveRequired)) {
      return { met: false, reason: req.failMessage || 'Objective not yet complete' }
    }

    // Check if exit must be unlocked
    if (req.mustUnlock && req.unlockId && !isExitUnlocked(req.unlockId)) {
      return { met: false, reason: req.failMessage || 'This path is blocked' }
    }

    return { met: true, reason: '' }
  }, [session, hasItem, hasFeat, isExitUnlocked, isObjectiveComplete, getSkillBonus])

  // Movement handler - defined before useEffect to avoid stale closure
  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!session) return

    const delta = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    }[direction]

    const newPos = {
      x: session.position.x + delta.x,
      y: session.position.y + delta.y,
    }

    // Bounds check
    if (newPos.x < 0 || newPos.x >= map.width || newPos.y < 0 || newPos.y >= map.height) {
      return
    }

    // Walkable check
    const targetTile = map.tiles[newPos.y][newPos.x]
    if (!tileConfigs[targetTile].walkable) {
      return
    }

    // Fog of war check - can't walk onto fogged/hidden tiles
    const targetVisibility = getTileVisibility(
      map.id,
      newPos.x,
      newPos.y,
      session.mapDiscovery || {},
      fogTiles,
      hiddenTiles
    )
    if (targetVisibility !== 'revealed') {
      return
    }

    movePlayer(direction)

    // Check for exit
    const exit = map.exits.find(e => e.position.x === newPos.x && e.position.y === newPos.y)
    if (exit && onExit) {
      // Check exit requirements if any
      if (exit.requirement) {
        const result = checkExitRequirement(exit.requirement)
        if (!result.met) {
          setLockedMessage(result.reason)
          setTimeout(() => setLockedMessage(null), 2500)
          return
        }
      }
      // Trigger map transition after a short delay for visual feedback
      setTimeout(() => {
        onExit(exit.targetMap, exit.targetSpawn)
      }, 100)
    }
  }, [session, map, movePlayer, onExit, checkExitRequirement, fogTiles, hiddenTiles])

  // Interaction handler - defined before useEffect to avoid stale closure
  const handleInteract = useCallback(() => {
    if (!session) return

    const interaction = map.interactionPoints.find(
      i => i.position.x === session.position.x && i.position.y === session.position.y
    )

    if (interaction && onInteract) {
      onInteract(interaction.position, interaction.dialogueId)
    }
  }, [session, map, onInteract])

  // Handle keyboard input
  useEffect(() => {
    if (phase !== 'playing') return

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      }

      const direction = keyMap[e.key]
      if (direction) {
        e.preventDefault()
        handleMove(direction)
      }

      // Interact with current tile
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleInteract()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, handleMove, handleInteract])

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!session || phase !== 'playing') return

    // Only allow movement to adjacent tiles
    const dx = Math.abs(x - session.position.x)
    const dy = Math.abs(y - session.position.y)

    if (dx + dy === 1) {
      const direction =
        x > session.position.x ? 'right' :
        x < session.position.x ? 'left' :
        y > session.position.y ? 'down' : 'up'
      handleMove(direction)
    } else if (dx === 0 && dy === 0) {
      handleInteract()
    }
  }, [session, phase, handleMove, handleInteract])

  if (!session) return null

  // Get chapter theme for chapter-specific visuals
  const chapterTheme = getChapterTheme(map.id)
  const chapterPalette = CHAPTER_PALETTES[chapterTheme]

  return (
    <div className="relative">
      {/* Map Grid - Enhanced 32-bit Sega style with chapter-specific atmosphere */}
      <div
        className="grid gap-0 border-4 border-[var(--pixel-ui-border)] relative overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${map.width}, minmax(28px, 1fr))`,
          aspectRatio: `${map.width} / ${map.height}`,
          imageRendering: 'pixelated',
          boxShadow: `inset 0 0 20px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 0 60px ${chapterPalette.ambientLight}`,
        }}
      >
        {/* Chapter ambient atmosphere overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: chapterPalette.ambientOverlay,
            mixBlendMode: 'soft-light',
          }}
        />
        {/* Chapter-specific environmental effects */}
        {chapterTheme === 'oregon_trail' && (
          /* Floating dust motes in sunset light */
          <div className="absolute inset-0 pointer-events-none z-31 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-float-dust"
                style={{
                  width: `${2 + (i % 3)}px`,
                  height: `${2 + (i % 3)}px`,
                  background: `rgba(255, 200, 120, ${0.3 + (i % 3) * 0.1})`,
                  left: `${10 + i * 12}%`,
                  top: `${20 + (i * 17) % 60}%`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: `${3 + i % 2}s`,
                }}
              />
            ))}
          </div>
        )}
        {chapterTheme === 'gold_rush_town' && (
          /* Lantern glow flickers and smoke haze */
          <div className="absolute inset-0 pointer-events-none z-31 overflow-hidden">
            <div
              className="absolute inset-0 animate-lantern-flicker"
              style={{
                background: 'radial-gradient(ellipse at 30% 40%, rgba(255, 150, 50, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(255, 120, 40, 0.12) 0%, transparent 40%)',
              }}
            />
            {/* Smoke wisps */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-smoke-rise"
                style={{
                  width: '30px',
                  height: '20px',
                  background: 'radial-gradient(ellipse, rgba(80, 60, 40, 0.3) 0%, transparent 70%)',
                  left: `${15 + i * 25}%`,
                  bottom: '10%',
                  animationDelay: `${i * 1.2}s`,
                }}
              />
            ))}
          </div>
        )}
        {chapterTheme === 'mining_camp' && (
          /* Gold dust sparkles in the air */
          <div className="absolute inset-0 pointer-events-none z-31 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-gold-sparkle"
                style={{
                  width: `${1 + (i % 2)}px`,
                  height: `${1 + (i % 2)}px`,
                  background: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ffe44d' : '#ffaa00',
                  boxShadow: `0 0 ${2 + (i % 2)}px #ffd700`,
                  left: `${5 + i * 8}%`,
                  top: `${10 + (i * 23) % 80}%`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>
        )}
        {chapterTheme === 'pastoral_ranch' && (
          /* Floating pollen and gentle breeze particles */
          <div className="absolute inset-0 pointer-events-none z-31 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-pollen-drift"
                style={{
                  width: `${2 + (i % 2)}px`,
                  height: `${2 + (i % 2)}px`,
                  background: i % 2 === 0 ? 'rgba(255, 255, 200, 0.6)' : 'rgba(200, 255, 200, 0.5)',
                  left: `${5 + i * 10}%`,
                  top: `${30 + (i * 13) % 50}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${4 + i % 3}s`,
                }}
              />
            ))}
          </div>
        )}
        {chapterTheme === 'twilight_legacy' && (
          /* Fireflies and moonlit silver sparkles */
          <div className="absolute inset-0 pointer-events-none z-31 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-firefly"
                style={{
                  width: `${2 + (i % 2)}px`,
                  height: `${2 + (i % 2)}px`,
                  background: i % 2 === 0 ? '#aaff88' : '#88ffaa',
                  boxShadow: `0 0 ${4 + i % 3}px ${i % 2 === 0 ? '#88ff44' : '#44ff88'}`,
                  left: `${8 + i * 12}%`,
                  top: `${15 + (i * 19) % 70}%`,
                  animationDelay: `${i * 0.6}s`,
                }}
              />
            ))}
            {/* Moonlit silver sparkles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`moon-${i}`}
                className="absolute rounded-full animate-moonlit-sparkle"
                style={{
                  width: '1px',
                  height: '1px',
                  background: '#ffffff',
                  boxShadow: '0 0 3px #c8c8ff, 0 0 6px #a8a8ff',
                  left: `${12 + i * 15}%`,
                  top: `${20 + (i * 31) % 60}%`,
                  animationDelay: `${i * 0.8}s`,
                }}
              />
            ))}
          </div>
        )}
        {map.tiles.map((row, y) =>
          row.map((tile, x) => {
            const isPlayer = session.position.x === x && session.position.y === y
            const config = tileConfigs[tile]
            const interaction = map.interactionPoints.find(
              i => i.position.x === x && i.position.y === y
            )
            const exit = map.exits.find(e => e.position.x === x && e.position.y === y)

            // Use chapter-aware gradient for themed tiles, fallback to base for others
            const gradient = getChapterTileGradient(tile, chapterTheme)

            // Check if this tile is adjacent to player (valid move target)
            const isAdjacent = session && (
              (Math.abs(x - session.position.x) === 1 && y === session.position.y) ||
              (Math.abs(y - session.position.y) === 1 && x === session.position.x)
            )

            // Check if exit is locked
            let exitLocked = false
            if (exit?.requirement) {
              const result = checkExitRequirement(exit.requirement)
              exitLocked = !result.met
            }

            // Calculate tile visibility (fog of war)
            const posKey = `${x},${y}`
            const visibility = getTileVisibility(
              map.id,
              x,
              y,
              session.mapDiscovery || {},
              fogTiles,
              hiddenTiles
            )
            const isAnimating = recentlyRevealed.has(posKey)

            // Get visibility CSS class
            const visibilityClass =
              visibility === 'hidden' ? 'tile-hidden' :
              visibility === 'fog' ? 'tile-fog' :
              isAnimating ? 'tile-revealed-animated' : ''

            // Get graphics tier enhancements
            const tierEnhancement = getTierEnhancement(graphicsTier, tile)
            const tierTexture = getTierTexture(graphicsTier, tile)

            // Combine boxShadow with tier extras
            const combinedBoxShadow = [
              gradient.boxShadow,
              tierEnhancement.extraShadow,
            ].filter(Boolean).join(', ')

            return (
              <div
                key={`${x}-${y}`}
                className={`
                  relative aspect-square flex items-center justify-center overflow-hidden
                  ${config.walkable && visibility === 'revealed' ? 'cursor-pointer' : 'cursor-not-allowed'}
                  ${config.interactive && visibility === 'revealed' ? 'hover:brightness-125' : ''}
                  ${config.walkable && isAdjacent && visibility === 'revealed' ? 'hover:scale-105 hover:z-10' : ''}
                  transition-all duration-100
                  ${visibilityClass}
                `}
                style={{
                  background: gradient.background,
                  boxShadow: combinedBoxShadow || undefined,
                  minWidth: '28px',
                  minHeight: '28px',
                  filter: tierEnhancement.filter,
                  opacity: tierEnhancement.opacity,
                  // Animation based on tier and tile type
                  animation: tierEnhancement.animation ||
                    (tile === 'water' ? 'water-shimmer 3s ease-in-out infinite' :
                    tile === 'gold' ? 'gold-glow 2s ease-in-out infinite' :
                    (tile === 'campfire' || tile === 'firepit' || tile === 'hearth') ? 'campfire-flicker 0.5s ease-in-out infinite' :
                    tile === 'stars' && getTierIndex(graphicsTier) >= 2 ? 'twinkle 2s ease-in-out infinite' : undefined),
                }}
                onClick={() => handleTileClick(x, y)}
              >
                {/* Tier-based texture overlay */}
                {tierTexture && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: tierTexture,
                      backgroundSize: '100% 100%',
                      opacity: getTierIndex(graphicsTier) >= 3 ? 0.5 : 0.3,
                    }}
                  />
                )}
                {/* 8-bit tier texture overlay for grass tiles (at tier 1 only, higher tiers use tierTexture) */}
                {tile === 'grass' && getTierIndex(graphicsTier) === 1 && !tierTexture && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 30%, #5aaa62 1px, transparent 1px),
                        radial-gradient(circle at 70% 60%, #2d6a34 1px, transparent 1px),
                        radial-gradient(circle at 40% 80%, #4a9a52 1px, transparent 1px)
                      `,
                      backgroundSize: '100% 100%',
                    }}
                  />
                )}

                {/* 8-bit tier texture overlay for path tiles */}
                {tile === 'path' && getTierIndex(graphicsTier) === 1 && !tierTexture && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                      backgroundImage: `
                        radial-gradient(ellipse at 25% 50%, #8a7a5a 2px, transparent 2px),
                        radial-gradient(ellipse at 75% 40%, #706040 2px, transparent 2px)
                      `,
                      backgroundSize: '100% 100%',
                    }}
                  />
                )}

                {/* Water wave overlay (8-bit tier only, higher tiers use tierTexture) */}
                {tile === 'water' && getTierIndex(graphicsTier) === 1 && (
                  <>
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `
                          linear-gradient(180deg,
                            transparent 0%,
                            rgba(255, 255, 255, 0.15) 30%,
                            transparent 50%,
                            rgba(0, 40, 80, 0.2) 100%
                          )
                        `,
                      }}
                    />
                    {/* Animated wave lines */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-40"
                      style={{
                        backgroundImage: `
                          repeating-linear-gradient(
                            0deg,
                            transparent 0px,
                            transparent 3px,
                            rgba(255, 255, 255, 0.3) 3px,
                            rgba(255, 255, 255, 0.3) 4px
                          )
                        `,
                      }}
                    />
                  </>
                )}

                {/* CSS Pixel Art Tree for forest tiles - Chapter-aware colors */}
                {tile === 'forest' && !isPlayer && (() => {
                  // Chapter-specific tree color palettes
                  const treeColors = {
                    oregon_trail: { trunk: '#5a4030', foliage1: '#4a6a3a', foliage2: '#5a7a4a', foliage3: '#6a8a5a', shadow: '#3a5a2a' },
                    gold_rush_town: { trunk: '#3a2a1a', foliage1: '#1a3a1a', foliage2: '#2a4a2a', foliage3: '#3a5a3a', shadow: '#0a2a0a' },
                    mining_camp: { trunk: '#4a3a20', foliage1: '#2a5a2a', foliage2: '#3a6a3a', foliage3: '#4a7a4a', shadow: '#1a4a1a' },
                    pastoral_ranch: { trunk: '#5a4020', foliage1: '#1e6c2b', foliage2: '#2e8c3b', foliage3: '#3eac4b', shadow: '#0e4c1b' },
                    twilight_legacy: { trunk: '#3a3a4a', foliage1: '#2a4a4a', foliage2: '#3a5a5a', foliage3: '#4a6a6a', shadow: '#1a3a3a' },
                  }
                  const colors = treeColors[chapterTheme]
                  return (
                  <div className="absolute inset-0 flex items-end justify-center pointer-events-none" style={{ paddingBottom: '2px' }}>
                    <div className="relative" style={{ width: '20px', height: '24px' }}>
                      {/* Tree trunk */}
                      <div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2"
                        style={{
                          width: '4px',
                          height: '6px',
                          background: `linear-gradient(90deg, ${adjustColor(colors.trunk, -20)} 0%, ${colors.trunk} 50%, ${adjustColor(colors.trunk, -20)} 100%)`,
                          boxShadow: `0 1px 0 ${adjustColor(colors.trunk, -30)}`,
                        }}
                      />
                      {/* Tree foliage layers (32-bit Sega style) */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          bottom: '5px',
                          width: '14px',
                          height: '8px',
                          background: `linear-gradient(180deg, ${colors.foliage1} 0%, ${colors.shadow} 100%)`,
                          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                          boxShadow: `0 1px 0 ${adjustColor(colors.shadow, -10)}`,
                        }}
                      />
                      <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          bottom: '10px',
                          width: '10px',
                          height: '7px',
                          background: `linear-gradient(180deg, ${colors.foliage2} 0%, ${colors.foliage1} 100%)`,
                          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                        }}
                      />
                      <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          bottom: '14px',
                          width: '6px',
                          height: '5px',
                          background: `linear-gradient(180deg, ${colors.foliage3} 0%, ${colors.foliage2} 100%)`,
                          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                        }}
                      />
                    </div>
                  </div>
                )})()}

                {/* CSS Pixel Art Mountain for mountain tiles - Chapter-aware colors */}
                {tile === 'mountain' && !isPlayer && (() => {
                  // Chapter-specific mountain color palettes
                  const mountainColors = {
                    oregon_trail: { base: '#9a8a6a', mid: '#7a6a4a', dark: '#5a4a2a', snow: '#f8f0e0', snowShadow: '#e8d8c0' },
                    gold_rush_town: { base: '#6a5a4a', mid: '#4a3a2a', dark: '#2a2a1a', snow: '#d8d8d0', snowShadow: '#b8b8a8' },
                    mining_camp: { base: '#8a7a5a', mid: '#6a5a3a', dark: '#4a3a1a', snow: '#ffffff', snowShadow: '#e0e0e0' },
                    pastoral_ranch: { base: '#7a8a7a', mid: '#5a6a5a', dark: '#3a4a3a', snow: '#ffffff', snowShadow: '#e8f0e8' },
                    twilight_legacy: { base: '#6a6a8a', mid: '#4a4a6a', dark: '#2a2a4a', snow: '#e8e8ff', snowShadow: '#c8c8e8' },
                  }
                  const colors = mountainColors[chapterTheme]
                  return (
                  <div className="absolute inset-0 flex items-end justify-center pointer-events-none" style={{ paddingBottom: '2px' }}>
                    <div className="relative" style={{ width: '24px', height: '22px' }}>
                      {/* Mountain base */}
                      <div
                        className="absolute bottom-0 left-0"
                        style={{
                          width: '24px',
                          height: '16px',
                          background: `linear-gradient(135deg, ${colors.base} 0%, ${colors.mid} 50%, ${colors.dark} 100%)`,
                          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                        }}
                      />
                      {/* Snow cap */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          bottom: '12px',
                          width: '8px',
                          height: '6px',
                          background: `linear-gradient(180deg, ${colors.snow} 0%, ${colors.snowShadow} 100%)`,
                          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        }}
                      />
                    </div>
                  </div>
                )})()}

                {/* CSS Pixel Art Campfire */}
                {(tile === 'campfire' || tile === 'firepit') && !isPlayer && (
                  <div className="absolute inset-0 flex items-end justify-center pointer-events-none" style={{ paddingBottom: '4px' }}>
                    <div className="relative" style={{ width: '20px', height: '20px' }}>
                      {/* Log base */}
                      <div
                        className="absolute bottom-0 left-0"
                        style={{
                          width: '20px',
                          height: '4px',
                          background: 'linear-gradient(90deg, #4a3020 0%, #654321 50%, #4a3020 100%)',
                          borderRadius: '2px',
                        }}
                      />
                      {/* Fire flames */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          bottom: '3px',
                          width: '12px',
                          height: '14px',
                          background: 'linear-gradient(180deg, #ff4400 0%, #ff8800 40%, #ffcc00 100%)',
                          clipPath: 'polygon(50% 0%, 80% 40%, 70% 70%, 100% 100%, 0% 100%, 30% 70%, 20% 40%)',
                          filter: 'drop-shadow(0 0 4px #ff6600)',
                        }}
                      />
                      {/* Inner flame */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          bottom: '5px',
                          width: '6px',
                          height: '8px',
                          background: 'linear-gradient(180deg, #ffff00 0%, #ffcc00 100%)',
                          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* CSS Pixel Art Rock */}
                {tile === 'rock' && !isPlayer && (
                  <div className="absolute inset-0 flex items-end justify-center pointer-events-none" style={{ paddingBottom: '2px' }}>
                    <div className="relative" style={{ width: '22px', height: '16px' }}>
                      <div
                        className="absolute bottom-0 left-0"
                        style={{
                          width: '22px',
                          height: '14px',
                          background: 'linear-gradient(135deg, #9a9a9a 0%, #6a6a6a 40%, #4a4a4a 100%)',
                          borderRadius: '4px 6px 2px 3px',
                          boxShadow: 'inset 2px 2px 0 #aaaaaa, inset -2px -2px 0 #3a3a3a',
                        }}
                      />
                      {/* Highlight */}
                      <div
                        className="absolute"
                        style={{
                          top: '2px',
                          left: '4px',
                          width: '6px',
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.3)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tile icon (for tiles without custom CSS art) */}
                {config.icon && !isPlayer && tile !== 'forest' && tile !== 'mountain' && tile !== 'campfire' && tile !== 'firepit' && tile !== 'rock' && (
                  <span className="text-lg sm:text-xl select-none drop-shadow-md">{config.icon}</span>
                )}

                {/* Interaction icon override */}
                {interaction?.icon && !isPlayer && (
                  <span className="text-lg sm:text-xl select-none drop-shadow-md">{interaction.icon}</span>
                )}

                {/* Player */}
                {isPlayer && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="drop-shadow-lg transform scale-75 sm:scale-100">
                      <ProspectorSprite />
                    </div>
                  </div>
                )}

                {/* Interactive indicator - Chapter-aware 32-bit style */}
                {config.interactive && !isPlayer && (
                  <>
                    {/* Glowing exclamation mark - uses chapter palette */}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-20">
                      <div
                        className="font-[var(--font-pixel)] text-[10px] font-bold animate-bounce"
                        style={{
                          color: chapterTheme === 'twilight_legacy' ? '#c8b8ff' :
                                 chapterTheme === 'pastoral_ranch' ? '#88ff88' :
                                 chapterTheme === 'gold_rush_town' ? '#ffaa44' : '#ffd700',
                          textShadow: `0 0 4px ${chapterPalette.interactiveGlow}, 0 0 8px ${chapterPalette.atmosphereGlow}, 0 1px 0 rgba(0,0,0,0.5)`,
                          animationDuration: '1s',
                        }}
                      >
                        !
                      </div>
                    </div>
                    {/* Pulsing glow ring - chapter-specific */}
                    <div
                      className="absolute inset-0 rounded-sm animate-pulse pointer-events-none"
                      style={{
                        boxShadow: `0 0 8px 2px ${chapterPalette.interactiveGlow}, inset 0 0 4px ${chapterPalette.atmosphereGlow}`,
                        animationDuration: '1.5s',
                      }}
                    />
                  </>
                )}

                {/* Exit indicator */}
                {exit && !isPlayer && (
                  <div className="absolute inset-0 flex items-center justify-center z-15">
                    {exitLocked ? (
                      <>
                        {/* Locked exit - red lock icon */}
                        <div
                          className="text-xs font-bold"
                          style={{
                            color: '#ff4444',
                            textShadow: '0 0 4px #aa0000, 0 1px 0 #660000',
                          }}
                        >
                          🔒
                        </div>
                        {/* Red glow for locked */}
                        <div
                          className="absolute inset-0 rounded-sm animate-pulse pointer-events-none"
                          style={{
                            boxShadow: '0 0 6px 2px rgba(255, 0, 0, 0.4), inset 0 0 4px rgba(255, 0, 0, 0.2)',
                            animationDuration: '2s',
                          }}
                        />
                      </>
                    ) : (
                      <>
                        {/* Unlocked exit - glowing arrow */}
                        <div
                          className="text-sm animate-pulse"
                          style={{
                            color: '#44ff88',
                            textShadow: '0 0 6px #00ff44, 0 0 12px #00aa22',
                            animationDuration: '1.5s',
                          }}
                        >
                          →
                        </div>
                        {/* Green glow for unlocked */}
                        <div
                          className="absolute inset-0 rounded-sm pointer-events-none"
                          style={{
                            boxShadow: '0 0 8px 2px rgba(68, 255, 136, 0.4), inset 0 0 4px rgba(68, 255, 136, 0.2)',
                          }}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Map name */}
      <div className="absolute top-0 left-0 bg-[var(--pixel-bg-dark)] px-2 py-1 border-2 border-[var(--pixel-ui-border)]">
        <span className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-gold-light)]">
          {map.name}
        </span>
      </div>

      {/* Controls hint */}
      <div className="mt-2 text-center">
        <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)]">
          Arrow keys or WASD to move | Space to interact | Tap tiles on mobile
        </p>
      </div>

      {/* Locked exit message popup */}
      {lockedMessage && (
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-pulse"
          style={{
            background: 'linear-gradient(180deg, rgba(60, 20, 20, 0.95), rgba(40, 10, 10, 0.98))',
            border: '3px solid #aa3333',
            borderRadius: '4px',
            padding: '12px 20px',
            boxShadow: '0 0 20px rgba(170, 50, 50, 0.6), inset 0 0 10px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <p
              className="font-[var(--font-pixel)] text-[12px] sm:text-[14px]"
              style={{
                color: '#ffaaaa',
                textShadow: '0 1px 0 #660000',
              }}
            >
              {lockedMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
