'use client'

import React from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'
import { type LocationType, type ServiceType } from '../../data/worldMaps'

interface MapIconProps {
  type: LocationType | ServiceType | 'player' | 'question' | 'cave' | 'cabin' | 'crystal' | 'frog' | 'wine' | 'grapes' | 'bridge' | 'saloon_icon' | 'building'
  tier: GraphicsTier
  size?: number
  glow?: boolean
  dimmed?: boolean
  animated?: boolean
}

function getTierScale(tier: GraphicsTier): number {
  switch (tier) {
    case 'retro_4bit': return 8
    case 'classic_8bit': return 12
    case 'enhanced_16bit': return 16
    case 'modern_32bit': return 24
    case 'ultra_64bit': return 32
  }
}

export function MapIcon({ type, tier, size, glow = false, dimmed = false, animated = false }: MapIconProps) {
  const baseSize = size ?? getTierScale(tier)
  const s = baseSize
  const isRetro = tier === 'retro_4bit'
  const isUltra = tier === 'ultra_64bit'

  const wrapperProps = {
    width: s,
    height: s,
    viewBox: '0 0 16 16',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    style: {
      opacity: dimmed ? 0.4 : 1,
      filter: glow ? 'drop-shadow(0 0 3px #ffd700)' : undefined,
    } as React.CSSProperties,
    className: animated && isUltra ? 'map-icon-animated' : undefined,
  }

  const renderIcon = () => {
    switch (type) {
      // ===== Location Types =====
      case 'town':
        return (
          <svg {...wrapperProps}>
            {/* Buildings cluster */}
            <rect x="2" y="8" width="4" height="6" fill="#8f6845" />
            <rect x="3" y="9" width="2" height="1" fill="#f4d76b" />
            <rect x="3" y="11" width="1" height="1" fill="#f4d76b" />
            <rect x="7" y="6" width="5" height="8" fill="#a08060" />
            <rect x="8" y="7" width="1" height="1" fill="#f4d76b" />
            <rect x="10" y="7" width="1" height="1" fill="#f4d76b" />
            <rect x="9" y="10" width="1" height="4" fill="#5c3d2e" />
            {!isRetro && <rect x="1" y="7" width="6" height="1" fill="#6b5040" />}
            {!isRetro && <rect x="6" y="5" width="7" height="1" fill="#6b5040" />}
            <rect x="0" y="14" width="16" height="2" fill="#3b2a1f" />
          </svg>
        )

      case 'fort':
        return (
          <svg {...wrapperProps}>
            {/* Fort walls with flag */}
            <rect x="1" y="6" width="14" height="8" fill="#a08060" />
            <rect x="1" y="6" width="2" height="2" fill="#8f6845" />
            <rect x="5" y="6" width="2" height="2" fill="#8f6845" />
            <rect x="9" y="6" width="2" height="2" fill="#8f6845" />
            <rect x="13" y="6" width="2" height="2" fill="#8f6845" />
            <rect x="6" y="10" width="4" height="4" fill="#5c3d2e" />
            {/* Flag */}
            <rect x="7" y="1" width="1" height="5" fill="#5c3d2e" />
            <rect x="8" y="1" width="4" height="3" fill="#b13e53" />
            <rect x="0" y="14" width="16" height="2" fill="#3b2a1f" />
          </svg>
        )

      case 'river':
        return (
          <svg {...wrapperProps}>
            {/* Waves */}
            <path d="M1,6 Q4,4 8,6 Q12,8 15,6" stroke="#5ba0d0" strokeWidth="1.5" fill="none" />
            <path d="M1,9 Q4,7 8,9 Q12,11 15,9" stroke="#3b6ea5" strokeWidth="1.5" fill="none" />
            <path d="M1,12 Q4,10 8,12 Q12,14 15,12" stroke="#5ba0d0" strokeWidth="1.5" fill="none" />
            {!isRetro && <circle cx="3" cy="8" r="0.5" fill="#87ceeb" opacity="0.6" />}
            {!isRetro && <circle cx="11" cy="11" r="0.5" fill="#87ceeb" opacity="0.6" />}
          </svg>
        )

      case 'landmark':
        return (
          <svg {...wrapperProps}>
            {/* Spire/obelisk */}
            <polygon points="8,1 11,12 5,12" fill="#c0cbdc" />
            <rect x="4" y="12" width="8" height="2" fill="#8f6845" />
            {!isRetro && <line x1="8" y1="3" x2="8" y2="11" stroke="#a0abbc" strokeWidth="0.5" />}
            <rect x="0" y="14" width="16" height="2" fill="#3b2a1f" />
          </svg>
        )

      case 'mine':
        return (
          <svg {...wrapperProps}>
            {/* Pickaxe */}
            <line x1="3" y1="13" x2="12" y2="4" stroke="#8f6845" strokeWidth="1.5" />
            <polygon points="12,4 15,2 14,6" fill="#c0cbdc" />
            {!isRetro && <polygon points="12,4 10,2 14,3" fill="#a0abbc" />}
            {/* Mine entrance */}
            <rect x="1" y="10" width="6" height="4" fill="#3b2a1f" />
            <rect x="2" y="10" width="4" height="3" fill="#1a1c2c" />
            {!isRetro && <rect x="1" y="10" width="6" height="1" fill="#5c3d2e" />}
            <rect x="0" y="14" width="16" height="2" fill="#3b2a1f" />
          </svg>
        )

      case 'ghost_town':
        return (
          <svg {...wrapperProps}>
            {/* Ruined building with X windows */}
            <rect x="3" y="6" width="10" height="8" fill="#6b5040" opacity="0.7" />
            {/* X windows */}
            <line x1="5" y1="8" x2="7" y2="10" stroke="#1a1c2c" strokeWidth="0.8" />
            <line x1="7" y1="8" x2="5" y2="10" stroke="#1a1c2c" strokeWidth="0.8" />
            <line x1="9" y1="8" x2="11" y2="10" stroke="#1a1c2c" strokeWidth="0.8" />
            <line x1="11" y1="8" x2="9" y2="10" stroke="#1a1c2c" strokeWidth="0.8" />
            {/* Collapsed roof */}
            <polygon points="2,6 8,2 14,6 12,6 8,4 4,6" fill="#5c3d2e" opacity="0.8" />
            {!isRetro && <line x1="9" y1="3" x2="11" y2="6" stroke="#3b2a1f" strokeWidth="0.5" />}
            <rect x="0" y="14" width="16" height="2" fill="#3b2a1f" />
          </svg>
        )

      case 'pass':
        return (
          <svg {...wrapperProps}>
            {/* Twin mountain peaks with gap */}
            <polygon points="0,14 4,4 8,10" fill="#8f6845" />
            <polygon points="8,10 12,4 16,14" fill="#6b5040" />
            {!isRetro && <polygon points="4,3 5,5 3,5" fill="#c0cbdc" />}
            {!isRetro && <polygon points="12,3 13,5 11,5" fill="#c0cbdc" />}
            {/* Path through */}
            <line x1="7" y1="11" x2="9" y2="11" stroke="#e8a027" strokeWidth="1" strokeDasharray="1,1" />
            <rect x="0" y="14" width="16" height="2" fill="#3b2a1f" />
          </svg>
        )

      case 'spring':
        return (
          <svg {...wrapperProps}>
            {/* Water droplet with steam */}
            <ellipse cx="8" cy="11" rx="4" ry="3" fill="#3b6ea5" />
            {!isRetro && <ellipse cx="7" cy="10" rx="1.5" ry="1" fill="#5ba0d0" opacity="0.5" />}
            {/* Steam wisps */}
            <path d="M6,7 Q5,5 6,3" stroke="#c0cbdc" strokeWidth="0.8" fill="none" opacity="0.5" />
            <path d="M8,6 Q7,4 8,2" stroke="#c0cbdc" strokeWidth="0.8" fill="none" opacity="0.6" />
            <path d="M10,7 Q9,5 10,3" stroke="#c0cbdc" strokeWidth="0.8" fill="none" opacity="0.5" />
          </svg>
        )

      case 'mountains':
        return (
          <svg {...wrapperProps}>
            {/* Triple peak */}
            <polygon points="0,14 5,4 10,14" fill="#6b5040" />
            <polygon points="4,14 8,2 12,14" fill="#8f6845" />
            <polygon points="8,14 13,5 16,14" fill="#5c3d2e" />
            {!isRetro && <polygon points="8,1 9,3 7,3" fill="#c0cbdc" />}
            {!isRetro && <polygon points="5,3 6,5 4,5" fill="#c0cbdc" opacity="0.7" />}
          </svg>
        )

      case 'destination':
        return (
          <svg {...wrapperProps}>
            {/* Star */}
            <polygon points="8,1 10,6 15,6 11,9 13,14 8,11 3,14 5,9 1,6 6,6" fill="#f4d76b" />
            {!isRetro && <polygon points="8,3 9,6 12,6 10,8 11,11 8,9 5,11 6,8 4,6 7,6" fill="#e8a027" />}
          </svg>
        )

      case 'desert':
        return (
          <svg {...wrapperProps}>
            {/* Cactus */}
            <rect x="7" y="4" width="2" height="10" fill="#3e8948" />
            <rect x="3" y="6" width="4" height="2" fill="#3e8948" />
            <rect x="3" y="4" width="2" height="4" fill="#3e8948" />
            <rect x="11" y="8" width="2" height="4" fill="#3e8948" />
            <rect x="9" y="8" width="4" height="2" fill="#3e8948" />
            {!isRetro && <rect x="8" y="5" width="1" height="1" fill="#4aa84a" opacity="0.5" />}
            <rect x="0" y="14" width="16" height="2" fill="#D2B48C" />
          </svg>
        )

      case 'cave':
        return (
          <svg {...wrapperProps}>
            {/* Cave arch */}
            <path d="M2,14 L2,8 Q2,4 8,3 Q14,4 14,8 L14,14" fill="#6b5040" />
            <path d="M4,14 L4,9 Q4,6 8,5 Q12,6 12,9 L12,14" fill="#1a1c2c" />
            {!isRetro && <circle cx="7" cy="10" r="0.5" fill="#f4d76b" opacity="0.3" />}
            {!isRetro && <circle cx="10" cy="11" r="0.4" fill="#f4d76b" opacity="0.2" />}
          </svg>
        )

      case 'cabin':
        return (
          <svg {...wrapperProps}>
            {/* Log cabin */}
            <rect x="2" y="7" width="12" height="7" fill="#8f6845" />
            <polygon points="1,7 8,2 15,7" fill="#5c3d2e" />
            <rect x="6" y="10" width="3" height="4" fill="#3b2a1f" />
            <rect x="3" y="8" width="2" height="2" fill="#f4d76b" />
            <rect x="11" y="8" width="2" height="2" fill="#f4d76b" />
            {!isRetro && <rect x="9" y="3" width="1" height="3" fill="#5c3d2e" />}
            {!isRetro && <rect x="8" y="2" width="3" height="2" fill="#888" opacity="0.4" />}
            <rect x="0" y="14" width="16" height="2" fill="#3b2a1f" />
          </svg>
        )

      // ===== Service Icons =====
      case 'inn':
        return (
          <svg {...wrapperProps}>
            {/* Bed */}
            <rect x="2" y="8" width="12" height="4" fill="#5c3d2e" />
            <rect x="2" y="6" width="4" height="4" fill="#c0cbdc" />
            <rect x="1" y="5" width="2" height="9" fill="#3b2a1f" />
            <rect x="13" y="9" width="2" height="5" fill="#3b2a1f" />
          </svg>
        )

      case 'shop':
        return (
          <svg {...wrapperProps}>
            {/* Bag/sack */}
            <ellipse cx="8" cy="10" rx="5" ry="4" fill="#a08060" />
            <path d="M5,7 Q8,4 11,7" stroke="#8f6845" strokeWidth="1.5" fill="none" />
            {!isRetro && <line x1="8" y1="5" x2="8" y2="3" stroke="#8f6845" strokeWidth="1" />}
          </svg>
        )

      case 'telegraph':
        return (
          <svg {...wrapperProps}>
            {/* Lightning bolt */}
            <polygon points="9,1 5,8 8,8 6,15 12,7 9,7" fill="#f4d76b" />
          </svg>
        )

      case 'saloon':
      case 'saloon_icon':
        return (
          <svg {...wrapperProps}>
            {/* Mug */}
            <rect x="3" y="5" width="8" height="8" rx="1" fill="#a08060" />
            <rect x="4" y="6" width="6" height="3" fill="#e8a027" />
            <path d="M11,7 Q14,7 14,9 Q14,11 11,11" stroke="#a08060" strokeWidth="1.2" fill="none" />
            {!isRetro && <rect x="4" y="5" width="6" height="1" fill="#c0cbdc" opacity="0.4" />}
          </svg>
        )

      case 'assay':
        return (
          <svg {...wrapperProps}>
            {/* Scales */}
            <line x1="8" y1="2" x2="8" y2="12" stroke="#a08060" strokeWidth="1" />
            <line x1="3" y1="4" x2="13" y2="4" stroke="#a08060" strokeWidth="1" />
            <path d="M2,4 L1,8 L5,8 Z" fill="#e8a027" />
            <path d="M14,4 L11,8 L15,8 Z" fill="#e8a027" />
            <rect x="6" y="12" width="4" height="2" fill="#a08060" />
          </svg>
        )

      case 'church':
        return (
          <svg {...wrapperProps}>
            {/* Cross */}
            <rect x="7" y="1" width="2" height="8" fill="#c0cbdc" />
            <rect x="5" y="3" width="6" height="2" fill="#c0cbdc" />
            <rect x="3" y="9" width="10" height="5" fill="#a08060" />
            <rect x="7" y="10" width="2" height="4" fill="#5c3d2e" />
          </svg>
        )

      case 'stable':
        return (
          <svg {...wrapperProps}>
            {/* Horse head */}
            <path d="M4,14 L4,6 Q4,3 7,2 L10,2 Q12,3 12,5 L12,8 L14,10 L14,14" fill="#8f6845" />
            <rect x="10" y="4" width="1" height="1" fill="#1a1c2c" />
            {!isRetro && <path d="M6,2 L5,0 L7,1" fill="#6b5040" />}
            {!isRetro && <path d="M9,2 L8,0 L10,1" fill="#6b5040" />}
          </svg>
        )

      case 'blacksmith':
        return (
          <svg {...wrapperProps}>
            {/* Hammer */}
            <rect x="7" y="2" width="2" height="10" fill="#8f6845" rx="0.5" />
            <rect x="4" y="1" width="8" height="4" rx="1" fill="#6b7b8d" />
            {!isRetro && <rect x="5" y="2" width="6" height="1" fill="#8899aa" />}
          </svg>
        )

      case 'doctor':
        return (
          <svg {...wrapperProps}>
            {/* Medical cross */}
            <rect x="2" y="2" width="12" height="12" rx="2" fill="#c0cbdc" />
            <rect x="6" y="4" width="4" height="8" fill="#b13e53" />
            <rect x="4" y="6" width="8" height="4" fill="#b13e53" />
          </svg>
        )

      // ===== Special Icons =====
      case 'player':
        return (
          <svg {...wrapperProps}>
            {isRetro ? (
              <>
                {/* Simple horse blocky */}
                <rect x="4" y="4" width="8" height="6" fill="#8f6845" />
                <rect x="10" y="2" width="4" height="4" fill="#8f6845" />
                <rect x="12" y="1" width="2" height="2" fill="#6b5040" />
                <rect x="4" y="10" width="2" height="4" fill="#6b5040" />
                <rect x="10" y="10" width="2" height="4" fill="#6b5040" />
              </>
            ) : (
              <>
                {/* Detailed horse */}
                <path d="M3,12 L3,7 Q3,5 5,4 L9,4 Q11,4 12,3 L14,1 L14,4 Q14,6 12,7 L12,12" fill="#8f6845" />
                <rect x="13" y="2" width="1" height="1" fill="#1a1c2c" />
                <rect x="3" y="12" width="2" height="2" fill="#6b5040" />
                <rect x="10" y="12" width="2" height="2" fill="#6b5040" />
                {!isRetro && <path d="M12,1 L14,0 L14,1" fill="#5c3d2e" />}
                {!isRetro && <line x1="3" y1="5" x2="1" y2="4" stroke="#6b5040" strokeWidth="0.8" />}
              </>
            )}
          </svg>
        )

      case 'question':
        return (
          <svg {...wrapperProps}>
            <circle cx="8" cy="8" r="6" fill="#29366f" stroke="#41a6f6" strokeWidth="1" />
            <text x="8" y="11" textAnchor="middle" fill="#c0cbdc" fontSize="8" fontFamily="monospace" fontWeight="bold">?</text>
          </svg>
        )

      case 'frog':
        return (
          <svg {...wrapperProps}>
            <ellipse cx="8" cy="10" rx="5" ry="4" fill="#3e8948" />
            <circle cx="5" cy="6" r="2" fill="#3e8948" />
            <circle cx="11" cy="6" r="2" fill="#3e8948" />
            <circle cx="5" cy="5" r="1" fill="#f4d76b" />
            <circle cx="11" cy="5" r="1" fill="#f4d76b" />
            <circle cx="5" cy="5" r="0.4" fill="#1a1c2c" />
            <circle cx="11" cy="5" r="0.4" fill="#1a1c2c" />
          </svg>
        )

      case 'wine':
        return (
          <svg {...wrapperProps}>
            <rect x="7" y="8" width="2" height="4" fill="#8f6845" />
            <rect x="5" y="12" width="6" height="2" fill="#8f6845" />
            <path d="M4,2 L4,6 Q4,9 8,9 Q12,9 12,6 L12,2 Z" fill="#5d275d" />
            {!isRetro && <ellipse cx="7" cy="5" rx="1.5" ry="2" fill="#7a3a7a" opacity="0.5" />}
          </svg>
        )

      case 'grapes':
        return (
          <svg {...wrapperProps}>
            <circle cx="6" cy="8" r="2" fill="#5d275d" />
            <circle cx="10" cy="8" r="2" fill="#5d275d" />
            <circle cx="8" cy="6" r="2" fill="#7a3a7a" />
            <circle cx="8" cy="10" r="2" fill="#5d275d" />
            <line x1="8" y1="4" x2="8" y2="1" stroke="#3e8948" strokeWidth="1" />
            <ellipse cx="10" cy="2" rx="2" ry="1" fill="#3e8948" />
          </svg>
        )

      case 'crystal':
        return (
          <svg {...wrapperProps}>
            <polygon points="8,1 12,6 10,14 6,14 4,6" fill="#87ceeb" opacity="0.8" />
            <polygon points="8,2 10,6 8,12 6,6" fill="#5ba0d0" opacity="0.6" />
            {!isRetro && <line x1="8" y1="1" x2="8" y2="12" stroke="#c0e8ff" strokeWidth="0.5" opacity="0.4" />}
          </svg>
        )

      case 'bridge':
        return (
          <svg {...wrapperProps}>
            <path d="M1,10 Q8,4 15,10" stroke="#a08060" strokeWidth="2" fill="none" />
            <line x1="4" y1="8" x2="4" y2="14" stroke="#8f6845" strokeWidth="1.5" />
            <line x1="12" y1="8" x2="12" y2="14" stroke="#8f6845" strokeWidth="1.5" />
            <line x1="1" y1="10" x2="15" y2="10" stroke="#6b5040" strokeWidth="1" />
          </svg>
        )

      case 'building':
        return (
          <svg {...wrapperProps}>
            <rect x="3" y="4" width="10" height="10" fill="#a08060" />
            <rect x="2" y="3" width="12" height="2" fill="#8f6845" />
            <rect x="4" y="6" width="2" height="2" fill="#f4d76b" />
            <rect x="10" y="6" width="2" height="2" fill="#f4d76b" />
            <rect x="7" y="9" width="2" height="5" fill="#5c3d2e" />
            <rect x="0" y="14" width="16" height="2" fill="#3b2a1f" />
          </svg>
        )

      default:
        // Fallback: simple circle marker
        return (
          <svg {...wrapperProps}>
            <circle cx="8" cy="8" r="5" fill="#41a6f6" />
            <circle cx="8" cy="8" r="3" fill="#29366f" />
          </svg>
        )
    }
  }

  return renderIcon()
}

/**
 * Map a GoldCountryLocation icon string to a MapIcon type.
 */
export function goldCountryIconToType(icon: string): MapIconProps['type'] {
  const mapping: Record<string, MapIconProps['type']> = {
    cabin: 'cabin',
    frog: 'frog',
    wine: 'wine',
    cave: 'cave',
    crystal: 'crystal',
    tree: 'landmark',
    mine: 'mine',
    saloon: 'saloon_icon',
    grapes: 'grapes',
    building: 'building',
    bridge: 'bridge',
  }
  return mapping[icon] || 'town'
}

export default MapIcon
