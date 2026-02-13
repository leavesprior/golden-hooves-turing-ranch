'use client'

import React, { useState } from 'react'

interface Footnote {
  id: string
  text: string
  parentId?: string
}

interface GuidePanelProps {
  isOpen: boolean
  onClose: () => void
  currentLocation?: string
  currentCulture?: string
  onConsult?: (query: string) => void
}

export function GuidePanel({ isOpen, onClose, currentLocation, currentCulture, onConsult }: GuidePanelProps) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [footnotes, setFootnotes] = useState<Footnote[]>([])
  const [expandedFootnote, setExpandedFootnote] = useState<string | null>(null)
  const [mood, setMood] = useState<'academic' | 'speculative' | 'humorous'>('academic')

  const handleConsult = () => {
    if (!query.trim()) return
    // In production, this would call the AI DM pipeline
    // For now, provide contextual placeholder responses
    const responses = [
      `The Guide flips through its pages with scholarly enthusiasm. "Regarding ${query}... This is a matter of some academic debate. Which is to say, the academics who debate it are the only ones who care."`,
      `"Ah, ${query}. An excellent question. I have three footnotes on this subject, two of which contradict each other, and one of which is in a language I don't recognize."`,
      `The Guide considers this for a moment. "In my experience, which spans considerably more time than yours, ${query} is best understood by not understanding it too thoroughly."`,
    ]
    setResponse(responses[Math.floor(Math.random() * responses.length)])
    setFootnotes([
      { id: 'f1', text: 'This is, strictly speaking, an oversimplification. The full explanation would require a second volume.' },
      { id: 'f2', text: 'See also: "Things That Seemed Like A Good Idea At The Time", Chapter 42.' },
    ])
    if (onConsult) onConsult(query)
    setQuery('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 max-w-[90vw] bg-gradient-to-b from-indigo-950 to-purple-950 border-l-4 border-purple-600 z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-purple-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{'\uD83D\uDCD6'}</span>
          <div>
            <h3 className="font-pixel text-purple-200 text-xs">The Guide</h3>
            <p className="text-purple-500 text-[8px]">
              Mood: {mood} {mood === 'humorous' && '\uD83D\uDE0F'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-purple-400 hover:text-purple-200 font-pixel text-xs"
        >
          {'\u2715'}
        </button>
      </div>

      {/* Context */}
      {(currentLocation || currentCulture) && (
        <div className="px-4 py-2 bg-purple-900/30 text-[9px] text-purple-400">
          {currentLocation && <span>Location: {currentLocation}</span>}
          {currentLocation && currentCulture && <span> {'\u2022'} </span>}
          {currentCulture && <span>Culture: {currentCulture}</span>}
        </div>
      )}

      {/* Response area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {response && (
          <div className="bg-black/30 border border-purple-700/50 rounded-lg p-4">
            <p className="text-purple-200/90 text-xs leading-relaxed">{response}</p>

            {/* Footnotes */}
            {footnotes.length > 0 && (
              <div className="mt-3 border-t border-purple-800/50 pt-2">
                <p className="text-purple-500 text-[8px] mb-1">Footnotes:</p>
                {footnotes.map((fn, i) => (
                  <div key={fn.id} className="mt-1">
                    <button
                      onClick={() => setExpandedFootnote(expandedFootnote === fn.id ? null : fn.id)}
                      className="text-purple-400 text-[8px] hover:text-purple-300"
                    >
                      [{i + 1}] {expandedFootnote === fn.id ? '\u25BC' : '\u25B6'}
                    </button>
                    {expandedFootnote === fn.id && (
                      <p className="text-purple-400/70 text-[8px] ml-4 mt-0.5 italic">
                        {fn.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!response && (
          <div className="text-center py-8">
            <p className="text-purple-500 text-xs italic">
              The Guide hovers expectantly, pages rustling in a nonexistent breeze.
            </p>
          </div>
        )}
      </div>

      {/* Mood selector */}
      <div className="px-4 py-2 flex gap-1">
        {(['academic', 'speculative', 'humorous'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMood(m)}
            className={`text-[8px] font-pixel px-2 py-1 rounded border ${
              mood === m
                ? 'bg-purple-700 border-purple-500 text-purple-200'
                : 'border-purple-800 text-purple-600 hover:text-purple-400'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-purple-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConsult()}
            placeholder="Ask the Guide..."
            className="flex-1 bg-black/40 border border-purple-700 text-purple-200 text-[10px] px-3 py-2 rounded outline-none focus:border-purple-500 placeholder:text-purple-700"
          />
          <button
            onClick={handleConsult}
            disabled={!query.trim()}
            className="font-pixel text-[9px] text-purple-200 bg-purple-700 px-3 py-2 rounded hover:bg-purple-600 disabled:opacity-40"
          >
            ASK
          </button>
        </div>
      </div>
    </div>
  )
}
