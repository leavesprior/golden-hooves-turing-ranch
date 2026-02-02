'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'

const cabinPhotos = [
  '/cabin-photos/cabin-1.jpg',
  '/cabin-photos/cabin-2.jpg',
  '/cabin-photos/cabin-3.jpg',
  '/cabin-photos/cabin-4.jpg',
  '/cabin-photos/cabin-5.jpg',
  '/cabin-photos/cabin-7.jpg',
  '/cabin-photos/cabin-8.jpg',
]

const AIRBNB_URL = 'https://airbnb.com/h/backofbeyondranch'

const amenities = [
  { icon: '\u2668\ufe0f', name: 'Hot Tub', desc: 'Soak under the stars' },
  { icon: '\ud83c\udfae', name: 'Game Room', desc: 'Pool table & arcade' },
  { icon: '\ud83d\udc34', name: 'Ranch Animals', desc: 'Horses, emus, sheep & more' },
  { icon: '\ud83c\udfd4\ufe0f', name: '10 Acres', desc: 'Private Gold Country retreat' },
  { icon: '\ud83d\udecf\ufe0f', name: 'Sleeps 12', desc: '4 bedrooms, 3 baths' },
  { icon: '\ud83d\udd25', name: 'Fire Pit', desc: 'Outdoor gathering spot' },
  { icon: '\ud83c\udf77', name: 'Wine Country', desc: 'Minutes from vineyards' },
  { icon: '\u26f7\ufe0f', name: 'Near Bear Valley', desc: 'Ski season access' },
]

const nearbyAttractions = [
  { name: 'Moaning Cavern', distance: '15 min', type: 'Caves' },
  { name: 'California Caverns', distance: '20 min', type: 'Caves' },
  { name: 'Ironstone Vineyards', distance: '10 min', type: 'Wine' },
  { name: 'Calaveras Big Trees', distance: '30 min', type: 'Nature' },
  { name: 'Angels Camp', distance: '15 min', type: 'Historic' },
  { name: 'Bear Valley Ski', distance: '45 min', type: 'Ski' },
]

// Deterministic pseudo-random for SSR-safe star/firefly placement
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Generate stars with variety
function generateStars() {
  const stars: { x: number; y: number; size: number; brightness: number; twinkleSpeed: number; delay: number; color: string }[] = []
  for (let i = 0; i < 120; i++) {
    const r = seededRandom(i)
    const r2 = seededRandom(i + 500)
    const r3 = seededRandom(i + 1000)
    const r4 = seededRandom(i + 1500)
    // Cluster some stars near the milky way band (top 15-25%)
    const inBand = r4 < 0.3
    stars.push({
      x: r * 100,
      y: inBand ? 15 + r2 * 12 : r2 * 42,
      size: r3 < 0.05 ? 3 : r3 < 0.2 ? 2 : 1,
      brightness: 0.2 + r3 * 0.8,
      twinkleSpeed: 1.5 + r4 * 3,
      delay: r * 5,
      color: r4 < 0.1 ? '#ffd4a8' : r4 < 0.2 ? '#a8d4ff' : '#ffffff',
    })
  }
  return stars
}

function generateFireflies() {
  const flies: { x: number; y: number; driftX: number; driftY: number; speed: number; delay: number; size: number }[] = []
  for (let i = 0; i < 18; i++) {
    const r = seededRandom(i + 2000)
    const r2 = seededRandom(i + 2500)
    const r3 = seededRandom(i + 3000)
    flies.push({
      x: 5 + r * 90,
      y: 55 + r2 * 35,
      driftX: -8 + r3 * 16,
      driftY: -6 + seededRandom(i + 3500) * 12,
      speed: 3 + r * 5,
      delay: r2 * 6,
      size: 2 + r3 * 2,
    })
  }
  return flies
}

const stars = generateStars()
const fireflies = generateFireflies()

