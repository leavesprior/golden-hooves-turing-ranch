'use client'

/**
 * NpcChat — front-end for the three-vector NPC engine (/api/neoma/chat).
 *
 * Reusable across any registered character (pass `characterId`). Drives the
 * server's Personality + Disposition + Agenda loop: first contact opens a
 * session, each turn POSTs with the sessionId, and the panel surfaces the
 * NPC's shifting disposition as ambient mood. Pixel-styled to match the clue UI.
 */

import { useRef, useState } from 'react'
import { PixelButton } from '@/components/pixel'
import { babelfishTransform } from '@/app/oregon-trail/lib/babelfishSpell'
import { getDmPlayerId, storeDmQueueCapability } from '@/app/oregon-trail/hooks/useDmDirectives'

type Disposition = 'hostile' | 'wary' | 'neutral' | 'warming' | 'ally'

interface ChatLine {
  role: 'npc' | 'visitor'
  text: string
}

interface ChatApiResponse {
  response?: string
  sessionId?: string
  ended?: boolean
  disposition?: Disposition
  agendaProgress?: string
  cooldown?: boolean
  timeExpired?: boolean
  maxMessagesReached?: boolean
  // DM Layer P1: capability token the game poller uses to drain enqueued directives.
  dmQueueCapability?: string
}

const DISPOSITION_MOOD: Record<Disposition, string> = {
  hostile: 'guarded, arms crossed',
  wary: 'watching you closely',
  neutral: 'listening',
  warming: 'softening a little',
  ally: 'at ease with you',
}

const MAX_LEN = 500

export default function NpcChat({
  characterId,
  name,
  portrait,
  intro,
  communicationSpell = false,
  karma = 0,
  liveContext,
}: {
  characterId: string
  name: string
  portrait?: string
  intro?: string
  // dp-babelfish-spell: when true, ALL NPC lines render as Douglas-Adams gestures
  // (emoji if karma>=100, ASCII otherwise). Off by default → normal dialogue.
  communicationSpell?: boolean
  karma?: number
  /** Street weather / kin — atmosphere only, never game-mechanic dump. */
  liveContext?: string
}) {
  const [open, setOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lines, setLines] = useState<ChatLine[]>([])
  const [disposition, setDisposition] = useState<Disposition>('wary')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ended, setEnded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  async function post(body: Record<string, unknown>): Promise<ChatApiResponse | null> {
    try {
      const res = await fetch('/api/neoma/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return (await res.json()) as ChatApiResponse
    } catch {
      return null
    }
  }

  async function start() {
    setStarted(true)
    setLoading(true)
    // DM Layer P1: thread the stable player id so any directives this NPC mints at
    // session-end enqueue under the id the oregon-trail poller drains (mirrors
    // WitnessDialogue). Without this, a DM-Table conversation never reaches the game.
    const playerId = getDmPlayerId()
    const data = await post({ characterId, playerId, ...(liveContext ? { liveContext } : {}) })
    setLoading(false)
    if (!data) {
      setLines([{ role: 'npc', text: 'The wind carries nothing back. Try again later.' }])
      return
    }
    storeDmQueueCapability(data.dmQueueCapability)
    if (data.sessionId) setSessionId(data.sessionId)
    if (data.disposition) setDisposition(data.disposition)
    if (data.response) setLines([{ role: 'npc', text: data.response }])
    if (data.ended || data.cooldown) setEnded(true)
    scrollToEnd()
  }

  async function send() {
    const msg = input.trim()
    if (!msg || loading || ended || !sessionId) return
    setInput('')
    setLines(prev => [...prev, { role: 'visitor', text: msg }])
    scrollToEnd()
    setLoading(true)
    const data = await post({ sessionId, message: msg })
    setLoading(false)
    if (!data) {
      setLines(prev => [...prev, { role: 'npc', text: '...the connection wavers.' }])
      return
    }
    if (data.disposition) setDisposition(data.disposition)
    if (data.response) setLines(prev => [...prev, { role: 'npc', text: data.response! }])
    if (data.ended || data.timeExpired || data.maxMessagesReached) setEnded(true)
    scrollToEnd()
  }

  if (!open) {
    return (
      <div className="my-6 text-center">
        <PixelButton onClick={() => setOpen(true)} variant="green" size="sm">
          Speak with {name}
        </PixelButton>
      </div>
    )
  }

  return (
    <div className="my-6 bg-[var(--pixel-forest-dark)] border-4 border-[var(--pixel-forest-mid)] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-[var(--pixel-forest-mid)]">
        {portrait && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portrait}
            alt={name}
            className="w-12 h-12 object-cover border-2 border-[var(--pixel-gold-mid)]"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        <div className="flex-1">
          <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">{name}</p>
          <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-forest-light)] italic">
            {DISPOSITION_MOOD[disposition]}
          </p>
        </div>
      </div>

      {!started ? (
        <div className="text-center py-2">
          {intro && (
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-4 leading-relaxed">
              {intro}
            </p>
          )}
          <PixelButton onClick={start} variant="gold" size="sm">
            Approach
          </PixelButton>
        </div>
      ) : (
        <>
          {/* Conversation */}
          <div ref={scrollRef} className="max-h-64 overflow-y-auto space-y-3 mb-3 pr-1">
            {lines.map((l, i) => (
              <div key={i} className={l.role === 'visitor' ? 'text-right' : 'text-left'}>
                <p
                  className={`font-[var(--font-pixel)] text-[8px] leading-relaxed inline-block px-2 py-1 ${
                    l.role === 'visitor'
                      ? 'text-[var(--pixel-gold-light)]'
                      : 'text-[var(--pixel-ui-text)]'
                  }`}
                >
                  {l.role === 'npc' && <span className="text-[var(--pixel-forest-light)]">{name}: </span>}
                  {l.role === 'npc' && communicationSpell
                    ? babelfishTransform(l.text, karma, true)
                    : l.text}
                </p>
              </div>
            ))}
            {loading && (
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-forest-light)] italic">
                {name} considers...
              </p>
            )}
          </div>

          {/* Input */}
          {ended ? (
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-fire-orange)] text-center py-2">
              The conversation has ended.
            </p>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                maxLength={MAX_LEN}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') send()
                }}
                disabled={loading}
                placeholder="Say something..."
                className="flex-1 bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] px-2 py-1 font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] focus:outline-none focus:border-[var(--pixel-gold-mid)]"
              />
              <PixelButton onClick={send} variant="gold" size="sm">
                Send
              </PixelButton>
            </div>
          )}
        </>
      )}
    </div>
  )
}
