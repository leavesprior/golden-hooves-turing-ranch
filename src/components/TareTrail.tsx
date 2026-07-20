'use client'

// ============================================================================
// THE TARE'S TRAIL (2026-06-18) — the front door to all the town investigations.
//
// The 10 Where-in-Time-style town cases were excellent but ORPHANED (only
// reachable 4-5 clicks deep). This is the wanted-poster case-board that makes
// them discoverable AND ties them into ONE chase: convict Cyrus Vane "the Tare"
// across the Mother Lode, town by town. It reads the solved set the investigation
// shell already writes (localStorage 'bobr_town_cases_solved'), shows progress,
// and — only once the board is complete — names the through-line that connects
// every case (so the theme is a player's DISCOVERY, not a writer's secret).
// ============================================================================

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { INVESTIGATIONS } from '@/lib/townInvestigations'
import { getCanonicalTown } from '@/lib/townRegistry'
import { getTownProgressMap, type TownProgress } from '@/lib/townProgress'
import { PlaceBackdrop } from '@/components/PlaceBackdrop'

const SOLVED_KEY = 'bobr_town_cases_solved'
const GOLD = 'var(--pixel-gold-light)'

function teaser(setup: string): string {
  const first = setup.split('. ')[0]
  return first.length < setup.length ? first + '.' : first
}

export function TareTrail() {
  const cases = Object.values(INVESTIGATIONS)
  const [solved, setSolved] = useState<string[]>([])
  // Unified per-town progression (investigation + explore mystery) — the "one
  // progression" view across both clue surfaces. Read client-side only.
  const [progress, setProgress] = useState<Record<string, TownProgress>>({})

  // Read solved set client-side only (avoids SSR/hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SOLVED_KEY)
      if (raw) setSolved(JSON.parse(raw))
    } catch { /* ignore */ }
    try {
      setProgress(getTownProgressMap(cases.map(c => c.townId)))
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const solvedCount = cases.filter(c => solved.includes(c.townId)).length
  const complete = solvedCount >= cases.length

  return (
    <div className="mx-auto max-w-4xl px-3 py-5 font-[var(--font-pixel)] text-[var(--pixel-ui-text)]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[16px]" style={{ color: GOLD }}>THE TARE'S TRAIL</h1>
        <Link href="/map" className="text-[10px] text-[var(--pixel-ui-text)]/70 hover:text-[var(--pixel-gold-light)]">see the full map ▸</Link>
      </div>
      <p className="mb-1 text-[11px] leading-relaxed text-[var(--pixel-ui-text)]/80">
        One swindler — <span style={{ color: GOLD }}>Cyrus Vane, "the Tare"</span> — works every camp in the Mother Lode, wearing each town's history like a coat. Follow his trail and convict him, town by town.
      </p>

      {/* progress */}
      <div className="my-3 flex items-center gap-3">
        <div className="h-2 flex-1 max-w-sm overflow-hidden rounded bg-black/40 border border-[var(--pixel-gold-dark)]">
          <div className="h-full bg-[var(--pixel-gold-mid)]" style={{ width: `${(solvedCount / cases.length) * 100}%` }} />
        </div>
        <span className="text-[11px]" style={{ color: GOLD }}>Vane convicted in {solvedCount} of {cases.length} towns</span>
      </div>

      {complete && (
        <div className="mb-4 border-2 border-[var(--pixel-gold-mid)] bg-[var(--pixel-gold-dark)]/20 p-3">
          <h2 className="mb-1 text-[12px]" style={{ color: GOLD }}>THE THROUGH-LINE</h2>
          <p className="text-[11px] leading-relaxed text-[var(--pixel-ui-text)]/90">
            Ten towns, ten disguises — one crime under all of them: the <span style={{ color: GOLD }}>forgery of presence</span>. Vane always claimed to have struck, settled, signed, survived, or stood where he never honestly did. And every town caught him the same way: by the honest record of who was <em>really</em> there. The one thing this country could never counterfeit.
          </p>
        </div>
      )}

      {/* wanted-poster grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cases.map(c => {
          const isSolved = solved.includes(c.townId)
          const county = getCanonicalTown(c.townId)?.county
          return (
            <Link
              key={c.townId}
              href={`/town/${c.townId}`}
              className={`relative flex flex-col border-2 p-3 transition-colors ${isSolved ? 'border-[var(--pixel-gold-mid)] bg-[var(--pixel-gold-dark)]/15' : 'border-[var(--pixel-gold-dark)] bg-black/40 hover:bg-[var(--pixel-gold-dark)]/10'}`}
            >
              <PlaceBackdrop id={c.townId} className="mb-2 h-20 rounded border border-[var(--pixel-gold-dark)]/60" />
              <div className="flex items-baseline justify-between">
                <span className="text-[12px]" style={{ color: GOLD }}>{c.title}</span>
                {isSolved
                  ? <span className="ml-2 flex-none rotate-[-8deg] border border-green-400 px-1 text-[8px] text-green-300">CONVICTED</span>
                  : <span className="ml-2 flex-none border border-[var(--pixel-ui-border)] px-1 text-[8px] text-[var(--pixel-ui-text)]/50">OPEN</span>}
              </div>
              <span className="mt-0.5 text-[9px] text-[var(--pixel-ui-text)]/50">{county} County</span>
              <span className="mt-1.5 text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">{teaser(c.setup)}</span>
              {/* Unified progression: also reflect the /explore mystery status for this town */}
              <span className="mt-1 text-[8px] text-[var(--pixel-ui-text)]/45">
                {progress[c.townId]?.fullySolved
                  ? '★ town fully solved (case + explore)'
                  : progress[c.townId]?.mysterySolved
                    ? '🔎 explore mystery solved · case ' + (isSolved ? 'too' : 'open')
                    : isSolved
                      ? '🔎 explore mystery still open'
                      : ''}
              </span>
              <span className="mt-2 text-[9px]" style={{ color: GOLD }}>{isSolved ? 'revisit the case ▸' : 'open the case ▸'}</span>
            </Link>
          )
        })}
      </div>

      {/* Whole-game continuity callout (additive from 2026-06 continuity audit) */}
      <div className="mt-4 border border-[var(--pixel-gold-dark)]/50 bg-black/30 p-2 text-[9px] leading-snug text-[var(--pixel-ui-text)]/70">
        The Tare slips through five eras on this one piece of land: 1849 Gold Rush (assayer), 1960s Forester&apos;s Trail, 1982 Ranch Begin, the present Back of Beyond, and a future only real stewardship can write. Every honest record — milled oak, tally books, frog counts, your QR presence — is what he cannot forge. Complete the trail across Quest, Where-in-Time, Explore, and the Ranch to close the case for good.
      </div>
    </div>
  )
}
