'use client'

import { useState, useEffect } from 'react'
import { PixelNavigation, PixelButton } from '@/components/pixel'
import Link from 'next/link'

type MenuOption = 'main' | 'qr-hunt' | 'about'

export default function GamePage() {
  const [selectedOption, setSelectedOption] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [currentView, setCurrentView] = useState<MenuOption>('main')

  // Animate title screen appearance
  useEffect(() => {
    const timer = setTimeout(() => setShowMenu(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Keyboard navigation like a real RPG
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentView !== 'main') return

      const menuItems = 4
      if (e.key === 'ArrowUp' || e.key === 'w') {
        setSelectedOption(prev => (prev - 1 + menuItems) % menuItems)
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        setSelectedOption(prev => (prev + 1) % menuItems)
      } else if (e.key === 'Enter' || e.key === ' ') {
        handleMenuSelect(selectedOption)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedOption, currentView])

  const handleMenuSelect = (index: number) => {
    switch (index) {
      case 0: // New Game
        window.location.href = '/adventure/play'
        break
      case 1: // Continue
        window.location.href = '/adventure/play'
        break
      case 2: // At the Ranch
        setCurrentView('qr-hunt')
        break
      case 3: // About
        setCurrentView('about')
        break
    }
  }

  const menuItems = [
    { label: 'NEW GAME', icon: '/gold-nuggets.png', desc: 'Begin Tobias\'s journey' },
    { label: 'CONTINUE', icon: '/leather-journal.png', desc: 'Resume your adventure' },
    { label: 'AT THE RANCH', icon: '/pegasus-logo.webp', desc: 'QR treasure hunt' },
    { label: 'ABOUT', icon: '/treasure-map.png', desc: 'The story so far' },
  ]

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)] overflow-hidden">
      <PixelNavigation />

      {/* Main Title Screen */}
      {currentView === 'main' && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
          {/* Starfield background effect */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  opacity: Math.random() * 0.7 + 0.3,
                }}
              />
            ))}
          </div>

          {/* Game Logo */}
          <div className="relative z-10 text-center mb-8">
            <div className="mb-4 relative">
              <img
                src="/pegasus-logo.webp"
                alt="Back of Beyond Ranch - Pegasus Logo"
                className="w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto drop-shadow-[0_0_15px_rgba(244,215,107,0.6)]"
                style={{ filter: 'drop-shadow(0 0 10px var(--pixel-gold-mid))' }}
              />
            </div>
            <h1
              className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-xl sm:text-2xl mb-2 tracking-wider"
              style={{ textShadow: '0 0 20px var(--pixel-gold-dark)' }}
            >
              THE GOLDEN HOOVES
            </h1>
            <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-mid)] text-sm sm:text-base tracking-widest">
              L E G A C Y
            </h2>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mt-4 opacity-70">
              A Gold Country Adventure
            </p>
          </div>

          {/* Menu Options */}
          <div
            className={`relative z-10 transition-all duration-1000 ${
              showMenu ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-4 min-w-[320px] sm:min-w-[400px]">
              {menuItems.map((item, index) => (
                <button
                  key={item.label}
                  onClick={() => handleMenuSelect(index)}
                  onMouseEnter={() => setSelectedOption(index)}
                  className={`w-full text-left py-3 px-4 mb-3 last:mb-0 transition-all font-[var(--font-pixel)] rounded ${
                    selectedOption === index
                      ? 'bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-light)] shadow-[0_0_15px_rgba(244,215,107,0.4)]'
                      : 'bg-[var(--pixel-bg-light)] border-2 border-transparent hover:border-[var(--pixel-ui-border)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Selection arrow */}
                    <span className={`text-lg ${selectedOption === index ? 'text-[var(--pixel-gold-light)]' : 'text-transparent'}`}>
                      ▶
                    </span>
                    {/* Menu icon image */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded overflow-hidden transition-all ${
                      selectedOption === index
                        ? 'drop-shadow-[0_0_8px_rgba(244,215,107,0.8)] scale-110'
                        : 'opacity-70 grayscale-[30%]'
                    }`}>
                      <img
                        src={item.icon}
                        alt={item.label}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* Label and description */}
                    <div className="flex-1">
                      <span className={`text-xs sm:text-sm block ${
                        selectedOption === index ? 'text-[var(--pixel-gold-light)]' : 'text-[var(--pixel-ui-text)]'
                      }`}>
                        {item.label}
                      </span>
                      <p className={`text-[8px] sm:text-[9px] mt-1 transition-opacity ${
                        selectedOption === index
                          ? 'text-[var(--pixel-gold-mid)] opacity-100'
                          : 'text-[var(--pixel-ui-text)] opacity-50'
                      }`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Controls hint */}
            <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)] text-center mt-4 opacity-50">
              ↑↓ SELECT • ENTER TO CONFIRM • TAP TO SELECT
            </p>
          </div>

          {/* Press Start prompt */}
          {!showMenu && (
            <div className="relative z-10 mt-12 animate-pulse">
              <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                PRESS START
              </p>
            </div>
          )}

          {/* Bottom branding */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)] opacity-40">
              © 1852-2026 BACK OF BEYOND RANCH
            </p>
          </div>
        </div>
      )}

      {/* QR Hunt Sub-menu */}
      {currentView === 'qr-hunt' && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => setCurrentView('main')}
            className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-6 hover:text-[var(--pixel-gold-light)]"
          >
            ← BACK TO MENU
          </button>

          <div className="text-center mb-8">
            <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg mb-2">
              🏠 AT THE RANCH
            </h1>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
              The physical QR treasure hunt for guests staying at Back of Beyond Ranch
            </p>
          </div>

          <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-6 mb-6">
            <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-[10px] mb-4">
              HOW IT WORKS
            </h2>
            <div className="space-y-3 font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
              <p>1. Explore the ranch property during your stay</p>
              <p>2. Find QR codes hidden at 14 locations</p>
              <p>3. Scan each code to reveal story clues and earn points</p>
              <p>4. Complete the hunt to unlock exclusive discounts</p>
            </div>
          </div>

          <div className="bg-[var(--pixel-earth-dark)] border-4 border-[var(--pixel-gold-mid)] p-6 mb-6">
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] text-center mb-4">
              This hunt continues the story from the online RPG!
            </p>
            <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] text-center">
              Play "The Golden Hooves Legacy" online first to learn Tobias's story,
              then discover his hidden clues in person at the ranch.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <PixelButton href="/adventure/play" variant="gold" size="md">
              ▶ PLAY THE PROLOGUE FIRST
            </PixelButton>
            <PixelButton href="/rentals" variant="orange" size="md">
              📅 BOOK YOUR STAY
            </PixelButton>
          </div>
        </div>
      )}

      {/* About Screen */}
      {currentView === 'about' && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => setCurrentView('main')}
            className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-6 hover:text-[var(--pixel-gold-light)]"
          >
            ← BACK TO MENU
          </button>

          <div className="text-center mb-8">
            <img
              src="/pegasus-logo.webp"
              alt="Pegasus Logo"
              className="w-16 h-16 object-contain mx-auto mb-2 drop-shadow-[0_0_10px_rgba(244,215,107,0.5)]"
            />
            <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg mt-4 mb-2">
              THE STORY
            </h1>
          </div>

          <div className="space-y-6">
            <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-6">
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] leading-relaxed">
                The year is 1852. Young Tobias Goldsworth leaves Missouri with dreams of fortune
                in the California goldfields. His journey takes him through Volcano, Angels Camp,
                and the legendary Mother Lode of the Sierra Nevada.
              </p>
            </div>

            <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-6">
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] leading-relaxed">
                What Tobias finds is more valuable than gold—a stretch of pristine wilderness
                that would become Back of Beyond Ranch. Before he dies, he hides clues throughout
                the property, leading to his greatest treasure.
              </p>
            </div>

            <div className="bg-[var(--pixel-earth-dark)] border-4 border-[var(--pixel-gold-mid)] p-6">
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] text-center">
                170 years later, the clues remain. Will you find them?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="text-center">
                <p className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg">5</p>
                <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)]">CHAPTERS</p>
              </div>
              <div className="text-center">
                <p className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg">14</p>
                <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)]">QR LOCATIONS</p>
              </div>
              <div className="text-center">
                <p className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg">3</p>
                <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)]">ENDINGS</p>
              </div>
              <div className="text-center">
                <p className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg">27%</p>
                <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)]">MAX DISCOUNT</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <PixelButton href="/adventure/play" variant="gold" size="md">
              ▶ START YOUR ADVENTURE
            </PixelButton>
          </div>
        </div>
      )}
    </div>
  )
}
