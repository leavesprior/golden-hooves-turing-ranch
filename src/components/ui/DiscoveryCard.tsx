'use client'

import React, { useEffect } from 'react'
import { playSFX } from '@/app/oregon-trail/lib/audioManager'
import { DOSMessage } from '@/components/ui/DOSMessage'

interface DiscoveryCardProps {
  type: 'person' | 'place' | 'object' | 'lore'
  title: string
  subtitle?: string
  icon: string
  description: string
  historicalFact?: string
  mapLocationId?: string
  onDismiss: () => void
  onViewInNotebook?: () => void
}

const TYPE_COLORS: Record<DiscoveryCardProps['type'], string> = {
  person: 'bg-amber-700',
  place: 'bg-emerald-700',
  object: 'bg-blue-700',
  lore: 'bg-purple-700',
}

const TYPE_LABELS: Record<DiscoveryCardProps['type'], string> = {
  person: 'Person of Interest',
  place: 'Location Discovered',
  object: 'Object Found',
  lore: 'Lore Uncovered',
}

export function DiscoveryCard({
  type,
  title,
  subtitle,
  icon,
  description,
  historicalFact,
  mapLocationId,
  onDismiss,
  onViewInNotebook,
}: DiscoveryCardProps) {
  useEffect(() => {
    playSFX('success')
  }, [])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-950 border-2 border-amber-600 rounded-lg max-w-md w-full overflow-hidden animate-slide-in-up">
        {/* Top colored bar */}
        <div className={`${TYPE_COLORS[type]} px-4 py-2 flex items-center justify-between`}>
          <span className="text-[10px] font-pixel uppercase tracking-widest text-white/90">
            {TYPE_LABELS[type]}
          </span>
          <span className="text-[10px] font-pixel uppercase tracking-widest text-white/60">
            New Discovery
          </span>
        </div>

        {/* Icon */}
        <div className="text-5xl text-center py-4">{icon}</div>

        {/* Title & Subtitle */}
        <div className="px-4 pb-2">
          <h3 className="font-pixel text-amber-200 text-lg text-center">{title}</h3>
          {subtitle && (
            <p className="text-amber-400/70 text-xs text-center mt-1">{subtitle}</p>
          )}
        </div>

        {/* Description */}
        <div className="px-4 py-2">
          <DOSMessage text={description} speed={20} sfxEvery={0} />
        </div>

        {/* Historical fact */}
        {historicalFact && (
          <div className="px-4 pb-2">
            <p className="italic text-amber-400/60 text-xs border-t border-amber-800 pt-2 mt-2">
              {historicalFact}
            </p>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-amber-900/50">
          {mapLocationId && (
            <button
              onClick={() => { playSFX('click'); onDismiss() }}
              className="font-pixel text-[10px] text-amber-400 border border-amber-600 px-3 py-1 rounded hover:bg-amber-900/30 transition-colors"
            >
              [MAP]
            </button>
          )}
          {onViewInNotebook && (
            <button
              onClick={() => { playSFX('click'); onViewInNotebook() }}
              className="font-pixel text-[10px] text-amber-400 border border-amber-600 px-3 py-1 rounded hover:bg-amber-900/30 transition-colors"
            >
              [NOTEBOOK]
            </button>
          )}
          <button
            onClick={() => { playSFX('click'); onDismiss() }}
            className="font-pixel text-[10px] text-stone-950 bg-amber-600 px-3 py-1 rounded hover:bg-amber-500 transition-colors"
          >
            [CLOSE]
          </button>
        </div>
      </div>
    </div>
  )
}
