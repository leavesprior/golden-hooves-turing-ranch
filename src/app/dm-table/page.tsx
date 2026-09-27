'use client'

/**
 * /dm-table — the secret Hitchhiker's-Guide entrance to the Neoma DM experience.
 * Design: DONT_PANIC_BRIDGE_DM_TABLE_20260717.md
 *
 * Flow (all LOCAL, in-game):
 *   1. one-invite guard + 4:20 window claim  (dp-420-hub-gate)
 *   2. Bridge of Death, "other series" questions (dp-bridge-variant)
 *        wrong answer → launched into the chasm → /oregon-trail (the hub is retired)
 *        right answer → the fluorescent DON'T PANIC intro
 *   3. DON'T PANIC intro (dp-dmtable-intro) → the DM Table
 *   4. DM Table: the Volcano NPC bound via /api/neoma/chat with the
 *        communicationSpell active → replies render as Adams gestures
 *        (dp-babelfish-spell). On 4:20 expiry → /oregon-trail.
 *
 * THEMATIC-ONLY (never wired here): the "Neoma-only SSH channel" and the
 * "Tower security agents" (dp-neoma-ssh-channel / dp-tower-security-agents) are
 * GAME CONCEPTS. This page opens NO ssh, reads NO secret, inspects NO network.
 * The spell's "player is on a secure home network" trigger is just the flag we
 * pass to NpcChat. Real secure-channel work stays GROK-BEFORE + rotation-pending.
 * This page is LOCAL ONLY: it is on main, but middleware 404s it on any
 * non-loopback host (src/lib/localBackendAccess.ts). The entrance is a bridge in
 * the Golden Frog Trail title background, rendered only on loopback.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BridgeKeeper } from '../oregon-trail/components/BridgeKeeper'
import {
  BRIDGE_QUESTIONS_OTHER_SERIES,
  BRIDGE_KEEPER_OTHER_SERIES_INTRO,
} from '../oregon-trail/data/adamsEasterEggs'
import DontPanicIntro from './DontPanicIntro'
import NpcChat from '@/components/rpg/NpcChat'

// The 4:20 window — deliberately the SAME 260_000ms as consciousness port 42's
// SESSION_DURATION_MS in /api/neoma/chat/route.ts. Kept as a local const because
// that value lives in a server module; if one changes, change both.
const DP_SESSION_MS = 260_000

const SLOT_KEY = 'dp_dmtable_slot' // localStorage: { id, expiresAt } — one invite at a time
const MYID_KEY = 'dp_dmtable_myid' // sessionStorage: this tab's stable claim id

type Phase = 'checking' | 'denied' | 'bridge' | 'granting' | 'grant_error' | 'intro' | 'table' | 'expired'

type LocalGrant = { expiresAt: number; workerEnabled: boolean; slidesEnabled: boolean; xrUrl: string | null }

interface Slot {
  id: string
  expiresAt: number
}

function readSlot(): Slot | null {
  try {
    const raw = localStorage.getItem(SLOT_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Slot
    if (typeof s?.id === 'string' && typeof s?.expiresAt === 'number') return s
  } catch {
    /* corrupt slot → treat as empty */
  }
  return null
}

/** karma "score" for the babelfish spell: the karma-wallet cookies/tacos total. */
function readKarmaScore(): number {
  try {
    const raw = localStorage.getItem('oregon_trail_karma_wallet')
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { balance?: { good?: number; neutral?: number } }
    const good = Number(parsed?.balance?.good) || 0
    const neutral = Number(parsed?.balance?.neutral) || 0
    return good + neutral
  } catch {
    return 0
  }
}

