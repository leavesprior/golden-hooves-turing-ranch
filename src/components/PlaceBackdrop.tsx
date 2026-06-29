'use client'

// Real-place 64-bit backdrops for the whole game. Each is generated from a
// historical photo or a Google Maps reference, pixel-downscaled, style-gated, and
// vision-verified (see tools/place-art/). Keyed by a game location id -> a file in
// public/place-art/. Renders nothing if a location has no art (graceful), so it's
// safe to drop into any game's location view.

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy-load the DB32 renderer so its ~320-LOC code is NOT pulled into the client
// bundle on the default (flag-OFF) build — it only loads when the flag-ON branch
// actually renders. ssr:false is fine: the renderer is canvas/client-only.
const PixelScene = dynamic(() => import('@/components/PixelScene'), { ssr: false })

// Caller classNames carry img-only utilities (object-top/cover/contain) that are
// meaningless on a wrapper <div>. Strip them for the pixel wrapper while keeping
// layout-relevant classes (h-*, rounded, border, etc.).
function stripObjectUtils(cn: string): string {
  return cn
    .split(/\s+/)
    .filter((c) => c && !/^object-/.test(c))
    .join(' ')
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

// --- DB32 32/64-bit pixel-art scenes (opt-in, flag-gated) -------------------
// The DB32 renderer (src/lib/pixelArt/db32Renderer.ts, previewed at
// /pixel-preview) understands these 13 authored Gold Country scene keys.
type Db32SceneKey =
  | 'ranch' | 'columbia' | 'mokehill' | 'bearvalley' | 'river' | 'mine'
  | 'angels' | 'murphys' | 'lookout' | 'map' | 'battle' | 'office' | 'vane'

// Flag, OFF by default → ZERO visual change until enabled. Same convention as
// NEXT_PUBLIC_WIT_RANDOMIZE / NEXT_PUBLIC_ENABLE_KARMA_DEV_CHAIN elsewhere.
const PIXEL_SCENES_ON =
  process.env.NEXT_PUBLIC_PIXEL_SCENES === '1' ||
  process.env.NEXT_PUBLIC_PIXEL_SCENES === 'true'

// Place id (a PLACE_ART key) -> a DB32 scene that genuinely depicts that place.
// Partial coverage by design: places without a faithful scene match are left on
// their existing PNG (no entry here = unchanged).
const DB32_SCENE_BY_PLACE: Record<string, Db32SceneKey> = {
  // Pryor / BOBR ranch + cabin (the "Back of Beyond" homestead)
  bobr_ranch: 'ranch', bobr_cabin: 'ranch', ch4_ranch_site: 'ranch', ch5_ranch_house: 'ranch',
  // Angels Camp (Twain's jumping frog) + its hotel
  angels_camp: 'angels', ch3_angels_camp: 'angels', ace_angels_hotel: 'angels',
  angels_camp_expanded: 'angels', ch3_jumping_frog: 'angels',
  // Murphys ("Queen of the Sierra") + Ironstone vineyards nearby
  murphys: 'murphys', ch3_murphys: 'murphys', ironstone_vineyards: 'murphys',
  // Mokelumne Hill (rhyolite stone town) + Hotel Leger
  mokelumne_hill: 'mokehill', ch4_mokelumne_hill: 'mokehill', mh_hotel_leger: 'mokehill',
  // Kennedy Mine + the hydraulic scar
  kennedy_mine: 'mine', ch5_hydraulic_scar: 'mine',
}

export function PlaceBackdrop({ id, className = '' }: { id: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const [pixelFailed, setPixelFailed] = useState(false)

  // Flag-gated DB32 scene (opt-in). When OFF (default) this branch is skipped
  // entirely and the code below runs byte-for-byte as before. If the renderer
  // can't draw, pixelFailed flips and we fall through to the PNG/null path.
  if (PIXEL_SCENES_ON && !pixelFailed) {
    const db32 = DB32_SCENE_BY_PLACE[id]
    if (db32) {
      // Fill the same box the <img> occupied: the wrapper carries the caller's
      // layout className (height/border/rounding) + w-full + overflow-hidden
      // (object-* utils stripped — they only apply to replaced elements). The
      // canvas covers the box WITHOUT distortion via object-cover (the 16:9
      // canvas is center-cropped to non-16:9 boxes like h-44/h-28), and the HUD
      // is suppressed since this is a decorative backdrop, not the game view.
      return (
        <div
          className={`relative w-full overflow-hidden [image-rendering:pixelated] ${stripObjectUtils(className)}`}
        >
          <PixelScene
            loc={db32}
            hud={false}
            width={640}
            height={360}
            onError={() => setPixelFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )
    }
  }

  const art = PLACE_ART[id]
  if (!art || failed) return null
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
