'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import { useMarket } from '../marketContext'
import { generateMandelbrotData } from '../data/mandelbrotPricing'

/**
 * 80x80 canvas showing the Mandelbrot set region
 * with a marker dot at the current c position.
 * Amber/brown color palette.
 */

const SIZE = 80
const CANVAS_DISPLAY = 160 // CSS display size (2x for retina)

// Amber/brown color palette (instead of classic rainbow)
function iterationToColor(iteration: number, maxIterations: number): [number, number, number] {
  if (iteration >= maxIterations) {
    return [30, 15, 8] // Deep brown for inside the set
  }

  const t = iteration / maxIterations

  if (t < 0.2) {
    // Dark amber
    const f = t / 0.2
    return [
      Math.floor(40 + 60 * f),
      Math.floor(20 + 25 * f),
      Math.floor(5 + 10 * f),
    ]
  } else if (t < 0.5) {
    // Amber to gold
    const f = (t - 0.2) / 0.3
    return [
      Math.floor(100 + 100 * f),
      Math.floor(45 + 80 * f),
      Math.floor(15 + 20 * f),
    ]
  } else if (t < 0.8) {
    // Gold to light amber
    const f = (t - 0.5) / 0.3
    return [
      Math.floor(200 + 45 * f),
      Math.floor(125 + 70 * f),
      Math.floor(35 + 40 * f),
    ]
  } else {
    // Light amber to cream
    const f = (t - 0.8) / 0.2
    return [
      Math.floor(245 + 10 * f),
      Math.floor(195 + 40 * f),
      Math.floor(75 + 80 * f),
    ]
  }
}

export function MandelbrotVisualizer() {
  const { pricingState } = useMarket()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const zoom = 2.5
  const centerReal = pricingState.cReal
  const centerImag = pricingState.cImag

  // Generate fractal data
  const fractalData = useMemo(() => {
    return generateMandelbrotData(centerReal, centerImag, SIZE, zoom)
  }, [centerReal, centerImag])

  // Draw to canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.createImageData(SIZE, SIZE)
    const maxIter = 100

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const iteration = fractalData[y][x]
        const [r, g, b] = iterationToColor(iteration, maxIter)
        const idx = (y * SIZE + x) * 4
        imageData.data[idx] = r
        imageData.data[idx + 1] = g
        imageData.data[idx + 2] = b
        imageData.data[idx + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)

    // Draw marker dot at center (current c position)
    const markerX = SIZE / 2
    const markerY = SIZE / 2
    ctx.fillStyle = '#ff3333'
    ctx.fillRect(markerX - 2, markerY - 2, 4, 4)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.strokeRect(markerX - 2, markerY - 2, 4, 4)
  }, [fractalData])

  return (
    <div className="bg-amber-950/60 border-2 border-amber-700 rounded-lg p-3">
      <h3 className="font-pixel text-amber-200 text-xs mb-2 text-center">
        Mandelbrot Pricing Map
      </h3>
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="border border-amber-600 rounded"
          style={{
            width: CANVAS_DISPLAY,
            height: CANVAS_DISPLAY,
            imageRendering: 'pixelated',
          }}
        />
      </div>
      <div className="mt-2 text-center text-[9px] text-amber-500">
        <div>
          c = ({pricingState.cReal.toFixed(4)}, {pricingState.cImag.toFixed(4)}i)
        </div>
        <div className="mt-1 text-[8px] text-amber-600">
          Red dot = current price position
        </div>
      </div>
    </div>
  )
}
