'use client'

import { useState } from 'react'
import { TRAIL_OUTCOME_ART, type TrailOutcomeArtId } from '../data/trailOutcomeArt'
import styles from './TrailOutcomePicture.module.css'

/** Shares one raster/fallback treatment between Passing and river results.
 * Text and continuation controls remain available when the asset is missing. */
export function TrailOutcomePicture({ art, caption }: { art: TrailOutcomeArtId; caption?: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const asset = TRAIL_OUTCOME_ART[art]
  return <figure className={styles.figure} data-testid="trail-outcome-picture" data-art={art}>
    {failedSource === asset.src ? <div className={styles.fallback} role="img" aria-label={asset.alt} data-testid="trail-art-fallback">
      <span aria-hidden="true">{art.startsWith('grave-') ? '✦' : '≈'}</span>
      <p>{asset.alt}</p>
    </div> :
      // The 320x180 source is deliberately displayed with nearest-neighbor pixels.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={asset.src} alt={asset.alt} width={320} height={180} onError={() => setFailedSource(asset.src)} />}
    {caption && <figcaption>{caption}</figcaption>}
  </figure>
}
