'use client'

import { useState, type ReactNode } from 'react'
import { placeSceneFor, placeSceneMapLink, type PlaceSceneEra } from '@/lib/placeSceneAssets'
import styles from './PlaceScene.module.css'

/** A view of the same place across eras. Only its caller's local UI state changes;
 * this component has no gameplay, rewards, location, or persistence writers. */
export function PlaceScene({ placeId, era, onEraChange, children }: {
  placeId: string
  era: PlaceSceneEra
  onEraChange: (era: PlaceSceneEra) => void
  children: ReactNode
}) {
  const scene = placeSceneFor(placeId)
  const [painting, setPainting] = useState(false)
  const [failedImage, setFailedImage] = useState<string | null>(null)
  if (!scene) return <div className="relative min-h-0 flex-1">{children}</div>
  const modern = scene.modern
  const imageSrc = modern.kind === 'property_photo' ? painting ? modern.painting : modern.src : null
  const imageAlt = modern.kind === 'property_photo' ? painting ? 'The existing painted view of the modern ranch house.' : modern.alt : ''

  return <section className={styles.scene} data-testid="place-scene" data-place={scene.town.id} data-era={era}
    data-lat={scene.town.lat} data-lng={scene.town.lng}>
    <div className={styles.toolbar}>
      <div className={styles.tabs} role="group" aria-label={scene.town.name + ' view'}>
        <button type="button" aria-pressed={era === '1849'} onClick={() => onEraChange('1849')} data-testid="place-scene-1849">1849</button>
        <button type="button" aria-pressed={era === 'today'} onClick={() => onEraChange('today')} data-testid="place-scene-today">Today</button>
      </div>
      {era === 'today' && <a href={placeSceneMapLink(scene.town)} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>Open in Google Maps</a>}
    </div>

    <div className={styles.viewport}>
      <div className={`${styles.historical} ${scene.historical.pixelated ? styles.pixelArt : ''}`} hidden={era !== '1849'} data-testid="place-scene-historical">
        {children}
      </div>
      {era === 'today' && (modern.kind === 'maps_embed'
        ? <iframe className={styles.map} src={modern.src} title={scene.town.name + ' today — Google Maps'}
          loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" data-testid="place-scene-map" />
        : <figure className={styles.photo}>
          {imageSrc === failedImage ? <div role="img" aria-label={imageAlt} className={styles.fallback} data-testid="place-scene-fallback">
            <p>The property picture could not load.</p>
            <p>{imageAlt}</p>
          </div> :
            // Reuse the published property file without claiming a new photo date.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc!} alt={imageAlt}
              onError={() => setFailedImage(imageSrc)} data-testid="place-scene-photo" />}
          <figcaption><button type="button" onClick={() => setPainting(value => !value)} data-testid="place-scene-painting">
            {painting ? 'Show property photo' : 'Show ranch painting'}
          </button></figcaption>
        </figure>)}
    </div>
    <div className={styles.caption}>
      <p>{era === 'today' ? modern.kind === 'property_photo' && painting ? 'Today · Ranch painting' : modern.label : scene.historical.label}</p>
      <p>{scene.historical.notes}</p>
    </div>
  </section>
}
