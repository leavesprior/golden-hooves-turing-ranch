'use client'

// Real-place 64-bit backdrops for the whole game. Each is generated from a
// historical photo or a Google Maps reference, pixel-downscaled, style-gated, and
// vision-verified (see tools/place-art/). Keyed by a game location id -> a file in
// public/place-art/. Renders nothing if a location has no art (graceful), so it's
// safe to drop into any game's location view.

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { Weather, TimeOfDay } from './CinematicScene'

const CinematicScene = dynamic(() => import('./CinematicScene'), { ssr: false })

// Living-painting mode is OFF in production by default — the static <img> below is
// the shipped, luster-preserving render. Set NEXT_PUBLIC_CINEMATIC_SCENES=1 (e.g.
// in .env.local) to bring backdrops alive on the LOCAL testing build, or pass
// cinematic={true} per call to pilot a single scene. Live game stays unchanged.
const CINEMATIC_ENABLED = process.env.NEXT_PUBLIC_CINEMATIC_SCENES === '1'

// Per-place mood (weather + time-of-day), keyed by the resolved art slug. Anything
// unlisted falls back to a calm daylit scene with warm rays.
const SCENE_MOOD: Record<string, { weather?: Weather; timeOfDay?: TimeOfDay; rayColor?: number; fireflies?: boolean }> = {
  ch3_donner_pass: { weather: 'snow', timeOfDay: 'day', rayColor: 0xbcdfff, fireflies: false },
  ch3_carson_trail: { weather: 'snow', timeOfDay: 'dawn', rayColor: 0xcfe4ff, fireflies: false },
  volcano: { weather: 'embers', timeOfDay: 'night', rayColor: 0xffe2b0, fireflies: false },
  vol_st_george: { weather: 'embers', timeOfDay: 'night', rayColor: 0xffd29a, fireflies: false },
  ch5_ghost_town: { weather: 'embers', timeOfDay: 'night', rayColor: 0xffc890, fireflies: false },
  ch5_hydraulic_scar: { weather: 'rain', timeOfDay: 'dusk', rayColor: 0xc8d6e6, fireflies: false },
  mh_hotel_leger: { weather: 'embers', timeOfDay: 'night', rayColor: 0xffce9a, fireflies: true },
  welcome_gate: { timeOfDay: 'dusk', rayColor: 0xffe6a8, fireflies: true },
  bobr_cabin: { timeOfDay: 'dusk', rayColor: 0xffdca0, fireflies: true },
  kennedy_mine: { timeOfDay: 'dusk', rayColor: 0xffd28a, fireflies: false },
  sa_courthouse: { timeOfDay: 'dusk', rayColor: 0xffd9a6, fireflies: false },
  big_trees: { timeOfDay: 'dawn', rayColor: 0xd8f0b0, fireflies: true },
  forester_trail: { timeOfDay: 'dawn', rayColor: 0xcdeaa0, fireflies: true },
  natural_bridges: { timeOfDay: 'dawn', rayColor: 0xbfeecf, fireflies: true },
}

const PLACE_ART: Record<string, string> = {
  // --- Where in Time eras (custom-generated) ---
  forester_trail: 'forester_trail', welcome_gate: 'welcome_gate',
  // --- Town-investigation scene art (2026-06-17) ---
  sandy_gulch: 'sandy_gulch', harris_ranch: 'harris_ranch', vol_st_george: 'vol_st_george',
  mh_hotel_leger: 'mh_hotel_leger', sa_courthouse: 'sa_courthouse', ace_angels_hotel: 'ace_angels_hotel',
  // --- Gold Country Explorer ---
  volcano: 'volcano', angels_camp: 'angels_camp', west_point: 'west_point',
  mokelumne_hill: 'mokelumne_hill', san_andreas: 'san_andreas', bobr_ranch: 'bobr_cabin',
  nevada_city: 'nevada_city', grass_valley: 'grass_valley',
  angels_camp_expanded: 'ace_angels_hotel', mariposa: 'mariposa',
  // --- Oregon Trail (Gold Country) ---
  bobr_cabin: 'bobr_cabin', murphys: 'murphys', moaning_cavern: 'moaning_cavern',
  california_caverns: 'big_trees', big_trees: 'big_trees', kennedy_mine: 'kennedy_mine',
  ironstone_vineyards: 'murphys', jackson: 'jackson', natural_bridges: 'natural_bridges',
  // --- Adventure / Prospector's Tale (ch1-2 confirmed; ch3-5 best matches) ---
  ch1_independence: 'ch1_independence', ch1_fort_kearny: 'ch1_fort_kearny',
  ch1_sacramento_waterfront: 'ch1_sacramento_waterfront', ch1_sutters_fort: 'ch1_sutters_fort',
  ch1_sacramento_tent_city: 'ch1_sacramento_waterfront',
  ch2_volcano_main: 'volcano', ch2_st_george: 'vol_st_george', ch2_masonic_lodge: 'volcano',
  ch2_cobblestone: 'volcano', ch2_miners_camp: 'volcano', ch2_cemetery: 'volcano',
  ch2_hangtown: 'ch2_hangtown', ch2_drytown: 'ch2_drytown', ch2_chinese_camp: 'ch2_chinese_camp',
  ch3_angels_camp: 'angels_camp', ch3_murphys: 'murphys', ch3_moaning_cavern: 'moaning_cavern',
  ch3_big_trees: 'big_trees', ch3_natural_bridges: 'natural_bridges',
  ch3_donner_pass: 'ch3_donner_pass', ch3_carson_trail: 'ch3_carson_trail',
  ch3_jumping_frog: 'angels_camp',
  ch4_west_point: 'west_point', ch4_jackson: 'jackson', ch4_mokelumne_hill: 'mokelumne_hill',
  ch4_ranch_site: 'bobr_cabin', ch5_ranch_house: 'bobr_cabin',
  ch5_ghost_town: 'ch5_ghost_town', ch5_hydraulic_scar: 'ch5_hydraulic_scar',
}

export function PlaceBackdrop({
  id,
  className = '',
  cinematic,
}: {
  id: string
  className?: string
  /** Override the global flag for a single scene: true = force living painting, false = force static. */
  cinematic?: boolean
}) {
  const [failed, setFailed] = useState(false)
  // Scene-change fade: when the resolved art changes, the cinematic backdrop
  // dissolves in (covers the Pixi rebuild flash → a real "scene transition"
  // feel). Reduced-motion users skip straight to shown. Hooks run before any
  // early return to keep hook order stable.
  const [shown, setShown] = useState(false)
  const art = PLACE_ART[id]
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    setShown(false)
    let r2 = 0
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setShown(true)) })
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [art])
  if (!art || failed) return null

  const useCinematic = cinematic ?? CINEMATIC_ENABLED
  if (useCinematic) {
    const mood = SCENE_MOOD[art] ?? {}
    return (
      <div
        aria-hidden
        className={`w-full overflow-hidden bg-black ${className}`}
        style={{ opacity: shown ? 1 : 0, transition: 'opacity 650ms ease-out' }}
      >
        <CinematicScene
          key={art}
          src={`/place-art/${art}.png`}
          fit="cover"
          weather={mood.weather}
          timeOfDay={mood.timeOfDay}
          rayColor={mood.rayColor}
          fireflies={mood.fireflies ?? false}
        />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/place-art/${art}.png`}
      alt=""
      aria-hidden
      onError={() => setFailed(true)}
      className={`w-full object-cover [image-rendering:pixelated] ${className}`}
    />
  )
}
