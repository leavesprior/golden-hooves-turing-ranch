'use client'

/**
 * Ascii2Viewport — rung 0 of the ladder, drawn at eye level in colored ASCII.
 *
 * It takes the SAME props as TownWalkScene and the SAME snapshot, so switching
 * presentation mid-walk leaves you standing on the tile you were standing on.
 * Every rule (collision, reach, allowlists, room transitions) is the tile world's;
 * this component owns only the keys, the heading, and the drawing.
 */

import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import {
  COMPASS,
  ascii2Forward,
  ascii2Look,
  buildAscii2Scene,
  renderFrame,
  turnHeading,
  FRAME_COLS,
  FRAME_COLS_NARROW,
  FRAME_ROWS,
  type Heading,
} from '@/lib/ascii2Walk'
import { ascii2TownFor } from '@/lib/ascii2Towns'
import { adjacentTownWalkTargets, townWalkMap, type TownWalkSnapshot, type TownWalkTarget } from '@/lib/townWalk'
import styles from './TownWalkScene.module.css'

const LINE_HEIGHT = 1.05

export interface Ascii2ViewportProps {
  snapshot: TownWalkSnapshot
  onChange: (snapshot: TownWalkSnapshot) => void
  allowedAttractionIds: readonly string[]
  allowedNpcIds: readonly string[]
  onAttraction: (id: string) => void
  onTalk: (npcId: string) => void
  onBackToLook: () => void
  onPresentPixel?: () => void
  /** Facing is presentation state, but it should survive a toggle like position does. */
  heading?: Heading
  onHeadingChange?: (heading: Heading) => void
}

