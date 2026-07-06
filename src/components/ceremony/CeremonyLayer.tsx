'use client'

// CeremonyLayer — renders the ceremony queue. Two lanes:
//   • quest  → top-center toast, auto-dismisses (the frequent, glanceable beat)
//   • levelup / chapter → center overlay the player dismisses (the beats worth a pause)
// Styling matches the house grammar (font-pixel, gradient panel, pixel-gold border,
// existing animate-slide-in-up / animate-float-up classes) so it reads as one game,
// not a bolted-on widget. Sits above camp/dialogue (z-[105]) but below the chapter-5
// ending cutscene (z-[110]).

import React, { useEffect, useState } from 'react'
import { useCeremony, CeremonyEvent, CeremonyRepChange } from '@/lib/ceremonyContext'

function repFlavor(delta: number): string {
  // FNV "word travels" — every rep shift gets a named, immediate consequence.
  if (delta > 0) return 'word travels — they remember a friend'
  if (delta < 0) return 'word travels — and not kindly'
  return ''
}

function RewardChips({ ev }: { ev: CeremonyEvent }) {
  const r = ev.rewards
  if (!r) return null
  const chips: React.ReactNode[] = []
  if (r.xp) chips.push(
    <span key="xp" className="text-[var(--pixel-gold-light)]">{'✨'} +{r.xp} XP</span>
  )
  if (r.gold && r.gold > 0) chips.push(
    <span key="gold" className="text-yellow-300">{'🪙'} +{r.gold}</span>
  )
  if (r.karmaGood && r.karmaGood > 0) chips.push(
    <span key="kg" className="text-green-300">{'⚖️'} +{r.karmaGood} Good</span>
  )
  if (r.karmaGood && r.karmaGood < 0) chips.push(
    <span key="kb" className="text-red-300">{'⚖️'} {r.karmaGood} Good</span>
  )
  if (r.karmaLawful && r.karmaLawful > 0) chips.push(
    <span key="kl" className="text-blue-300">{'⚖️'} +{r.karmaLawful} Lawful</span>
  )
  if (chips.length === 0) return null
  return <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] mt-1">{chips}</div>
}

function RepLines({ reps }: { reps?: CeremonyRepChange[] }) {
  if (!reps || reps.length === 0) return null
  return (
    <div className="mt-2 flex flex-col gap-1">
      {reps.map((rep, i) => (
        <div key={i} className="text-[10px] flex items-center gap-2">
          <span>{rep.icon}</span>
          <span className="text-white/90">{rep.name}</span>
          <span className={rep.delta >= 0 ? 'text-green-300' : 'text-red-300'}>
            {rep.delta >= 0 ? '▲' : '▼'} {Math.abs(rep.delta)}
          </span>
          <span className="text-white/40 italic">{repFlavor(rep.delta)}</span>
        </div>
      ))}
    </div>
  )
}

function QuestToast({ ev, onDismiss }: { ev: CeremonyEvent; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 4200)
    const killTimer = setTimeout(onDismiss, 4700)
    return () => { clearTimeout(exitTimer); clearTimeout(killTimer) }
  }, [onDismiss])

  return (
    <div
      className={`
        pointer-events-auto
        bg-gradient-to-r from-[var(--pixel-bg-mid)]/95 to-[var(--pixel-bg-dark)]/95
        border-2 border-[var(--pixel-gold-mid)]
        rounded-lg px-4 py-3 shadow-xl font-pixel max-w-md
        transform transition-all duration-300 ease-out
        ${exiting ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0 animate-slide-in-up'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl text-[var(--pixel-gold-light)] animate-float-up">{'📜'}</div>
        <div className="flex-1">
          <div className="text-[var(--pixel-gold-light)] text-[11px] tracking-wide">QUEST COMPLETE</div>
          <div className="text-white text-sm mt-0.5">{ev.title}</div>
          {ev.subtitle && <div className="text-white/60 text-[10px] mt-0.5">{ev.subtitle}</div>}
          <RewardChips ev={ev} />
          <RepLines reps={ev.rewards?.reputation} />
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-white transition-colors text-xs">{'×'}</button>
      </div>
    </div>
  )
}

function XpFloat({ ev, onDismiss, index }: { ev: CeremonyEvent; onDismiss: () => void; index: number }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 1300)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div
      className="animate-float-up font-pixel text-[var(--pixel-gold-light)] text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
      style={{ marginTop: index === 0 ? 0 : 2 }}
    >
      {ev.title}
    </div>
  )
}

function Overlay({ ev, onDismiss }: { ev: CeremonyEvent; onDismiss: () => void }) {
  useEffect(() => {
    // Safety auto-dismiss so a ceremony can never soft-lock the player.
    const t = setTimeout(onDismiss, 9000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const isLevel = ev.kind === 'levelup'
  return (
    <div
      className="fixed inset-0 z-[105] bg-black/80 flex items-center justify-center p-4 pointer-events-auto"
      onClick={onDismiss}
    >
      <div
        className="animate-slide-in-up bg-gradient-to-b from-[var(--pixel-bg-light)] to-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-gold-mid)] rounded-xl px-8 py-7 max-w-md text-center font-pixel shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-5xl animate-float-up mb-3">{isLevel ? '⭐' : '🏵️'}</div>
        <div className="text-[var(--pixel-gold-light)] text-sm tracking-widest mb-2">
          {isLevel ? 'LEVEL UP' : `CHAPTER ${ev.chapter ?? ''} COMPLETE`}
        </div>
        <div className="text-white text-lg leading-relaxed mb-1">{ev.title}</div>
        {ev.subtitle && <div className="text-white/70 text-xs mb-2">{ev.subtitle}</div>}
        {isLevel && ev.level != null && (
          <div className="text-[var(--pixel-gold-light)] text-2xl my-2">Lv {ev.level}</div>
        )}
        {isLevel && ev.skillPoints ? (
          <div className="text-green-300 text-xs mb-2">
            {'✨'} +{ev.skillPoints} skill point{ev.skillPoints > 1 ? 's' : ''} to spend
          </div>
        ) : null}
        {ev.flavor && <div className="text-white/60 text-[11px] italic mt-2 mb-4">{ev.flavor}</div>}
        <button
          onClick={onDismiss}
          className="mt-3 px-6 py-2 bg-[var(--pixel-gold-mid)] text-[var(--pixel-bg-dark)] rounded-lg text-xs hover:brightness-110 transition-all"
        >
          {isLevel ? 'CONTINUE' : 'MAKE CAMP ▶'}
        </button>
      </div>
    </div>
  )
}

export function CeremonyLayer() {
  const { events, dismiss } = useCeremony()

  const toasts = events.filter(e => e.kind === 'quest')
  const floats = events.filter(e => e.kind === 'xp')
  // Only one overlay at a time — show the oldest queued, dismiss reveals the next.
  const overlay = events.find(e => e.kind === 'levelup' || e.kind === 'chapter')

  return (
    <>
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[104] flex flex-col items-center gap-2 pointer-events-none">
          {toasts.map(ev => (
            <QuestToast key={ev.id} ev={ev} onDismiss={() => dismiss(ev.id)} />
          ))}
        </div>
      )}
      {floats.length > 0 && (
        <div className="fixed top-24 right-6 z-[103] flex flex-col items-end pointer-events-none">
          {floats.map((ev, i) => (
            <XpFloat key={ev.id} ev={ev} index={i} onDismiss={() => dismiss(ev.id)} />
          ))}
        </div>
      )}
      {overlay && <Overlay key={overlay.id} ev={overlay} onDismiss={() => dismiss(overlay.id)} />}
    </>
  )
}

export default CeremonyLayer
