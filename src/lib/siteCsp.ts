/** Content-Security-Policy for public (non-loopback) responses, set by middleware. */
export const SITE_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self'; frame-src https://www.google.com/maps/embed; frame-ancestors 'none'; upgrade-insecure-requests"

/**
 * Out of Time (XR) at /xr: the IWSDK bundle compiles WebAssembly that it embeds
 * as a data: URL. 'wasm-unsafe-eval' permits WebAssembly compilation only (not
 * eval/new Function); data: in connect-src lets it fetch that embedded module.
 */
export const XR_CSP = SITE_CSP
  .replace("script-src 'self' 'unsafe-inline'", "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'")
  .replace("connect-src 'self'", "connect-src 'self' data:")

export function isXrPath(path: string): boolean {
  return path === '/xr' || path.startsWith('/xr/')
}

export function contentSecurityPolicyFor(path: string): string {
  return isXrPath(path) ? XR_CSP : SITE_CSP
}
