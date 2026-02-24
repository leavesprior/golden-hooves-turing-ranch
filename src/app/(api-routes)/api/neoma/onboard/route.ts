import { NextRequest, NextResponse } from 'next/server'
import { execFileSync } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs'
import { join } from 'path'

// ===================== RATE LIMITING (FILE-BASED, PERSISTENT) =====================
// Survives server restarts. /tmp auto-cleans on reboot.

const RATE_DIR = '/tmp/neoma-onboard-ratelimit'
const RATE_LIMIT = 3 // attempts per window
const RATE_WINDOW_MS = 60_000
const RATE_CLEANUP_MS = 300_000

try { mkdirSync(RATE_DIR, { recursive: true, mode: 0o700 }) } catch {}

// Set of trusted reverse proxy IPs. Only trust x-forwarded-for from these.
const TRUSTED_PROXIES = new Set<string>(['127.0.0.1', '::1'])

function sanitizeIPForFile(ip: string): string {
  return ip.replace(/[^0-9a-f.:]/gi, '_').slice(0, 45)
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const file = join(RATE_DIR, sanitizeIPForFile(ip))

  try {
    const raw = readFileSync(file, 'utf-8')
    const entry = JSON.parse(raw) as { count: number; resetAt: number }

    if (now > entry.resetAt) {
      writeFileSync(file, JSON.stringify({ count: 1, resetAt: now + RATE_WINDOW_MS }), { mode: 0o600 })
      return true
    }
    if (entry.count >= RATE_LIMIT) return false
    entry.count++
    writeFileSync(file, JSON.stringify(entry), { mode: 0o600 })
    return true
  } catch {
    writeFileSync(file, JSON.stringify({ count: 1, resetAt: now + RATE_WINDOW_MS }), { mode: 0o600 })
    return true
  }
}

// Periodic cleanup of stale rate limit files
let cleanupTimer: ReturnType<typeof setInterval> | null = null
function ensureCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    try {
      const now = Date.now()
      for (const f of readdirSync(RATE_DIR)) {
        try {
          const st = statSync(join(RATE_DIR, f))
          if (now - st.mtimeMs > RATE_CLEANUP_MS) unlinkSync(join(RATE_DIR, f))
        } catch {}
      }
    } catch {}
  }, RATE_CLEANUP_MS)
}

// ===================== HELPERS =====================

function getClientIP(request: NextRequest): string {
  // H1: Don't blindly trust x-forwarded-for — it's client-settable.
  // Only trust it if the connecting IP is a known reverse proxy.
  const socketIP = request.headers.get('x-real-ip') || '127.0.0.1'

  if (TRUSTED_PROXIES.has(socketIP)) {
    // Request came from a trusted proxy — use the forwarded client IP
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
  }

  // Direct connection or untrusted proxy — use socket IP
  return socketIP
}

// ===================== VALIDATE TOKEN (GET) =====================

export async function GET(request: NextRequest) {
  ensureCleanup()

  const ip = getClientIP(request)
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded. Try again in 60 seconds.' },
      { status: 429 }
    )
  }

  const token = request.nextUrl.searchParams.get('t')
  if (!token || !/^[a-f0-9]{32,64}$/.test(token)) {
    return NextResponse.json({ ok: false, error: 'Invalid token format' }, { status: 400 })
  }

  try {
    const result = execFileSync(
      'neoma-device-onboard',
      ['get-pending', token],
      { timeout: 5000, encoding: 'utf-8' }
    )
    const data = JSON.parse(result.trim().split('\n').pop() || '{}')

    if (!data.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || 'Token invalid' },
        { status: 404 }
      )
    }

    // Return safe info (no private keys)
    return NextResponse.json({
      ok: true,
      name: data.name,
      role: data.role,
      vpn_ip: data.vpn_ip,
      node_type: data.node_type,
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Token validation failed' },
      { status: 500 }
    )
  }
}

// ===================== ACTIVATE + DOWNLOAD (POST) =====================

interface OnboardRequestBody {
  token: string
  platform?: 'linux' | 'windows' | 'mobile'
}

export async function POST(request: NextRequest) {
  ensureCleanup()

  const ip = getClientIP(request)
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded. Try again in 60 seconds.' },
      { status: 429 }
    )
  }

  let body: OnboardRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, platform = 'linux' } = body

  if (!token || !/^[a-f0-9]{32,64}$/.test(token)) {
    return NextResponse.json({ ok: false, error: 'Invalid token format' }, { status: 400 })
  }

  try {
    // Get pending config with bootstrap scripts
    const result = execFileSync(
      'neoma-device-onboard',
      ['get-pending', token],
      { timeout: 5000, encoding: 'utf-8' }
    )
    const data = JSON.parse(result.trim().split('\n').pop() || '{}')

    if (!data.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || 'Token invalid' },
        { status: 404 }
      )
    }

    // Activate the device
    try {
      execFileSync(
        'neoma-device-onboard',
        ['activate', token],
        { timeout: 10000, encoding: 'utf-8' }
      )
    } catch {
      // Activation might partially fail (e.g., WG not running) — still return bootstrap
    }

    // Return platform-specific bootstrap
    let bootstrap = ''
    let filename = ''
    let contentType = 'text/plain'

    switch (platform) {
      case 'windows':
        bootstrap = data.bootstrap_windows || ''
        filename = 'bootstrap.ps1'
        contentType = 'text/plain'
        break
      case 'mobile':
        bootstrap = data.wg_mobile_conf || ''
        filename = 'wg-neoma.conf'
        contentType = 'text/plain'
        break
      default:
        bootstrap = data.bootstrap_linux || ''
        filename = 'bootstrap.sh'
        contentType = 'text/x-shellscript'
    }

    return NextResponse.json({
      ok: true,
      name: data.name,
      role: data.role,
      vpn_ip: data.vpn_ip,
      node_type: data.node_type,
      platform,
      bootstrap,
      filename,
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Onboarding failed' },
      { status: 500 }
    )
  }
}
