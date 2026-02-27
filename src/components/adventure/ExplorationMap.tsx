'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { CrossGameStorage } from '@/lib/crossGameProgression'
import { playSFX } from '@/app/oregon-trail/lib/audioManager'

// ============================================
// TYPES
// ============================================

export interface ExplorationLocation {
  id: string
  name: string
  icon: string
  x: number    // 0-100 grid coordinate
  y: number    // 0-100 grid coordinate
  discovered: boolean
  visited: boolean
  connectedTo: string[]
  type: string
}

interface ExplorationMapProps {
  chapter: number
  locations: ExplorationLocation[]
  currentLocationId: string
  playerIcon?: string
  onArrive: (locationId: string) => void
  onEncounter?: () => void
  width?: number
  height?: number
}

// ============================================
// CONSTANTS
// ============================================

const GRID_SCALE = 12           // pixels per grid unit
const PLAYER_SPEED = 2.0        // grid units per second
const ENCOUNTER_DISTANCE = 5    // grid units between encounter checks
const ENCOUNTER_BASE_CHANCE = 0.15
const ARRIVAL_RADIUS = 1.5      // grid units
const FOG_RADIUS = 15           // grid units around discovered locations
const CAMERA_LERP = 0.08        // smooth follow factor

// Color palette — Fallout 1 wasteland meets Gold Country
const COLORS = {
  bg: 0x1a1a0e,
  terrainBase: 0x2d3a1a,
  terrainNoise: 0x253015,
  river: 0x3b5998,
  mountain: 0x5c5c5c,
  trail: 0xd97706,
  trailDot: 0xb45309,
  locationDiscovered: 0xd97706,
  locationVisited: 0x92400e,
  locationDim: 0x4a5568,
  player: 0xfbbf24,
  playerTrail: 0xd97706,
  fog: 0x0a0a06,
  dust: 0x8b7355,
  arrivalFlash: 0xfbbf24,
  pulse: 0x6366f1,
  text: 0xd4d4d8,
  textAmber: 0xfbbf24,
}

// ============================================
// SEEDED RANDOM for consistent terrain
// ============================================

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ============================================
// EXPLORATION MAP COMPONENT
// ============================================

