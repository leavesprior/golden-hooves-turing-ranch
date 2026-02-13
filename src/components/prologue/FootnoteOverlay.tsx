'use client'

import React, { useState } from 'react'

interface Footnote {
  id: string
  number: number
  text: string
  childFootnotes?: Footnote[]
}

interface FootnoteOverlayProps {
  footnotes: Footnote[]
  isVisible: boolean
  onClose: () => void
}

function FootnoteItem({ footnote, depth = 0 }: { footnote: Footnote; depth?: number }) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = footnote.childFootnotes && footnote.childFootnotes.length > 0

  return (
    <div className={`${depth > 0 ? 'ml-4 border-l border-purple-800/50 pl-3' : ''}`}>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-purple-500 text-[9px] font-pixel shrink-0">
          [{footnote.number}]
        </span>
        <div className="flex-1">
          <p className="text-purple-300/80 text-[9px] leading-relaxed">{footnote.text}</p>
          {hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-purple-500 text-[8px] mt-1 hover:text-purple-300"
            >
              {expanded ? '\u25BC' : '\u25B6'} {footnote.childFootnotes!.length} sub-footnote{footnote.childFootnotes!.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="mt-1">
          {footnote.childFootnotes!.map(child => (
            <FootnoteItem key={child.id} footnote={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function FootnoteOverlay({ footnotes, isVisible, onClose }: FootnoteOverlayProps) {
  if (!isVisible || footnotes.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="bg-indigo-950/95 border-t-2 border-x-2 border-purple-600 rounded-t-lg p-4 shadow-2xl max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-pixel text-purple-300 text-[10px]">
              Footnotes ({footnotes.length})
            </h4>
            <button
              onClick={onClose}
              className="text-purple-500 hover:text-purple-300 text-xs"
            >
              {'\u2715'}
            </button>
          </div>
          <div className="space-y-2">
            {footnotes.map(fn => (
              <FootnoteItem key={fn.id} footnote={fn} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
