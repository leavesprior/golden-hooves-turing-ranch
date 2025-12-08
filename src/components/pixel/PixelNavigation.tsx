'use client'
import Link from 'next/link'
import { useState } from 'react'

const navItems = [
  { href: '/', label: '🏠 Home' },
  { href: '/explore', label: '🗺️ Map' },
  { href: '/game', label: '⚔️ Quest' },
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
          <Link href="/" className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-gold-light)] hover:text-[var(--pixel-gold-mid)] transition-colors">
            BOBR
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden font-[var(--font-pixel)] text-[var(--pixel-ui-text)] text-[10px]"
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
