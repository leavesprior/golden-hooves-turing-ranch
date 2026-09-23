import assert from 'node:assert/strict'
import { shouldShowInstallBanner } from './RegisterSW'

// Playtest 2026-09-23: the fixed install chip covered the trail title Play
// button and the Pioneer save chip on every trail screen.
assert.equal(shouldShowInstallBanner('/oregon-trail', false), false, 'never over the trail title / HUD')
assert.equal(shouldShowInstallBanner('/oregon-trail/anything', false), false)
assert.equal(shouldShowInstallBanner('/', false), true, 'still offered on the site pages')
assert.equal(shouldShowInstallBanner('/oregon-trailhead', false), true, 'prefix match is by path segment')
assert.equal(shouldShowInstallBanner('/', true), false, 'a dismissal is honored')
console.log('RegisterSW install banner: ok')