export default function DmTablePage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('checking')
  const [remaining, setRemaining] = useState(DP_SESSION_MS)
  const [karma, setKarma] = useState(0)
  const [grant, setGrant] = useState<LocalGrant | null>(null)
  const bridgeAnswers = useRef<readonly string[]>([])
  const timersRef = useRef<{ kick?: ReturnType<typeof setTimeout>; tick?: ReturnType<typeof setInterval> }>({})

  const toTrail = useCallback(() => {
    router.push('/oregon-trail')
  }, [router])

  // --- Mount: claim the single invite slot + start the 4:20 window ---
  useEffect(() => {
    setKarma(readKarmaScore())

    // Stable per-tab id so a refresh in THIS tab re-claims; a different tab is denied.
    let myId = sessionStorage.getItem(MYID_KEY)
    if (!myId) {
      myId = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem(MYID_KEY, myId)
    }

    const now = Date.now()
    const slot = readSlot()
    if (slot && slot.expiresAt > now && slot.id !== myId) {
      // Someone else already holds the one invite, and their 4:20 hasn't elapsed.
      setPhase('denied')
      return
    }

    // Claim (or renew our own) slot for the full window.
    const expiresAt = now + DP_SESSION_MS
    localStorage.setItem(SLOT_KEY, JSON.stringify({ id: myId, expiresAt }))
    setPhase('bridge')

    // 4:20 kick → /oregon-trail, and a per-second countdown for the HUD.
    timersRef.current.kick = setTimeout(() => {
      const cur = readSlot()
      if (cur && cur.id === myId) localStorage.removeItem(SLOT_KEY)
      setPhase('expired')
      toTrail()
    }, DP_SESSION_MS)

    timersRef.current.tick = setInterval(() => {
      setRemaining(Math.max(0, expiresAt - Date.now()))
    }, 1000)

    return () => {
      if (timersRef.current.kick) clearTimeout(timersRef.current.kick)
      if (timersRef.current.tick) clearInterval(timersRef.current.tick)
    }
  }, [toTrail])

  const mmss = `${Math.floor(remaining / 60000)}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}`

  // --- Bridge outcomes ---
  const onBridgeSuccess = async () => {
    setPhase('granting')
    setGrant(null)
    try {
      const response = await fetch('/api/local-backend/bridge', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: bridgeAnswers.current }),
      })
      if (!response.ok) throw new Error('Local door closed')
      const result = await response.json() as LocalGrant
      if (!Number.isFinite(result.expiresAt) || result.expiresAt <= Date.now()) throw new Error('Passage expired')
      setGrant({ expiresAt: result.expiresAt, workerEnabled: result.workerEnabled === true, slidesEnabled: result.slidesEnabled === true, xrUrl: typeof result.xrUrl === 'string' && result.xrUrl.startsWith('https://') ? result.xrUrl : null })
      setPhase('intro')
    } catch { setPhase('grant_error') }
  }
  const onBridgeChasm = () => {
    // Wrong answer → "launched into the chasm" → back to /oregon-trail.
    toTrail()
  }

  if (phase === 'checking' || phase === 'expired' || phase === 'granting') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="font-pixel text-emerald-400 text-sm animate-pulse">
          {phase === 'expired' ? 'The window closes. Returning to the trail…' : phase === 'granting' ? 'The Keeper checks your passage…' : 'Approaching the dark…'}
        </p>
      </div>
    )
  }

  if (phase === 'grant_error') {
    return <main className="min-h-screen bg-black p-6 flex flex-col items-center justify-center gap-5 text-emerald-200" data-testid="local-bridge-error">
      <p role="alert">The local door did not open. You can try the Keeper again.</p>
      <button type="button" className="west-face-pill" style={{ minHeight: 44 }} onClick={() => setPhase('bridge')}>Try the Keeper again</button>
      <button type="button" className="west-face-pill" style={{ minHeight: 44 }} onClick={toTrail}>Back to the trail</button>
    </main>
  }

  if (phase === 'denied') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <p className="font-pixel text-cyan-300 text-lg mb-3" style={{ textShadow: '0 0 10px #22d3ee' }}>
          One invite at a time.
        </p>
        <p className="text-emerald-200/70 text-sm max-w-sm leading-relaxed">
          The Dungeon Master is already sitting with someone. The table takes exactly one
          hitchhiker per session. Try again after their four minutes and twenty seconds.
        </p>
        <button
          onClick={toTrail}
          className="mt-8 px-6 py-2 font-pixel text-xs rounded border-2 border-emerald-500 text-emerald-300"
        >
          &larr; Back to the trail
        </button>
      </div>
    )
  }

  if (phase === 'intro') {
    return <DontPanicIntro onEnter={() => {
      if (grant && grant.expiresAt > Date.now()) setPhase('table')
      else toTrail()
    }} />
  }

  // phase === 'bridge' → the Keeper (rendered over black), or 'table' → the DM room.
  return (
    <div className="min-h-screen bg-black">
      {/* 4:20 window HUD — the port-42 timer, mirrored */}
      <div className="fixed top-3 right-3 z-[60] font-pixel text-xs px-3 py-1 rounded border border-emerald-600 bg-black/70 text-emerald-300">
        {'⏳ '}
        {mmss}
      </div>

      {phase === 'bridge' && (
        <BridgeKeeper
          playerName="Hitchhiker"
          questions={BRIDGE_QUESTIONS_OTHER_SERIES}
          introLines={BRIDGE_KEEPER_OTHER_SERIES_INTRO}
          approachLabel="Approach the Secret Bridge"
          onAnswersComplete={answers => { bridgeAnswers.current = answers }}
          onSuccess={() => { void onBridgeSuccess() }}
          onFailure={onBridgeChasm}
          onCancel={toTrail}
        />
      )}

      {phase === 'table' && (
        <main className="max-w-2xl mx-auto px-4 py-10">
          <header className="text-center mb-6">
            <h1
              className="font-pixel text-2xl"
              style={{ color: '#39ff14', textShadow: '0 0 10px #39ff14, 0 0 28px #0f9d58' }}
            >
              The DM Table
            </h1>
            <p className="text-emerald-200/70 text-xs mt-2 max-w-md mx-auto leading-relaxed">
              The local table is open, and Neoma greets you under a
              <span className="text-cyan-300"> spell of communication</span>. The mountain&apos;s
              words arrive as gestures — read them the way you read a friend across a
              crowded, noisy galaxy.
            </p>
            <p className="text-emerald-300/50 text-[10px] mt-2">
              spell mode: {karma >= 100 ? '64-bit emoji (karma ≥ 100)' : 'ASCII gestures (karma < 100)'}
              {'  ·  karma '}
              {karma}
            </p>
          </header>

          {grant && grant.expiresAt > Date.now() && (grant.workerEnabled || grant.slidesEnabled || grant.xrUrl) && (
            <nav aria-label="Local tools" className="mb-6 flex flex-wrap gap-3" data-testid="local-backend-links">
              {grant.slidesEnabled && <a href="/neoma/neoma-slides.pdf" target="_blank" rel="noopener noreferrer" className="west-face-pill inline-flex items-center" style={{ minHeight: 44 }} data-testid="local-backend-slides">Slides</a>}
              {grant.workerEnabled && <>
                <a href="/worker" className="west-face-pill inline-flex items-center" style={{ minHeight: 44 }} data-testid="local-backend-worker">Mike Fisher’s tracker</a>
                <a href="/worker/danna" className="west-face-pill inline-flex items-center" style={{ minHeight: 44 }} data-testid="local-backend-danna">Danna’s tracker</a>
              </>}
              {grant.xrUrl && <XrLink url={grant.xrUrl} />}
            </nav>
          )}

          <NpcChat
            characterId="volcano"
            name="The Volcano"
            intro="A door you were not looking for has opened. The mountain stirs, ancient and amused, and speaks — though the spell turns its words to gestures."
            communicationSpell
            karma={karma}
          />
        </main>
      )}
    </div>
  )
}

