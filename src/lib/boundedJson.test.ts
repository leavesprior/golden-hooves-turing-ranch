/**
 * readBoundedJson never buffers more than maxBytes, whatever Content-Length says.
 *   npx tsx src/lib/boundedJson.test.ts
 */
import { readBoundedJson } from './boundedJson'

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })

function streamOf(totalBytes: number, chunk = 64 * 1024): { stream: ReadableStream<Uint8Array>; pulled: () => number } {
  let sent = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(ctrl) {
      if (sent >= totalBytes) return ctrl.close()
      const n = Math.min(chunk, totalBytes - sent)
      sent += n
      ctrl.enqueue(new Uint8Array(n).fill(0x20))
    },
  })
  return { stream, pulled: () => sent }
}

const req = (body: BodyInit | null, headers: Record<string, string> = {}) =>
  new Request('http://x/api', { method: 'POST', body, headers, duplex: 'half' } as RequestInit)

async function main() {
  const ok = await readBoundedJson(req(JSON.stringify({ a: 1 }), { 'content-type': 'application/json' }), 1024)
  check('small JSON parses', ok.ok && (ok.value as { a: number }).a === 1, ok)

  const declaredBig = await readBoundedJson(req('{}', { 'content-length': '99999999' }), 1024)
  check('declared oversize is refused before reading', !declaredBig.ok && declaredBig.reason === 'too_large', declaredBig)

  const s = streamOf(50 * 1024 * 1024)
  const chunked = await readBoundedJson(req(s.stream), 512 * 1024)
  check('undeclared (chunked) oversize is refused', !chunked.ok && chunked.reason === 'too_large', chunked)
  check('it stopped reading near the cap, not at 50MB', s.pulled() < 2 * 1024 * 1024, s.pulled())

  const bad = await readBoundedJson(req('{not json'), 1024)
  check('malformed JSON is invalid', !bad.ok && bad.reason === 'invalid', bad)
  const nobody = await readBoundedJson(req(null), 1024)
  check('no body is invalid', !nobody.ok && nobody.reason === 'invalid', nobody)
  const nan = await readBoundedJson(req('{}', { 'content-length': 'abc' }), 1024)
  check('non-numeric content-length is invalid', !nan.ok && nan.reason === 'invalid', nan)
}

main().then(() => {
  const failed = results.filter((r) => !r.pass)
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + String(JSON.stringify(r.detail)).slice(0, 300)}`)
  console.log(`boundedJson: ${results.length - failed.length}/${results.length}`)
  process.exit(failed.length ? 1 : 0)
}).catch((e) => { console.error(e); process.exit(1) })
