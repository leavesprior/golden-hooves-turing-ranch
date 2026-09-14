import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { allowLocalBackendRequest, localBackendConfig, localBackendRoute, LOCAL_BRIDGE_COOKIE } from './lib/localBackendAccess'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  // LAN_CANARY=1 marks a plain-HTTP LAN canary (next start on the LAN): HSTS +
  // upgrade-insecure-requests would force subresources onto a nonexistent https
  // origin and blank the site. Never set in real production (HTTPS edge).
  const isLanCanary = process.env.LAN_CANARY === '1'
  const isLocalhost = isLanCanary || host.startsWith('localhost') || host.startsWith('127.0.0.1')

  const path = request.nextUrl.pathname
  // The explicit encoded-path matcher below also observes encoded image names.
  // Preserve the original asset bypass for those that are not backend aliases.
  if (path.includes('%') && /\.(?:svg|png|jpg|jpeg|gif|webp)$/.test(path) && !localBackendRoute(path)) return NextResponse.next()
  // Backend tools stay off public hosts even if flags are accidentally enabled.
  // Exact loopback + configured flags + a short-lived signed Bridge grant for
  // worker/slides. This is local progression, not user authentication or LAN access.
  if (!await allowLocalBackendRequest({ path, url: request.url, host,
    method: request.method, requestOrigin: request.headers.get('origin'),
    cookie: request.cookies.get(LOCAL_BRIDGE_COOKIE)?.value, config: localBackendConfig(process.env) })) {
    return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  // Direct-booking preview (wrong-county TOT lived here). Off in production
  // unless DIRECT_BOOKING_PREVIEW=true. Localhost stays open for dry-runs.
  const isDirectBookingPreview =
    path === '/rentals/availability' ||
    path.startsWith('/rentals/availability/') ||
    path === '/api/bookings/inquiry' ||
    path === '/api/bookings/confirm-deposit'
  if (
    isDirectBookingPreview &&
    !isLocalhost &&
    process.env.DIRECT_BOOKING_PREVIEW !== 'true'
  ) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // /api/neoma/chat deliberately remains available: ordinary trail witnesses
  // and NpcChat use it. Unrelated Neoma/trainer assets are also unaffected.

  // Note: HTTPS redirect is handled by Railway's edge proxy.
  // Doing it here breaks Railway's internal healthcheck (HTTP with x-forwarded-proto: http).

  // Canonical www → non-www redirect
  if (host.startsWith('www.')) {
    const canonicalHost = host.replace(/^www\./, '')
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${canonicalHost}`)
    return NextResponse.redirect(url, 301)
  }

  const response = NextResponse.next()
  if (localBackendRoute(path)) {
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  // Security headers (applied via middleware since standalone mode
  // does not reliably serve next.config.ts headers())
  if (!isLocalhost) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self'; frame-src https://www.google.com/maps/embed; frame-ancestors 'none'; upgrade-insecure-requests")
  }

  return response
}

export const config = {
  matcher: [
    '/dm-table/:path*',
    '/worker/:path*',
    '/api/worker/:path*',
    '/api/local-backend/:path*',
    '/neoma/neoma-slides.pdf',
    // Encoded protected aliases must not escape via the normal asset exclusions.
    '/((?!_next/static|_next/image).*%.*)',
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
