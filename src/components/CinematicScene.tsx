'use client'

import { useEffect, useRef } from 'react'

/**
 * CinematicScene — turns a static 32/64-bit place-art image into a LIVING painting
 * (Lunar / Phantasy-Star-IV cutscene feel).
 *
 * The base photo is a real <img> (always renders, crisp + pixelated) and Pixi.js
 * draws ONLY the atmosphere on a TRANSPARENT canvas on top:
 *   • slow Ken-Burns breathe + drift (CSS transform on the <img>)
 *   • pointer parallax (atmosphere moves more than the art = depth)
 *   • volumetric god-rays · drifting dust · dusk fireflies · sun-glow · vignette
 *   • per-place WEATHER (snow / rain / embers) + TIME-OF-DAY color grade
 *
 * Atmosphere is asset-free (procedural textures); the photo never depends on
 * Pixi's loader, so the picture shows even if WebGL/Pixi is slow or unavailable.
 */
export type Weather = 'none' | 'snow' | 'rain' | 'embers'
export type TimeOfDay = 'day' | 'dawn' | 'dusk' | 'night'

export default function CinematicScene({
  src,
  width = 1280,
  height = 720,
  fireflies = true,
  rayColor = 0xffe6a8,
  weather = 'none',
  timeOfDay = 'day',
  fit = 'fixed',
}: {
  src: string
  width?: number
  height?: number
  fireflies?: boolean
  rayColor?: number
  weather?: Weather
  timeOfDay?: TimeOfDay
  /** 'fixed' = sized by its natural aspect ratio (gallery). 'cover' = fill+crop the parent (in-game backdrop). */
  fit?: 'fixed' | 'cover'
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let destroyed = false
    let app: any = null
    let onMove: ((e: PointerEvent) => void) | null = null
    let hostEl: HTMLDivElement | null = hostRef.current
    let io: IntersectionObserver | null = null

    ;(async () => {
      let PIXI: any
      try {
        PIXI = await import('pixi.js')
      } catch {
        return // photo <img> still shows; just no atmosphere
      }
      if (destroyed || !hostRef.current) return

      const reduce = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

      try {
        app = new PIXI.Application()
        await app.init({ width, height, antialias: true, backgroundAlpha: 0, resolution: 1 })
      } catch {
        return
      }
      if (destroyed || !hostRef.current) { try { app.destroy(true) } catch { /* noop */ } ; return }

      // Transparent canvas overlaid exactly on the <img> beneath it.
      const canvas = app.canvas as HTMLCanvasElement
      canvas.style.position = 'absolute'
      canvas.style.inset = '0'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.objectFit = 'cover'
      canvas.style.pointerEvents = 'none'
      hostRef.current.appendChild(canvas)

      // --- helper: radial-gradient texture from an offscreen canvas ---
      const radial = (size: number, stops: [number, string][]) => {
        const c = document.createElement('canvas'); c.width = c.height = size
        const g = c.getContext('2d')!
        const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
        stops.forEach(([o, col]) => grd.addColorStop(o, col))
        g.fillStyle = grd; g.fillRect(0, 0, size, size)
        return PIXI.Texture.from(c)
      }
      // --- helper: vertical soft beam texture (for god-rays) ---
      const beamTex = (() => {
        const c = document.createElement('canvas'); c.width = 64; c.height = 256
        const g = c.getContext('2d')!
        const grd = g.createLinearGradient(0, 0, 0, 256)
        grd.addColorStop(0, 'rgba(255,255,255,0.9)')
        grd.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = grd; g.fillRect(0, 0, 64, 256)
        const side = g.createLinearGradient(0, 0, 64, 0)
        side.addColorStop(0, 'rgba(0,0,0,0)'); side.addColorStop(0.5, 'rgba(255,255,255,1)'); side.addColorStop(1, 'rgba(0,0,0,0)')
        g.globalCompositeOperation = 'destination-in'; g.fillStyle = side; g.fillRect(0, 0, 64, 256)
        return PIXI.Texture.from(c)
      })()

      // ── Atmosphere layers (parallax further than the art) ──
      const atmo = new PIXI.Container(); app.stage.addChild(atmo)

      // sun position (upper-right warm light)
      const sunX = width * 0.78, sunY = height * 0.2

      // sun glow
      const glow = new PIXI.Sprite(radial(512, [[0, 'rgba(255,228,150,0.85)'], [0.4, 'rgba(255,190,90,0.35)'], [1, 'rgba(255,190,90,0)']]))
      glow.anchor.set(0.5); glow.x = sunX; glow.y = sunY; glow.scale.set(1.4); glow.blendMode = 'add'
      atmo.addChild(glow)

      // god-rays
      const rays = new PIXI.Container(); rays.x = sunX; rays.y = sunY; atmo.addChild(rays)
      const rayList: any[] = []
      for (let i = 0; i < 6; i++) {
        const r = new PIXI.Sprite(beamTex)
        r.anchor.set(0.5, 0); r.tint = rayColor; r.blendMode = 'add'
        r.height = height * 1.1; r.width = 90 + i * 30
        r.rotation = 2.5 + i * 0.16
        r.alpha = 0.05 + (i % 2) * 0.04
        rays.addChild(r); rayList.push({ s: r, base: r.alpha, ph: i })
      }

      // dust motes
      const dust: any[] = []
      const dotTex = radial(32, [[0, 'rgba(255,240,200,1)'], [1, 'rgba(255,240,200,0)']])
      for (let i = 0; i < 60; i++) {
        const d = new PIXI.Sprite(dotTex)
        d.anchor.set(0.5); d.blendMode = 'add'
        const s = 1 + Math.random() * 3
        d.scale.set(s / 6)
        d.x = Math.random() * width; d.y = Math.random() * height
        d.alpha = 0.15 + Math.random() * 0.4
        atmo.addChild(d)
        dust.push({ s: d, vx: (Math.random() - 0.5) * 6, vy: -4 - Math.random() * 8, ph: Math.random() * 6.28, sp: 0.5 + Math.random() })
      }

      // fireflies (dusk life)
      const flies: any[] = []
      if (fireflies) {
        const fTex = radial(48, [[0, 'rgba(190,255,140,1)'], [0.5, 'rgba(150,220,90,0.5)'], [1, 'rgba(150,220,90,0)']])
        for (let i = 0; i < 14; i++) {
          const f = new PIXI.Sprite(fTex)
          f.anchor.set(0.5); f.blendMode = 'add'; f.scale.set(0.5)
          f.x = width * (0.15 + Math.random() * 0.7); f.y = height * (0.45 + Math.random() * 0.45)
          atmo.addChild(f)
          flies.push({ s: f, ox: f.x, oy: f.y, ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.6, rx: 30 + Math.random() * 60, ry: 20 + Math.random() * 40 })
        }
      }

      // ── per-place weather (snow / rain / embers) ──
      const wx: any[] = []
      if (weather === 'snow') {
        const snowTex = radial(24, [[0, 'rgba(255,255,255,1)'], [0.6, 'rgba(235,245,255,0.7)'], [1, 'rgba(235,245,255,0)']])
        for (let i = 0; i < 90; i++) {
          const p = new PIXI.Sprite(snowTex); p.anchor.set(0.5); p.scale.set(0.2 + Math.random() * 0.5)
          p.x = Math.random() * width; p.y = Math.random() * height; p.alpha = 0.4 + Math.random() * 0.5
          atmo.addChild(p)
          wx.push({ s: p, kind: 'snow', vy: 18 + Math.random() * 30, sway: 8 + Math.random() * 16, ph: Math.random() * 6.28, sp: 0.5 + Math.random() })
        }
      } else if (weather === 'rain') {
        for (let i = 0; i < 120; i++) {
          const p = new PIXI.Sprite(PIXI.Texture.WHITE); p.anchor.set(0.5)
          p.width = 1.4; p.height = 14 + Math.random() * 12; p.tint = 0xbfd2e6; p.alpha = 0.18 + Math.random() * 0.22; p.rotation = 0.12
          p.x = Math.random() * width; p.y = Math.random() * height
          atmo.addChild(p)
          wx.push({ s: p, kind: 'rain', vy: 420 + Math.random() * 260, vx: 60 })
        }
      } else if (weather === 'embers') {
        const emTex = radial(24, [[0, 'rgba(255,230,150,1)'], [0.5, 'rgba(255,140,40,0.7)'], [1, 'rgba(255,80,20,0)']])
        for (let i = 0; i < 50; i++) {
          const p = new PIXI.Sprite(emTex); p.anchor.set(0.5); p.blendMode = 'add'; p.scale.set(0.15 + Math.random() * 0.5)
          p.x = Math.random() * width; p.y = Math.random() * height; p.alpha = 0.4 + Math.random() * 0.5
          atmo.addChild(p)
          wx.push({ s: p, kind: 'ember', vy: -(20 + Math.random() * 45), sway: 10 + Math.random() * 22, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.2 })
        }
      }

      // ── time-of-day color grade (multiply tint + additive light + vignette depth) ──
      const GRADE: Record<TimeOfDay, { mult: number; multA: number; glow: number; glowA: number; vig: number }> = {
        day:   { mult: 0xffffff, multA: 0.0,  glow: 0xfff0d0, glowA: 0.0,  vig: 0.80 },
        dawn:  { mult: 0xffd9d0, multA: 0.20, glow: 0xff9d6a, glowA: 0.16, vig: 0.78 },
        dusk:  { mult: 0xffcaa0, multA: 0.24, glow: 0xff7e3c, glowA: 0.20, vig: 0.86 },
        night: { mult: 0x3b4a86, multA: 0.40, glow: 0x6a86c0, glowA: 0.10, vig: 0.92 },
      }
      const grade = GRADE[timeOfDay] ?? GRADE.day
      if (grade.multA > 0) {
        const cg = new PIXI.Sprite(PIXI.Texture.WHITE)
        cg.width = width; cg.height = height; cg.tint = grade.mult; cg.alpha = grade.multA; cg.blendMode = 'multiply'
        app.stage.addChild(cg)
      }
      if (grade.glowA > 0) {
        const cgw = new PIXI.Sprite(PIXI.Texture.WHITE)
        cgw.width = width; cgw.height = height; cgw.tint = grade.glow; cgw.alpha = grade.glowA; cgw.blendMode = 'add'
        app.stage.addChild(cgw)
      }

      // vignette (dark edges — deepens toward night)
      const vig = new PIXI.Sprite(radial(512, [[0, 'rgba(0,0,0,0)'], [0.6, 'rgba(0,0,0,0)'], [1, `rgba(15,8,2,${grade.vig})`]]))
      vig.width = width * 1.5; vig.height = height * 1.5; vig.anchor.set(0.5); vig.x = width / 2; vig.y = height / 2
      app.stage.addChild(vig)

      // ── animation: Ken-Burns drives the <img> (CSS), parallax drives atmosphere ──
      const img = imgRef.current
      const OVERSCAN = 1.08
      if (img) img.style.transform = `scale(${OVERSCAN})` // base overscan so drift never shows edges
      let t = 0
      const target = { x: 0, y: 0 }
      const cur = { x: 0, y: 0 }
      if (!reduce) app.ticker.add((tk: any) => {
        const dt = tk.deltaMS / 1000; t += dt
        cur.x += (target.x - cur.x) * Math.min(1, dt * 3)
        cur.y += (target.y - cur.y) * Math.min(1, dt * 3)
        // Ken-Burns breathe + drift on the photo itself
        if (img) {
          const breathe = OVERSCAN * (1 + Math.sin(t * 0.18) * 0.02)
          const dx = Math.sin(t * 0.13) * 0.8 + cur.x * 1.0
          const dy = Math.cos(t * 0.11) * 0.6 + cur.y * 0.7
          img.style.transform = `scale(${breathe}) translate(${dx}%, ${dy}%)`
        }
        // atmosphere parallax (moves more than the art = depth)
        atmo.x = cur.x * 34; atmo.y = cur.y * 24
        for (const r of rayList) { r.s.alpha = r.base + Math.sin(t * 0.6 + r.ph) * 0.03 }
        glow.alpha = 0.85 + Math.sin(t * 0.5) * 0.12
        for (const d of dust) {
          d.s.x += (d.vx + Math.sin(t * d.sp + d.ph) * 4) * dt
          d.s.y += d.vy * dt
          d.s.alpha = 0.2 + (Math.sin(t * d.sp + d.ph) * 0.5 + 0.5) * 0.4
          if (d.s.y < -20) { d.s.y = height + 20; d.s.x = Math.random() * width }
          if (d.s.x < -20) d.s.x = width + 20; if (d.s.x > width + 20) d.s.x = -20
        }
        for (const f of flies) {
          f.s.x = f.ox + Math.sin(t * f.sp + f.ph) * f.rx
          f.s.y = f.oy + Math.cos(t * f.sp * 0.8 + f.ph) * f.ry
          f.s.alpha = 0.25 + (Math.sin(t * 2.2 + f.ph) * 0.5 + 0.5) * 0.7
        }
        for (const p of wx) {
          if (p.kind === 'snow') {
            p.s.y += p.vy * dt; p.s.x += Math.sin(t * p.sp + p.ph) * p.sway * dt
            if (p.s.y > height + 10) { p.s.y = -10; p.s.x = Math.random() * width }
          } else if (p.kind === 'rain') {
            p.s.y += p.vy * dt; p.s.x += p.vx * dt
            if (p.s.y > height + 14) { p.s.y = -14; p.s.x = Math.random() * width - 40 }
          } else if (p.kind === 'ember') {
            p.s.y += p.vy * dt; p.s.x += Math.sin(t * p.sp + p.ph) * p.sway * dt
            p.s.alpha = 0.3 + (Math.sin(t * 2 + p.ph) * 0.5 + 0.5) * 0.6
            if (p.s.y < -10) { p.s.y = height + 10; p.s.x = Math.random() * width }
          }
        }
      })

      if (!reduce && hostRef.current) {
        onMove = (e: PointerEvent) => {
          const rect = hostRef.current!.getBoundingClientRect()
          target.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
          target.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
        }
        hostRef.current.addEventListener('pointermove', onMove)
        hostEl = hostRef.current

        if (typeof IntersectionObserver !== 'undefined') {
          io = new IntersectionObserver((entries) => {
            for (const e of entries) { if (e.isIntersecting) app.ticker.start(); else app.ticker.stop() }
          }, { threshold: 0.05 })
          io.observe(hostRef.current)
        }
      }
    })()

    return () => {
      destroyed = true
      if (io) io.disconnect()
      if (hostEl && onMove) hostEl.removeEventListener('pointermove', onMove)
      if (app) { try { app.destroy(true, { children: true }) } catch { /* noop */ } }
    }
  }, [src, width, height, fireflies, rayColor, weather, timeOfDay])

  return (
    <div
      ref={hostRef}
      style={
        fit === 'cover'
          ? { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#120c06', lineHeight: 0 }
          : { position: 'relative', width: '100%', aspectRatio: `${width} / ${height}`, overflow: 'hidden', background: '#120c06', lineHeight: 0 }
      }
    >
      {/* The photo — always renders, independent of Pixi/WebGL. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt=""
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          imageRendering: 'pixelated',
          transformOrigin: 'center',
          willChange: 'transform',
        }}
      />
      {/* Pixi atmosphere canvas is appended here, absolutely positioned over the photo. */}
    </div>
  )
}
