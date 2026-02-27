/**
 * Neoma Live Context — detects tunnel/VPN status for live mode.
 * Stub implementation for production builds (full version on live branches).
 */

interface TunnelStatus {
  mode: 'live' | 'standard' | 'dreaming'
  isVpn: boolean
  mbHealthy: boolean
  ollamaReachable: boolean
  cachedAt: number | null
}

export async function getTunnelStatus(): Promise<TunnelStatus> {
  return {
    mode: 'dreaming',
    isVpn: false,
    mbHealthy: false,
    ollamaReachable: false,
    cachedAt: null,
  }
}
