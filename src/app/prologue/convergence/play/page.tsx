'use client'

import React, { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePrologue, type PrologueCharacterId } from '../../prologueContext'
import { ConvergenceBoard } from '@/components/prologue/ConvergenceBoard'
import { CrossGameStorage } from '@/lib/crossGameProgression'

// The four era-witnesses and the evidence each carries into Tenochtitlan. Only the
// acts the player actually completed become presentable evidence. Each ties to the
// Great Serpent archetype — the thread that proves the "returning god" is a shared
// myth four cultures wrote, not a prophecy one culture received.
const EVIDENCE_DEFS: Record<PrologueCharacterId, { title: string; description: string; serpentConnection: string }> = {
  norseman: {
    title: "The Norseman's Runestones",
    description:
      'Runes carved beneath these lands prove flesh-and-blood travelers crossed oceans centuries before — no gods required, only longships and stubbornness.',
    serpentConnection: 'Jormungandr — the world-serpent',
  },
  native: {
    title: "The Dream Walker's Vision",
    description:
      "At Cahokia's Serpent Mound, the dream-walk revealed the Great Serpent as a force of earth and river — honored, not a deity descending from the sky.",
    serpentConnection: 'Uktena — the horned serpent',
  },
  califia: {
    title: "Califia's Battle Records",
    description:
      'A war-queen’s ledgers: gods do not need ships, armor, horses, or supply lines. The man on the shore needs all four.',
    serpentConnection: "Alchupo'osh — the serpent power",
  },
  incan: {
    title: "The Quipu Reader's Proof",
    description:
      'Knotted calculations show the year Ce Acatl falls where it does by arithmetic, not prophecy. The calendar is a wheel, not a finger pointing east.',
    serpentConnection: 'Amaru — the mountain serpent',
  },
}

type Phase = 'intro' | 'evidence' | 'argument' | 'resolved'

// The pivotal choice put to the player before the High Priest of Quetzalcoatl.
const ARGUMENTS: { id: string; text: string; correct: boolean; reply: string }[] = [
  {
    id: 'shared_myth',
    text:
      'Quetzalcoatl, Viracocha, Kukulkan, Jormungandr — one story, carried along a thousand years of trade. A returning serpent-god is a myth four cultures wrote, not a prophecy one received. The man on the shore is just a man.',
    correct: true,
    reply:
      'The High Priest is silent a long moment. "Prophecy," he says at last, "is just history written by someone facing the wrong direction."',
  },
  {
    id: 'he_is_god',
    text:
      'He came from the east in the year of the prophecy. Perhaps the priests are right to bow.',
    correct: false,
    reply:
      'The High Priest narrows his eyes. "You crossed a thousand years to tell me to kneel? Your own evidence calls you a liar. Lay it out again — properly."',
  },
  {
    id: 'flee',
    text: 'It does not matter what he is. Bar the causeways and let the lake decide.',
    correct: false,
    reply:
      'A warrior’s answer, not a witness’s. "Fear is not proof," the priest says. "You gathered proof. Use it."',
  },
]

