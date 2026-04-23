/**
 * /adventure/cipher-test — dev-only route for playtesting CipherAltar.
 *
 * Gated behind NODE_ENV === 'development'. In production builds the route
 * returns a 404 (via `notFound()`), so this never ships to players. It lets
 * designers test the altar UX — drag, snap, rotate, overlay reveal,
 * gold-bloom — without grinding through the Prologue.
 *
 * The page pre-populates the act5Gate store with all four artifacts and
 * forces the state machine to ALTAR_ACTIVE so the altar is immediately
 * interactive.
 */

import { notFound } from 'next/navigation'
import CipherTestClient from './CipherTestClient'

// In production: return 404 at build time (prerender) so the route simply
// doesn't exist. In dev: render the client component normally.
export default function CipherTestPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  return <CipherTestClient />
}
