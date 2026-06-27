'use client'

/**
 * RanchScene3D — research SPIKE (2026-06-26, Grok-blessed, time-boxed).
 *
 * Proves the "HD-2D 3D ranch" visual language entirely inside the existing
 * Next.js app via react-three-fiber — no Godot, no second deploy, no new game
 * systems. The four hotspots reuse the EXISTING time-echo riddles + the page's
 * own CrossGameStorage flow (passed in as props). Real ranch photos from
 * /public/scene-backdrops are used as billboard panels (HD-2D), exactly the
 * cheapest credible 3D path for a 2D-art game.
 *
 * Controls: click to look (pointer lock), WASD/arrows to walk, crosshair + click
 * to inspect a hotspot, ESC to release the mouse.
 */

import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Billboard,
  Text,
  useTexture,
  Sky,
  KeyboardControls,
  useKeyboardControls,
  PointerLockControls,
} from '@react-three/drei'
import * as THREE from 'three'

export interface Hotspot {
  echoId: string
  label: string
  texture: string
  position: [number, number, number]
  discovered: boolean
}

// The four ranch time-echo stations, dressed with real ranch / period photos.
export const RANCH_HOTSPOTS: Omit<Hotspot, 'discovered'>[] = [
  { echoId: 'norse_runestone', label: 'The Old Mine', texture: '/scene-backdrops/gold-history.jpg', position: [-9, 1.6, -7] },
  { echoId: 'cahokian_mound_earth', label: 'The Ranch Soil', texture: '/scene-backdrops/trail.jpg', position: [9, 1.6, -5] },
  { echoId: 'chumash_star_chart', label: 'Under the Stars', texture: '/scene-backdrops/stars.jpg', position: [-7, 1.6, 9] },
  { echoId: 'guide_ranch_comment', label: 'Back of Beyond', texture: '/scene-backdrops/welcome.jpg', position: [8, 1.6, 8] },
]

const KEYMAP = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
]

function Player() {
  const { camera } = useThree()
  const [, get] = useKeyboardControls()
  const front = useRef(new THREE.Vector3())
  const side = useRef(new THREE.Vector3())
  const move = useRef(new THREE.Vector3())

  useFrame((_, dt) => {
    const { forward, backward, left, right } = get()
    const speed = 6
    camera.getWorldDirection(front.current)
    front.current.y = 0
    front.current.normalize()
    side.current.crossVectors(camera.up, front.current).normalize()
    move.current.set(0, 0, 0)
    if (forward) move.current.add(front.current)
    if (backward) move.current.sub(front.current)
    if (left) move.current.add(side.current)
    if (right) move.current.sub(side.current)
    if (move.current.lengthSq() > 0) {
      move.current.normalize().multiplyScalar(speed * dt)
      camera.position.add(move.current)
    }
    // Keep the walker on the ground and inside a soft boundary.
    camera.position.y = 1.6
    const limit = 22
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -limit, limit)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -limit, limit)
  })
  return null
}

function HotspotBillboard({ spot, onInspect }: { spot: Hotspot; onInspect: (echoId: string) => void }) {
  const tex = useTexture(spot.texture)
  return (
    <Billboard position={spot.position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          if (!spot.discovered) onInspect(spot.echoId)
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
      >
        <planeGeometry args={[3.4, 2.4]} />
        <meshBasicMaterial map={tex} transparent opacity={spot.discovered ? 0.45 : 1} toneMapped={false} />
      </mesh>
      {/* frame */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[3.7, 2.7]} />
        <meshBasicMaterial color={spot.discovered ? '#3f6212' : '#a16207'} />
      </mesh>
      <Text position={[0, 1.7, 0]} fontSize={0.32} color={spot.discovered ? '#86efac' : '#fde68a'} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000000">
        {spot.discovered ? `✓ ${spot.label}` : spot.label}
      </Text>
    </Billboard>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#6b7f3a" />
    </mesh>
  )
}

export default function RanchScene3D({
  discoveredEchoIds,
  onInspect,
}: {
  discoveredEchoIds: string[]
  onInspect: (echoId: string) => void
}) {
  const hotspots: Hotspot[] = RANCH_HOTSPOTS.map((s) => ({
    ...s,
    discovered: discoveredEchoIds.includes(s.echoId),
  }))
  return (
    <div className="relative w-full" style={{ height: '70vh' }}>
      {/* crosshair */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="h-2 w-2 rounded-full border border-amber-200/80" />
      </div>
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 font-pixel text-[9px] text-amber-200/80">
        click to look · WASD to walk · aim + click a station · ESC to release
      </div>
      <KeyboardControls map={KEYMAP}>
        <Canvas camera={{ position: [0, 1.6, 14], fov: 70 }} shadows>
          <Sky sunPosition={[80, 30, 100]} turbidity={6} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[20, 30, 10]} intensity={1.1} castShadow />
          <Ground />
          <Suspense fallback={null}>
            {hotspots.map((s) => (
              <HotspotBillboard key={s.echoId} spot={s} onInspect={onInspect} />
            ))}
          </Suspense>
          <Player />
          <PointerLockControls />
        </Canvas>
      </KeyboardControls>
    </div>
  )
}
