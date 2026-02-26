'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { type GraphicsTier } from '../../oregonTrailContext'

export interface MapViewport {
  scale: number
  offsetX: number
  offsetY: number
}

interface UseMapInteractionOptions {
  graphicsTier: GraphicsTier
  minScale?: number
  maxScale?: number
  enabled?: boolean
}

interface UseMapInteractionReturn {
  viewport: MapViewport
  containerRef: React.RefObject<HTMLDivElement | null>
  svgTransform: string
  handlers: {
    onWheel: (e: React.WheelEvent) => void
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
    onDoubleClick: (e: React.MouseEvent) => void
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
  resetView: () => void
  centerOn: (x: number, y: number) => void
}

// Tier-gated: disabled at retro_4bit/classic_8bit
function isTierEnabled(tier: GraphicsTier): boolean {
  return tier !== 'retro_4bit' && tier !== 'classic_8bit'
}

export function useMapInteraction({
  graphicsTier,
  minScale = 0.5,
  maxScale = 3.0,
  enabled = true,
}: UseMapInteractionOptions): UseMapInteractionReturn {
  const tierEnabled = isTierEnabled(graphicsTier) && enabled
  const containerRef = useRef<HTMLDivElement>(null)

  const [viewport, setViewport] = useState<MapViewport>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  })

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [pinchDistance, setPinchDistance] = useState<number | null>(null)

  const clampScale = useCallback((s: number) => Math.min(maxScale, Math.max(minScale, s)), [minScale, maxScale])

  // Mouse wheel zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!tierEnabled) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setViewport(prev => ({
      ...prev,
      scale: clampScale(prev.scale * delta),
    }))
  }, [tierEnabled, clampScale])

  // Pan: mouse down
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!tierEnabled) return
    if (e.button !== 0) return // left click only
    setIsDragging(true)
    setDragStart({ x: e.clientX - viewport.offsetX, y: e.clientY - viewport.offsetY })
  }, [tierEnabled, viewport.offsetX, viewport.offsetY])

  // Pan: mouse move
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!tierEnabled || !isDragging) return
    setViewport(prev => ({
      ...prev,
      offsetX: e.clientX - dragStart.x,
      offsetY: e.clientY - dragStart.y,
    }))
  }, [tierEnabled, isDragging, dragStart])

  // Pan: mouse up
  const onMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const onMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Double click to center
  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!tierEnabled || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    setViewport(prev => ({
      ...prev,
      offsetX: prev.offsetX + (centerX - clickX),
      offsetY: prev.offsetY + (centerY - clickY),
    }))
  }, [tierEnabled])

  // Touch: pinch zoom
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!tierEnabled) return
    if (e.touches.length === 2) {
      setPinchDistance(getTouchDistance(e.touches))
    } else if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - viewport.offsetX,
        y: e.touches[0].clientY - viewport.offsetY,
      })
    }
  }, [tierEnabled, viewport.offsetX, viewport.offsetY])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!tierEnabled) return
    if (e.touches.length === 2 && pinchDistance !== null) {
      const newDist = getTouchDistance(e.touches)
      const ratio = newDist / pinchDistance
      setViewport(prev => ({
        ...prev,
        scale: clampScale(prev.scale * ratio),
      }))
      setPinchDistance(newDist)
    } else if (e.touches.length === 1 && isDragging) {
      setViewport(prev => ({
        ...prev,
        offsetX: e.touches[0].clientX - dragStart.x,
        offsetY: e.touches[0].clientY - dragStart.y,
      }))
    }
  }, [tierEnabled, pinchDistance, isDragging, dragStart, clampScale])

  const onTouchEnd = useCallback(() => {
    setIsDragging(false)
    setPinchDistance(null)
  }, [])

  // Keyboard: arrows pan, +/- zoom, Home resets
  useEffect(() => {
    if (!tierEnabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys when user is in an input, button, or modal overlay
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return
      if (document.querySelector('.fixed.inset-0')) return

      const panAmount = 10
      switch (e.key) {
        case 'ArrowUp':
          setViewport(prev => ({ ...prev, offsetY: prev.offsetY + panAmount }))
          e.preventDefault()
          break
        case 'ArrowDown':
          setViewport(prev => ({ ...prev, offsetY: prev.offsetY - panAmount }))
          e.preventDefault()
          break
        case 'ArrowLeft':
          setViewport(prev => ({ ...prev, offsetX: prev.offsetX + panAmount }))
          e.preventDefault()
          break
        case 'ArrowRight':
          setViewport(prev => ({ ...prev, offsetX: prev.offsetX - panAmount }))
          e.preventDefault()
          break
        case '+':
        case '=':
          setViewport(prev => ({ ...prev, scale: clampScale(prev.scale * 1.1) }))
          break
        case '-':
          setViewport(prev => ({ ...prev, scale: clampScale(prev.scale * 0.9) }))
          break
        case 'Home':
          setViewport({ scale: 1, offsetX: 0, offsetY: 0 })
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tierEnabled, clampScale])

  const resetView = useCallback(() => {
    setViewport({ scale: 1, offsetX: 0, offsetY: 0 })
  }, [])

  const centerOn = useCallback((x: number, y: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    // Convert percentage coordinates to pixel offset
    const targetPixelX = (x / 100) * rect.width * viewport.scale
    const targetPixelY = (y / 100) * rect.height * viewport.scale
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    setViewport(prev => ({
      ...prev,
      offsetX: centerX - targetPixelX,
      offsetY: centerY - targetPixelY,
    }))
  }, [viewport.scale])

  // Build the SVG transform string
  const svgTransform = tierEnabled
    ? `translate(${viewport.offsetX}, ${viewport.offsetY}) scale(${viewport.scale})`
    : ''

  return {
    viewport,
    containerRef: containerRef as React.RefObject<HTMLDivElement | null>,
    svgTransform,
    handlers: {
      onWheel,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onDoubleClick,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    resetView,
    centerOn,
  }
}

export default useMapInteraction
