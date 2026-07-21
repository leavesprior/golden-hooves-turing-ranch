'use client'

/**
 * useVerifiedPresence — shared GPS presence-verification hook (Living Trail P1).
 *
 * Extracted from the inline GPS loop in GoldCountryExplore.tsx (GPS acquire +
 * haversine), with upgrades the original discards:
 *  - keeps `pos.coords.accuracy` (original threw it away)
 *  - per-call geofence radius in METERS (original hard-coded ~5 km)
 *  - dwell tracking: caller passes `dwellMs`; hook reports { inside, dwelledMs,
 *    verified } where verified = inside continuously >= dwellMs with
 *    accuracy <= 150 m
 *  - watchPosition with the same options object as the original
 *
 * Dev-only GPS mock for QA (GPS can't be real in a desktop browser):
 *   ?ltMock=lat,lng      — position override (accuracy pinned to 10 m)
 *   ?ltMockHour=0-23     — local-hour override for time-window gates
 * Both are honored ONLY when process.env.NODE_ENV === 'development'.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export interface GeofenceTarget {
  lat: number
  lng: number
  radiusM: number
}

export type GpsStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error' | 'mock'

export interface PresencePosition {
  lat: number
  lng: number
  accuracyM: number
}

export interface VerifiedPresenceResult {
  status: GpsStatus
  position: PresencePosition | null
  /** Distance to the target geofence center, meters (null until a fix exists). */
  distanceM: number | null
  /** Currently within the geofence radius (regardless of accuracy/dwell). */
  inside: boolean
  /** Milliseconds spent continuously inside with acceptable accuracy. */
  dwelledMs: number
  /** inside continuously >= dwellMs with accuracy <= ACCURACY_MAX_M. */
  verified: boolean
  retry: () => void
}

/** Max GPS accuracy (meters) that still counts toward verified presence. */
export const ACCURACY_MAX_M = 150

const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
const DWELL_TICK_MS = 500

/** Haversine distance in METERS (the GoldCountryExplore original returns km). */
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** Dev-only mocked GPS position from ?ltMock=lat,lng. Null in production or when absent/malformed. */
export function getDevMockPosition(): PresencePosition | null {
  if (process.env.NODE_ENV !== 'development') return null
  if (typeof window === 'undefined') return null
  try {
    const raw = new URLSearchParams(window.location.search).get('ltMock')
    if (!raw) return null
    const [latStr, lngStr] = raw.split(',')
    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng, accuracyM: 10 }
  } catch {
    return null
  }
}

/** Dev-only mocked local hour from ?ltMockHour=0-23. Null in production or when absent/malformed. */
export function getDevMockHour(): number | null {
  if (process.env.NODE_ENV !== 'development') return null
  if (typeof window === 'undefined') return null
  try {
    const raw = new URLSearchParams(window.location.search).get('ltMockHour')
    if (raw === null) return null
    const hour = parseInt(raw, 10)
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null
    return hour
  } catch {
    return null
  }
}

export function useVerifiedPresence(target: GeofenceTarget | null, dwellMs: number): VerifiedPresenceResult {
  const [status, setStatus] = useState<GpsStatus>('idle')
  const [position, setPosition] = useState<PresencePosition | null>(null)
  const [dwelledMs, setDwelledMs] = useState(0)
  const watchIdRef = useRef<number | null>(null)
  const insideSinceRef = useRef<number | null>(null)

  const requestGPS = useCallback(() => {
    // Dev mock takes precedence — QA can't produce a real fix at the marker
    const mock = getDevMockPosition()
    if (mock) {
      setPosition(mock)
      setStatus('mock')
      return
    }
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('error')
      return
    }
    setStatus('requesting')
    const success = (pos: GeolocationPosition) => {
      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyM: pos.coords.accuracy,
      })
      setStatus('granted')
    }
    const fail = () => setStatus('denied')
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
    watchIdRef.current = navigator.geolocation.watchPosition(success, fail, GEO_OPTIONS)
  }, [])

  // Acquire on mount; release the watch on unmount
  useEffect(() => {
    requestGPS()
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [requestGPS])

  const distanceM = position && target
    ? distanceMeters(position.lat, position.lng, target.lat, target.lng)
    : null
  const inside = distanceM !== null && target !== null && distanceM <= target.radiusM

  // Dwell clock: ticks while inside with acceptable accuracy; resets on exit,
  // accuracy loss, or target change (switching nodes restarts the dwell).
  const accuracyOk = position !== null && position.accuracyM <= ACCURACY_MAX_M
  const counting = inside && accuracyOk
  const targetKey = target ? `${target.lat},${target.lng},${target.radiusM}` : 'none'

  useEffect(() => {
    insideSinceRef.current = null
    setDwelledMs(0)
  }, [targetKey])

  useEffect(() => {
    if (!counting) {
      insideSinceRef.current = null
      setDwelledMs(0)
      return
    }
    if (insideSinceRef.current === null) insideSinceRef.current = Date.now()
    const tick = () => {
      if (insideSinceRef.current !== null) {
        setDwelledMs(Date.now() - insideSinceRef.current)
      }
    }
    tick()
    const interval = setInterval(tick, DWELL_TICK_MS)
    return () => clearInterval(interval)
  }, [counting, targetKey])

  const verified = counting && dwelledMs >= dwellMs

  return { status, position, distanceM, inside, dwelledMs, verified, retry: requestGPS }
}
