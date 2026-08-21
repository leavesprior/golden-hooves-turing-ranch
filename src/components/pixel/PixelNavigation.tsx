'use client'
import Link from 'next/link'
import { useState } from 'react'

// 2026-06-17 map-unification step 1 (nav congruence): the three maps were also
// reached confusingly. "Quest" pointed at the OLD /game launcher menu — repoint
// to /hub (the "PLAY THE COMPLETE JOURNEY" hub). "Map" → /explore is the Gold
// Country TOWN explorer (not character travel) — relabel "Explore" so it isn't
// mistaken for the travel map.
// 2026-06-18: the unified /map and the 10 town investigations were orphaned (nav
// pointed at the old /explore and nothing linked /map). Repoint "Map" -> /map (the
// canonical state→county→local map, which links into /explore for town detail) and
// add "Cases" -> /investigations (The Tare's Trail case-board). Closes the congruence loop.
const navItems = [
  { href: '/', label: '🏠 Home' },
  { href: '/hub', label: '🎮 Play' },
  { href: '/map', label: '🗺️ Map' },
  { href: '/investigations', label: '🔍 Cases' },
  { href: '/karma-market', label: '🏪 Market' },
  { href: '/rentals', label: '🏨 Stay' },
  { href: '/leaderboard', label: '🏆 Ranks' },
]

export default function PixelNavigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-[var(--pixel-bg-dark)] border-b-4 border-[var(--pixel-ui-border)] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-gold-light)] hover:text-[var(--pixel-gold-mid)] transition-colors flex items-center gap-1">
            <span>🐸</span>
            <span>GOLDEN FROG</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-[var(--font-pixel)] text-[11px] sm:text-[8px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] transition-colors min-h-11 inline-flex items-center"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden font-[var(--font-pixel)] text-[var(--pixel-ui-text)] text-[16px] min-h-11 min-w-11"
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t-2 border-[var(--pixel-ui-border)] mt-2 pt-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block py-2 font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
