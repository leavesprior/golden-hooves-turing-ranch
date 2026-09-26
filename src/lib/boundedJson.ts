/**
 * Read a JSON request body without ever holding more than `maxBytes`.
 * `request.json()` buffers the whole body first, so a missing, lying or
 * chunked Content-Length let one request exhaust the single Railway instance
 * before any size check ran (council 20260926_141619_secure-save).
 */
export type BoundedJson<T> = { ok: true; value: T } | { ok: false; reason: 'too_large' | 'invalid' }

export async function readBoundedJson<T = unknown>(request: Request, maxBytes: number): Promise<BoundedJson<T>> {
  const declared = request.headers.get('content-length')
  if (declared !== null) {
    const n = Number(declared)
    if (!Number.isFinite(n) || n < 0) return { ok: false, reason: 'invalid' }
    if (n > maxBytes) return { ok: false, reason: 'too_large' }
  }
  if (!request.body) return { ok: false, reason: 'invalid' }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => {})
      return { ok: false, reason: 'too_large' }
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    bytes.set(c, offset)
    offset += c.byteLength
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as T }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}