export default function ConvergencePlayPage() {
  const { state, canAccessConvergence, plantTimeEcho } = usePrologue()
  const [phase, setPhase] = useState<Phase>('intro')
  const [presented, setPresented] = useState<string[]>([])
  const [wrong, setWrong] = useState<string | null>(null)
  const recordedRef = useRef(false)

  const completed = useMemo(
    () =>
      (Object.entries(state.actProgress) as [PrologueCharacterId, { completed: boolean }][])
        .filter(([, p]) => p.completed)
        .map(([id]) => id),
    [state.actProgress],
  )

  const evidence = useMemo(
    () =>
      completed.map(id => ({
        id,
        characterSource: id,
        title: EVIDENCE_DEFS[id].title,
        description: EVIDENCE_DEFS[id].description,
        serpentConnection: EVIDENCE_DEFS[id].serpentConnection,
        verified: true,
      })),
    [completed],
  )

  // Need 3 strands of evidence to make the case, or all the player has if they
  // came in with the minimum of two completed acts.
  const requiredEvidence = Math.min(3, evidence.length)

  // Gate: same rule as the landing page (2+ completed acts).
  if (!canAccessConvergence()) {
    return (
      <Shell>
        <div className="text-5xl mb-4">{'🔒'}</div>
        <h2 className="font-pixel text-amber-200 text-lg mb-3">The Convergence is sealed</h2>
        <p className="text-amber-400 text-xs mb-6">Complete at least two character acts to stand before the priests.</p>
        <BackLink />
      </Shell>
    )
  }

  function finish() {
    // Plant the two convergence-sourced echoes and record the climax milestone —
    // exactly once, even if React re-renders. These echoes surface later in the
    // 1849 games (the Aztec codex in Prospector's Tale, the Guide's prophecy at
    // the ranch), closing the loop the prologue opened.
    if (!recordedRef.current) {
      recordedRef.current = true
      plantTimeEcho('aztec_codex_prospector')
      plantTimeEcho('guide_ranch_comment')
      CrossGameStorage.recordMilestone('prologue_convergence_complete', 'prologue', {
        completedWith: completed,
      })
    }
    setPhase('resolved')
  }

  return (
    <Shell wide>
      {phase === 'intro' && (
        <div className="text-center max-w-xl mx-auto">
          <div className="text-6xl mb-4">{'🏛️'}</div>
          <h2 className="font-pixel text-amber-100 text-lg mb-4">Templo Mayor — the Year Ce Acatl</h2>
          <p className="text-amber-300 text-sm leading-relaxed mb-3">
            Smoke from the night fires still hangs over the lake. The High Priest of Quetzalcoatl waits at the
            pyramid&apos;s summit, and below him a city more beautiful than anything in Spain — soon, in the grand
            tradition of explorers finding beautiful things, to be destroyed.
          </p>
          <p className="text-amber-400 text-xs leading-relaxed mb-6">
            &quot;Strangers come from the east,&quot; the priest says, &quot;in the year the feathered serpent was
            promised to return. The people would call them gods.&quot; He turns to you — traveler across centuries
            you have no right to have crossed. &quot;You have seen more of this world than any living soul. Tell me
            what they are.&quot;
          </p>
          <button
            onClick={() => setPhase('evidence')}
            className="font-pixel text-sm text-amber-100 bg-amber-800 border-2 border-amber-500 px-8 py-3 rounded hover:bg-amber-700 transition-all"
          >
            Lay out your evidence
          </button>
        </div>
      )}

      {phase === 'evidence' && (
        <div className="max-w-3xl mx-auto">
          <ConvergenceBoard evidence={evidence} requiredEvidence={requiredEvidence} onPresent={(ids) => { setPresented(ids); setPhase('argument') }} />
          <p className="text-center text-amber-600 text-[9px] mt-3">
            Each strand carries the same serpent under a different name. That is the thread to pull.
          </p>
        </div>
      )}

      {phase === 'argument' && (
        <div className="max-w-xl mx-auto">
          <div className="p-4 bg-black/30 border-2 border-amber-800 rounded-lg mb-4 text-center">
            <h3 className="font-pixel text-amber-200 text-sm mb-2">The priest weighs your evidence</h3>
            <p className="text-amber-400/80 text-[10px]">
              You laid out {presented.length} strand{presented.length === 1 ? '' : 's'}. Now make the case. What do
              you tell the High Priest?
            </p>
          </div>
          <div className="space-y-3">
            {ARGUMENTS.map(a => (
              <button
                key={a.id}
                onClick={() => (a.correct ? finish() : setWrong(a.reply))}
                className="w-full text-left p-3 rounded-lg border-2 border-amber-700/50 bg-amber-900/20 hover:border-amber-500 hover:bg-amber-900/40 transition-all"
              >
                <p className="text-amber-200 text-[11px] leading-relaxed">{a.text}</p>
              </button>
            ))}
          </div>
          {wrong && <p className="mt-4 text-center text-red-400/80 text-[10px] italic leading-relaxed">{wrong}</p>}
        </div>
      )}

      {phase === 'resolved' && (
        <div className="text-center max-w-xl mx-auto">
          <div className="text-6xl mb-4">{'🐍'}</div>
          <h2 className="font-pixel text-amber-100 text-lg mb-4">The Serpent Unbraided</h2>
          <p className="text-amber-300 text-sm leading-relaxed mb-3">
            {ARGUMENTS[0].reply}
          </p>
          <p className="text-amber-400 text-xs leading-relaxed mb-3">
            The Inca waited for Viracocha. The Maya for Kukulkan. The Aztec for Quetzalcoatl. When pale strangers
            arrived from the east in ships, a few important officials briefly considered that they might be gods —
            rather than what they were: pale strangers arriving from the east to take all the gold.
          </p>
          <div className="p-4 bg-purple-900/20 border-2 border-purple-700/40 rounded-lg mb-4">
            <p className="text-purple-300 text-[11px] leading-relaxed">
              In the priest&apos;s codex, a freshly-painted page shows a figure who looks — impossibly — like a
              prospector, beside a glyph reading <span className="italic">the age when yellow metal devours the land</span>.
              And the Guide, who has watched all of this with amusement and exasperation, remarks to no one in
              particular: &quot;In about eight hundred and forty-nine years, someone will build a rather nice ranch
              right about... here.&quot;
            </p>
          </div>
          <p className="text-amber-500 text-[10px] mb-6">
            Your testimony is planted in the river of time — the codex and the prophecy will surface again, far to
            the north, in 1849.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/prologue"
              className="font-pixel text-[11px] text-amber-100 bg-amber-800 border-2 border-amber-500 px-6 py-3 rounded hover:bg-amber-700 transition-all"
            >
              Return to the Prologue
            </Link>
            <Link
              href="/oregon-trail"
              className="font-pixel text-[11px] text-amber-200 border-2 border-amber-600 px-6 py-3 rounded hover:text-amber-100 hover:border-amber-400 transition-all"
            >
              Cross into 1849 ▶
            </Link>
          </div>
        </div>
      )}
    </Shell>
  )
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-red-950 to-black flex items-center justify-center px-4 py-10">
      <div className={wide ? 'w-full' : 'text-center max-w-md'}>{children}</div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/prologue/convergence"
      className="font-pixel text-[10px] text-amber-300 border border-amber-600 px-4 py-2 hover:text-amber-100"
    >
      {'←'} Back
    </Link>
  )
}