export function ExplorationMap({
  chapter,
  locations,
  currentLocationId,
  playerIcon,
  onArrive,
  onEncounter,
  width: propWidth,
  height: propHeight,
}: ExplorationMapProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<any>(null)
  const pixiLoadedRef = useRef(false)
  const destroyedRef = useRef(false)

  // Player state refs (mutated in game loop, no re-renders)
  const playerRef = useRef({
    x: 50, y: 50,
    targetX: 50, targetY: 50,
    walking: false,
    targetLocationId: null as string | null,
    distanceSinceCheck: 0,
    direction: 0,  // radians
  })
  const keysRef = useRef(new Set<string>())
  const cameraRef = useRef({ x: 50, y: 50 })
  const trailRef = useRef<Array<{ x: number; y: number; age: number }>>([])

  // React state for UI overlays
  const [distanceText, setDistanceText] = useState('')
  const [arrived, setArrived] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Place player at current location on mount
  useEffect(() => {
    const loc = locations.find(l => l.id === currentLocationId)
    if (loc) {
      playerRef.current.x = loc.x
      playerRef.current.y = loc.y
      playerRef.current.targetX = loc.x
      playerRef.current.targetY = loc.y
      cameraRef.current.x = loc.x
      cameraRef.current.y = loc.y
    }
  }, [currentLocationId, locations])

  // ============================================
  // PIXI INITIALIZATION (dynamic import, SSR-safe)
  // ============================================
  useEffect(() => {
    if (!canvasRef.current || pixiLoadedRef.current) return
    pixiLoadedRef.current = true
    destroyedRef.current = false

    let app: any = null

    ;(async () => {
      // Dynamic import — avoids SSR crash
      const PIXI = await import('pixi.js')
      if (destroyedRef.current) return

      app = new PIXI.Application()
      const w = propWidth || canvasRef.current?.clientWidth || 800
      const h = propHeight || canvasRef.current?.clientHeight || 600
      await app.init({
        width: w,
        height: h,
        backgroundColor: COLORS.bg,
        antialias: false,
        resolution: 1,
      })

      if (destroyedRef.current) { app.destroy(true); return }

      canvasRef.current!.appendChild(app.canvas)
      appRef.current = app

      // ── Create layers ──
      const worldContainer = new PIXI.Container()
      const terrainLayer = new PIXI.Container()
      const pathLayer = new PIXI.Container()
      const locationLayer = new PIXI.Container()
      const playerLayer = new PIXI.Container()
      const fogLayer = new PIXI.Container()
      const uiLayer = new PIXI.Container()

      worldContainer.addChild(terrainLayer, pathLayer, fogLayer, locationLayer, playerLayer)
      app.stage.addChild(worldContainer, uiLayer)

      // ── Draw terrain ──
      drawTerrain(PIXI, terrainLayer, chapter)
      drawRivers(PIXI, terrainLayer, chapter)
      drawMountains(PIXI, terrainLayer, chapter)

      // ── Draw paths between locations ──
      drawPaths(PIXI, pathLayer, locations)

      // ── Draw location markers ──
      const locationSprites: Map<string, any> = new Map()
      for (const loc of locations) {
        const marker = drawLocationMarker(PIXI, loc)
        locationLayer.addChild(marker)
        locationSprites.set(loc.id, marker)

        // Click handler on location marker
        marker.eventMode = 'static'
        marker.cursor = 'pointer'
        marker.on('pointerdown', () => {
          if (loc.discovered) {
            playerRef.current.targetX = loc.x
            playerRef.current.targetY = loc.y
            playerRef.current.walking = true
            playerRef.current.targetLocationId = loc.id
            playerRef.current.distanceSinceCheck = 0
          }
        })
      }

      // ── Draw fog of war ──
      const fogGraphics = new PIXI.Graphics()
      fogLayer.addChild(fogGraphics)

      // ── Player sprite ──
      const playerContainer = new PIXI.Container()
      const playerDot = new PIXI.Graphics()
      playerDot.circle(0, 0, 0.6 * GRID_SCALE)
      playerDot.fill({ color: COLORS.player, alpha: 0.9 })
      playerDot.circle(0, 0, 0.8 * GRID_SCALE)
      playerDot.stroke({ color: COLORS.player, width: 1, alpha: 0.3 })
      playerContainer.addChild(playerDot)

      // Direction arrow
      const arrow = new PIXI.Graphics()
      arrow.poly([
        { x: 0, y: -0.9 * GRID_SCALE },
        { x: -0.4 * GRID_SCALE, y: 0.2 * GRID_SCALE },
        { x: 0.4 * GRID_SCALE, y: 0.2 * GRID_SCALE },
      ])
      arrow.fill({ color: 0xfef3c7, alpha: 0.8 })
      playerContainer.addChild(arrow)

      // Player icon text (emoji)
      const iconText = new PIXI.Text({
        text: playerIcon || '\u26CF',  // pick (prospector)
        style: { fontSize: 14, fill: 0xffffff },
      })
      iconText.anchor.set(0.5, 0.5)
      iconText.y = -1.6 * GRID_SCALE
      playerContainer.addChild(iconText)

      playerLayer.addChild(playerContainer)

      // Trail graphics
      const trailGraphics = new PIXI.Graphics()
      playerLayer.addChild(trailGraphics)

      // Dust particle pool
      const dustParticles: Array<{ g: any; life: number; vx: number; vy: number }> = []
      const dustContainer = new PIXI.Container()
      playerLayer.addChild(dustContainer)

      // ── Arrival flash overlay ──
      const flashOverlay = new PIXI.Graphics()
      flashOverlay.rect(0, 0, w, h)
      flashOverlay.fill({ color: COLORS.arrivalFlash, alpha: 0 })
      flashOverlay.alpha = 0
      uiLayer.addChild(flashOverlay)

      // ── GAME LOOP ──
      let flashTimer = 0
      let pulsePhase = 0

      app.ticker.add((ticker: any) => {
        const dt = ticker.deltaTime / 60  // seconds
        const player = playerRef.current
        const camera = cameraRef.current
        const keys = keysRef.current

        pulsePhase += dt * 2

        // ── Keyboard movement ──
        let kx = 0, ky = 0
        if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) ky = -1
        if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) ky = 1
        if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) kx = -1
        if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) kx = 1

        if (kx !== 0 || ky !== 0) {
          // Normalize diagonal
          const len = Math.sqrt(kx * kx + ky * ky)
          kx /= len; ky /= len
          player.targetX = player.x + kx * PLAYER_SPEED * 10
          player.targetY = player.y + ky * PLAYER_SPEED * 10
          player.walking = true
          player.targetLocationId = null  // free movement
        }

        // ── Walk toward target ──
        if (player.walking) {
          const dx = player.targetX - player.x
          const dy = player.targetY - player.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist > 0.05) {
            const step = Math.min(PLAYER_SPEED * dt, dist)
            const nx = dx / dist
            const ny = dy / dist
            player.x += nx * step
            player.y += ny * step
            player.direction = Math.atan2(ny, nx)
            player.distanceSinceCheck += step

            // Clamp to map
            player.x = Math.max(2, Math.min(98, player.x))
            player.y = Math.max(2, Math.min(98, player.y))

            // Trail
            trailRef.current.push({ x: player.x, y: player.y, age: 0 })
            if (trailRef.current.length > 60) trailRef.current.shift()

            // Dust particles
            if (Math.random() < 0.3) {
              const dg = new PIXI.Graphics()
              dg.circle(0, 0, 1.5 + Math.random() * 2)
              dg.fill({ color: COLORS.dust, alpha: 0.4 })
              dg.x = player.x * GRID_SCALE + (Math.random() - 0.5) * 6
              dg.y = player.y * GRID_SCALE + (Math.random() - 0.5) * 6
              dustContainer.addChild(dg)
              dustParticles.push({
                g: dg,
                life: 1.0,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 4,
              })
            }

            // ── Encounter check ──
            if (player.distanceSinceCheck >= ENCOUNTER_DISTANCE && onEncounter) {
              player.distanceSinceCheck = 0
              const chance = ENCOUNTER_BASE_CHANCE + (dist > 10 ? 0.1 : 0)
              if (Math.random() < chance) {
                player.walking = false
                flashTimer = 0.3
                flashOverlay.alpha = 0.5
                onEncounter()
              }
            }

            // ── Distance text ──
            if (player.targetLocationId) {
              const tLoc = locations.find(l => l.id === player.targetLocationId)
              if (tLoc) {
                const remDist = Math.sqrt(
                  (tLoc.x - player.x) ** 2 + (tLoc.y - player.y) ** 2
                )
                setDistanceText(`${(remDist * 0.3).toFixed(1)} miles to ${tLoc.name}`)
              }
            } else {
              setDistanceText('')
            }

            // ── Check arrival at any location ──
            for (const loc of locations) {
              if (!loc.discovered) continue
              const ld = Math.sqrt((loc.x - player.x) ** 2 + (loc.y - player.y) ** 2)
              if (ld < ARRIVAL_RADIUS && player.targetLocationId === loc.id) {
                player.walking = false
                player.x = loc.x
                player.y = loc.y
                player.targetLocationId = null
                setDistanceText('')

                // Arrival flash
                flashTimer = 0.4
                flashOverlay.alpha = 0.6

                // SFX + callbacks
                try { playSFX('success') } catch {}
                CrossGameStorage.logEvent(
                  'rpg_adventure',
                  'landmark_reached',
                  `Arrived at ${loc.name}`,
                  { locationId: loc.id }
                )
                setArrived(true)
                setTimeout(() => {
                  setArrived(false)
                  onArrive(loc.id)
                }, 300)
                break
              }
            }
          } else {
            // Close enough to target but no location — stop
            if (!player.targetLocationId) {
              player.walking = false
            }
          }
        }

        // ── Camera follow ──
        camera.x += (player.x - camera.x) * CAMERA_LERP
        camera.y += (player.y - camera.y) * CAMERA_LERP
        worldContainer.x = w / 2 - camera.x * GRID_SCALE
        worldContainer.y = h / 2 - camera.y * GRID_SCALE

        // ── Update player position ──
        playerContainer.x = player.x * GRID_SCALE
        playerContainer.y = player.y * GRID_SCALE
        arrow.rotation = player.direction + Math.PI / 2

        // ── Update trail ──
        trailGraphics.clear()
        for (let i = 0; i < trailRef.current.length; i++) {
          const t = trailRef.current[i]
          t.age += dt
          const alpha = Math.max(0, 1 - t.age / 3)
          if (alpha <= 0) { trailRef.current.splice(i, 1); i--; continue }
          trailGraphics.circle(t.x * GRID_SCALE, t.y * GRID_SCALE, 1.2)
          trailGraphics.fill({ color: COLORS.playerTrail, alpha: alpha * 0.5 })
        }

        // ── Update dust ──
        for (let i = dustParticles.length - 1; i >= 0; i--) {
          const p = dustParticles[i]
          p.life -= dt * 1.5
          if (p.life <= 0) {
            dustContainer.removeChild(p.g)
            p.g.destroy()
            dustParticles.splice(i, 1)
            continue
          }
          p.g.x += p.vx * dt
          p.g.y += p.vy * dt
          p.g.alpha = p.life * 0.4
        }

        // ── Flash timer ──
        if (flashTimer > 0) {
          flashTimer -= dt
          flashOverlay.alpha = Math.max(0, flashTimer * 2)
        }

        // ── Update fog of war ──
        fogGraphics.clear()
        const mapW = 100 * GRID_SCALE
        const mapH = 100 * GRID_SCALE
        fogGraphics.rect(0, 0, mapW, mapH)
        fogGraphics.fill({ color: COLORS.fog, alpha: 0.85 })

        // Cut out revealed areas
        for (const loc of locations) {
          if (!loc.discovered) continue
          const radius = FOG_RADIUS * GRID_SCALE
          fogGraphics.circle(loc.x * GRID_SCALE, loc.y * GRID_SCALE, radius)
          fogGraphics.cut()
        }
        // Also cut around player
        fogGraphics.circle(player.x * GRID_SCALE, player.y * GRID_SCALE, FOG_RADIUS * GRID_SCALE * 0.5)
        fogGraphics.cut()

        // ── Update location marker pulsing ──
        for (const loc of locations) {
          const sprite = locationSprites.get(loc.id)
          if (!sprite) continue
          if (loc.discovered) {
            sprite.alpha = 1
            if (loc.id === currentLocationId) {
              sprite.scale.set(1 + Math.sin(pulsePhase * 3) * 0.05)
            } else {
              sprite.scale.set(1)
            }
          } else {
            // Check if connected to a discovered location
            const isAdjacent = locations.some(
              other => other.discovered && other.connectedTo.includes(loc.id)
            )
            if (isAdjacent) {
              sprite.alpha = 0.25 + Math.sin(pulsePhase * 1.5) * 0.1
              sprite.visible = true
            } else {
              sprite.visible = false
            }
          }
        }

        // ── Animate path pulse ──
        if (player.walking && player.targetLocationId) {
          pathLayer.alpha = 0.7 + Math.sin(pulsePhase * 4) * 0.3
        } else {
          pathLayer.alpha = 1
        }
      })

      setMapReady(true)
    })()

    return () => {
      destroyedRef.current = true
      if (appRef.current) {
        try { appRef.current.destroy(true) } catch {}
        appRef.current = null
      }
      pixiLoadedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Keyboard input ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault()
        keysRef.current.add(e.key)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return (
    <div className="relative">
      <div
        ref={canvasRef}
        className="border-2 border-amber-700 rounded overflow-hidden"
        style={{ width: propWidth || '100%', height: propHeight || 500 }}
      />
      {/* Distance overlay */}
      {distanceText && (
        <div className="absolute top-2 right-2 font-[var(--font-pixel)] text-amber-400 text-[10px] bg-black/80 px-2 py-1 rounded border border-amber-800">
          {distanceText}
        </div>
      )}
      {/* WASD hint */}
      {mapReady && (
        <div className="absolute bottom-2 left-2 font-[var(--font-pixel)] text-amber-600/60 text-[8px] bg-black/60 px-2 py-1 rounded">
          WASD/Arrows to walk {'\u2022'} Click location to travel
        </div>
      )}
      {/* Chapter label */}
      <div className="absolute top-2 left-2 font-[var(--font-pixel)] text-amber-500 text-[10px] bg-black/80 px-2 py-1 rounded border border-amber-900">
        CH.{chapter} {'\u2022'} GOLD COUNTRY
      </div>
      {/* Arrival flash text */}
      {arrived && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="font-[var(--font-pixel)] text-amber-300 text-lg bg-black/70 px-4 py-2 rounded border border-amber-500 animate-pulse">
            ARRIVED
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// DRAWING HELPERS
// ============================================

function drawTerrain(PIXI: any, container: any, chapter: number) {
  const rng = seededRandom(chapter * 7919)
  const g = new PIXI.Graphics()
  const mapW = 100 * GRID_SCALE
  const mapH = 100 * GRID_SCALE

  // Base fill
  g.rect(0, 0, mapW, mapH)
  g.fill({ color: COLORS.terrainBase })

  // Noise patches
  for (let i = 0; i < 200; i++) {
    const px = rng() * mapW
    const py = rng() * mapH
    const size = 8 + rng() * 30
    g.rect(px - size / 2, py - size / 2, size, size)
    g.fill({
      color: rng() > 0.5 ? COLORS.terrainNoise : 0x344a1e,
      alpha: 0.3 + rng() * 0.3,
    })
  }

  // Grass tufts (small dots scattered)
  for (let i = 0; i < 400; i++) {
    const px = rng() * mapW
    const py = rng() * mapH
    g.circle(px, py, 0.8 + rng() * 1.5)
    g.fill({ color: 0x4a6b2a, alpha: 0.2 + rng() * 0.2 })
  }

  container.addChild(g)
}

function drawRivers(PIXI: any, container: any, chapter: number) {
  const rng = seededRandom(chapter * 3571)
  const g = new PIXI.Graphics()

  // Generate 2-3 rivers as curved paths
  const riverCount = 2 + Math.floor(rng() * 2)
  for (let r = 0; r < riverCount; r++) {
    const startX = rng() * 100 * GRID_SCALE
    const startY = 0
    const points: Array<{ x: number; y: number }> = []
    let cx = startX
    let cy = startY
    for (let step = 0; step < 8; step++) {
      cx += (rng() - 0.5) * 20 * GRID_SCALE
      cy += (12 + rng() * 8) * GRID_SCALE
      cx = Math.max(5 * GRID_SCALE, Math.min(95 * GRID_SCALE, cx))
      points.push({ x: cx, y: cy })
    }

    // Draw river as thick line segments
    g.moveTo(startX, startY)
    for (const pt of points) {
      g.lineTo(pt.x, pt.y)
    }
    g.stroke({ color: COLORS.river, width: 3 + rng() * 4, alpha: 0.5, cap: 'round', join: 'round' })

    // Thinner highlight
    g.moveTo(startX + 1, startY)
    for (const pt of points) {
      g.lineTo(pt.x + 1, pt.y)
    }
    g.stroke({ color: 0x5b79b8, width: 1, alpha: 0.3, cap: 'round', join: 'round' })
  }

  container.addChild(g)
}

function drawMountains(PIXI: any, container: any, chapter: number) {
  const rng = seededRandom(chapter * 1237)
  const g = new PIXI.Graphics()

  // Mountain clusters in corners and edges
  const clusterCount = 4 + Math.floor(rng() * 4)
  for (let c = 0; c < clusterCount; c++) {
    const cx = rng() * 100 * GRID_SCALE
    const cy = rng() * 100 * GRID_SCALE
    const peakCount = 3 + Math.floor(rng() * 5)

    for (let p = 0; p < peakCount; p++) {
      const mx = cx + (rng() - 0.5) * 15 * GRID_SCALE
      const my = cy + (rng() - 0.5) * 10 * GRID_SCALE
      const h = 8 + rng() * 16
      const w = 6 + rng() * 12

      // Mountain triangle
      g.poly([
        { x: mx, y: my - h },
        { x: mx - w, y: my },
        { x: mx + w, y: my },
      ])
      g.fill({ color: COLORS.mountain, alpha: 0.4 + rng() * 0.2 })

      // Snow cap on taller peaks
      if (h > 16) {
        g.poly([
          { x: mx, y: my - h },
          { x: mx - w * 0.25, y: my - h * 0.6 },
          { x: mx + w * 0.25, y: my - h * 0.6 },
        ])
        g.fill({ color: 0xd4d4d8, alpha: 0.3 })
      }
    }
  }

  container.addChild(g)
}

function drawPaths(PIXI: any, container: any, locations: ExplorationLocation[]) {
  const g = new PIXI.Graphics()
  const drawn = new Set<string>()

  for (const loc of locations) {
    if (!loc.discovered) continue
    for (const adjId of loc.connectedTo) {
      const adj = locations.find(l => l.id === adjId)
      if (!adj) continue
      const key = [loc.id, adjId].sort().join('-')
      if (drawn.has(key)) continue
      drawn.add(key)

      // Dotted trail line
      const x1 = loc.x * GRID_SCALE
      const y1 = loc.y * GRID_SCALE
      const x2 = adj.x * GRID_SCALE
      const y2 = adj.y * GRID_SCALE
      const dx = x2 - x1
      const dy = y2 - y1
      const len = Math.sqrt(dx * dx + dy * dy)
      const dotSpacing = 6
      const dots = Math.floor(len / dotSpacing)
      const bothDiscovered = loc.discovered && adj.discovered

      for (let i = 0; i <= dots; i++) {
        const t = i / Math.max(dots, 1)
        const px = x1 + dx * t
        const py = y1 + dy * t
        g.circle(px, py, bothDiscovered ? 1.0 : 0.6)
        g.fill({
          color: bothDiscovered ? COLORS.trail : COLORS.locationDim,
          alpha: bothDiscovered ? 0.5 : 0.2,
        })
      }
    }
  }

  container.addChild(g)
}

function drawLocationMarker(PIXI: any, loc: ExplorationLocation): any {
  const container = new PIXI.Container()
  container.x = loc.x * GRID_SCALE
  container.y = loc.y * GRID_SCALE

  const isDiscovered = loc.discovered
  const isVisited = loc.visited

  // Base circle
  const base = new PIXI.Graphics()
  const radius = 0.8 * GRID_SCALE
  base.circle(0, 0, radius)
  if (isDiscovered) {
    base.fill({ color: isVisited ? COLORS.locationVisited : 0x1a1a0e })
    base.circle(0, 0, radius)
    base.stroke({ color: COLORS.locationDiscovered, width: 1.5, alpha: 0.9 })
  } else {
    base.fill({ color: 0x1a1a0e, alpha: 0.5 })
    base.circle(0, 0, radius)
    base.stroke({ color: COLORS.locationDim, width: 1, alpha: 0.4 })
  }
  container.addChild(base)

  // Glow ring for discovered locations
  if (isDiscovered) {
    const glow = new PIXI.Graphics()
    glow.circle(0, 0, radius * 1.6)
    glow.fill({ color: COLORS.locationDiscovered, alpha: 0.08 })
    container.addChildAt(glow, 0)
  }

  // Visited checkmark
  if (isVisited && isDiscovered) {
    const check = new PIXI.Text({
      text: '\u2713',
      style: { fontSize: 8, fill: COLORS.locationDiscovered },
    })
    check.anchor.set(0.5, 0.5)
    check.x = radius * 0.9
    check.y = -radius * 0.9
    container.addChild(check)
  }

  // Icon (emoji text)
  if (isDiscovered) {
    const icon = new PIXI.Text({
      text: loc.icon,
      style: { fontSize: 12, fill: 0xffffff },
    })
    icon.anchor.set(0.5, 0.5)
    container.addChild(icon)
  } else {
    const qmark = new PIXI.Text({
      text: '?',
      style: {
        fontSize: 10,
        fill: COLORS.locationDim,
        fontFamily: 'monospace',
        fontWeight: 'bold',
      },
    })
    qmark.anchor.set(0.5, 0.5)
    container.addChild(qmark)
  }

  // Name label (below marker)
  if (isDiscovered) {
    const label = new PIXI.Text({
      text: loc.name.length > 18 ? loc.name.slice(0, 16) + '..' : loc.name,
      style: {
        fontSize: 8,
        fill: COLORS.textAmber,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        dropShadow: true,
        dropShadowColor: 0x000000,
        dropShadowDistance: 1,
        dropShadowAlpha: 0.8,
      },
    })
    label.anchor.set(0.5, 0)
    label.y = radius + 3
    container.addChild(label)
  }

  return container
}

export default ExplorationMap
