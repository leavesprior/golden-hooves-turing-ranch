'use client'

import { useEffect, useRef } from 'react'
import { createDB32Renderer } from '@/lib/pixelArt/db32Renderer'

/**
 * PixelScene — renders a single DB32 32/64-bit pixel-art scene (ported from the
 * bobr-improvements demo) onto a canvas, in the live web game. Deterministic +
 * asset-free: pass a location id (or scene key) and it draws the matching Gold
 * Country scene. Client-only (the renderer builds an internal buffer canvas).
 *
 * The 320x180 internal buffer is nearest-neighbor upscaled to width x height, and
 * the canvas is CSS-scaled to its container with image-rendering: pixelated, so it
 * stays crisp at any size — the classic 16/32/64-bit look.
 */
export default function PixelScene({
  loc,
  state,
  width = 640,
  height = 360,
  className = '',
}: {
  loc: string
  state?: unknown
  width?: number
  height?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<ReturnType<typeof createDB32Renderer> | null>(null)

  useEffect(() => {
    if (!rendererRef.current) rendererRef.current = createDB32Renderer()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    rendererRef.current.renderScene(ctx, width, height, loc, state ?? {}, [])
  }, [loc, state, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ imageRendering: 'pixelated', width: '100%', height: 'auto', display: 'block' }}
    />
  )
}
