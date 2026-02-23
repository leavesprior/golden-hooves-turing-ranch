import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

// ===================== RATE LIMITING =====================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 3 // attempts per minute
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT) {
    return false
  }

  entry.count++
  return true
}

// Periodic cleanup
let cleanupTimer: ReturnType<typeof setInterval> | null = null
function ensureCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of rateLimitStore) {
      if (now > entry.resetAt + 300_000) {
        rateLimitStore.delete(ip)
      }
    }
  }, 300_000)
}

// ===================== HELPERS =====================

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
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
  if (!token || !/^[a-f0-9]{32}$/.test(token)) {
    return NextResponse.json({ ok: false, error: 'Invalid token format' }, { status: 400 })
  }

  try {
    const result = execSync(
      `neoma-device-onboard get-pending "${token.replace(/[^a-f0-9]/g, '')}"`,
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

  if (!token || !/^[a-f0-9]{32}$/.test(token)) {
    return NextResponse.json({ ok: false, error: 'Invalid token format' }, { status: 400 })
  }

  const safeToken = token.replace(/[^a-f0-9]/g, '')

  try {
    // Get pending config with bootstrap scripts
    const result = execSync(
      `neoma-device-onboard get-pending "${safeToken}"`,
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
      execSync(
        `neoma-device-onboard activate "${safeToken}"`,
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
