import { NextResponse } from 'next/server'
import { getTunnelStatus } from '../data/liveNeomaContext'

/**
 * Neoma Health Check — tunnel and service status.
 * Used by monitoring (guardian, wheelwright) and frontend mode detection.
 *
 * GET /api/neoma/health
 */
export async function GET() {
  try {
    const status = await getTunnelStatus()

    return NextResponse.json({
      ok: true,
      status: status.mode === 'live' ? 'awake' : status.mode === 'standard' ? 'partial' : 'dreaming',
      mode: status.mode,
      tunnel: {
        vpn: status.isVpn,
        memoryBridge: status.mbHealthy,
        ollama: status.ollamaReachable,
      },
      cached: status.cachedAt ? new Date(status.cachedAt).toISOString() : null,
      ts: Date.now(),
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error', ts: Date.now() },
      { status: 500 }
    )
  }
}
