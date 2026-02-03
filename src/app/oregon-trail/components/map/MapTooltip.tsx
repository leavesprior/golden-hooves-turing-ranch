'use client'

import React, { useRef, useState, useEffect } from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'
import { type MapLocation } from '../../data/worldMaps'
import { MapIcon } from './MapIcons'

interface MapTooltipProps {
  location: MapLocation | null
  position: { x: number; y: number }
  visible: boolean
  graphicsTier: GraphicsTier
  containerRef?: React.RefObject<HTMLDivElement | null>
}

const DANGER_COLORS: Record<string, string> = {
  safe: 'var(--pixel-forest-light)',
  normal: 'var(--pixel-gold-mid)',
  dangerous: 'var(--pixel-fire-orange)',
}

const SERVICE_LABELS: Record<string, string> = {
  inn: 'Inn',
  shop: 'Shop',
  telegraph: 'Telegraph',
  saloon: 'Saloon',
  mine: 'Mine',
  assay: 'Assay',
  church: 'Church',
  stable: 'Stable',
  blacksmith: 'Smith',
  doctor: 'Doctor',
}

export function MapTooltip({ location, position, visible, graphicsTier, containerRef }: MapTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [adjustedPos, setAdjustedPos] = useState(position)

  // Smart boundary detection - flip tooltip if near edges
  useEffect(() => {
    if (!visible || !tooltipRef.current) {
      setAdjustedPos(position)
      return
    }

    const tooltip = tooltipRef.current
    const rect = tooltip.getBoundingClientRect()
    const container = containerRef?.current?.getBoundingClientRect()
    const viewport = container || { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight }

    let x = position.x
    let y = position.y

    // Flip horizontally if overflowing right
    if (x + rect.width > viewport.right - 10) {
      x = position.x - rect.width - 20
    }

    // Flip vertically if overflowing bottom
    if (y + rect.height > viewport.bottom - 10) {
      y = position.y - rect.height
    }

    // Ensure not off-screen left or top
    if (x < viewport.left + 5) x = viewport.left + 5
    if (y < viewport.top + 5) y = viewport.top + 5

    setAdjustedPos({ x, y })
  }, [position, visible, containerRef])

  if (!visible || !location) return null

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 max-w-xs pointer-events-none"
      style={{
        left: `${adjustedPos.x}px`,
        top: `${adjustedPos.y}px`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.15s ease',
      }}
    >
      <div className="bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] p-3 rounded-lg shadow-xl">
        {/* Header: icon + name */}
        <div className="flex items-center gap-2 mb-1.5">
          <MapIcon type={location.type} tier={graphicsTier} size={18} />
          <span className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-xs leading-tight">
            {location.name}
          </span>
        </div>

        {/* Type badge + danger indicator */}
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[11px] px-1.5 py-0.5 rounded font-[var(--font-pixel)]"
            style={{
              backgroundColor: DANGER_COLORS[location.dangerLevel],
              color: 'black',
            }}
          >
            {location.dangerLevel.toUpperCase()}
          </span>
          <span className="text-[11px] text-[var(--pixel-ui-text)] font-[var(--font-pixel)]">
            {location.type.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Description */}
        <div className="text-[11px] text-[var(--pixel-ui-text)] mb-2 leading-relaxed">
          {location.description}
        </div>

        {/* Services row */}
        {location.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {location.services.map(service => (
              <div key={service} className="flex items-center gap-0.5" title={SERVICE_LABELS[service]}>
                <MapIcon type={service} tier={graphicsTier} size={12} />
                <span className="text-[10px] text-[var(--pixel-ui-text)] opacity-70">
                  {SERVICE_LABELS[service]}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Lore preview */}
        {location.lore && (
          <div className="pt-1.5 border-t border-[var(--pixel-ui-border)]">
            <div className="text-[11px] text-[var(--pixel-forest-light)] italic leading-relaxed">
              Est. {location.lore.founded}
              {location.lore.peakPopulation > 0 && ` | Peak: ${location.lore.peakPopulation.toLocaleString()}`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapTooltip
