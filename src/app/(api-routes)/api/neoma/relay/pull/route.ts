import { NextRequest, NextResponse } from 'next/server'
import { pullJobs, relaySecret, verifyRelay } from '@/lib/neomaRelay'

// Neoma's worker pulls chat jobs here (outbound from Main/Tower, signed with the
// relay secret). Unsigned or unconfigured requests get a bare 404.
const NOT_FOUND = () => new NextResponse('Not Found', { status: 404 })
const LONG_POLL_MS = 20_000

export async function POST(request: NextRequest) {
  if (!relaySecret()) return NOT_FOUND()
  const body = await request.text()
  if (!verifyRelay(request.headers.get('x-relay-ts'), request.headers.get('x-relay-sig'), body)) return NOT_FOUND()
  const jobs = await pullJobs(LONG_POLL_MS)
  return NextResponse.json({ jobs }, { headers: { 'Cache-Control': 'no-store' } })
}
