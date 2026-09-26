import { encryptSave, decryptSave } from './cryptoSave'
import { deriveSaveProof } from './saveProof'
import { generateTrailId, normalizeTrailId } from './trailId'

export type SaveType = 'adventure_save' | 'rpg_session' | 'cross_game' | 'karma' | 'leaderboard'

const PASSPHRASE_CACHE_KEY = 'bobr_trail_passphrase'
const DEVICE_ID_KEY = 'bobr_device_id'
const CLOUD_SLOT_KEY = 'bobr_cloud_slot_id'

interface SaveToCloudResult {
  action: 'saved' | 'created' | 'error'
  error?: string
}

interface LoadFromCloudResult {
  data: object | null
  error?: string
}

interface HasCloudSaveResult {
  exists: boolean
  /** Set when the check itself failed (store down, throttled): unknown, not "no save". */
  error?: string
  lastSaved?: string
  saveType?: string
}

/**
 * Generate or retrieve a device fingerprint for conflict detection
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'

  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

/**
 * This browser's Trail ID — the private name of its cloud save slot
 * (trailId.ts). Deliberately NOT the public Hall of Fame playerId: a public
 * id could be claimed by someone else before the player's first save.
 * Slots made before Trail IDs (slot_<uuid>) keep working as they are.
 */
export function getCloudSlotId(): string {
  if (typeof window === 'undefined') return 'server'
  let slot = localStorage.getItem(CLOUD_SLOT_KEY)
  if (!slot || !normalizeTrailId(slot)) {
    slot = generateTrailId()
    localStorage.setItem(CLOUD_SLOT_KEY, slot)
  }
  return slot
}

/**
 * Make a Trail ID this browser's slot — called only after a load with it
 * succeeded, so later saves go back to the same slot on the new device.
 */
export function adoptCloudSlotId(trailId: string): void {
  if (typeof window === 'undefined') return
  const id = normalizeTrailId(trailId)
  if (!id) return
  const before = localStorage.getItem(CLOUD_SLOT_KEY)
  // Keep the trail this device followed before, so it is never simply forgotten.
  if (before && before !== id) localStorage.setItem(`${CLOUD_SLOT_KEY}_previous`, before)
  localStorage.setItem(CLOUD_SLOT_KEY, id)
}

/**
 * Cache passphrase in sessionStorage (cleared on tab close)
 */
export function cachePassphrase(passphrase: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PASSPHRASE_CACHE_KEY, passphrase)
}

/**
 * Retrieve cached passphrase from sessionStorage
 */
export function getCachedPassphrase(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(PASSPHRASE_CACHE_KEY)
}

/**
 * Clear cached passphrase from sessionStorage
 */
export function clearCachedPassphrase(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PASSPHRASE_CACHE_KEY)
}

/**
 * Save encrypted game state to cloud
 */
export async function saveToCloud(
  playerId: string,
  saveType: SaveType,
  data: object,
  passphrase: string,
  deviceId?: string
): Promise<SaveToCloudResult> {
  try {
    // Encrypt the data; the proof (from the same passphrase) claims/unlocks the slot
    const [encrypted, proof] = await Promise.all([encryptSave(data, passphrase), deriveSaveProof(passphrase, playerId)])

    // Prepare the payload
    const payload = {
      playerId,
      saveType,
      saveData: JSON.stringify(encrypted),
      saveVersion: '1.0',
      deviceId: deviceId || getDeviceId(),
      proof,
    }

    // POST to API
    const response = await fetch('/api/saves', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return {
        action: 'error',
        error: response.status === 403 ? 'Wrong passphrase' : errorData.error || `HTTP ${response.status}`
      }
    }

    const result = await response.json()
    return {
      action: result.action || 'saved'
    }
  } catch (error) {
    return {
      action: 'error',
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Load and decrypt game state from cloud
 */
export async function loadFromCloud(
  playerId: string,
  saveType: SaveType,
  passphrase: string
): Promise<LoadFromCloudResult> {
  try {
    // GET from API
    const proof = await deriveSaveProof(passphrase, playerId)
    const response = await fetch(
      `/api/saves?playerId=${encodeURIComponent(playerId)}&saveType=${encodeURIComponent(saveType)}`,
      { headers: { 'X-Save-Proof': proof }, cache: 'no-store' }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return { data: null }
      }
      if (response.status === 403) {
        return { data: null, error: 'Wrong passphrase' }
      }
      if (response.status === 429) {
        return { data: null, error: 'Too many wrong passphrases. Wait a minute and try again.' }
      }
      const errorData = await response.json().catch(() => ({}))
      return {
        data: null,
        error: errorData.error || `HTTP ${response.status}`
      }
    }

    const result = await response.json()

    if (!result.saveData) {
      return { data: null }
    }

    // Parse the encrypted data
    const encrypted = JSON.parse(result.saveData)

    // Decrypt
    const decrypted = await decryptSave(encrypted, passphrase)

    if (!decrypted) {
      return {
        data: null,
        error: 'Wrong passphrase'
      }
    }

    return { data: decrypted }
  } catch (error) {
    if (error instanceof Error && error.message.includes('decrypt')) {
      return {
        data: null,
        error: 'Wrong passphrase'
      }
    }
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Check if a cloud save exists (no passphrase needed — just checks metadata)
 */
export async function hasCloudSave(
  playerId: string,
  saveType?: SaveType
): Promise<HasCloudSaveResult> {
  try {
    const params = new URLSearchParams({
      playerId,
      metadataOnly: 'true'
    })

    if (saveType) {
      params.append('saveType', saveType)
    }

    const response = await fetch(`/api/saves?${params.toString()}`)

    if (!response.ok) {
      if (response.status === 404) {
        return { exists: false }
      }
      return { exists: false, error: `HTTP ${response.status}` }
    }

    const result = await response.json()

    return {
      exists: true,
      lastSaved: result.lastSaved,
      saveType: result.saveType
    }
  } catch {
    // The check itself failed: unknown, not "no save" (keeps Load reachable).
    return { exists: false, error: 'Network error' }
  }
}
