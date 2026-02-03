'use client'

import React from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'
import { type ChapterType } from '../../data/worldMaps'

interface MapSVGDefsProps {
  graphicsTier: GraphicsTier
  chapter: ChapterType
}

export function MapSVGDefs({ graphicsTier, chapter }: MapSVGDefsProps) {
  const isRetro = graphicsTier === 'retro_4bit'
  const isClassic = graphicsTier === 'classic_8bit'
  const isEnhanced = graphicsTier === 'enhanced_16bit'
  const isModern = graphicsTier === 'modern_32bit'
  const isUltra = graphicsTier === 'ultra_64bit'
  const highDetail = isModern || isUltra

  return (
    <defs>
      {/* ========== TERRAIN PATTERNS ========== */}

      {/* Forest pattern - pixel-art trees */}
      <pattern id="pattern-forest" patternUnits="userSpaceOnUse" width={isRetro ? 12 : 8} height={isRetro ? 12 : 8}>
        {isRetro ? (
          <rect width="12" height="12" fill="#2d5a3d" />
        ) : (
          <>
            <rect width="8" height="8" fill="#2d5a3d" />
            <rect x="3" y="1" width="2" height="2" fill="#1e4d2b" />
            <rect x="2" y="3" width="4" height="1" fill="#3e8948" />
            <rect x="3" y="4" width="2" height="2" fill="#1e4d2b" />
            <rect x="3" y="6" width="2" height="1" fill="#5c3d2e" />
          </>
        )}
      </pattern>

      {/* Mountain pattern - triangle peaks */}
      <pattern id="pattern-mountains" patternUnits="userSpaceOnUse" width={isRetro ? 16 : 10} height={isRetro ? 16 : 10}>
        {isRetro ? (
          <>
            <rect width="16" height="16" fill="#6b5040" />
            <rect x="4" y="8" width="8" height="8" fill="#8f6845" />
          </>
        ) : (
          <>
            <rect width="10" height="10" fill="#6b5040" />
            <polygon points="5,2 8,8 2,8" fill="#8f6845" />
            {highDetail && <polygon points="5,1 6,3 4,3" fill="#c0cbdc" />}
          </>
        )}
      </pattern>

      {/* Desert pattern - stipple */}
      <pattern id="pattern-desert" patternUnits="userSpaceOnUse" width="6" height="6">
        <rect width="6" height="6" fill="#D2B48C" />
        {!isRetro && (
          <>
            <circle cx="1" cy="1" r="0.5" fill="#c4a574" />
            <circle cx="4" cy="3" r="0.5" fill="#b89b6a" />
            <circle cx="2" cy="5" r="0.4" fill="#c4a574" />
          </>
        )}
      </pattern>

      {/* Water pattern - wavy lines */}
      <pattern id="pattern-water" patternUnits="userSpaceOnUse" width="12" height="6">
        <rect width="12" height="6" fill="#3b6ea5" />
        {isRetro ? (
          <rect x="0" y="2" width="12" height="2" fill="#4a8ac0" />
        ) : (
          <>
            <path d="M0,3 Q3,1 6,3 Q9,5 12,3" stroke="#5ba0d0" strokeWidth="0.8" fill="none" opacity="0.7">
              {isUltra && (
                <animate attributeName="d" dur="2s" repeatCount="indefinite"
                  values="M0,3 Q3,1 6,3 Q9,5 12,3;M0,3 Q3,5 6,3 Q9,1 12,3;M0,3 Q3,1 6,3 Q9,5 12,3" />
              )}
            </path>
            {highDetail && (
              <path d="M0,5 Q3,3 6,5 Q9,7 12,5" stroke="#5ba0d0" strokeWidth="0.5" fill="none" opacity="0.4">
                {isUltra && (
                  <animate attributeName="d" dur="2.5s" repeatCount="indefinite"
                    values="M0,5 Q3,3 6,5 Q9,7 12,5;M0,5 Q3,7 6,5 Q9,3 12,5;M0,5 Q3,3 6,5 Q9,7 12,5" />
                )}
              </path>
            )}
          </>
        )}
      </pattern>

      {/* Grass pattern - short dashes */}
      <pattern id="pattern-grass" patternUnits="userSpaceOnUse" width="8" height="8">
        <rect width="8" height="8" fill="#588157" />
        {!isRetro && (
          <>
            <line x1="2" y1="6" x2="2" y2="4" stroke="#6aab5c" strokeWidth="0.6" />
            <line x1="5" y1="7" x2="5" y2="5" stroke="#6aab5c" strokeWidth="0.6" />
            <line x1="7" y1="6" x2="7" y2="3" stroke="#4a7a3d" strokeWidth="0.6" />
          </>
        )}
      </pattern>

      {/* Mine tailings pattern */}
      <pattern id="pattern-mine" patternUnits="userSpaceOnUse" width="8" height="8">
        <rect width="8" height="8" fill="#5c5040" />
        {!isRetro && (
          <>
            <rect x="1" y="2" width="2" height="1" fill="#7a6b55" />
            <rect x="5" y="5" width="2" height="1" fill="#4a3f30" />
            <circle cx="3" cy="6" r="0.8" fill="#8b7355" />
          </>
        )}
      </pattern>

      {/* ========== GRADIENTS ========== */}

      {/* Chapter 1 background - green prairie to mountain */}
      <linearGradient id="grad-ch1-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3a5a40" />
        <stop offset="50%" stopColor="#588157" />
        <stop offset="100%" stopColor="#a3b18a" />
      </linearGradient>

      {/* Chapter 2 background - gold country foothills */}
      <linearGradient id="grad-ch2-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8b7355" />
        <stop offset="50%" stopColor="#a08060" />
        <stop offset="100%" stopColor="#c4a574" />
      </linearGradient>

      {/* Fog gradient for fog of war */}
      <radialGradient id="grad-fog-hidden">
        <stop offset="0%" stopColor="black" stopOpacity="1" />
        <stop offset="70%" stopColor="black" stopOpacity="0.8" />
        <stop offset="100%" stopColor="black" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="grad-fog-scoutable">
        <stop offset="0%" stopColor="black" stopOpacity="0.6" />
        <stop offset="50%" stopColor="black" stopOpacity="0.3" />
        <stop offset="100%" stopColor="black" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="grad-fog-scouting">
        <stop offset="0%" stopColor="black" stopOpacity="0.2" />
        <stop offset="40%" stopColor="black" stopOpacity="0.1" />
        <stop offset="100%" stopColor="black" stopOpacity="0" />
      </radialGradient>

      {/* Danger zone gradients */}
      <radialGradient id="grad-danger-high">
        <stop offset="0%" stopColor="#ff0000" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
      </radialGradient>

      <radialGradient id="grad-danger-normal">
        <stop offset="0%" stopColor="#ffc800" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#ffc800" stopOpacity="0" />
      </radialGradient>

      {/* Gold glow for active paths */}
      <linearGradient id="grad-path-active" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#f4d76b" />
        <stop offset="50%" stopColor="#e8a027" />
        <stop offset="100%" stopColor="#f4d76b" />
      </linearGradient>

      {/* ========== FILTERS ========== */}

      {/* Pixel shadow for markers */}
      <filter id="filter-pixel-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="1" stdDeviation={isRetro ? 0 : 1} floodColor="#000" floodOpacity="0.5" />
      </filter>

      {/* Gold glow for current location */}
      <filter id="filter-gold-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation={isRetro ? 1 : 3} result="blur" />
        <feFlood floodColor="#ffd700" floodOpacity="0.6" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Fog blur for soft mask edges */}
      <filter id="filter-fog-blur">
        <feGaussianBlur stdDeviation={isRetro ? 0 : isClassic ? 2 : 4} />
      </filter>

      {/* Scouting pulse */}
      <filter id="filter-scout-pulse" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feFlood floodColor="#d4a843" floodOpacity="0.5" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Tier-specific retro/pixelation filters */}
      {isRetro && (
        <filter id="filter-tier-retro">
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            <feFuncG type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            <feFuncB type="discrete" tableValues="0 0.25 0.5 0.75 1" />
          </feComponentTransfer>
        </filter>
      )}

      {isClassic && (
        <filter id="filter-tier-classic">
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.14 0.29 0.43 0.57 0.71 0.86 1" />
            <feFuncG type="discrete" tableValues="0 0.14 0.29 0.43 0.57 0.71 0.86 1" />
            <feFuncB type="discrete" tableValues="0 0.14 0.29 0.43 0.57 0.71 0.86 1" />
          </feComponentTransfer>
        </filter>
      )}

      {/* CRT green overlay for GoldCountryExplore PipBoy */}
      <filter id="filter-crt-green">
        <feColorMatrix type="matrix" values="
          0.2 0.7 0.1 0 0
          0.1 0.8 0.1 0 0.05
          0.05 0.3 0.05 0 0
          0 0 0 1 0
        " />
      </filter>

      {/* ========== FOG OF WAR MASK TEMPLATE ========== */}
      {/* Actual mask instances are created dynamically in MapFogOfWar */}
    </defs>
  )
}

export default MapSVGDefs
