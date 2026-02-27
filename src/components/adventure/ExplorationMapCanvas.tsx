'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { CrossGameStorage } from '@/lib/crossGameProgression'
import { playSFX } from '@/app/oregon-trail/lib/audioManager'
import type { ExplorationLocation } from './ExplorationMap'

// ============================================
// Canvas2D Fallback — SSR-safe, no PixiJS dependency
// Same visual style but simpler: click-to-walk only
// ============================================

interface ExplorationMapCanvasProps {
  chapter: number
  locations: ExplorationLocation[]
  currentLocationId: string
  onArrive: (locationId: string) => void
  onEncounter?: () => void
  width?: number
  height?: number
}

const GRID_SCALE = 10
const PLAYER_SPEED = 2.5
const ENCOUNTER_DISTANCE = 5
const ENCOUNTER_CHANCE = 0.15
const ARRIVAL_RADIUS = 1.5
const FOG_RADIUS = 15

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function ExplorationMapCanvas({
  chapter,
  locations,
  currentLocationId,
  onArrive,
  onEncounter,
  width: propWidth,
  height: propHeight,
}: ExplorationMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const playerRef = useRef({ x: 50, y: 50, targetX: 50, targetY: 50, walking: false, targetId: null as string | null, distCheck: 0 })
  const cameraRef = useRef({ x: 50, y: 50 })
  const [distanceText, setDistanceText] = useState('')
  const [arrived, setArrived] = useState(false)

  // Init player at current location
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

  // Click handler — find closest discovered location to click point
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const cx = (e.clientX - rect.left) / rect.width
    const cy = (e.clientY - rect.top) / rect.height
    const cam = cameraRef.current
    const w = propWidth || canvas.width
    const h = propHeight || canvas.height

    // Convert click to world coordinates
    const worldX = cam.x + (cx - 0.5) * (w / GRID_SCALE)
    const worldY = cam.y + (cy - 0.5) * (h / GRID_SCALE)

    // Find nearest discovered location within 5 grid units
    let closest: ExplorationLocation | null = null
    let closestDist = 5
    for (const loc of locations) {
      if (!loc.discovered) continue
      const d = Math.sqrt((loc.x - worldX) ** 2 + (loc.y - worldY) ** 2)
      if (d < closestDist) {
        closestDist = d
        closest = loc
      }
    }

    if (closest) {
      playerRef.current.targetX = closest.x
      playerRef.current.targetY = closest.y
      playerRef.current.walking = true
      playerRef.current.targetId = closest.id
      playerRef.current.distCheck = 0
    }
  }, [locations, propWidth, propHeight])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const maybeCtx = canvas.getContext('2d')
    if (!maybeCtx) return
    const ctx: CanvasRenderingContext2D = maybeCtx

    const w = propWidth || 800
    const h = propHeight || 500
    canvas.width = w
    canvas.height = h

    const rng = seededRandom(chapter * 7919)
    // Pre-generate terrain noise
    const noisePatches: Array<{ x: number; y: number; w: number; h: number; c: string }> = []
    for (let i = 0; i < 150; i++) {
      noisePatches.push({
        x: rng() * 100, y: rng() * 100,
        w: 1 + rng() * 4, h: 1 + rng() * 4,
        c: rng() > 0.5 ? 'rgba(37,48,21,0.3)' : 'rgba(52,74,30,0.3)',
      })
    }

    // Pre-generate mountains
    const mountains: Array<{ x: number; y: number; w: number; h: number }> = []
    for (let i = 0; i < 20; i++) {
      mountains.push({
        x: rng() * 100, y: rng() * 100,
        w: 1 + rng() * 2, h: 1.5 + rng() * 3,
      })
    }

    let lastTime = performance.now()

    function frame(time: number) {
      const dt = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time

      const player = playerRef.current
      const cam = cameraRef.current

      // Walk
      if (player.walking) {
        const dx = player.targetX - player.x
        const dy = player.targetY - player.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0.05) {
          const step = Math.min(PLAYER_SPEED * dt, dist)
          player.x += (dx / dist) * step
          player.y += (dy / dist) * step
          player.x = Math.max(2, Math.min(98, player.x))
          player.y = Math.max(2, Math.min(98, player.y))
          player.distCheck += step

          // Encounter check
          if (player.distCheck >= ENCOUNTER_DISTANCE && onEncounter) {
            player.distCheck = 0
            if (Math.random() < ENCOUNTER_CHANCE) {
              player.walking = false
              onEncounter()
              return
            }
          }

          // Distance text
          if (player.targetId) {
            const tLoc = locations.find(l => l.id === player.targetId)
            if (tLoc) {
              const rd = Math.sqrt((tLoc.x - player.x) ** 2 + (tLoc.y - player.y) ** 2)
              setDistanceText(`${(rd * 0.3).toFixed(1)} miles to ${tLoc.name}`)
            }
          }

          // Check arrival
          for (const loc of locations) {
            if (!loc.discovered) continue
            const ld = Math.sqrt((loc.x - player.x) ** 2 + (loc.y - player.y) ** 2)
            if (ld < ARRIVAL_RADIUS && player.targetId === loc.id) {
              player.walking = false
              player.x = loc.x
              player.y = loc.y
              player.targetId = null
              setDistanceText('')
              try { playSFX('success') } catch {}
              CrossGameStorage.logEvent('rpg_adventure', 'landmark_reached', `Arrived at ${loc.name}`, { locationId: loc.id })
              setArrived(true)
              setTimeout(() => { setArrived(false); onArrive(loc.id) }, 300)
              break
            }
          }
        } else if (!player.targetId) {
          player.walking = false
        }
      }

      // Camera
      cam.x += (player.x - cam.x) * 0.08
      cam.y += (player.y - cam.y) * 0.08

      // ── RENDER ──
      ctx.fillStyle = '#1a1a0e'
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      ctx.translate(w / 2 - cam.x * GRID_SCALE, h / 2 - cam.y * GRID_SCALE)

      // Terrain base
      ctx.fillStyle = '#2d3a1a'
      ctx.fillRect(0, 0, 100 * GRID_SCALE, 100 * GRID_SCALE)

      // Noise patches
      for (const n of noisePatches) {
        ctx.fillStyle = n.c
        ctx.fillRect(n.x * GRID_SCALE, n.y * GRID_SCALE, n.w * GRID_SCALE, n.h * GRID_SCALE)
      }

      // Mountains
      ctx.fillStyle = 'rgba(92,92,92,0.4)'
      for (const m of mountains) {
        ctx.beginPath()
        ctx.moveTo(m.x * GRID_SCALE, m.y * GRID_SCALE - m.h * GRID_SCALE)
        ctx.lineTo((m.x - m.w) * GRID_SCALE, m.y * GRID_SCALE)
        ctx.lineTo((m.x + m.w) * GRID_SCALE, m.y * GRID_SCALE)
        ctx.closePath()
        ctx.fill()
      }

      // Fog of war
      ctx.fillStyle = 'rgba(10,10,6,0.85)'
      ctx.fillRect(0, 0, 100 * GRID_SCALE, 100 * GRID_SCALE)
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      for (const loc of locations) {
        if (!loc.discovered) continue
        const gr = ctx.createRadialGradient(
          loc.x * GRID_SCALE, loc.y * GRID_SCALE, 0,
          loc.x * GRID_SCALE, loc.y * GRID_SCALE, FOG_RADIUS * GRID_SCALE
        )
        gr.addColorStop(0, 'rgba(0,0,0,1)')
        gr.addColorStop(0.7, 'rgba(0,0,0,0.8)')
        gr.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = gr
        ctx.fillRect(
          (loc.x - FOG_RADIUS) * GRID_SCALE,
          (loc.y - FOG_RADIUS) * GRID_SCALE,
          FOG_RADIUS * 2 * GRID_SCALE,
          FOG_RADIUS * 2 * GRID_SCALE
        )
      }
      ctx.restore()

      // Paths
      const drawn = new Set<string>()
      for (const loc of locations) {
        if (!loc.discovered) continue
        for (const adjId of loc.connectedTo) {
          const adj = locations.find(l => l.id === adjId)
          if (!adj || !adj.discovered) continue
          const key = [loc.id, adjId].sort().join('-')
          if (drawn.has(key)) continue
          drawn.add(key)

          ctx.setLineDash([4, 4])
          ctx.strokeStyle = 'rgba(217,119,6,0.5)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(loc.x * GRID_SCALE, loc.y * GRID_SCALE)
          ctx.lineTo(adj.x * GRID_SCALE, adj.y * GRID_SCALE)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // Location markers
      const pulse = Math.sin(time * 0.003) * 0.5 + 0.5
      for (const loc of locations) {
        const isAdj = locations.some(o => o.discovered && o.connectedTo.includes(loc.id))
        if (!loc.discovered && !isAdj) continue

        const lx = loc.x * GRID_SCALE
        const ly = loc.y * GRID_SCALE
        const r = 8

        if (loc.discovered) {
          // Glow
          ctx.beginPath()
          ctx.arc(lx, ly, r * 1.6, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(217,119,6,${0.05 + (loc.id === currentLocationId ? pulse * 0.1 : 0)})`
          ctx.fill()

          // Circle
          ctx.beginPath()
          ctx.arc(lx, ly, r, 0, Math.PI * 2)
          ctx.fillStyle = loc.visited ? '#92400e' : '#1a1a0e'
          ctx.fill()
          ctx.strokeStyle = '#d97706'
          ctx.lineWidth = loc.id === currentLocationId ? 2 : 1.5
          ctx.stroke()

          // Icon
          ctx.font = '12px serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#ffffff'
          ctx.fillText(loc.icon, lx, ly)

          // Label
          ctx.font = 'bold 7px monospace'
          ctx.fillStyle = '#fbbf24'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          const label = loc.name.length > 18 ? loc.name.slice(0, 16) + '..' : loc.name
          ctx.fillText(label, lx, ly + r + 3)

          // Visited checkmark
          if (loc.visited) {
            ctx.font = '8px sans-serif'
            ctx.fillStyle = '#d97706'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('\u2713', lx + r * 0.8, ly - r * 0.8)
          }
        } else if (isAdj) {
          // Dim question mark
          ctx.beginPath()
          ctx.arc(lx, ly, r * 0.8, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(26,26,14,${0.4 + pulse * 0.15})`
          ctx.fill()
          ctx.strokeStyle = `rgba(74,85,104,${0.3 + pulse * 0.1})`
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.font = 'bold 10px monospace'
          ctx.fillStyle = '#4a5568'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('?', lx, ly)
        }
      }

      // Player
      const px = player.x * GRID_SCALE
      const py = player.y * GRID_SCALE
      // Outer glow
      ctx.beginPath()
      ctx.arc(px, py, 8, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(251,191,36,0.15)'
      ctx.fill()
      // Inner dot
      ctx.beginPath()
      ctx.arc(px, py, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#fbbf24'
      ctx.fill()
      ctx.strokeStyle = 'rgba(251,191,36,0.4)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.restore()

      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(animRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, locations, currentLocationId])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border-2 border-amber-700 rounded cursor-crosshair"
        style={{ width: propWidth || '100%', height: propHeight || 500 }}
        onClick={handleCanvasClick}
      />
      {distanceText && (
        <div className="absolute top-2 right-2 font-[var(--font-pixel)] text-amber-400 text-[10px] bg-black/80 px-2 py-1 rounded border border-amber-800">
          {distanceText}
        </div>
      )}
      <div className="absolute top-2 left-2 font-[var(--font-pixel)] text-amber-500 text-[10px] bg-black/80 px-2 py-1 rounded border border-amber-900">
        CH.{chapter} {'\u2022'} GOLD COUNTRY
      </div>
      <div className="absolute bottom-2 left-2 font-[var(--font-pixel)] text-amber-600/60 text-[8px] bg-black/60 px-2 py-1 rounded">
        Click a location to walk there
      </div>
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

export default ExplorationMapCanvas
