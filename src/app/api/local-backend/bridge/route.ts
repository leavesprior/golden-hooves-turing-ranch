import { NextRequest, NextResponse } from 'next/server'
import { BRIDGE_QUESTIONS_OTHER_SERIES, checkBridgeAnswer, isBridgeSwallowReversal } from '@/app/oregon-trail/data/adamsEasterEggs'
import { issueLocalBridgeGrant, localBackendConfig, localBackendOrigin, LOCAL_BRIDGE_COOKIE, LOCAL_BRIDGE_TTL_MS } from '@/lib/localBackendAccess'

export const dynamic = 'force-dynamic'

function response(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Fixed in-game questions, not a password or an authentication factor. */
export async function POST(request: NextRequest) {
  const config = localBackendConfig(process.env)
  const origin = localBackendOrigin(request.url, request.headers.get('host'))
  if (!config.enabled || !origin) return response('Not Found', 404)
  if (request.headers.get('origin') !== origin || (request.headers.has('sec-fetch-site') && request.headers.get('sec-fetch-site') !== 'same-origin')) return response('Same-origin request required', 403)
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) return response('JSON required', 415)
  const maxBytes = 4096
  if (Number(request.headers.get('content-length')) > maxBytes) return response('Answers too large', 413)
  if (!request.body) return response('Answers required', 400)
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) { await reader.cancel(); return response('Answers too large', 413) }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes))
    const answers = body && typeof body === 'object' && !Array.isArray(body) ? (body as { answers?: unknown }).answers : null
    if (!Array.isArray(answers) || answers.length !== BRIDGE_QUESTIONS_OTHER_SERIES.length
      || !answers.every((answer, index) => typeof answer === 'string' && answer.length <= 512 && answer.trim().length > 0
        && (checkBridgeAnswer(BRIDGE_QUESTIONS_OTHER_SERIES[index], answer, 'Hitchhiker')
          || isBridgeSwallowReversal(BRIDGE_QUESTIONS_OTHER_SERIES[index], answer)))) return response('The Keeper has not granted passage', 403)
  } catch { return response('Invalid answers', 400) }
  const grant = await issueLocalBridgeGrant(origin, config)
  if (!grant) return response('Not Found', 404)
  const result = NextResponse.json({ expiresAt: grant.expiresAt, workerEnabled: config.workerEnabled, slidesEnabled: config.slidesEnabled }, { headers: { 'Cache-Control': 'no-store' } })
  result.cookies.set(LOCAL_BRIDGE_COOKIE, grant.token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: new URL(origin).protocol === 'https:',
    path: '/',
    maxAge: LOCAL_BRIDGE_TTL_MS / 1000,
  })
  return result
}
