'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import {
  TOWN_WALK_TILE_SIZE,
  adjacentTownWalkTargets,
  stepTownWalk,
  townWalkMap,
  townWalkTileAt,
  type TownWalkDirection,
  type TownWalkMap,
  type TownWalkProp,
  type TownWalkPropKind,
  type TownWalkSnapshot,
  type TownWalkTarget,
  type TownWalkTerrain,
} from '@/lib/townWalk'
import styles from './TownWalkScene.module.css'

export interface TownWalkSceneProps {
  snapshot: TownWalkSnapshot
  onChange: (snapshot: TownWalkSnapshot) => void
  allowedAttractionIds: readonly string[]
  allowedNpcIds: readonly string[]
  onAttraction: (id: string) => void
  onTalk: (npcId: string) => void
  onBackToLook: () => void
  onToday?: () => void
}

const TILE = TOWN_WALK_TILE_SIZE
const KEY_DIRECTION: Readonly<Record<string, TownWalkDirection>> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
}
const DIRECTIONS: readonly { id: TownWalkDirection; arrow: string; label: string; dx: number; dy: number }[] = [
  { id: 'up', arrow: '↑', label: 'north', dx: 0, dy: -1 },
  { id: 'left', arrow: '←', label: 'west', dx: -1, dy: 0 },
  { id: 'down', arrow: '↓', label: 'south', dx: 0, dy: 1 },
  { id: 'right', arrow: '→', label: 'east', dx: 1, dy: 0 },
]
const TERRAIN_FILL: Record<TownWalkTerrain, string> = {
  grass: 'var(--walk-grass)', dirt: 'var(--pixel-earth-light)',
  water: 'var(--walk-water)', planks: 'var(--pixel-earth-mid)', floor: 'var(--walk-floor)',
}
const PROP_NAME: Record<TownWalkPropKind, string> = {
  tree: 'tree', rock: 'rock', canvas: 'canvas wall', wall: 'wall', crate: 'crate',
  bench: 'bench', table: 'table', marker: 'wooden marker', fire: 'fire',
}

/** Small painted shapes are projections of the shared collision data. */
function PropSprite({ kind }: { kind: TownWalkPropKind }) {
  switch (kind) {
    case 'tree': return <>
      <rect x="7" y="9" width="3" height="7" fill="var(--pixel-earth-dark)" />
      <path d="M5 0h6v2h3v3h2v5h-3v3H3v-3H0V5h2V2h3Z" fill="var(--pixel-forest-dark)" />
      <path d="M5 1h5v2h3v4h-3v3H3V7H1V4h4Z" fill="var(--walk-leaf)" />
      <path d="M5 2h4v2H5v3H3V4h2Z" fill="var(--pixel-forest-light)" opacity=".55" />
    </>
    case 'rock': return <>
      <path d="M3 5h8v2h3v6H1V8h2Z" fill="var(--pixel-earth-dark)" />
      <path d="M4 4h6v2h3v5H3V7h1Z" fill="var(--walk-stone)" />
      <path d="M4 5h6v2H4Z" fill="var(--pixel-ui-text)" />
    </>
    case 'crate': return <>
      <rect x="2" y="3" width="12" height="11" fill="var(--pixel-earth-dark)" />
      <rect x="3" y="3" width="10" height="9" fill="var(--pixel-earth-light)" />
      <path d="M4 4h8M4 11h8M4 4l8 7M12 4l-8 7" stroke="var(--pixel-gold-dark)" strokeWidth="1" />
    </>
    case 'bench': return <>
      <path d="M3 8h2v6H3Zm8 0h2v6h-2Z" fill="var(--pixel-earth-dark)" />
      <rect x="1" y="6" width="14" height="4" fill="var(--pixel-earth-light)" />
      <rect x="2" y="6" width="12" height="1" fill="var(--pixel-gold-mid)" />
    </>
    case 'table': return <>
      <path d="M2 8h3v7H2Zm9 0h3v7h-3Z" fill="var(--pixel-earth-dark)" />
      <rect x="0" y="3" width="16" height="8" fill="var(--pixel-earth-mid)" />
      <rect x="0" y="3" width="16" height="2" fill="var(--pixel-earth-light)" />
      <rect x="5" y="5" width="5" height="3" fill="var(--read-ink)" />
    </>
    case 'marker': return <>
      <rect x="6" y="2" width="4" height="13" fill="var(--pixel-earth-dark)" />
      <path d="M6 2h3v10H6ZM3 5h9v3H3Z" fill="var(--pixel-earth-light)" />
    </>
    case 'fire': return <>
      <path d="M3 10h10v3H3ZM1 11h2v2H1Zm12 0h2v2h-2Z" fill="var(--walk-stone)" />
      <path d="M5 7h2V3h2v3h2v3h2v3H4V9h1Z" fill="var(--pixel-fire-orange)" />
      <path d="M7 8h2V6h1v5H6V9h1Z" fill="var(--pixel-gold-light)" />
    </>
    case 'wall': return <>
      <rect width="16" height="16" fill="var(--pixel-earth-dark)" />
      <rect x="1" y="1" width="14" height="12" fill="var(--pixel-earth-mid)" />
      <path d="M1 4h14M1 9h14" stroke="var(--pixel-earth-light)" strokeWidth="1" />
    </>
    case 'canvas': return null // The connected shelter footprint is drawn together.
  }
}

