import { NextRequest, NextResponse } from 'next/server'
import { getSaveMeta, readSave, writeSave, MAX_SAVE_BYTES, type SaveFailure } from '@/lib/cloudSaveStore'

/**
 * Cloud Save API — encrypted game state on the Railway /data volume.
 *
 * GET /api/saves?playerId=X&saveType=adventure_save&metadataOnly=true
 *   Existence + last-saved time. No proof needed; never returns save data.
 * GET /api/saves?playerId=X&saveType=adventure_save   (header X-Save-Proof)
 *   The owner's ciphertext.
 * POST /api/saves  { playerId, saveType, saveData, saveVersion?, deviceId?, proof }
 *   Creates (first write claims the player) or replaces a save.
 *
 * The browser encrypts before sending and derives the proof from the
 * passphrase (cryptoSave.ts, saveProof.ts). See cloudSaveStore.ts.
 * Replaced the Notion store 2026-09-26: it was not configured in production
 * (Notion key absent; it had been live around 2026-06) and let anyone holding a playerId overwrite that player's save.
 */

const STATUS: Record<SaveFailure, number> = {
  invalid: 400,
  forbidden: 403,
  not_found: 404,
  too_large: 413,
  throttled: 429,
}

const MESSAGE: Record<SaveFailure, string> = {
  invalid: 'Invalid request',
  forbidden: 'Wrong passphrase for this save',
  not_found: 'No save found',
  too_large: 'Save too large',
  throttled: 'Too many wrong passphrases. Wait a minute and try again.',
}

function failure(reason: SaveFailure) {
  return NextResponse.json({ error: MESSAGE[reason], reason }, { status: STATUS[reason] })
}

function storeDown(err: unknown) {
  console.error('Cloud save store error:', err)
  return NextResponse.json({ error: 'Cloud saves unavailable' }, { status: 503 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('playerId') ?? ''
  const saveType = searchParams.get('saveType') ?? undefined

  try {
    if (searchParams.get('metadataOnly') === 'true') {
      const meta = getSaveMeta(playerId, saveType)
      return meta ? NextResponse.json(meta) : NextResponse.json(null, { status: 404 })
    }
    const result = readSave(playerId, saveType ?? '', request.headers.get('x-save-proof') ?? '')
    if (!result.ok) return failure(result.reason)
    return NextResponse.json(
      { saveData: result.saveData, lastSaved: result.lastSaved, saveType: result.saveType },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    return storeDown(err)
  }
}

export async function POST(request: NextRequest) {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_SAVE_BYTES + 16 * 1024) return failure('too_large')

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return failure('invalid')
  }

  try {
    const result = writeSave({
      playerId: body.playerId as string,
      saveType: body.saveType as string,
      saveData: body.saveData as string,
      saveVersion: body.saveVersion as string | undefined,
      deviceId: body.deviceId as string | undefined,
      proof: body.proof as string,
    })
    if (!result.ok) return failure(result.reason)
    return NextResponse.json({ action: result.action })
  } catch (err) {
    return storeDown(err)
  }
}