export default function Home() {
  const [showCursor, setShowCursor] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)
  const [owlEyesOpen, setOwlEyesOpen] = useState(true)
  const [shootingStar, setShootingStar] = useState(false)

  useEffect(() => {
    setMounted(true)
    const cursorInterval = setInterval(() => setShowCursor(prev => !prev), 500)
    const photoInterval = setInterval(() => setCurrentPhotoIndex(prev => (prev + 1) % cabinPhotos.length), 8000)

    // Owl blink cycle
    const owlBlink = setInterval(() => {
      setOwlEyesOpen(false)
      setTimeout(() => setOwlEyesOpen(true), 200)
    }, 4000)

    // Shooting star every 8-15s
    const triggerShootingStar = () => {
      setShootingStar(true)
      setTimeout(() => setShootingStar(false), 1200)
    }
    const shootingInterval = setInterval(triggerShootingStar, 8000 + Math.random() * 7000)
    // First one after 3s
    const firstShoot = setTimeout(triggerShootingStar, 3000)

    return () => {
      clearInterval(cursorInterval)
      clearInterval(photoInterval)
      clearInterval(owlBlink)
      clearInterval(shootingInterval)
      clearTimeout(firstShoot)
    }
  }, [])

  const handleGalleryKey = useCallback((e: KeyboardEvent) => {
    if (galleryIndex === null) return
    if (e.key === 'Escape') setGalleryIndex(null)
    if (e.key === 'ArrowLeft') setGalleryIndex(prev => prev !== null ? (prev - 1 + cabinPhotos.length) % cabinPhotos.length : 0)
    if (e.key === 'ArrowRight') setGalleryIndex(prev => prev !== null ? (prev + 1) % cabinPhotos.length : 0)
  }, [galleryIndex])

  useEffect(() => {
    window.addEventListener('keydown', handleGalleryKey)
    return () => window.removeEventListener('keydown', handleGalleryKey)
  }, [handleGalleryKey])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  HERO - The Full Pixel Art Scene                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Rotating Photo Background */}
        <div className="absolute inset-0">
          {cabinPhotos.map((photo, index) => (
            <div
              key={photo}
              className={`absolute inset-0 transition-opacity duration-[2000ms] ${
                index === currentPhotoIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={photo}
                alt={`Back of Beyond Ranch - Photo ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/50 to-black/95" />
        </div>

        {/* ─── SKY LAYER ─── */}

        {/* Moon */}
        <div className="absolute top-[6%] right-[12%] z-[5] pointer-events-none">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20">
            <div className="absolute inset-0 rounded-full bg-[#fffde7] shadow-[0_0_40px_12px_rgba(255,253,200,0.25),0_0_80px_30px_rgba(255,253,200,0.1)]" />
            {/* Craters */}
            <div className="absolute top-3 left-4 w-3 h-3 rounded-full bg-[#f5f0c8] opacity-50" />
            <div className="absolute top-7 right-3 w-2 h-2 rounded-full bg-[#f5f0c8] opacity-40" />
            <div className="absolute bottom-4 left-6 w-4 h-3 rounded-full bg-[#f5f0c8] opacity-30" />
            {/* Dark side shadow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-l from-transparent via-transparent to-[var(--pixel-bg-dark)] opacity-30" />
          </div>
        </div>

        {/* Stars - layered with sizes, brightness, and color variety */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Milky Way band - subtle gradient */}
          <div
            className="absolute w-[200%] h-[15%] top-[14%] -left-[20%] opacity-[0.04] rotate-[-8deg]"
            style={{ background: 'radial-gradient(ellipse at center, rgba(180,200,255,1) 0%, transparent 70%)' }}
          />

          {stars.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                backgroundColor: s.color,
                opacity: s.brightness,
                animation: `twinkle ${s.twinkleSpeed}s ease-in-out infinite`,
                animationDelay: `${s.delay}s`,
                boxShadow: s.size >= 3 ? `0 0 ${s.size * 2}px ${s.color}` : 'none',
              }}
            />
          ))}

          {/* Shooting star */}
          {shootingStar && (
            <div className="shooting-star" />
          )}
        </div>

        {/* ─── MOUNTAIN LAYERS (4 deep) ─── */}
        <div className="absolute bottom-0 left-0 right-0 h-72 pointer-events-none">
          {/* Layer 1 - Far distant peaks with snow caps */}
          <svg className="absolute bottom-44 w-full h-36 opacity-40" preserveAspectRatio="none" viewBox="0 0 200 40">
            <polygon points="0,40 12,18 22,25 35,8 50,20 62,5 78,15 90,3 105,12 118,7 135,18 150,10 165,22 178,6 195,14 200,20 200,40" fill="var(--pixel-bg-mid)" />
            {/* Snow caps */}
            <polygon points="35,8 30,14 40,14" fill="rgba(255,255,255,0.15)" />
            <polygon points="62,5 57,11 67,11" fill="rgba(255,255,255,0.2)" />
            <polygon points="90,3 84,10 96,10" fill="rgba(255,255,255,0.25)" />
            <polygon points="178,6 173,12 183,12" fill="rgba(255,255,255,0.15)" />
          </svg>

          {/* Layer 2 - Mid mountains */}
          <svg className="absolute bottom-32 w-full h-36 opacity-70" preserveAspectRatio="none" viewBox="0 0 200 40">
            <polygon points="0,40 10,22 25,30 38,15 52,25 68,10 82,20 95,8 110,18 125,12 140,22 158,14 175,20 190,10 200,18 200,40" fill="var(--pixel-bg-mid)" />
          </svg>

          {/* Layer 3 - Nearer hills with tree silhouettes */}
          <svg className="absolute bottom-20 w-full h-32" preserveAspectRatio="none" viewBox="0 0 200 40">
            <polygon points="0,40 8,20 18,28 30,14 42,22 55,10 68,18 80,12 95,20 108,15 120,24 135,12 148,20 162,16 178,22 192,14 200,18 200,40" fill="var(--pixel-forest-dark)" />
            {/* Pine tree silhouettes on ridgeline */}
            <polygon points="28,14 30,14 29,8" fill="var(--pixel-forest-dark)" />
            <polygon points="53,10 55,10 54,4" fill="var(--pixel-forest-dark)" />
            <polygon points="66,18 68,18 67,12" fill="var(--pixel-forest-dark)" />
            <polygon points="93,20 95,20 94,14" fill="var(--pixel-forest-dark)" />
            <polygon points="133,12 135,12 134,6" fill="var(--pixel-forest-dark)" />
            <polygon points="160,16 162,16 161,10" fill="var(--pixel-forest-dark)" />
            <polygon points="190,14 192,14 191,8" fill="var(--pixel-forest-dark)" />
          </svg>

          {/* Layer 4 - Foreground treeline */}
          <svg className="absolute bottom-10 w-full h-24" preserveAspectRatio="none" viewBox="0 0 200 30">
            {/* Rolling ground */}
            <polygon points="0,30 0,18 15,15 30,18 45,14 60,17 75,13 90,16 105,12 120,15 135,13 150,16 165,14 180,17 200,15 200,30" fill="#0d2818" />
            {/* Individual pines */}
            {[10, 25, 42, 58, 73, 88, 103, 120, 138, 155, 170, 188].map((x, i) => {
              const h = 6 + seededRandom(i + 100) * 8
              return (
                <polygon
                  key={i}
                  points={`${x - 2},${18 - seededRandom(i + 200) * 4} ${x + 2},${18 - seededRandom(i + 200) * 4} ${x},${18 - seededRandom(i + 200) * 4 - h}`}
                  fill={i % 3 === 0 ? '#0a2015' : '#0d2818'}
                />
              )
            })}
          </svg>

          {/* Ground */}
          <div className="absolute bottom-0 w-full h-14 bg-[#0d2818]" />
        </div>

        {/* ─── GROUND SCENE ─── */}

        {/* Winding path from bottom center toward cabin */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[7] pointer-events-none hidden sm:block">
          <svg width="120" height="60" viewBox="0 0 120 60" className="opacity-30">
            <path d="M60,60 Q55,45 50,35 Q42,20 55,10 Q62,5 60,0" fill="none" stroke="#8B7355" strokeWidth="6" strokeLinecap="round" />
            <path d="M60,60 Q55,45 50,35 Q42,20 55,10 Q62,5 60,0" fill="none" stroke="#A0896A" strokeWidth="2" strokeLinecap="round" strokeDasharray="4,6" />
          </svg>
        </div>

        {/* Fence posts along the corral */}
        <div className="absolute bottom-[52px] left-[6%] z-[8] hidden lg:flex gap-[10px]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-[3px] h-[14px] bg-[var(--pixel-earth-mid)]" />
              <div className="w-[3px] h-[2px] bg-[var(--pixel-earth-dark)]" />
            </div>
          ))}
          {/* Horizontal rails */}
          <div className="absolute top-[3px] left-0 right-0 h-[2px] bg-[var(--pixel-earth-mid)] opacity-80" />
          <div className="absolute top-[9px] left-0 right-0 h-[2px] bg-[var(--pixel-earth-mid)] opacity-60" />
        </div>

        {/* ── BARN (detailed) ── */}
        <div className="absolute bottom-[52px] left-[14%] z-[9] hidden md:block">
          <div className="relative">
            {/* Main structure */}
            <div className="w-28 h-[70px] bg-[#8B4513] relative border-b-2 border-[#5D3A1A]">
              {/* Gambrel roof */}
              <svg className="absolute -top-[28px] left-0" width="112" height="30" viewBox="0 0 112 30">
                <polygon points="0,30 14,12 56,0 98,12 112,30" fill="#654321" />
                <polygon points="14,12 56,0 98,12" fill="#5A3A1A" />
                {/* Roof ridge */}
                <line x1="56" y1="0" x2="56" y2="2" stroke="#4A2A0A" strokeWidth="2" />
              </svg>
              {/* Weathervane */}
              <div className="absolute -top-[38px] left-1/2 -translate-x-1/2" style={{ animation: 'weathervane 6s ease-in-out infinite' }}>
                <div className="w-[2px] h-[10px] bg-[#888] mx-auto" />
                <div className="relative -top-[10px]">
                  <div className="w-[12px] h-[2px] bg-[#aaa] -ml-[5px]" />
                  <div className="absolute -top-[3px] -right-[6px] w-0 h-0 border-l-[4px] border-l-[#aaa] border-t-[2px] border-t-transparent border-b-[2px] border-b-transparent" />
                </div>
              </div>
              {/* Barn X-door */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-[48px] bg-[#5D3A1A] border-2 border-[#3D2A0A] overflow-hidden">
                {/* X pattern */}
                <div className="absolute inset-0">
                  <div className="absolute top-0 left-0 w-full h-full border-l-[1px] border-b-[1px] border-[#4A2A0A] origin-top-left rotate-[37deg] scale-[1.4]" />
                  <div className="absolute top-0 right-0 w-full h-full border-r-[1px] border-b-[1px] border-[#4A2A0A] origin-top-right -rotate-[37deg] scale-[1.4]" />
                </div>
                <div className="absolute top-1/2 right-2 -translate-y-1/2 w-[3px] h-[3px] bg-[#FFD700] rounded-full shadow-[0_0_4px_#FFD700]" />
              </div>
              {/* Hay loft window - warm glow */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-5 bg-[#F4D76B] opacity-40 shadow-[0_0_8px_#F4D76B]">
                {/* Hay wisps poking out */}
                <div className="absolute -bottom-1 left-1 w-3 h-1 bg-[#C4A73B] rotate-[-15deg]" />
                <div className="absolute -bottom-1 right-2 w-2 h-1 bg-[#D4B74B] rotate-[10deg]" />
              </div>
              {/* Side window */}
              <div className="absolute top-3 left-2 w-4 h-4 bg-[#3D2A0A] border border-[#2D1A0A]">
                <div className="absolute inset-0 bg-[#F4D76B] opacity-20" />
              </div>
            </div>
          </div>
        </div>

        {/* ── CABIN (detailed) ── */}
        <div className="absolute bottom-[48px] left-1/2 -translate-x-1/2 z-[10]">
          <div className="relative">
            {/* Main cabin body */}
            <div className="w-48 h-28 bg-[var(--pixel-earth-dark)] relative border-b-2 border-[#2a1a10]">
              {/* Log lines for texture */}
              {[0, 8, 16, 24].map(y => (
                <div key={y} className="absolute left-0 right-0 h-[1px] bg-[#2a1a10] opacity-30" style={{ top: `${y + 32}px` }} />
              ))}

              {/* A-frame roof with overhang */}
              <div className="absolute -top-[52px] left-1/2 -translate-x-1/2">
                <svg width="210" height="56" viewBox="0 0 210 56">
                  <polygon points="105,0 0,56 210,56" fill="var(--pixel-earth-mid)" />
                  <polygon points="105,0 105,4 8,56 0,56" fill="#4a3020" />
                  {/* Roof shingles hint */}
                  <line x1="20" y1="48" x2="190" y2="48" stroke="#3a2515" strokeWidth="1" opacity="0.3" />
                  <line x1="40" y1="40" x2="170" y2="40" stroke="#3a2515" strokeWidth="1" opacity="0.2" />
                  <line x1="55" y1="32" x2="155" y2="32" stroke="#3a2515" strokeWidth="1" opacity="0.15" />
                </svg>
              </div>

              {/* Chimney */}
              <div className="absolute -top-[62px] right-5 w-6 h-16 bg-[#5c4033] border border-[#3a2515]">
                {/* Brick lines */}
                <div className="absolute top-2 left-0 right-0 h-[1px] bg-[#3a2515] opacity-40" />
                <div className="absolute top-5 left-0 right-0 h-[1px] bg-[#3a2515] opacity-40" />
                <div className="absolute top-8 left-0 right-0 h-[1px] bg-[#3a2515] opacity-40" />
                {/* Chimney cap */}
                <div className="absolute -top-1 -left-1 w-8 h-[3px] bg-[#4a3525]" />
              </div>

              {/* Smoke from chimney - multiple particles */}
              <div className="absolute -top-[70px] right-6">
                <div className="smoke-particle w-3 h-3 bg-white/10 rounded-full" style={{ animationDelay: '0s' }} />
                <div className="smoke-particle w-4 h-4 bg-white/8 rounded-full ml-1" style={{ animationDelay: '0.8s' }} />
                <div className="smoke-particle w-3 h-3 bg-white/6 rounded-full ml-2" style={{ animationDelay: '1.6s' }} />
                <div className="smoke-particle w-5 h-5 bg-white/5 rounded-full" style={{ animationDelay: '2.4s' }} />
              </div>

              {/* Left window with frame and curtain */}
              <div className="absolute top-3 left-4 w-10 h-10 bg-[#1a1a2e] border-2 border-[var(--pixel-earth-mid)]">
                <div className="absolute inset-0 bg-[var(--pixel-cabin-window)] shadow-[0_0_20px_var(--pixel-cabin-glow),0_0_40px_rgba(255,200,100,0.15)]" />
                {/* Window cross */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-[var(--pixel-earth-mid)]" />
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[var(--pixel-earth-mid)]" />
                {/* Curtain hint */}
                <div className="absolute top-0 left-0 w-2 h-full bg-[var(--pixel-earth-dark)] opacity-30" />
                <div className="absolute top-0 right-0 w-2 h-full bg-[var(--pixel-earth-dark)] opacity-30" />
              </div>

              {/* Right window */}
              <div className="absolute top-3 right-4 w-10 h-10 bg-[#1a1a2e] border-2 border-[var(--pixel-earth-mid)]">
                <div className="absolute inset-0 bg-[var(--pixel-cabin-window)] shadow-[0_0_20px_var(--pixel-cabin-glow),0_0_40px_rgba(255,200,100,0.15)]" />
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-[var(--pixel-earth-mid)]" />
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[var(--pixel-earth-mid)]" />
                <div className="absolute top-0 left-0 w-2 h-full bg-[var(--pixel-earth-dark)] opacity-30" />
                <div className="absolute top-0 right-0 w-2 h-full bg-[var(--pixel-earth-dark)] opacity-30" />
              </div>

              {/* Front door with frame */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-16 bg-[var(--pixel-earth-mid)] border-2 border-[#2a1a10]">
                {/* Door panels */}
                <div className="absolute top-1 left-1 right-[50%] bottom-[50%] border border-[#2a1a10] opacity-30" />
                <div className="absolute top-1 left-[50%] right-1 bottom-[50%] border border-[#2a1a10] opacity-30" />
                <div className="absolute top-[50%] left-1 right-[50%] bottom-1 border border-[#2a1a10] opacity-30" />
                <div className="absolute top-[50%] left-[50%] right-1 bottom-1 border border-[#2a1a10] opacity-30" />
                {/* Door knob */}
                <div className="absolute top-1/2 right-2 -translate-y-1/2 w-[4px] h-[4px] bg-[#FFD700] rounded-full shadow-[0_0_6px_#FFD700]" />
              </div>

              {/* Porch / step */}
              <div className="absolute -bottom-[6px] left-[25%] right-[25%] h-[6px] bg-[var(--pixel-earth-mid)] border-t border-[#4a3020]" />

              {/* Lantern by door */}
              <div className="absolute bottom-4 left-[28%]">
                <div className="w-[4px] h-[6px] bg-[#666]" />
                <div className="w-[6px] h-[8px] bg-[#FFD700] -ml-[1px] rounded-sm shadow-[0_0_10px_#FFD700,0_0_20px_rgba(255,215,0,0.3)]" style={{ animation: 'lanternFlicker 2s ease-in-out infinite' }} />
              </div>

              {/* Welcome mat */}
              <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-14 h-[3px] bg-[#8B6914] rounded-sm" />
            </div>

            {/* Stone foundation */}
            <div className="absolute bottom-[-4px] left-[-4px] right-[-4px] h-[4px] bg-[#555] border-t border-[#666]" />
          </div>
        </div>

        {/* ── HOT TUB (detailed with deck) ── */}
        <div className="absolute bottom-[40px] right-[20%] z-[10] hidden sm:block">
          <div className="relative">
            {/* Wooden deck platform */}
            <div className="absolute -bottom-[4px] -left-3 w-[86px] h-[4px] bg-[#8B6914]" />
            <div className="absolute -bottom-[2px] -left-2 w-[82px] h-[2px] bg-[#9B7924] opacity-60" />

            {/* Tub body */}
            <div className="w-20 h-12 bg-[var(--pixel-earth-mid)] rounded-t-xl border-2 border-[var(--pixel-earth-dark)] border-b-0 relative overflow-hidden">
              {/* Wood slat lines */}
              {[4, 9, 14].map(x => (
                <div key={x} className="absolute top-0 bottom-0 w-[1px] bg-[var(--pixel-earth-dark)] opacity-30" style={{ left: `${x}px` }} />
              ))}
              {/* Water */}
              <div className="absolute inset-[4px] top-[6px] bg-[#3366aa] rounded-t-lg overflow-hidden">
                {/* Water shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#5588cc] to-transparent opacity-30" style={{ animation: 'waterShimmer 3s ease-in-out infinite' }} />
                {/* Reflected moonlight */}
                <div className="absolute top-1 left-3 w-3 h-1 bg-white/20 rounded-full" style={{ animation: 'waterShimmer 4s ease-in-out infinite reverse' }} />
              </div>
            </div>

            {/* Steam particles - elaborate */}
            <div className="absolute -top-4 left-2 flex gap-[3px]">
              <div className="pixel-steam w-2 h-2 bg-white/15 rounded-full" />
              <div className="pixel-steam w-3 h-3 bg-white/12 rounded-full" style={{ animationDelay: '0.4s' }} />
              <div className="pixel-steam w-2 h-2 bg-white/10 rounded-full" style={{ animationDelay: '0.8s' }} />
              <div className="pixel-steam w-3 h-3 bg-white/8 rounded-full" style={{ animationDelay: '1.2s' }} />
              <div className="pixel-steam w-2 h-2 bg-white/12 rounded-full" style={{ animationDelay: '1.6s' }} />
            </div>
          </div>
        </div>

        {/* ── FIRE PIT ── */}
        <div className="absolute bottom-[42px] right-[35%] z-[9] hidden md:block">
          <div className="relative">
            {/* Stone ring */}
            <div className="w-14 h-6 bg-[#555] rounded-full border border-[#666] flex items-center justify-center overflow-hidden">
              {/* Fire */}
              <div className="relative w-8 h-5">
                <div className="fire-flame absolute bottom-0 left-1 w-3 h-4 bg-[var(--pixel-fire-orange)] rounded-t-full" style={{ animationDelay: '0s' }} />
                <div className="fire-flame absolute bottom-0 left-3 w-2 h-5 bg-[#ff4500] rounded-t-full" style={{ animationDelay: '0.15s' }} />
                <div className="fire-flame absolute bottom-0 right-1 w-3 h-3 bg-[var(--pixel-fire-orange)] rounded-t-full" style={{ animationDelay: '0.3s' }} />
                <div className="fire-flame absolute bottom-0 left-2 w-2 h-3 bg-[#ffcc00] rounded-t-full" style={{ animationDelay: '0.1s' }} />
              </div>
            </div>
            {/* Fire glow on ground */}
            <div className="absolute -inset-4 rounded-full bg-[var(--pixel-fire-orange)] opacity-[0.06] blur-sm" />
            {/* Embers */}
            <div className="ember absolute -top-3 left-2" style={{ animationDelay: '0s' }} />
            <div className="ember absolute -top-2 right-3" style={{ animationDelay: '0.5s' }} />
            <div className="ember absolute -top-4 left-5" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* ── PINE TREES (foreground) ── */}
        <div className="absolute bottom-[44px] left-[5%] z-[8] hidden md:block opacity-90">
          <PixelPine height={40} shade="dark" />
        </div>
        <div className="absolute bottom-[48px] left-[10%] z-[7] hidden lg:block opacity-70">
          <PixelPine height={32} shade="mid" />
        </div>
        <div className="absolute bottom-[44px] right-[8%] z-[8] hidden md:block opacity-90">
          <PixelPine height={36} shade="dark" />
        </div>
        <div className="absolute bottom-[50px] right-[14%] z-[7] hidden lg:block opacity-70">
          <PixelPine height={28} shade="mid" />
        </div>

        {/* ── OWL IN TREE ── */}
        <div className="absolute bottom-[72px] right-[7%] z-[9] hidden lg:block">
          <div className="relative">
            {/* Branch */}
            <div className="w-12 h-[3px] bg-[#4a3020] rounded" />
            {/* Owl body */}
            <div className="absolute -top-[14px] left-3">
              <div className="w-[10px] h-[12px] bg-[#8B6914] rounded-t-full relative">
                {/* Ears */}
                <div className="absolute -top-[3px] left-0 w-[3px] h-[3px] bg-[#8B6914] rotate-[-15deg]" />
                <div className="absolute -top-[3px] right-0 w-[3px] h-[3px] bg-[#8B6914] rotate-[15deg]" />
                {/* Eyes */}
                <div className="absolute top-[2px] left-[1px] w-[3px] h-[3px] rounded-full bg-[#FFD700]">
                  {owlEyesOpen && <div className="absolute top-[1px] left-[1px] w-[1px] h-[1px] bg-black rounded-full" />}
                </div>
                <div className="absolute top-[2px] right-[1px] w-[3px] h-[3px] rounded-full bg-[#FFD700]">
                  {owlEyesOpen && <div className="absolute top-[1px] left-[1px] w-[1px] h-[1px] bg-black rounded-full" />}
                </div>
                {/* Beak */}
                <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[2px] h-[2px] bg-[#C4A73B]" />
              </div>
            </div>
          </div>
        </div>

        {/* ── ANIMALS ── */}

        {/* Horses in corral */}
        <div className="absolute bottom-[44px] left-[7%] z-[10] hidden lg:block">
          <div className="flex gap-3">
            <div style={{ animation: 'horseIdle 3s ease-in-out infinite' }}>
              <div className="text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐴</div>
            </div>
            <div style={{ animation: 'horseIdle 3.5s ease-in-out infinite', animationDelay: '1.2s' }}>
              <div className="text-xl transform scale-x-[-1] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐴</div>
            </div>
            <div style={{ animation: 'horseIdle 2.8s ease-in-out infinite', animationDelay: '0.6s' }}>
              <div className="text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐴</div>
            </div>
          </div>
        </div>

        {/* Sheep flock */}
        <div className="absolute bottom-[38px] right-[10%] z-[10] hidden lg:block">
          <div className="flex gap-1 items-end">
            <div style={{ animation: 'graze 4s ease-in-out infinite' }}><div className="text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐑</div></div>
            <div style={{ animation: 'graze 4.5s ease-in-out infinite', animationDelay: '1s' }}><div className="text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐑</div></div>
            <div style={{ animation: 'graze 3.8s ease-in-out infinite', animationDelay: '2s' }}><div className="text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐑</div></div>
            <div style={{ animation: 'graze 4.2s ease-in-out infinite', animationDelay: '0.5s' }}><div className="text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐑</div></div>
          </div>
          {/* Shepherd dog nearby */}
          <div className="absolute -left-5 bottom-0" style={{ animation: 'dogWag 1s ease-in-out infinite' }}>
            <div className="text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐕</div>
          </div>
        </div>

        {/* Distant cattle */}
        <div className="absolute bottom-[70px] left-[4%] z-[6] hidden md:block opacity-60">
          <div className="flex gap-2">
            <div className="text-[10px]">🐄</div>
            <div className="text-[9px] mt-1">🐄</div>
            <div className="text-[10px]">🐂</div>
            <div className="text-[8px] mt-1">🐄</div>
          </div>
        </div>

        {/* Emus strutting */}
        <div className="absolute bottom-[46px] left-[22%] z-[10] hidden lg:block">
          <div className="flex gap-2">
            <div style={{ animation: 'emuWalk 5s ease-in-out infinite' }}><div className="text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🦙</div></div>
            <div style={{ animation: 'emuWalk 6s ease-in-out infinite', animationDelay: '2.5s' }}><div className="text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🦙</div></div>
          </div>
        </div>

        {/* Chickens with rooster */}
        <div className="absolute bottom-[36px] left-[18%] z-[10] hidden lg:block">
          <div className="flex gap-1 items-end">
            <div style={{ animation: 'roosterCrow 8s ease-in-out infinite' }}><div className="text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐓</div></div>
            <div style={{ animation: 'peck 1.5s ease-in-out infinite' }}><div className="text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐔</div></div>
            <div style={{ animation: 'peck 1.5s ease-in-out infinite', animationDelay: '0.5s' }}><div className="text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐔</div></div>
            <div style={{ animation: 'peck 2s ease-in-out infinite', animationDelay: '1s' }}><div className="text-[10px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐥</div></div>
            <div style={{ animation: 'peck 1.8s ease-in-out infinite', animationDelay: '0.3s' }}><div className="text-[10px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐥</div></div>
          </div>
        </div>

        {/* Cat on cabin porch */}
        <div className="absolute bottom-[52px] left-[calc(50%-36px)] z-[11] hidden sm:block">
          <div style={{ animation: 'catTailSwish 3s ease-in-out infinite' }}>
            <div className="text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🐈</div>
          </div>
        </div>

        {/* ── PEGASUS (enhanced trail) ── */}
        <div className="absolute z-[20] hidden sm:block" style={{ animation: 'pegasusFly 22s linear infinite' }}>
          <div className="relative">
            <div className="text-2xl drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" style={{ animation: 'wingFlap 0.5s ease-in-out infinite' }}>🦄</div>
            {/* Rainbow sparkle trail */}
            <div className="absolute -right-1 top-1 text-xs" style={{ animation: 'sparkle 0.3s ease-in-out infinite' }}>✨</div>
            <div className="absolute -right-3 top-0 text-[8px] opacity-70" style={{ animation: 'sparkle 0.4s ease-in-out infinite', animationDelay: '0.1s' }}>⭐</div>
            <div className="absolute -right-5 top-2 text-[6px] opacity-50" style={{ animation: 'sparkle 0.5s ease-in-out infinite', animationDelay: '0.2s' }}>💫</div>
            <div className="absolute -right-7 top-0 w-1 h-1 rounded-full bg-[#ff6b6b] opacity-40" style={{ animation: 'sparkle 0.6s ease-in-out infinite', animationDelay: '0.15s' }} />
            <div className="absolute -right-8 top-2 w-1 h-1 rounded-full bg-[#ffd93d] opacity-30" style={{ animation: 'sparkle 0.5s ease-in-out infinite', animationDelay: '0.25s' }} />
            <div className="absolute -right-9 top-1 w-1 h-1 rounded-full bg-[#6bff6b] opacity-20" style={{ animation: 'sparkle 0.4s ease-in-out infinite', animationDelay: '0.35s' }} />
          </div>
        </div>

        {/* ── FIREFLIES ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {fireflies.map((f, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                width: `${f.size}px`,
                height: `${f.size}px`,
                backgroundColor: '#bfff00',
                boxShadow: `0 0 ${f.size * 2}px #bfff00, 0 0 ${f.size * 4}px rgba(191,255,0,0.3)`,
                animation: `fireflyFloat ${f.speed}s ease-in-out infinite, fireflyGlow ${f.speed * 0.6}s ease-in-out infinite`,
                animationDelay: `${f.delay}s`,
                ['--drift-x' as string]: `${f.driftX}px`,
                ['--drift-y' as string]: `${f.driftY}px`,
              }}
            />
          ))}
        </div>

        {/* ─── HERO TEXT CONTENT ─── */}
        <div className="relative z-[25] flex flex-col items-center justify-center min-h-[90vh] px-4 text-center">
          <div className="mb-6">
            <p className="font-[var(--font-pixel)] text-[6px] sm:text-[8px] text-[var(--pixel-fire-orange)] tracking-[0.3em] uppercase mb-3" style={{ animation: 'fadeSlideIn 1s ease-out' }}>
              Gold Country, California
            </p>
            <h1
              className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg sm:text-2xl md:text-3xl mb-3"
              style={{ textShadow: '0 0 10px var(--pixel-gold-mid), 0 0 30px rgba(244,215,107,0.2)', animation: 'fadeSlideIn 1s ease-out 0.2s both' }}
            >
              Back of Beyond Ranch
            </h1>
            <div className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-ui-text)] tracking-widest" style={{ animation: 'fadeSlideIn 1s ease-out 0.4s both' }}>
              ═══════════════════════
            </div>
            <p className="font-[var(--font-pixel)] text-[8px] sm:text-[10px] text-[var(--pixel-sky-light)] mt-2 max-w-md mx-auto leading-relaxed" style={{ animation: 'fadeSlideIn 1s ease-out 0.6s both' }}>
              10-acre mountain retreat with hot tub, ranch animals,
              game room & Gold Country adventures
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center gap-5" style={{ animation: 'fadeSlideIn 1s ease-out 0.8s both' }}>
            <PixelButton href={AIRBNB_URL} variant="orange" size="lg">
              🏨 Book Your Stay
            </PixelButton>
            <div className="flex flex-col sm:flex-row gap-3">
              <PixelButton href="/oregon-trail" variant="gold" size="md">
                ⚔️ Start Quest
              </PixelButton>
              <PixelButton href="/explore" variant="green" size="md">
                🗺️ Explore Map
              </PixelButton>
            </div>
          </div>

          <div className="mt-10 font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
            <span className={showCursor ? 'opacity-100' : 'opacity-30'}>
              ▶ Press START to begin your adventure ◀
            </span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[25] flex gap-4 sm:gap-8 font-[var(--font-pixel)] text-[6px] sm:text-[8px] text-[var(--pixel-ui-text)] bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
          <div className="flex items-center gap-1 sm:gap-2">
            <span>⭐</span>
            <span>268 Reviews</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span>🏆</span>
            <span>#1 Ranked</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span>🛏️</span>
            <span>Sleeps 12</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  RANCH AMENITIES                                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 bg-gradient-to-b from-[var(--pixel-bg-dark)] to-[var(--pixel-bg-mid)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm sm:text-lg text-center mb-3">
            The Ranch
          </h2>
          <p className="font-[var(--font-pixel)] text-[7px] sm:text-[8px] text-[var(--pixel-ui-text)] text-center mb-10 max-w-lg mx-auto leading-relaxed">
            A mountain cabin on 10 private acres in the heart of Gold Country.
            Unplug, explore, and make memories.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {amenities.map((a, i) => (
              <div
                key={a.name}
                className="amenity-card bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)]/30 rounded-lg p-4 text-center hover:border-[var(--pixel-gold-mid)]/60 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(244,215,107,0.1)]"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="text-2xl mb-2 group-hover:scale-125 transition-transform duration-300">{a.icon}</div>
                <div className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-[8px] sm:text-[9px] mb-1">{a.name}</div>
                <div className="font-[var(--font-pixel)] text-[var(--pixel-ui-text)] text-[6px] sm:text-[7px] opacity-70">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  PHOTO GALLERY                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 bg-[var(--pixel-bg-mid)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm sm:text-lg text-center mb-8">
            Gallery
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cabinPhotos.map((photo, index) => (
              <button
                key={photo}
                onClick={() => setGalleryIndex(index)}
                className="relative aspect-[4/3] overflow-hidden rounded-lg border-2 border-[var(--pixel-ui-border)]/20 hover:border-[var(--pixel-gold-mid)] transition-all duration-300 hover:scale-[1.03] group hover:shadow-[0_0_15px_rgba(244,215,107,0.15)]"
              >
                <Image
                  src={photo}
                  alt={`Ranch photo ${index + 1}`}
                  fill
                  className="object-cover group-hover:brightness-110 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {galleryIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setGalleryIndex(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setGalleryIndex(prev => prev !== null ? (prev - 1 + cabinPhotos.length) % cabinPhotos.length : 0) }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl font-mono z-10 hover:scale-110 transition-transform"
          >
            ◀
          </button>
          <div className="relative w-full max-w-3xl aspect-[3/2]">
            <Image
              src={cabinPhotos[galleryIndex]}
              alt={`Ranch photo ${galleryIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setGalleryIndex(prev => prev !== null ? (prev + 1) % cabinPhotos.length : 0) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl font-mono z-10 hover:scale-110 transition-transform"
          >
            ▶
          </button>
          <button
            onClick={() => setGalleryIndex(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white font-[var(--font-pixel)] text-xs"
          >
            [ESC]
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 font-[var(--font-pixel)] text-[8px]">
            {galleryIndex + 1} / {cabinPhotos.length}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  GOLD COUNTRY ATTRACTIONS                                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 bg-gradient-to-b from-[var(--pixel-bg-mid)] to-[var(--pixel-bg-dark)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm sm:text-lg text-center mb-3">
            Gold Country Awaits
          </h2>
          <p className="font-[var(--font-pixel)] text-[7px] sm:text-[8px] text-[var(--pixel-ui-text)] text-center mb-8 max-w-md mx-auto leading-relaxed">
            Caves, vineyards, giant sequoias, skiing, and historic mining towns -- all within a short drive.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {nearbyAttractions.map((spot) => (
              <div
                key={spot.name}
                className="bg-[var(--pixel-bg-dark)]/60 border border-[var(--pixel-forest-mid)]/30 rounded-lg p-3 flex items-center gap-3 hover:border-[var(--pixel-forest-light)]/50 transition-colors"
              >
                <div className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-forest-light)] bg-[var(--pixel-forest-dark)] px-2 py-1 rounded shrink-0">
                  {spot.type}
                </div>
                <div>
                  <div className="font-[var(--font-pixel)] text-[var(--pixel-ui-text)] text-[8px]">{spot.name}</div>
                  <div className="font-[var(--font-pixel)] text-[var(--pixel-gold-mid)] text-[6px]">{spot.distance} drive</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <PixelButton href="/explore" variant="green" size="md">
              🗺️ Explore Full Map
            </PixelButton>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  ADVENTURE CARDS (enhanced with pixel scene backgrounds)  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 bg-[var(--pixel-bg-dark)] relative overflow-hidden">
        {/* Decorative pixel border top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--pixel-gold-mid)] to-transparent opacity-30" />

        <div className="max-w-6xl mx-auto">
          <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm sm:text-lg text-center mb-3">
            Choose Your Path
          </h2>
          <p className="font-[var(--font-pixel)] text-[7px] sm:text-[8px] text-[var(--pixel-ui-text)] text-center mb-10 max-w-md mx-auto leading-relaxed">
            Play games, complete quests, and earn real discounts on your stay.
            Your karma alignment shapes your experience.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Prospector's Tale */}
            <div className="adventure-card group relative">
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a1c2c] to-[#29366f] opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <PixelCard title="🎮 Prospector&#39;s Tale">
                <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed mb-3">
                  Play the prequel! Experience Tobias&apos;s 1852 Gold Rush journey in this browser RPG.
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="adventure-tag bg-[var(--pixel-ui-bg)]/50">5 Chapters</span>
                  <span className="adventure-tag bg-[var(--pixel-ui-bg)]/50">Branching Story</span>
                  <span className="adventure-tag bg-[var(--pixel-gold-dark)]/50">Earn Discounts</span>
                </div>
                <PixelButton href="/adventure" variant="blue" size="sm">
                  Play Now
                </PixelButton>
              </PixelCard>
            </div>

            {/* Mystery Hunt */}
            <div className="adventure-card group relative">
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#2a1a0a] to-[#3a2515] opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <PixelCard title="⚔️ Mystery Hunt">
                <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed mb-3">
                  At the ranch: scan QR codes, solve riddles, discover what Tobias left behind.
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="adventure-tag bg-[var(--pixel-gold-dark)]/50">14 Locations</span>
                  <span className="adventure-tag bg-[var(--pixel-gold-dark)]/50">Hidden Treasures</span>
                  <span className="adventure-tag bg-[var(--pixel-fire-orange)]/30">Up to 27% Off</span>
                </div>
                <PixelButton href="/game" variant="gold" size="sm">
                  Learn More
                </PixelButton>
              </PixelCard>
            </div>

            {/* Gold Country */}
            <div className="adventure-card group relative">
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0d2818] to-[#1e4d2b] opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <PixelCard title="🗺️ Gold Country">
                <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed mb-3">
                  Explore real locations! 40+ quests with moral choices across 11 Gold Country towns.
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="adventure-tag bg-[var(--pixel-forest-dark)]/50">40+ Quests</span>
                  <span className="adventure-tag bg-[var(--pixel-sky-mid)]/30">Moral Choices</span>
                  <span className="adventure-tag bg-[var(--pixel-forest-dark)]/50">Karma System</span>
                </div>
                <PixelButton href="/oregon-trail" variant="green" size="sm">
                  Start Quest
                </PixelButton>
              </PixelCard>
            </div>

            {/* The Inn */}
            <div className="adventure-card group relative">
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#3a2010] to-[#5c3d2e] opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <PixelCard title="🏨 The Inn">
                <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed mb-3">
                  Your home base. Hot tub, game room, 10 acres of ranch land, and ranch animals.
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="adventure-tag bg-[var(--pixel-earth-dark)]/50">Sleeps 12</span>
                  <span className="adventure-tag bg-[var(--pixel-earth-dark)]/50">Hot Tub & Games</span>
                  <span className="adventure-tag bg-[var(--pixel-fire-orange)]/30">Book & Save</span>
                </div>
                <PixelButton href={AIRBNB_URL} variant="orange" size="sm">
                  Book Stay
                </PixelButton>
              </PixelCard>
            </div>
          </div>

          {/* Karma discount teaser */}
          <div className="mt-8 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)]/30 rounded-lg p-5 max-w-2xl mx-auto hover:border-[var(--pixel-gold-mid)]/30 transition-colors">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-center sm:text-left flex-1">
                <h3 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-[9px] sm:text-[10px] mb-2">
                  Karma Discount System
                </h3>
                <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] leading-relaxed">
                  Your in-game alignment affects real booking discounts.
                  Lawful Good guests earn up to 1.5x discount multiplier.
                  Play fair, help NPCs, and follow house rules for the best deals.
                </p>
              </div>
              <div className="flex gap-2 text-center shrink-0">
                <div className="karma-tier bg-[var(--pixel-bg-dark)] px-3 py-2 rounded border border-[var(--pixel-forest-mid)]/30">
                  <div className="font-[var(--font-pixel)] text-[var(--pixel-forest-light)] text-[10px]">1.5x</div>
                  <div className="font-[var(--font-pixel)] text-[var(--pixel-ui-text)] text-[6px]">Lawful Good</div>
                </div>
                <div className="karma-tier bg-[var(--pixel-bg-dark)] px-3 py-2 rounded border border-[var(--pixel-ui-border)]/30">
                  <div className="font-[var(--font-pixel)] text-[var(--pixel-ui-text)] text-[10px]">1.0x</div>
                  <div className="font-[var(--font-pixel)] text-[var(--pixel-ui-text)] text-[6px]">Neutral</div>
                </div>
                <div className="karma-tier bg-[var(--pixel-bg-dark)] px-3 py-2 rounded border border-[var(--pixel-sky-light)]/30">
                  <div className="font-[var(--font-pixel)] text-[var(--pixel-sky-light)] text-[10px]">0.5x</div>
                  <div className="font-[var(--font-pixel)] text-[var(--pixel-ui-text)] text-[6px]">Chaotic Evil</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  HALL OF FAME                                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 bg-gradient-to-b from-[var(--pixel-bg-dark)] to-[var(--pixel-bg-mid)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm sm:text-lg mb-4">
            🏆 Hall of Fame 🏆
          </h2>
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] mb-6">
            Think you can beat the current champions? Start your quest!
          </p>
          <PixelButton href="/leaderboard" variant="gold" size="md">
            View Leaderboard
          </PixelButton>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  FINAL CTA                                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-[var(--pixel-bg-mid)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/cabin-photos/cabin-1.jpg" alt="" fill className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--pixel-bg-mid)] via-transparent to-[var(--pixel-bg-mid)] opacity-60" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm sm:text-lg mb-3">
            Ready for an Adventure?
          </h2>
          <p className="font-[var(--font-pixel)] text-[8px] sm:text-[9px] text-[var(--pixel-ui-text)] leading-relaxed mb-8 max-w-lg mx-auto">
            Book Back of Beyond Ranch on Airbnb. 4 bedrooms, 3 baths,
            hot tub, game room, and 10 acres of Gold Country.
            Your quest begins at check-in.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PixelButton href={AIRBNB_URL} variant="orange" size="lg">
              🏨 Book on Airbnb
            </PixelButton>
            <PixelButton href="/hub" variant="gold" size="lg">
              🎮 Game Hub
            </PixelButton>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  FOOTER                                                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-[var(--pixel-bg-dark)] border-t-4 border-[var(--pixel-ui-border)] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6 mb-6">
            <div className="text-center sm:text-left">
              <h3 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-[9px] mb-2">The Ranch</h3>
              <div className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] space-y-1">
                <p>4 Bedrooms, 3 Baths</p>
                <p>Sleeps 12 Guests</p>
                <p>10 Acres, Gold Country CA</p>
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-[9px] mb-2">Adventures</h3>
              <div className="font-[var(--font-pixel)] text-[7px] space-y-1">
                <Link href="/oregon-trail" className="block text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] transition-colors">Prospector&apos;s Quest</Link>
                <Link href="/explore" className="block text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] transition-colors">Gold Country Map</Link>
                <Link href="/game" className="block text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] transition-colors">Mystery Hunt</Link>
                <Link href="/hub" className="block text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] transition-colors">Game Hub</Link>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <h3 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-[9px] mb-2">Connect</h3>
              <div className="font-[var(--font-pixel)] text-[7px] space-y-1">
                <Link href={AIRBNB_URL} target="_blank" className="block text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] transition-colors">Airbnb Listing</Link>
                <Link href="https://x.com/BackBeyondRanch" target="_blank" className="block text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] transition-colors">Twitter / X</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--pixel-ui-border)]/30 pt-4 text-center">
            <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-60">
              &copy; 2025 Back of Beyond Ranch &middot; Murphys, CA &middot; Gold Country
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  ANIMATIONS                                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <style jsx>{`
        /* ── Stars ── */
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 1; }
        }

        /* ── Shooting Star ── */
        .shooting-star {
          position: absolute;
          top: 12%;
          left: 15%;
          width: 3px;
          height: 3px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 6px 2px white, 0 0 12px 4px rgba(255,255,255,0.5);
          animation: shootingStarAnim 1.2s ease-out forwards;
        }
        .shooting-star::after {
          content: '';
          position: absolute;
          top: 50%;
          right: 100%;
          width: 60px;
          height: 1px;
          background: linear-gradient(to left, white, transparent);
          transform: translateY(-50%);
        }
        @keyframes shootingStarAnim {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(250px, 120px) scale(0); opacity: 0; }
        }

        /* ── Smoke Particles ── */
        .smoke-particle {
          animation: smokeRise 3.2s ease-out infinite;
        }
        @keyframes smokeRise {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.12; }
          50% { transform: translateY(-18px) translateX(4px) scale(1.8); opacity: 0.06; }
          100% { transform: translateY(-36px) translateX(-2px) scale(2.5); opacity: 0; }
        }

        /* ── Fire ── */
        .fire-flame {
          animation: flameFlicker 0.4s ease-in-out infinite alternate;
        }
        @keyframes flameFlicker {
          0% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
          50% { transform: scaleY(1.15) scaleX(0.9); opacity: 1; }
          100% { transform: scaleY(0.85) scaleX(1.1); opacity: 0.85; }
        }

        /* ── Embers ── */
        .ember {
          width: 2px;
          height: 2px;
          background: #ff6600;
          border-radius: 50%;
          box-shadow: 0 0 3px #ff6600;
          animation: emberFloat 2s ease-out infinite;
        }
        @keyframes emberFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0.8; }
          100% { transform: translateY(-20px) translateX(8px); opacity: 0; }
        }

        /* ── Fireflies ── */
        @keyframes fireflyFloat {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(var(--drift-x, 5px), calc(var(--drift-y, -3px) * 0.5)); }
          50% { transform: translate(calc(var(--drift-x, 5px) * 0.3), var(--drift-y, -3px)); }
          75% { transform: translate(calc(var(--drift-x, 5px) * -0.5), calc(var(--drift-y, -3px) * 0.3)); }
        }
        @keyframes fireflyGlow {
          0%, 100% { opacity: 0.1; }
          40% { opacity: 0.8; }
          60% { opacity: 0.9; }
        }

        /* ── Animals ── */
        @keyframes horseIdle {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-2px); }
          60% { transform: translateY(-1px); }
        }
        @keyframes graze {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(2px) rotate(5deg); }
          50% { transform: translateY(3px) rotate(0deg); }
          75% { transform: translateY(2px) rotate(-5deg); }
        }
        @keyframes emuWalk {
          0%, 100% { transform: translateX(0) scaleX(1); }
          45% { transform: translateX(12px) scaleX(1); }
          50% { transform: translateX(12px) scaleX(-1); }
          95% { transform: translateX(0px) scaleX(-1); }
        }
        @keyframes peck {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(3px) rotate(15deg); }
        }
        @keyframes roosterCrow {
          0%, 85%, 100% { transform: rotate(0deg); }
          88% { transform: rotate(-10deg) translateY(-3px); }
          91% { transform: rotate(-15deg) translateY(-4px); }
          94% { transform: rotate(-10deg) translateY(-2px); }
        }
        @keyframes dogWag {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(-1); }
        }
        @keyframes catTailSwish {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(3deg); }
          75% { transform: rotate(-3deg); }
        }

        /* ── Pegasus ── */
        @keyframes pegasusFly {
          0% { left: -10%; top: 15%; }
          15% { top: 10%; }
          30% { left: 25%; top: 7%; }
          45% { top: 12%; }
          60% { left: 55%; top: 5%; }
          75% { left: 75%; top: 9%; }
          90% { top: 6%; }
          100% { left: 110%; top: 8%; }
        }
        @keyframes wingFlap {
          0%, 100% { transform: scaleY(1) rotate(-2deg); }
          50% { transform: scaleY(0.88) rotate(2deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        /* ── Barn Weathervane ── */
        @keyframes weathervane {
          0%, 100% { transform: scaleX(1); }
          30% { transform: scaleX(0.6); }
          50% { transform: scaleX(-0.8); }
          70% { transform: scaleX(-0.4); }
        }

        /* ── Lantern ── */
        @keyframes lanternFlicker {
          0%, 100% { opacity: 0.85; box-shadow: 0 0 8px #FFD700, 0 0 16px rgba(255,215,0,0.2); }
          25% { opacity: 0.95; box-shadow: 0 0 12px #FFD700, 0 0 24px rgba(255,215,0,0.3); }
          50% { opacity: 0.80; box-shadow: 0 0 6px #FFD700, 0 0 12px rgba(255,215,0,0.15); }
          75% { opacity: 0.90; box-shadow: 0 0 10px #FFD700, 0 0 20px rgba(255,215,0,0.25); }
        }

        /* ── Water ── */
        @keyframes waterShimmer {
          0%, 100% { transform: translateX(-20%); opacity: 0.2; }
          50% { transform: translateX(20%); opacity: 0.4; }
        }

        /* ── Hero text entrance ── */
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* ── Adventure card tags ── */
        .adventure-tag {
          font-family: var(--font-pixel);
          font-size: 7px;
          color: var(--pixel-ui-text);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* ── Adventure card hover glow ── */
        .adventure-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .adventure-card:hover {
          transform: translateY(-4px);
        }

        /* ── Karma tier hover ── */
        .karma-tier {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .karma-tier:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  )
}

/* ── Pixel Pine Tree Component ── */
function PixelPine({ height, shade }: { height: number; shade: 'dark' | 'mid' }) {
  const trunkH = Math.round(height * 0.25)
  const crownH = height - trunkH
  const baseW = Math.round(height * 0.5)
  const colors = shade === 'dark'
    ? { crown: '#0a3018', trunk: '#3a2515' }
    : { crown: '#0d3820', trunk: '#4a3020' }

  return (
    <div className="relative" style={{ width: `${baseW}px`, height: `${height}px` }}>
      {/* Trunk */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{ width: '4px', height: `${trunkH}px`, backgroundColor: colors.trunk }}
      />
      {/* Crown layers */}
      {[0, 1, 2].map(i => {
        const layerW = baseW * (0.4 + i * 0.25)
        const layerBot = trunkH + (2 - i) * (crownH / 3.5)
        return (
          <div
            key={i}
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: `${layerBot}px`,
              width: 0,
              height: 0,
              borderLeft: `${layerW / 2}px solid transparent`,
              borderRight: `${layerW / 2}px solid transparent`,
              borderBottom: `${crownH / 2.8}px solid ${colors.crown}`,
            }}
          />
        )
      })}
    </div>
  )
}
