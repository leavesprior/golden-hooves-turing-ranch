import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  // LAN_CANARY=1 marks a plain-HTTP LAN canary (next start on the LAN): HSTS +
  // upgrade-insecure-requests would force subresources onto a nonexistent https
  // origin and blank the site. Never set in real production (HTTPS edge).
  const isLanCanary = process.env.LAN_CANARY === '1'
  const isLocalhost = isLanCanary || host.startsWith('localhost') || host.startsWith('127.0.0.1')

  // Timesheets (Micah/Danna worker hours = financial data) must NOT be readily
  // available. Gate /worker* and /api/worker* behind an explicit env flag — off by
  // default returns a bare 404 (does not even reveal the route exists). Whoever needs
  // it sets WORKER_TIMESHEETS_ENABLED=true in that environment. The CCA Trainer
  // (public/neoma/cca-trainer.html) is a separate area and is unaffected.
  const path = request.nextUrl.pathname
  const isTimesheetRoute = path === '/worker' || path.startsWith('/worker/') || path.startsWith('/api/worker')
  if (isTimesheetRoute && process.env.WORKER_TIMESHEETS_ENABLED !== 'true') {
    return new NextResponse('Not Found', { status: 404 })
  }

  // Note: HTTPS redirect is handled by Railway's edge proxy.
  // Doing it here breaks Railway's internal healthcheck (HTTP with x-forwarded-proto: http).

  // Canonical www → non-www redirect
  if (host.startsWith('www.')) {
    const canonicalHost = host.replace(/^www\./, '')
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${canonicalHost}`)
    return NextResponse.redirect(url, 301)
  }

  const response = NextResponse.next()

  // Security headers (applied via middleware since standalone mode
  // does not reliably serve next.config.ts headers())
  if (!isLocalhost) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self'; frame-ancestors 'none'; upgrade-insecure-requests")
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
