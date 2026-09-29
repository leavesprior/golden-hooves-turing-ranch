'use client'

import React, { useState, useEffect } from 'react'

interface ChapterIntroProps {
  chapterNumber: number
  title: string
  subtitle?: string
  narrative: string[]
  onComplete: () => void
}

const CHAPTER_THEMES = {
  1: {
    bg: 'from-amber-950 via-orange-900 to-amber-800',
    accent: 'amber',
    icon: '🌅',
  },
  2: {
    bg: 'from-emerald-950 via-green-900 to-emerald-800',
    accent: 'emerald',
    icon: '⛏️',
  },
  3: {
    bg: 'from-slate-950 via-gray-900 to-slate-800',
    accent: 'slate',
    icon: '🔍',
  },
  4: {
    bg: 'from-purple-950 via-violet-900 to-purple-800',
    accent: 'purple',
    icon: '⚖️',
  },
}

export function ChapterIntro({ chapterNumber, title, subtitle, narrative, onComplete }: ChapterIntroProps) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [showContinue, setShowContinue] = useState(false)
  const [isTyping, setIsTyping] = useState(true)

  const theme = CHAPTER_THEMES[chapterNumber as keyof typeof CHAPTER_THEMES] || CHAPTER_THEMES[1]

  // Typewriter effect for narrative
  useEffect(() => {
    if (visibleLines < narrative.length) {
      const timer = setTimeout(() => {
        setVisibleLines(prev => prev + 1)
      }, 1500)
      return () => clearTimeout(timer)
    } else {
      setIsTyping(false)
      const timer = setTimeout(() => setShowContinue(true), 500)
      return () => clearTimeout(timer)
    }
  }, [visibleLines, narrative.length])

  // Skip animation on click/key
  useEffect(() => {
    const handleInput = () => {
      if (isTyping) {
        setVisibleLines(narrative.length)
        setIsTyping(false)
        setShowContinue(true)
      } else if (showContinue) {
        onComplete()
      }
    }

    window.addEventListener('keydown', handleInput)
    return () => window.removeEventListener('keydown', handleInput)
  }, [isTyping, showContinue, narrative.length, onComplete])

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${theme.bg} flex items-center justify-center p-8 cursor-pointer`}
      onClick={() => {
        if (isTyping) {
          setVisibleLines(narrative.length)
          setIsTyping(false)
          setShowContinue(true)
        } else if (showContinue) {
          onComplete()
        }
      }}
    >
      {/* Decorative border */}
      <div className="absolute inset-4 border-2 border-amber-600/30 rounded-lg pointer-events-none" />
      <div className="absolute inset-6 border border-amber-600/20 rounded-lg pointer-events-none" />

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 text-amber-600/40 text-2xl">◈</div>
      <div className="absolute top-8 right-8 text-amber-600/40 text-2xl">◈</div>
      <div className="absolute bottom-8 left-8 text-amber-600/40 text-2xl">◈</div>
      <div className="absolute bottom-8 right-8 text-amber-600/40 text-2xl">◈</div>

      <div className="max-w-2xl text-center">
        {/* Chapter icon */}
        <div className="text-6xl mb-6 animate-pulse">
          {theme.icon}
        </div>

        {/* Chapter number */}
        <div className="font-pixel text-amber-500/60 text-sm tracking-[0.3em] mb-2">
          CHAPTER {chapterNumber}
        </div>

        {/* Chapter title */}
        <h1 className="font-pixel text-amber-200 text-3xl md:text-4xl mb-2 tracking-wide">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-amber-400/80 text-lg italic mb-8">
            {subtitle}
          </p>
        )}

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-600/50" />
          <div className="text-amber-600/50">✦</div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-600/50" />
        </div>

        {/* Narrative text */}
        <div className="space-y-4 text-amber-100/90 text-lg font-serif leading-relaxed">
          {narrative.slice(0, visibleLines).map((line, index) => (
            <p
              key={index}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {line}
            </p>
          ))}
        </div>

        {isTyping && visibleLines < narrative.length && (
          <div className="mt-6 flex justify-center">
            <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse" />
          </div>
        )}

        <button
          type="button"
          data-testid="chapter-continue"
          className="west-face-pill west-face-pill-cream mt-10"
          onClick={(e) => {
            e.stopPropagation()
            if (isTyping) {
              setVisibleLines(narrative.length)
              setIsTyping(false)
              setShowContinue(true)
              return
            }
            onComplete()
          }}
        >
          {showContinue ? 'Continue' : 'Skip'}
        </button>
      </div>

      {/* Atmospheric particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/20 rounded-full"
            style={{
              left: `${(i * 47) % 100}%`,
              top: `${(i * 31) % 100}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.5; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

// Chapter data
export const CHAPTERS = {
  1: {
    number: 1,
    title: 'The Journey West',
    subtitle: 'Independence, Missouri · Spring 1849 (arriving from 2026)',
    narrative: [
      // Cadence after H.G. Wells, The Time Machine (1895, public domain):
      // "night followed day like the flapping of a black wing."
      'You press the golden frog. The ranch goes hazy. Night follows day like the flapping of a black wing, faster and faster, until the hills are one green-and-gold flicker.',
      'When the flicker stops it is spring, 1849, in Independence, Missouri, and a man in a stovepipe hat wants to know if you have seen his mule.',
      'Word has spread like wildfire: gold in California. Half the country is fixing to go and get some.',
      'You carry a Pinkerton badge. The Pinkerton agency will not be founded until next year. Nobody here has thought to check.',
      'Your quarry is Black Bart. He will not rob his first stagecoach until 1875, in Calaveras County. You are early. That is rather the point.',
      'Your wagon waits. Two thousand miles of trail, and justice rides with you. So, it appears, does the narrator.',
    ],
  },
  2: {
    number: 2,
    title: 'Gold Country',
    subtitle: 'The Sierra Nevada Foothills',
    narrative: [
      'After months on the trail, the golden hills of California rise before you.',
      'The mining camps are rough places - full of desperate men, easy money, and easier violence.',
      'Somewhere in these hills, Black Bart is planning his next heist.',
      'The locals know more than they\'re saying. Time to start asking questions.',
      'Your badge carries weight here. Use it wisely.',
    ],
  },
  3: {
    number: 3,
    title: 'The Investigation',
    subtitle: 'Following the Trail of Clues',
    narrative: [
      'The pieces are coming together. Witnesses have talked. Evidence has been gathered.',
      'Black Bart is clever - but not clever enough.',
      'Each town you visit brings you closer to the truth.',
      'Soon, you\'ll have enough to issue that warrant.',
      'Justice is patient, but it is also inevitable.',
    ],
  },
  4: {
    number: 4,
    title: 'The Reckoning',
    subtitle: 'Bringing the Gang to Justice',
    narrative: [
      'The warrant is signed. The posse is ready.',
      'Black Bart\'s luck has finally run out.',
      'Whatever happens next, you\'ve done your duty.',
      'The frontier may be lawless, but today, the law wins.',
      'Time to finish this.',
    ],
  },
}

export default ChapterIntro
