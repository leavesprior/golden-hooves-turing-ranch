import assert from 'node:assert/strict'
import { contentSecurityPolicyFor, SITE_CSP, XR_CSP } from './siteCsp'

// The site policy is byte-for-byte what middleware set before /xr existed.
assert.equal(SITE_CSP, "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self'; frame-src https://www.google.com/maps/embed; frame-ancestors 'none'; upgrade-insecure-requests")

// XR widens exactly two directives, and never to full 'unsafe-eval'.
assert.match(XR_CSP, /script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';/)
assert.match(XR_CSP, /connect-src 'self' data:;/)
assert.doesNotMatch(XR_CSP, /'unsafe-eval'/)
assert.equal(XR_CSP, "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' data:; media-src 'self'; frame-src https://www.google.com/maps/embed; frame-ancestors 'none'; upgrade-insecure-requests")

for (const path of ['/xr', '/xr/', '/xr/index.html', '/xr/assets/index.js']) assert.equal(contentSecurityPolicyFor(path), XR_CSP, path)
for (const path of ['/', '/xrays', '/xr-promo', '/oregon-trail', '/dm-table', '/api/xr', '/x']) assert.equal(contentSecurityPolicyFor(path), SITE_CSP, path)

console.log('siteCsp: ok')
