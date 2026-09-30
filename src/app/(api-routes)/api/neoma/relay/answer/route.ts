import { NextRequest, NextResponse } from 'next/server'
import { answerJob, relaySecret, verifyRelay } from '@/lib/neomaRelay'

// Neoma's worker posts {id, text} here, signed with the relay secret.
const NOT_FOUND = () => new NextResponse('Not Found', { status: 404 })

export async function POST(request: NextRequest) {
  if (!relaySecret()) return NOT_FOUND()
  const body = await request.text()
  if (!verifyRelay(request.headers.get('x-relay-ts'), request.headers.get('x-relay-sig'), body)) return NOT_FOUND()
  let parsed: { id?: unknown; text?: unknown }
  try { parsed = JSON.parse(body) } catch { return NextResponse.json({ ok: false }, { status: 400 }) }
  if (typeof parsed.id !== 'string' || typeof parsed.text !== 'string' || !parsed.text.trim()) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  return NextResponse.json({ ok: answerJob(parsed.id, parsed.text.trim()) }, { headers: { 'Cache-Control': 'no-store' } })
}
