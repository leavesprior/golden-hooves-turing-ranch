/**
 * L2 street sky. Trail weather is the base; the ridge and Volcano take fog.
 */
import type { Weather } from '@/app/oregon-trail/state/types'

/** Trail sky that ticks with Gold Country days. Fog is still a place overlay. */
export function trailWeatherForDay(day: number): Weather {
  const cycle = ((day % 5) + 5) % 5
  if (cycle === 0) return 'rain'
  if (cycle === 4) return 'storm'
  return 'fair'
}

export type StreetSky = 'fair' | 'rain' | 'fog' | 'storm'

export function streetSky(locationId: string, weather: Weather, day: number): StreetSky {
  if (weather === 'storm') return 'storm'
  if (weather === 'rain') return 'rain'
  if (weather === 'snow') return 'fog'
  const ridge = locationId === 'kennedy_mine' || locationId === 'volcano'
  if (ridge && day % 3 === 2) return 'fog'
  return 'fair'
}

const SKY_LABEL: Record<StreetSky, string> = {
  rain: 'Rain on the street. Paper curls. Riders stay in.',
  storm: 'Storm. The hole takes water. Meat will not keep.',
  fog: 'Fog on the ridge. The hole is a mouth in the white.',
  fair: 'Fair. The paper hangs dry.',
}

export function skyLabel(sky: StreetSky): string {
  return SKY_LABEL[sky]
}

/** Server-side allowlist — do not trust arbitrary client liveContext. */
export function isStreetSkyLabel(text: string): boolean {
  return (Object.values(SKY_LABEL) as string[]).includes(text)
}

export function skyWashesStreet(sky: StreetSky): boolean {
  return sky === 'rain' || sky === 'storm'
}
