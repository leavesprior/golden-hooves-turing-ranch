'use client'

/**
 * /dm-table — the secret Hitchhiker's-Guide entrance to the Neoma DM experience.
 * Design: DONT_PANIC_BRIDGE_DM_TABLE_20260717.md
 *
 * Flow (all LOCAL, in-game):
 *   1. one-invite guard + 4:20 window claim  (dp-420-hub-gate)
 *   2. Bridge of Death, "other series" questions (dp-bridge-variant)
 *        wrong answer → launched into the chasm → /hub
 *        right answer → the fluorescent DON'T PANIC intro
 *   3. DON'T PANIC intro (dp-dmtable-intro) → the DM Table
 *   4. DM Table: the Volcano NPC bound via /api/neoma/chat with the
 *        communicationSpell active → replies render as Adams gestures
 *        (dp-babelfish-spell). On 4:20 expiry → /hub.
 *
 * THEMATIC-ONLY (never wired here): the "Neoma-only SSH channel" and the
 * "Tower security agents" (dp-neoma-ssh-channel / dp-tower-security-agents) are
 * GAME CONCEPTS. This page opens NO ssh, reads NO secret, inspects NO network.
 * The spell's "player is on a secure home network" trigger is just the flag we
 * pass to NpcChat. Real secure-channel work stays GROK-BEFORE + rotation-pending.
 * This page is LOCAL ONLY and must never ship to main (dp-deploy: NEVER-MAIN).
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

type Phase = 'checking' | 'denied' | 'bridge' | 'intro' | 'table' | 'expired'

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
  const timersRef = useRef<{ kick?: ReturnType<typeof setTimeout>; tick?: ReturnType<typeof setInterval> }>({})

  const toHub = useCallback(() => {
    router.push('/hub')
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

    // 4:20 kick → /hub, and a per-second countdown for the HUD.
    timersRef.current.kick = setTimeout(() => {
      const cur = readSlot()
      if (cur && cur.id === myId) localStorage.removeItem(SLOT_KEY)
      setPhase('expired')
      toHub()
    }, DP_SESSION_MS)

    timersRef.current.tick = setInterval(() => {
      setRemaining(Math.max(0, expiresAt - Date.now()))
    }, 1000)

    return () => {
      if (timersRef.current.kick) clearTimeout(timersRef.current.kick)
      if (timersRef.current.tick) clearInterval(timersRef.current.tick)
    }
  }, [toHub])

  const mmss = `${Math.floor(remaining / 60000)}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}`

  // --- Bridge outcomes ---
  const onBridgeSuccess = () => setPhase('intro')
  const onBridgeChasm = () => {
    // Wrong answer → "launched into the chasm" → back to /hub.
    toHub()
  }

  if (phase === 'checking' || phase === 'expired') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="font-pixel text-emerald-400 text-sm animate-pulse">
          {phase === 'expired' ? 'The window closes. Returning to the hub…' : 'Approaching the dark…'}
        </p>
      </div>
    )
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
          onClick={toHub}
          className="mt-8 px-6 py-2 font-pixel text-xs rounded border-2 border-emerald-500 text-emerald-300"
        >
          &larr; Back to the hub
        </button>
      </div>
    )
  }

  if (phase === 'intro') {
    return <DontPanicIntro onEnter={() => setPhase('table')} />
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
          onSuccess={onBridgeSuccess}
          onFailure={onBridgeChasm}
          onCancel={toHub}
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
              You are on your own secure home ground now, so Neoma greets you under a
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
