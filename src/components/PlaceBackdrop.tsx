'use client'

// Real-place 64-bit backdrops for the whole game. Each is generated from a
// historical photo or a Google Maps reference, pixel-downscaled, style-gated, and
// vision-verified (see tools/place-art/). Keyed by a game location id -> a file in
// public/place-art/. Renders nothing if a location has no art (graceful), so it's
// safe to drop into any game's location view.

import { useState } from 'react'

const PLACE_ART: Record<string, string> = {
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

export function PlaceBackdrop({ id, className = '' }: { id: string; className?: string }) {
  const [failed, setFailed] = useState(false)
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
