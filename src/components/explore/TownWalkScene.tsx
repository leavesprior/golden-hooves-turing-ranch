'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import {
  adjacentTownWalkTargets,
  stepTownWalk,
  TOWN_WALK_ART_TILE,
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
  /** Step DOWN the graphics ladder: draw this same walk as colored ASCII. */
  onPresentAscii2?: () => void
}

/** Draw at 32px (32/64-bit). Collision still uses TOWN_WALK_TILE_SIZE = 16. */
const TILE = TOWN_WALK_ART_TILE
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
  grass: '#4b692f', dirt: '#8f563b',
  water: '#306082', planks: '#8f563b', floor: '#663931',
}
const PROP_NAME: Record<TownWalkPropKind, string> = {
  tree: 'tree', rock: 'rock', canvas: 'canvas wall', wall: 'wall', crate: 'crate',
  bench: 'bench', table: 'table', marker: 'wooden marker', fire: 'fire',
}

/** 32×32 painted shapes — 32/64-bit, still projections of the shared collision data. */
function PropSprite({ kind }: { kind: TownWalkPropKind }) {
  switch (kind) {
    case 'tree': return <>
      <rect x="14" y="18" width="5" height="13" fill="#663931" />
      <rect x="13" y="18" width="1" height="10" fill="#45283c" />
      <path d="M6 20 L16 2 L26 20 Z" fill="#4b692f" />
      <path d="M8 22 L16 8 L24 22 Z" fill="#6abe30" />
      <path d="M11 22 L16 12 L21 22 Z" fill="#37946e" />
    </>
    case 'rock': return <>
      <path d="M4 24 L10 12 L22 10 L28 24 Z" fill="#595652" />
      <path d="M8 22 L12 14 L20 13 L24 22 Z" fill="#9badb7" />
      <path d="M10 16 h8 v2 H10 Z" fill="#cbdbfc" />
    </>
    case 'crate': return <>
      <rect x="4" y="8" width="24" height="20" fill="#663931" />
      <rect x="6" y="8" width="20" height="16" fill="#8f563b" />
      <path d="M6 8 L26 24 M26 8 L6 24" stroke="#8a6f30" strokeWidth="1" />
      <rect x="6" y="8" width="20" height="2" fill="#d9a066" />
    </>
    case 'bench': return <>
      <rect x="5" y="18" width="4" height="10" fill="#663931" />
      <rect x="23" y="18" width="4" height="10" fill="#663931" />
      <rect x="2" y="14" width="28" height="6" fill="#8f563b" />
      <rect x="2" y="14" width="28" height="2" fill="#d9a066" />
    </>
    case 'table': return <>
      <rect x="4" y="18" width="5" height="12" fill="#663931" />
      <rect x="23" y="18" width="5" height="12" fill="#663931" />
      <rect x="2" y="8" width="28" height="12" fill="#8f563b" />
      <rect x="2" y="8" width="28" height="3" fill="#d9a066" />
      <rect x="12" y="12" width="8" height="4" fill="#eec39a" />
    </>
    case 'marker': return <>
      <rect x="14" y="4" width="4" height="26" fill="#8f563b" />
      <rect x="6" y="10" width="20" height="4" fill="#d9a066" />
    </>
    case 'fire': return <>
      <rect x="6" y="24" width="20" height="5" fill="#595652" />
      <path d="M10 24 L16 6 L22 24 Z" fill="#df7126" />
      <path d="M13 24 L16 12 L19 24 Z" fill="#fbf236" />
      <rect x="8" y="22" width="16" height="3" fill="#663931" />
    </>
    case 'wall': return <>
      <rect width="32" height="32" fill="#663931" />
      <rect x="2" y="2" width="28" height="24" fill="#8f563b" />
      <path d="M2 10h28M2 18h28" stroke="#d9a066" strokeWidth="1" />
    </>
    case 'canvas': return null
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
    <rect width={width} height={height} fill="#663931" />
    <path d={`M0 16L${width / 2} 0L${width} 16V${height - 6}H0Z`} fill="#e8d4a8" />
    <path d={`M0 16L${width / 2} 0V${height - 6}H0Z`} fill="#c4a574" />
    <path d={`M${width / 2} 0V${height - 6}M1 16H${width - 1}`} stroke="#8f563b" strokeWidth="2" />
    <path d={`M8 18V${height - 6}M${width - 8} 18V${height - 6}`} stroke="#d9a066" strokeWidth="1" opacity=".8" />
    {door && <>
      <rect x={doorX} y={height - TILE} width={TILE} height={TILE} fill="#45283c" />
      <path d={`M${doorX + 6} ${height - 4} V${height - TILE + 6} L${doorX + TILE / 2} ${height - TILE} L${doorX + TILE - 6} ${height - TILE + 6} V${height - 4}Z`} fill="#8f563b" />
      <rect x={doorX + 10} y={height - TILE + 10} width={TILE - 20} height={TILE - 16} fill="#222034" />
    </>}
  </g>
}

function PersonSprite({ player, direction = 'down' }: { player?: boolean; direction?: TownWalkDirection }) {
  const coat = player ? '#df7126' : '#3f3f74'
  const hat = player ? '#fbf236' : '#8f563b'
  return <>
    <ellipse cx="16" cy="30" rx="8" ry="2" fill="#222034" opacity=".55" />
    <rect x="11" y="22" width="4" height="8" fill="#663931" />
    <rect x="17" y="22" width="4" height="8" fill="#663931" />
    <rect x="10" y="12" width="12" height="12" fill={coat} />
    <rect x="8" y="14" width="3" height="8" fill={coat} />
    <rect x="21" y="14" width="3" height="8" fill={coat} />
    <rect x="12" y="6" width="8" height="8" fill="#d9a066" />
    <rect x={direction === 'left' ? 13 : 17} y="9" width="2" height="2" fill="#222034" />
    <rect x="11" y="3" width="10" height="5" fill={hat} />
    <rect x="10" y="7" width="12" height="2" fill="#663931" />
    {direction === 'up' && <rect x="12" y="8" width="8" height="4" fill="#8f563b" />}
    {player && <rect x="14" y="1" width="4" height="2" fill="#fbf236" />}
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
        {terrain === 'grass' && <path d="M6 22v-4m4 6v-5m8-8V6m5 5V8m12 14v-3" stroke={(x + y) % 3 ? '#6abe30' : '#8a6f30'} strokeWidth="1" />}
        {terrain === 'dirt' && <path d={`M${(x * 5 + y) % 20 + 2} 10h4M18 24h6`} stroke="#663931" strokeWidth="2" opacity=".55" />}
        {terrain === 'water' && <path d={`M2 ${6 + (y % 2) * 4}h12M16 20h12`} stroke="#5b6ee1" strokeWidth="2" opacity=".7" />}
        {(terrain === 'floor' || terrain === 'planks') && <path d="M0 8h32M0 16h32M0 24h32M8 8v8m16 0v8" stroke="#45283c" strokeWidth="1" opacity=".8" />}
        <path d="M0 32V0h32" fill="none" stroke="#222034" strokeWidth="1" opacity=".12" />
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
      {nearby.has(target.id) && <rect x="1" y="1" width="30" height="30" fill="none" stroke="#fbf236" strokeWidth="2" />}
      {target.kind === 'npc' ? <>
        <PersonSprite />
        <path d="M18 0h12v8h-6l-3 3V8H18Z" fill="#222034" />
        <path d="M22 3h2m3 0h2" stroke="#d9a066" strokeWidth="1" />
      </> : target.kind === 'exit' ? <>
        <rect x="6" y="8" width="20" height="18" fill="#222034" />
        <path d="M16 10v14m-6-6 6 6 6-6" fill="none" stroke="#fbf236" strokeWidth="2" />
      </> : <>
        <rect x="20" y="2" width="10" height="10" fill="#222034" />
        <path d={target.kind === 'entrance' ? 'M22 4h6v6h-2V6h-4Z' : 'M24 4h2v2h-2Zm0 4h2v2h-2Z'} fill="#fbf236" />
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
export function TownWalkScene({ snapshot, onChange, allowedAttractionIds, allowedNpcIds, onAttraction, onTalk, onBackToLook, onToday, onPresentAscii2 }: TownWalkSceneProps) {
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
      <div><p className={styles.eyebrow}>1849 · 32-bit · map</p><h2>{map.label}</h2></div>
      <div className={styles.views}>
        <button type="button" className={styles.button} onClick={onBackToLook} data-testid="town-walk-look">Back to Look</button>
        {onToday && <button type="button" className={styles.button} onClick={onToday} data-testid="town-walk-today">Today</button>}
        {onPresentAscii2 && <button type="button" className={styles.button} onClick={onPresentAscii2} data-testid="town-walk-ascii2">Eye-level</button>}
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
