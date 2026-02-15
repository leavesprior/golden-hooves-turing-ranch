import { encryptSave, decryptSave } from './cryptoSave'

export type SaveType = 'adventure_save' | 'rpg_session' | 'cross_game' | 'karma' | 'leaderboard'

const PASSPHRASE_CACHE_KEY = 'bobr_trail_passphrase'
const DEVICE_ID_KEY = 'bobr_device_id'

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
    // Encrypt the data
    const encrypted = await encryptSave(data, passphrase)

    // Prepare the payload
    const payload = {
      playerId,
      saveType,
      saveData: JSON.stringify(encrypted),
      saveVersion: '1.0',
      deviceId: deviceId || getDeviceId()
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
        error: errorData.error || `HTTP ${response.status}`
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
    const response = await fetch(
      `/api/saves?playerId=${encodeURIComponent(playerId)}&saveType=${encodeURIComponent(saveType)}`
    )

    if (!response.ok) {
      if (response.status === 404) {
        return { data: null }
      }
      return {
        data: null,
        error: `HTTP ${response.status}`
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
      return { exists: false }
    }

    const result = await response.json()

    return {
      exists: true,
      lastSaved: result.lastSaved,
      saveType: result.saveType
    }
  } catch (error) {
    return { exists: false }
  }
}
