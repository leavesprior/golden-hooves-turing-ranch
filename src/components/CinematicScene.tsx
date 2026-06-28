'use client'

import { useEffect, useRef } from 'react'

/**
 * CinematicScene — turns a static 32/64-bit place-art image into a LIVING painting
 * (Lunar / Phantasy-Star-IV cutscene feel) using the game's existing Pixi.js:
 *   • slow Ken-Burns breathe + drift
 *   • pointer parallax (foreground atmosphere moves more than the art = depth)
 *   • volumetric god-rays from the sun
 *   • drifting warm dust motes + dusk fireflies
 *   • soft sun-glow + vignette + gentle light pulse
 *   • per-place WEATHER (snow / rain / embers) + TIME-OF-DAY color grade
 *
 * Asset-free beyond the base image; client-only (dynamic import of pixi.js). The
 * point is to prove the "alive cinematic" direction on real art before scaling.
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
}: {
  src: string
  width?: number
  height?: number
  fireflies?: boolean
  rayColor?: number
  weather?: Weather
  timeOfDay?: TimeOfDay
}) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let destroyed = false
    let app: any = null
    let onMove: ((e: PointerEvent) => void) | null = null
    let canvasEl: HTMLCanvasElement | null = null
    let io: IntersectionObserver | null = null

    ;(async () => {
      const PIXI = await import('pixi.js')
      if (destroyed) return

      app = new PIXI.Application()
      await app.init({ width, height, antialias: true, background: '#120c06', resolution: 1 })
      if (destroyed) { app.destroy(true); return }
      canvasEl = app.canvas
      hostRef.current!.appendChild(app.canvas)

      // Respect prefers-reduced-motion: compose the graded still painting, no motion.
      const reduce = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

      // ── Base art (cover-fit with slight overscan so drift never shows edges) ──
      const tex = await PIXI.Assets.load(src)
      if (destroyed) { app.destroy(true); return }
      const base = new PIXI.Sprite(tex)
      base.anchor.set(0.5)
      const baseScale = Math.max(width / tex.width, height / tex.height) * 1.08
      base.scale.set(baseScale)
      base.x = width / 2; base.y = height / 2
      app.stage.addChild(base)

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
        day:   { mult: 0xffffff, multA: 0.0,  glow: 0xfff0d0, glowA: 0.0,  vig: 0.85 },
        dawn:  { mult: 0xffd9d0, multA: 0.22, glow: 0xff9d6a, glowA: 0.18, vig: 0.80 },
        dusk:  { mult: 0xffcaa0, multA: 0.26, glow: 0xff7e3c, glowA: 0.22, vig: 0.90 },
        night: { mult: 0x3b4a86, multA: 0.42, glow: 0x6a86c0, glowA: 0.10, vig: 0.95 },
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
      const vig = new PIXI.Sprite(radial(512, [[0, 'rgba(0,0,0,0)'], [0.62, 'rgba(0,0,0,0)'], [1, `rgba(15,8,2,${grade.vig})`]]))
      vig.width = width * 1.5; vig.height = height * 1.5; vig.anchor.set(0.5); vig.x = width / 2; vig.y = height / 2
      app.stage.addChild(vig)

      // ── animation ──
      let t = 0
      const target = { x: 0, y: 0 }
      const cur = { x: 0, y: 0 }
      if (!reduce) app.ticker.add((tk: any) => {
        const dt = tk.deltaMS / 1000; t += dt
        // pointer parallax easing
        cur.x += (target.x - cur.x) * Math.min(1, dt * 3)
        cur.y += (target.y - cur.y) * Math.min(1, dt * 3)
        // Ken-Burns breathe + drift
        const breathe = 1 + Math.sin(t * 0.18) * 0.025
        base.scale.set(baseScale * breathe)
        base.x = width / 2 + Math.sin(t * 0.13) * 10 + cur.x * 12
        base.y = height / 2 + Math.cos(t * 0.11) * 7 + cur.y * 8
        atmo.x = cur.x * 34; atmo.y = cur.y * 24
        // rays shimmer
        for (const r of rayList) { r.s.alpha = r.base + Math.sin(t * 0.6 + r.ph) * 0.03 }
        glow.alpha = 0.85 + Math.sin(t * 0.5) * 0.12
        // dust drift + wrap
        for (const d of dust) {
          d.s.x += (d.vx + Math.sin(t * d.sp + d.ph) * 4) * dt
          d.s.y += d.vy * dt
          d.s.alpha = 0.2 + (Math.sin(t * d.sp + d.ph) * 0.5 + 0.5) * 0.4
          if (d.s.y < -20) { d.s.y = height + 20; d.s.x = Math.random() * width }
          if (d.s.x < -20) d.s.x = width + 20; if (d.s.x > width + 20) d.s.x = -20
        }
        // fireflies wander + pulse
        for (const f of flies) {
          f.s.x = f.ox + Math.sin(t * f.sp + f.ph) * f.rx
          f.s.y = f.oy + Math.cos(t * f.sp * 0.8 + f.ph) * f.ry
          f.s.alpha = 0.25 + (Math.sin(t * 2.2 + f.ph) * 0.5 + 0.5) * 0.7
        }
        // weather: snow sways down, rain streaks down, embers rise + glow
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

      if (!reduce) {
        onMove = (e: PointerEvent) => {
          const rect = app.canvas.getBoundingClientRect()
          target.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
          target.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
        }
        app.canvas.addEventListener('pointermove', onMove)

        // Pause the render loop when the scene scrolls offscreen (GPU/battery).
        if (typeof IntersectionObserver !== 'undefined') {
          io = new IntersectionObserver((entries) => {
            for (const e of entries) { if (e.isIntersecting) app.ticker.start(); else app.ticker.stop() }
          }, { threshold: 0.05 })
          io.observe(hostRef.current!)
        }
      }
    })()

    return () => {
      destroyed = true
      if (io) io.disconnect()
      if (canvasEl && onMove) canvasEl.removeEventListener('pointermove', onMove)
      if (app) { try { app.destroy(true, { children: true }) } catch { /* noop */ } }
    }
  }, [src, width, height, fireflies, rayColor, weather, timeOfDay])

  return <div ref={hostRef} style={{ width: '100%', lineHeight: 0 }} />
}