function CanvasShelter({ props, door }: { props: readonly TownWalkProp[]; door?: TownWalkTarget }) {
  const cells = props.filter(prop => prop.kind === 'canvas')
  if (!cells.length) return null
  const left = Math.min(...cells.map(cell => cell.position.x)) * TILE
  const top = Math.min(...cells.map(cell => cell.position.y)) * TILE
  const width = (Math.max(...cells.map(cell => cell.position.x)) + 1) * TILE - left
  const height = (Math.max(...cells.map(cell => cell.position.y)) + 1) * TILE - top
  const doorX = door ? door.position.x * TILE - left : Math.floor(width / 2)
  return <g transform={`translate(${left} ${top})`}>
    <rect width={width} height={height} fill="var(--pixel-earth-dark)" />
    <path d={`M0 8L${width / 2} 0L${width} 8V${height - 4}H0Z`} fill="var(--walk-canvas)" />
    <path d={`M0 8L${width / 2} 0V${height - 4}H0Z`} fill="var(--read-ink)" />
    <path d={`M${width / 2} 1V${height - 5}M1 8H${width - 1}`} stroke="var(--pixel-earth-light)" strokeWidth="1" />
    <path d={`M1 ${height - 13}H${width - 1}M8 6V${height - 4}M${width - 8} 6V${height - 4}`} stroke="var(--pixel-earth-light)" strokeWidth="1" opacity=".7" />
    {door && <>
      <rect x={doorX} y={height - TILE} width={TILE} height={TILE} fill="var(--pixel-earth-dark)" />
      <path d={`M${doorX} ${height - TILE}v${TILE - 2}l4 -8v-6ZM${doorX + TILE} ${height - TILE}v${TILE - 2}l-4 -8v-6Z`} fill="var(--pixel-gold-light)" />
      <rect x={doorX + 2} y={height - 3} width={TILE - 4} height="3" fill="var(--pixel-earth-light)" />
    </>}
  </g>
}

function PersonSprite({ player, direction = 'down' }: { player?: boolean; direction?: TownWalkDirection }) {
  return <>
    <rect x="3" y="13" width="11" height="3" fill="var(--pixel-earth-dark)" opacity=".7" />
    <path d="M5 11h3v4H5Zm5 0h3v4h-3Z" fill="var(--pixel-bg-dark)" />
    <path d="M5 6h7v6H5ZM3 7h2v4H3Zm9 0h2v4h-2Z" fill={player ? 'var(--pixel-gold-mid)' : 'var(--pixel-sky-mid)'} />
    <rect x="6" y="3" width="5" height="4" fill="var(--read-ink)" />
    <rect x={direction === 'left' ? 6 : 10} y="4" width="1" height="1" fill="var(--pixel-earth-dark)" />
    <rect x="5" y="1" width="7" height="3" fill={player ? 'var(--pixel-gold-light)' : 'var(--pixel-earth-light)'} />
    <rect x="3" y="3" width="11" height="1" fill="var(--pixel-earth-dark)" />
    {direction === 'up' && <rect x="6" y="4" width="5" height="2" fill="var(--pixel-earth-mid)" />}
    {player && <path d="M1 15h3M13 15h3M1 12v3M16 12v3" stroke="var(--pixel-gold-light)" strokeWidth="1" />}
  </>
}

