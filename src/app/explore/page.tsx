import { cookies } from 'next/headers'
import ExploreQrLock from '@/components/explore/ExploreQrLock'
import ExploreClient from './ExploreClient'
import {
  EXPLORE_QR_STORAGE,
  EXPLORE_QR_TOKEN,
  tokenFromSearch,
} from '@/lib/exploreQrGate'

function first(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] || ''
  return v || ''
}

/**
 * Server gate: URL token or the porch cookie. Client sessionStorage still
 * covers same-tab return. Public /explore without a key SSRs the lock,
 * so curl, Google, and a phone with no JS all see the same door.
 */
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const search = `?qr=${encodeURIComponent(first(sp.qr))}&gate=${encodeURIComponent(first(sp.gate))}`
  const jar = await cookies()
  const initialOpen =
    tokenFromSearch(search) === EXPLORE_QR_TOKEN ||
    jar.get(EXPLORE_QR_STORAGE)?.value === EXPLORE_QR_TOKEN

  return (
    <ExploreQrLock initialOpen={initialOpen}>
      <ExploreClient />
    </ExploreQrLock>
  )
}