/** Out of Time (XR): open it here, or scan the QR with a phone / Quest. */
function XrLink({ url }: { url: string }) {
  const [qr, setQr] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    // @ts-expect-error qrcode has no type declarations (same as GoldCountryBooking)
    import('qrcode')
      .then((QR: { toDataURL?: (t: string, o: object) => Promise<string>; default?: { toDataURL?: (t: string, o: object) => Promise<string> } }) => {
        const toDataURL = QR.toDataURL || QR.default?.toDataURL
        if (!toDataURL) return Promise.reject(new Error('qrcode'))
        return toDataURL(url, { margin: 1, width: 160, color: { dark: '#10261b', light: '#d1fae5' } })
      })
      .then((data: string) => { if (live) setQr(data) })
      .catch(() => { if (live) setQr(null) })
    return () => { live = false }
  }, [url])
  return (
    <span className="inline-flex items-center gap-3" data-testid="local-backend-xr-entry">
      <a href={url} target="_blank" rel="noopener noreferrer" className="west-face-pill inline-flex items-center" style={{ minHeight: 44 }} data-testid="local-backend-xr">Out of Time (XR)</a>
      {qr && <img src={qr} width={96} height={96} alt="QR code: open Out of Time on a phone or Quest" data-testid="local-backend-xr-qr" />}
    </span>
  )
}
