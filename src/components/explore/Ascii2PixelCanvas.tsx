'use client'

import { useEffect, useRef } from 'react'
import { paintAscii2Pixels } from '@/lib/ascii2PixelPaint'
import { PIXEL_IH, PIXEL_IW } from '@/lib/walkBitPalette'
import type { Ascii2Scene, Heading } from '@/lib/ascii2Walk'
import type { TownWalkPosition, TownWalkTarget } from '@/lib/townWalk'

export function Ascii2PixelCanvas({
  scene,
  position,
  heading,
  allowed,
}: {
  scene: Ascii2Scene
  position: TownWalkPosition
  heading: Heading
  allowed: (t: TownWalkTarget) => boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    paintAscii2Pixels(ctx, scene, position, heading, allowed)
  }, [scene, position, heading, allowed])

  return (
    <canvas
      ref={ref}
      width={PIXEL_IW}
      height={PIXEL_IH}
      data-testid="ascii2-pixel"
      data-town={scene.townId}
      aria-hidden="true"
      className="rounded-sm border-2 border-[var(--pixel-earth-light)] bg-[#0e0c0a]"
    />
  )
}