function MapArt({ map, snapshot, targets, direction }: {
  map: TownWalkMap; snapshot: TownWalkSnapshot; targets: readonly TownWalkTarget[]; direction: TownWalkDirection
}) {
  const nearby = new Set(adjacentTownWalkTargets(map, snapshot.position).map(target => target.id))
  return <svg viewBox={`0 0 ${map.width * TILE} ${map.height * TILE}`} className={styles.art}
    shapeRendering="crispEdges" aria-hidden="true" focusable="false" data-testid="town-walk-art">
    {map.terrainRows.flatMap((row, y) => [...row].map((_cell, x) => {
      const terrain = townWalkTileAt(map, { x, y })!.terrain
      return <g key={`${x},${y}`} transform={`translate(${x * TILE} ${y * TILE})`}>
        <rect width={TILE} height={TILE} fill={TERRAIN_FILL[terrain]} />
        {terrain === 'grass' && <path d="M3 11v-2m1 3v-2m7-5V3m1 3V4" stroke={(x + y) % 3 ? 'var(--walk-leaf)' : 'var(--pixel-earth-light)'} strokeWidth="1" />}
        {terrain === 'dirt' && <path d={`M${(x * 3 + y) % 12 + 1} 5h2M9 12h3`} stroke="var(--pixel-earth-mid)" strokeWidth="1" opacity=".55" />}
        {terrain === 'water' && <path d={`M1 ${y % 2 + 3}h6M9 11h5`} stroke="var(--pixel-ui-border)" strokeWidth="1" opacity=".65" />}
        {(terrain === 'floor' || terrain === 'planks') && <path d="M0 3h16M0 8h16M0 13h16M4 3v5m8 0v5" stroke="var(--pixel-earth-dark)" strokeWidth="1" opacity=".7" />}
        <path d="M0 16V0h16" fill="none" stroke="var(--pixel-earth-dark)" strokeWidth=".5" opacity=".12" />
      </g>
    }))}
    <CanvasShelter props={map.props} door={map.targets.find(target => target.kind === 'entrance')} />
    {map.props.filter(prop => prop.kind !== 'canvas').map((prop, i) => <g key={i}
      transform={`translate(${prop.position.x * TILE} ${prop.position.y * TILE})`}>
      <PropSprite kind={prop.kind} />
    </g>)}
    {targets.map(target => <g key={target.id} transform={`translate(${target.position.x * TILE} ${target.position.y * TILE})`}
      data-target-id={target.id} data-target-kind={target.kind}>
      <title>{target.label}</title>
      {nearby.has(target.id) && <rect x=".5" y=".5" width="15" height="15" fill="none" stroke="var(--pixel-gold-light)" strokeWidth="1" />}
      {target.kind === 'npc' ? <>
        <PersonSprite />
        <path d="M9 0h7v5h-4l-2 2V5H9Z" fill="var(--read-ink)" />
        <path d="M11 2h1m2 0h1" stroke="var(--pixel-earth-dark)" strokeWidth="1" />
      </> : target.kind === 'exit' ? <>
        <rect x="3" y="4" width="10" height="10" fill="var(--pixel-earth-dark)" />
        <path d="M8 5v7m-3-3 3 3 3-3" fill="none" stroke="var(--pixel-gold-light)" strokeWidth="1" />
      </> : <>
        <rect x="10" y="1" width="5" height="5" fill="var(--pixel-earth-dark)" />
        <path d={target.kind === 'entrance' ? 'M11 2h3v3h-1V3h-2Z' : 'M12 2h1v1h-1Zm0 2h1v1h-1Z'} fill="var(--pixel-gold-light)" />
      </>}
    </g>)}
    <g transform={`translate(${snapshot.position.x * TILE} ${snapshot.position.y * TILE})`} data-testid="town-walk-player"
      data-x={snapshot.position.x} data-y={snapshot.position.y}>
      <PersonSprite player direction={direction} />
    </g>
  </svg>
}

/** Presentation only: all movement/adjacency comes from townWalk and all
 * progress, dialogue and room snapshots remain owned by the caller. */
