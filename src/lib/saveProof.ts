/**
 * Cloud-save ownership proof, derived from the player's passphrase.
 *
 * The passphrase is the only secret a player carries to a new device, so the
 * right to read or overwrite a cloud save must come from it. The proof is a
 * PBKDF2 output with its own fixed, per-player salt — independent of the
 * AES key in cryptoSave.ts (which uses a random salt per save), so knowing the
 * proof reveals nothing about the encryption key. The server stores only a
 * hash of the proof; the passphrase never leaves the browser.
 */

export const MIN_PASSPHRASE_LENGTH = 8
const PROOF_ITERATIONS = 100_000

function toBase64Url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function deriveSaveProof(passphrase: string, playerId: string): Promise<string> {
  const enc = new TextEncoder()
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(`bobr-cloud-save-auth:v1:${playerId}`), iterations: PROOF_ITERATIONS, hash: 'SHA-256' },
    base,
    256,
  )
  return toBase64Url(new Uint8Array(bits))
}
