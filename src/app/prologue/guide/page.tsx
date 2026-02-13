'use client'

import React, { useState } from 'react'
import Link from 'next/link'

/**
 * The Guide Encyclopedia - a browsable collection of all Guide entries.
 * Full content will be populated from guide/entries.ts data file.
 */

interface GuideEntry {
  id: string
  title: string
  content: string
  tier: 'gold' | 'silver' | 'bronze'
  category: string
}

// Sample entries (full set will come from data file)
const SAMPLE_ENTRIES: GuideEntry[] = [
  {
    id: 'tenochtitlan',
    title: 'Tenochtitlan',
    content: 'A city built on an island in a lake in a valley in mountains. The Aztecs chose this location because they saw an eagle eating a snake on a cactus, which they interpreted as divine. Most urban planners would interpret this as a sign to keep looking.',
    tier: 'gold',
    category: 'Locations',
  },
  {
    id: 'nazca_lines',
    title: 'Nazca Lines',
    content: 'The most impressive example of writing a note to someone who hasn\'t arrived yet in the history of interplanetary communication. The note, when properly translated, reads approximately: "Welcome. The food here is adequate."',
    tier: 'bronze',
    category: 'Mysteries',
  },
  {
    id: 'puma_punku',
    title: 'Puma Punku',
    content: 'The stones are cut with precision that appears machine-made. This is because they are machine-made. The machine was a large number of highly skilled stonemasons working very slowly. This explanation disappoints people who wanted aliens.',
    tier: 'silver',
    category: 'Sites',
  },
  {
    id: 'cahokia',
    title: 'Cahokia',
    content: 'In the year 1050 CE, Cahokia was larger than London. This fact routinely surprises people who assume that large cities are a European invention, much like the wheel, gunpowder, and anxiety.',
    tier: 'gold',
    category: 'Locations',
  },
  {
    id: 'serpent_mound',
    title: 'Serpent Mound',
    content: 'A 1,348-foot-long earthwork effigy shaped like a serpent, built on a meteor impact crater. The builders presumably thought this was a good location for a serpent because, and this is the key insight, it was.',
    tier: 'gold',
    category: 'Sites',
  },
  {
    id: 'quipu',
    title: 'Quipu',
    content: 'A recording device made of knotted strings. The Inca managed an empire of 12 million people with an accounting system that looked like a bundle of macrame. This should give pause to anyone who thinks blockchain is the most elegant data structure ever invented.',
    tier: 'gold',
    category: 'Technology',
  },
  {
    id: 'viracocha',
    title: 'Viracocha',
    content: 'The Incan creator god who emerged from Lake Titicaca and made the sun, moon, and stars. He then created people, got annoyed with them, turned them into stone, and started over. In this respect he is much like a software engineer on their third refactor.',
    tier: 'silver',
    category: 'Mythology',
  },
]

const TIER_COLORS = {
  gold: { bg: 'bg-amber-900/30', border: 'border-amber-600/50', text: 'text-amber-300', label: 'Verified Fact' },
  silver: { bg: 'bg-gray-800/30', border: 'border-gray-500/50', text: 'text-gray-300', label: 'Reasonable Speculation' },
  bronze: { bg: 'bg-orange-900/30', border: 'border-orange-600/50', text: 'text-orange-300', label: 'Fringe Theory' },
}

export default function GuidePage() {
  const [selectedTier, setSelectedTier] = useState<'all' | 'gold' | 'silver' | 'bronze'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEntries = SAMPLE_ENTRIES.filter(entry => {
    if (selectedTier !== 'all' && entry.tier !== selectedTier) return false
    if (searchQuery && !entry.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !entry.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-black to-purple-950">
      {/* Header */}
      <header className="border-b-2 border-purple-700 bg-black/30 px-4 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-pixel text-purple-200 text-lg">
              {'\uD83D\uDCD6'} The Guide
            </h1>
            <p className="text-purple-400 text-xs mt-1">Interdimensional Field Manual (Abridged)</p>
          </div>
          <Link href="/prologue" className="text-purple-400 hover:text-purple-200 text-xs font-pixel">
            {'\u2190'} Prologue
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Introductory quote */}
        <div className="text-center mb-8 p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
          <p className="text-purple-300 text-xs italic">
            "Don't Panic. But do bring a towel. The ancient Americas are surprisingly damp
            in places you wouldn't expect."
          </p>
          <p className="text-purple-500 text-[9px] mt-2">-- The Guide, Introduction (footnote 42)</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] bg-black/40 border border-purple-700 text-purple-200 text-xs px-3 py-2 rounded outline-none focus:border-purple-500 placeholder:text-purple-700"
          />
          <div className="flex gap-1">
            {(['all', 'gold', 'silver', 'bronze'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`text-[9px] font-pixel px-3 py-1.5 rounded border transition-colors ${
                  selectedTier === tier
                    ? 'bg-purple-700 border-purple-500 text-purple-200'
                    : 'border-purple-800 text-purple-500 hover:text-purple-300'
                }`}
              >
                {tier === 'all' ? 'All' : tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tier legend */}
        <div className="flex gap-4 mb-6 text-[9px] text-purple-500">
          <span>{'\uD83D\uDFE1'} Gold = Verified Fact</span>
          <span>{'\u26AA'} Silver = Reasonable Speculation</span>
          <span>{'\uD83D\uDFE0'} Bronze = Fringe Theory {'\uD83D\uDE09'}</span>
        </div>

        {/* Entries */}
        <div className="space-y-4">
          {filteredEntries.map(entry => {
            const tierStyle = TIER_COLORS[entry.tier]
            return (
              <div
                key={entry.id}
                className={`p-5 ${tierStyle.bg} border ${tierStyle.border} rounded-lg`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-pixel text-sm ${tierStyle.text}`}>{entry.title}</h3>
                  <span className={`text-[8px] ${tierStyle.text} opacity-70`}>
                    {tierStyle.label}
                  </span>
                </div>
                <p className="text-purple-200/80 text-xs leading-relaxed">{entry.content}</p>
                <div className="mt-2 text-[9px] text-purple-500">
                  Category: {entry.category}
                </div>
              </div>
            )
          })}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-purple-500 text-xs">
              No entries found. The Guide suggests broadening your search criteria,
              or possibly looking under the couch cushions.
            </p>
          </div>
        )}

        <div className="mt-8 text-center text-purple-600 text-[9px]">
          {SAMPLE_ENTRIES.length} entries available {'\u2022'} More unlock as you explore
        </div>
      </main>
    </div>
  )
}