export function TownWalkScene({ snapshot, onChange, allowedAttractionIds, allowedNpcIds, onAttraction, onTalk, onBackToLook, onToday }: TownWalkSceneProps) {
  const instructionsId = useId()
  const nearbyId = useId()
  const [direction, setDirection] = useState<TownWalkDirection>('down')
  const [feedback, setFeedback] = useState({ place: '', text: '' })
  const map = townWalkMap(snapshot.townId, snapshot.roomId)
  const placeKey = `${snapshot.townId}:${snapshot.roomId}`
  if (!map) return <section className={styles.scene}>
    <button type="button" className={styles.button} onClick={onBackToLook}>Back to Look</button>
    <p>The local walk could not load. Return to the town view.</p>
  </section>

  const allowed = (target: TownWalkTarget) => target.kind === 'exit'
    || (target.kind === 'npc' ? allowedNpcIds.includes(target.npcId) : allowedAttractionIds.includes(target.attractionId))
  const targets = map.targets.filter(allowed)
  const nearby = adjacentTownWalkTargets(map, snapshot.position).filter(allowed)
  const say = (text: string, place = placeKey) => setFeedback({ text, place })

  const move = (nextDirection: TownWalkDirection) => {
    const next = stepTownWalk(map, snapshot.position, nextDirection)
    setDirection(nextDirection)
    if (next.x === snapshot.position.x && next.y === snapshot.position.y) {
      const delta = DIRECTIONS.find(item => item.id === nextDirection)!
      const tile = townWalkTileAt(map, { x: next.x + delta.dx, y: next.y + delta.dy })
      say(!tile ? 'The path ends at the edge of this scene.'
        : tile.terrain === 'water' ? 'The creek blocks the way. Look for the plank crossing.'
        : tile.prop ? `The ${PROP_NAME[tile.prop]} blocks the way.` : 'Someone is standing there. Walk around them.')
      return
    }
    onChange({ ...snapshot, position: next })
    say(`You moved ${DIRECTIONS.find(item => item.id === nextDirection)!.label}.`)
  }

  const onMapKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return
    const nextDirection = KEY_DIRECTION[event.key.toLowerCase()]
    if (!nextDirection) return
    event.preventDefault()
    move(nextDirection)
  }

  const interact = (target: TownWalkTarget) => {
    // Recheck the supplied era/unlock allowlists and physical reach at activation.
    if (!allowed(target) || !adjacentTownWalkTargets(map, snapshot.position).some(item => item.id === target.id)) return
    if (target.kind === 'npc') {
      onTalk(target.npcId)
      say(target.label + '. Their words are below the map.')
    } else if (target.kind === 'attraction') {
      onAttraction(target.attractionId)
      say(target.label + '. The reading is below the map.')
    } else if (target.kind === 'entrance') {
      onAttraction(target.attractionId)
      onChange({ ...snapshot, roomId: target.destination.roomId, position: { ...target.destination.position }, exteriorReturnPosition: { ...snapshot.position } })
      say('You step through the canvas doorway.', `${snapshot.townId}:${target.destination.roomId}`)
    } else {
      const { exteriorReturnPosition, ...rest } = snapshot
      onChange({ ...rest, roomId: target.destination.roomId, position: { ...(exteriorReturnPosition ?? target.destination.position) } })
      say('You return to where you entered.', `${snapshot.townId}:${target.destination.roomId}`)
    }
  }

  return <section className={styles.scene} data-testid="town-walk-scene" data-town={map.townId} data-room={map.roomId}>
    <header className={styles.toolbar}>
      <div><p className={styles.eyebrow}>1849 · Walk</p><h2>{map.label}</h2></div>
      <div className={styles.views}>
        <button type="button" className={styles.button} onClick={onBackToLook} data-testid="town-walk-look">Back to Look</button>
        {onToday && <button type="button" className={styles.button} onClick={onToday} data-testid="town-walk-today">Today</button>}
      </div>
    </header>
    <div className={styles.body}>
      <div className={styles.mapFrame}>
        <div className={styles.map} tabIndex={0} role="application" aria-label={`Walk around ${map.label}`}
          aria-describedby={`${instructionsId} ${nearbyId}`} onKeyDown={onMapKey}
          onPointerDown={event => event.currentTarget.focus({ preventScroll: true })}
          data-testid="town-walk-map">
          <MapArt map={map} snapshot={snapshot} targets={targets} direction={direction} />
        </div>
      </div>
      <div className={styles.legend} aria-label="Map legend">
        <span><i className={styles.playerKey} aria-hidden="true" />You</span>
        <span><i className={styles.npcKey} aria-hidden="true" />Person</span>
        <span><i className={styles.targetKey} aria-hidden="true" />Place to inspect</span>
      </div>
      <p id={instructionsId} className={styles.instructions}>Select the map, then use arrow keys or W A S D. You can also use the direction buttons.</p>
      <div className={styles.controls}>
        <div className={styles.directions} role="group" aria-label="Walk direction">
          {DIRECTIONS.map(item => <button key={item.id} type="button" className={`${styles.button} ${styles[item.id]}`}
            aria-label={`Walk ${item.label}`} onClick={() => move(item.id)} data-testid={`town-walk-${item.id}`}>
            <span aria-hidden="true">{item.arrow}</span>
          </button>)}
        </div>
        <div className={styles.nearby} id={nearbyId}>
          <p className={styles.eyebrow}>Within reach</p>
          {nearby.length ? nearby.map(target => <button key={target.id} type="button" className={styles.button}
            onClick={() => interact(target)} data-testid={`town-walk-action-${target.id}`} data-action-kind={target.kind}>
            {target.kind === 'exit' ? 'Exit to the camp' : target.label}
          </button>) : <p>Walk beside a person, doorway, or marked place to interact.</p>}
        </div>
      </div>
      <p className={styles.feedback} role="status" aria-live="polite" aria-atomic="true" data-testid="town-walk-feedback">
        {feedback.place === placeKey ? feedback.text : 'Take a moment to look around the camp.'}
      </p>
      <details className={styles.notes}>
        <summary>Fictional layout · about this scene</summary>
        <p>{map.notes}</p>
      </details>
    </div>
  </section>
}
