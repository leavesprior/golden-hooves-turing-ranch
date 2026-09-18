'use client'

/**
 * Ascii2Viewport — rung 0 of the ladder, drawn at eye level in colored ASCII.
 *
 * It takes the SAME props as TownWalkScene and the SAME snapshot, so switching
 * presentation mid-walk leaves you standing on the tile you were standing on.
 * Every rule (collision, reach, allowlists, room transitions) is the tile world's;
 * this component owns only the keys, the heading, and the drawing.
 */

import { useId, useState, type KeyboardEvent } from 'react'
import {
  COMPASS,
  ascii2Forward,
  ascii2Look,
  buildAscii2Scene,
  renderFrame,
  turnHeading,
  type Heading,
} from '@/lib/ascii2Walk'
import { ascii2TownFor } from '@/lib/ascii2Towns'
import { adjacentTownWalkTargets, townWalkMap, type TownWalkSnapshot, type TownWalkTarget } from '@/lib/townWalk'
import styles from './TownWalkScene.module.css'

export interface Ascii2ViewportProps {
  snapshot: TownWalkSnapshot
  onChange: (snapshot: TownWalkSnapshot) => void
  allowedAttractionIds: readonly string[]
  allowedNpcIds: readonly string[]
  onAttraction: (id: string) => void
  onTalk: (npcId: string) => void
  onBackToLook: () => void
  onPresentPixel?: () => void
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
}: Ascii2ViewportProps) {
  const instructionsId = useId()
  const [heading, setHeading] = useState<Heading>('up')
  const [line, setLine] = useState('')
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

  const frame = renderFrame(scene, snapshot.position, heading, allowed)
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
          className="w-full overflow-x-auto bg-[#0e0c0a] p-2 outline-none"
        >
          <pre className="m-0 font-mono text-[9px] leading-[1.05] sm:text-[11px] md:text-[13px]" aria-hidden="true">
            {frame.rows.map((row, r) => (
              <span key={r} className="block whitespace-pre">
                {mergeSpans(row).map((s, i) => (
                  <span key={i} style={{ color: s.color }}>
                    {s.text}
                  </span>
                ))}
              </span>
            ))}
          </pre>
        </div>

        <p id={instructionsId} className={styles.instructions}>
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