export function Ascii2Viewport({
  snapshot,
  onChange,
  allowedAttractionIds,
  allowedNpcIds,
  onAttraction,
  onTalk,
  onBackToLook,
  onPresentPixel,
  heading: headingProp,
  onHeadingChange,
}: Ascii2ViewportProps) {
  const instructionsId = useId()
  const [localHeading, setLocalHeading] = useState<Heading>('up')
  const heading = headingProp ?? localHeading
  const setHeading = (next: Heading) => {
    setLocalHeading(next)
    onHeadingChange?.(next)
  }
  const [line, setLine] = useState('')
  // The brief allows a 40-80 column frame. 80 columns on a phone is a smear —
  // measured: at 390px wide the text had to shrink to ~4px to fit. Narrow screens
  // get the 40-column frame instead, which is the same world at a readable size.
  const [cols, setCols] = useState<number>(FRAME_COLS)
  useEffect(() => {
    const pick = () => setCols(window.innerWidth < 900 ? FRAME_COLS_NARROW : FRAME_COLS)
    pick()
    window.addEventListener('resize', pick)
    return () => window.removeEventListener('resize', pick)
  }, [])
  const town = ascii2TownFor(snapshot.townId)
  const scene = town ? buildAscii2Scene(town, snapshot) : undefined

  if (!town || !scene || !townWalkMap(snapshot.townId, snapshot.roomId)) {
    return (
      <section className={styles.scene}>
        <button type="button" className={styles.button} onClick={onBackToLook}>
          Back to Look
        </button>
        <p>The ascii walk could not load this camp. Return to the town view.</p>
      </section>
    )
  }

  const allowed = (target: TownWalkTarget) =>
    target.kind === 'exit' ||
    (target.kind === 'npc' ? allowedNpcIds.includes(target.npcId) : allowedAttractionIds.includes(target.attractionId))

  const frame = renderFrame(scene, snapshot.position, heading, allowed, { cols })
  // One height budget for the box AND the glyphs, so 24 rows always fit the box
  // they are drawn in. Two budgets that merely agreed on desktop hid 16px of frame
  // there and 103px on a phone — the caption row that names the year among it.
  const budgetVh = cols === FRAME_COLS_NARROW ? 28 : 40
  const fontSize = `clamp(6px, min(${(95 / cols).toFixed(2)}vw, calc((${budgetVh}vh - 1rem) / ${(FRAME_ROWS * LINE_HEIGHT).toFixed(2)})), 15px)`
  const nearby = adjacentTownWalkTargets(scene.map, snapshot.position).filter(allowed)

  const walk = (back = false) => {
    const dir = back ? turnHeading(turnHeading(heading, 1), 1) : heading
    const result = ascii2Forward(scene, snapshot.position, dir)
    if (result.blocked) {
      setLine(result.blocked)
      return
    }
    onChange({ ...snapshot, position: result.position })
    setLine(result.crossing ? `${result.crossing.label}: ${result.crossing.notYet}` : '')
  }

  const interact = () => {
    const look = ascii2Look(scene, snapshot.position, heading, allowed)
    if (look.kind === 'absence') {
      // The year refuses, and says so. Nothing is entered, nothing is awarded.
      setLine(`${look.site.label}: ${look.site.notYet}`)
      return
    }
    if (look.kind === 'nothing') {
      setLine('Nothing within reach. Walk on.')
      return
    }
    runTarget(look.target)
  }

  // Identical semantics to TownWalkScene.interact — reach is rechecked here too.
  const runTarget = (target: TownWalkTarget) => {
    if (!allowed(target) || !adjacentTownWalkTargets(scene.map, snapshot.position).some((t) => t.id === target.id)) return
    if (target.kind === 'npc') {
      onTalk(target.npcId)
      setLine(`${target.label}. Their words are below the walk.`)
    } else if (target.kind === 'attraction') {
      onAttraction(target.attractionId)
      setLine(`${target.label}. The reading is below the walk.`)
    } else if (target.kind === 'entrance') {
      onAttraction(target.attractionId)
      onChange({
        ...snapshot,
        roomId: target.destination.roomId,
        position: { ...target.destination.position },
        exteriorReturnPosition: { ...snapshot.position },
      })
      setLine('You step through the canvas doorway.')
    } else {
      const { exteriorReturnPosition, ...rest } = snapshot
      onChange({
        ...rest,
        roomId: target.destination.roomId,
        position: { ...(exteriorReturnPosition ?? target.destination.position) },
      })
      setLine('You return to where you entered.')
    }
  }

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return
    const k = event.key.toLowerCase()
    if (k === 'w' || k === 'arrowup') { event.preventDefault(); walk() }
    else if (k === 's' || k === 'arrowdown') { event.preventDefault(); walk(true) }
    else if (k === 'a' || k === 'arrowleft') { event.preventDefault(); setHeading(turnHeading(heading, -1)) }
    else if (k === 'd' || k === 'arrowright') { event.preventDefault(); setHeading(turnHeading(heading, 1)) }
    else if (k === 'e' || k === 'enter') { event.preventDefault(); interact() }
  }

  return (
    <section className={styles.scene} data-testid="ascii2-scene" data-town={scene.townId} data-room={scene.roomId}>
      <header className={styles.toolbar}>
        <div>
          <p className={styles.eyebrow}>1849 · ASCII walk</p>
          <h2>{scene.face}</h2>
        </div>
        <div className={styles.views}>
          <button type="button" className={styles.button} onClick={onBackToLook} data-testid="ascii2-look">
            Back to Look
          </button>
          {onPresentPixel && (
            <button type="button" className={styles.button} onClick={onPresentPixel} data-testid="ascii2-to-pixel">
              Pixel walk
            </button>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <div
          tabIndex={0}
          role="application"
          aria-label={`Walk ${scene.face} in text, facing ${COMPASS[heading]}`}
          aria-describedby={instructionsId}
          onKeyDown={onKey}
          onPointerDown={(event) => event.currentTarget.focus({ preventScroll: true })}
          data-testid="ascii2-view"
          data-heading={heading}
          data-x={snapshot.position.x}
          data-y={snapshot.position.y}
          className="w-full overflow-auto bg-[#0e0c0a] p-2 outline-none"
          style={{ maxHeight: `${budgetVh}vh` }}
        >
          {/*
            The frame is 80x24 of fixed geometry, so it must SCALE to the screen
            rather than push the controls off it. Sized from both axes — width so
            80 columns fit, height so 24 rows do — with a hard cap on the wrapper
            as a backstop. The first version used fixed pixel sizes and covered
            three of its four direction buttons on desktop and all four on a
            phone, which the browser check now measures directly.
          */}
          <pre
            className="m-0 font-mono"
            style={{ fontSize, lineHeight: LINE_HEIGHT }}
            data-cols={cols}
            aria-hidden="true"
          >
            {/*
              Rows are separated by a real newline rather than by `display:block`.
              Inside a <pre> both look identical, but only the newline survives a
              copy — with block spans the whole 24-row frame copied out as one
              run-on line. (Caught by the browser check, which counted 1 row.)
            */}
            {/*
              `lineHeight: inherit` on every span, inline so it outranks the global
              `.visual64-shell span { line-height: 1.45 }` (globals.css), which was
              silently making each row 1.45x the font instead of the frame's 1.05x.
            */}
            {frame.rows.map((row, r) => (
              <span key={r} style={{ lineHeight: 'inherit' }}>
                {mergeSpans(row).map((s, i) => (
                  <span key={i} style={{ color: s.color, lineHeight: 'inherit' }}>
                    {s.text}
                  </span>
                ))}
                {r < frame.rows.length - 1 ? '\n' : ''}
              </span>
            ))}
          </pre>
        </div>

        {/*
          Kept in the DOM for `aria-describedby`, but off the small-screen layout:
          on a phone this paragraph wrapped to three lines and pushed the lower
          direction buttons underneath the town panel below. The buttons say the
          same thing visually.
        */}
        <p id={instructionsId} className={`sr-only sm:not-sr-only sm:${styles.instructions}`}>
          Select the view, then W walks, S backs up, A and D turn, E steps in. The buttons do the same.
        </p>

        <div className={styles.controls}>
          <div className={styles.directions} role="group" aria-label="Walk">
            <button type="button" className={`${styles.button} ${styles.left}`} aria-label="Turn left" onClick={() => setHeading(turnHeading(heading, -1))} data-testid="ascii2-turn-left">
              <span aria-hidden="true">↰</span>
            </button>
            <button type="button" className={`${styles.button} ${styles.up}`} aria-label="Walk forward" onClick={() => walk()} data-testid="ascii2-forward">
              <span aria-hidden="true">↑</span>
            </button>
            <button type="button" className={`${styles.button} ${styles.right}`} aria-label="Turn right" onClick={() => setHeading(turnHeading(heading, 1))} data-testid="ascii2-turn-right">
              <span aria-hidden="true">↱</span>
            </button>
            <button type="button" className={`${styles.button} ${styles.down}`} aria-label="Step back" onClick={() => walk(true)} data-testid="ascii2-back">
              <span aria-hidden="true">↓</span>
            </button>
          </div>
          <div className={styles.nearby}>
            <p className={styles.eyebrow}>Within reach</p>
            {nearby.length ? (
              nearby.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  className={styles.button}
                  onClick={() => runTarget(target)}
                  data-testid={`ascii2-action-${target.id}`}
                  data-action-kind={target.kind}
                >
                  {target.kind === 'exit' ? 'Exit to the camp' : target.label}
                </button>
              ))
            ) : (
              <p>Walk beside a person, doorway, or marked place to interact.</p>
            )}
          </div>
        </div>

        <p className={styles.feedback} role="status" aria-live="polite" aria-atomic="true" data-testid="ascii2-feedback">
          {line || frame.caption}
        </p>

        <details className={styles.notes}>
          <summary>Fictional layout · about this walk</summary>
          <p>{scene.map.notes}</p>
          <p>{town.note}</p>
        </details>
      </div>
    </section>
  )
}

function mergeSpans(row: { ch: string; color: string }[]): { text: string; color: string }[] {
  const out: { text: string; color: string }[] = []
  for (const cell of row) {
    const last = out[out.length - 1]
    if (last && last.color === cell.color) last.text += cell.ch
    else out.push({ text: cell.ch, color: cell.color })
  }
  return out
}
