import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Phase 3.6: Treat any RFC1918 LAN host the same as localhost — never issue
 * HSTS or upgrade-insecure-requests for dev machines reached by IP over the
 * local network (e.g. 192.168.1.42:3000 from a phone testing the site). These
 * headers would force the browser to try HTTPS against a plain-HTTP dev
 * server and silently break access.
 *
 *   127.0.0.0/8    loopback
 *   10.0.0.0/8     private
 *   192.168.0.0/16 private
 *   172.16.0.0/12  private (16..31 in the second octet)
 */
const LAN_HOST_RE =
  /^(?:localhost|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?$/i

function isLanHost(host: string): boolean {
  return LAN_HOST_RE.test(host)
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const isLocalhost = isLanHost(host)

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
