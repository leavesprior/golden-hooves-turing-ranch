import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdir, writeFile } from 'node:fs/promises'

// Raw HTTP paths deliberately avoid fetch/URL dot-segment normalization.
// node --import tsx tools/localBackendPaths.http.ts [base] [label] [baseline]
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:3369')
assert.equal(base.protocol, 'http:', 'disposable loopback HTTP preview only')
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname))
const label = process.argv[3] ?? 'production'
const baseline = process.argv[4] === 'baseline'
if (baseline && !label.startsWith('baseline-')) throw new Error('Baseline capture must be explicitly labeled baseline-')
const output = `artifacts/local-menu-backend/paths-${label}`
const paths = [
  '/neoma/neoma-slides.pdf', '/neoma/%6eeoma-slides.pdf', '/%6eeoma/neoma-slides.pdf',
  '/neoma%2fneoma-slides.pdf', '/%6Eeoma%2F%6Eeoma-slides.%70df', '/neoma/neoma-slides.%70%64%66',
  '/neoma/%256eeoma-slides.pdf', '/%256eeoma/neoma-slides.pdf', '/neoma%252fneoma-slides.pdf',
  '/%25256eeoma/neoma-slides.pdf', '/neoma/../neoma/neoma-slides.pdf',
  '/neoma/fake/%2e%2e/neoma-slides.pdf', '/neoma/fake/..%2fneoma-slides.pdf',
  '/neoma/fake%2f..%2fneoma-slides.pdf', '/neoma//neoma-slides.pdf', '/neoma/neoma-slides.pdf/',
  '/neoma/neoma-slides.pdf%2f..%2fneoma-slides.pdf', '/neoma/neoma-slides.pdf%00.png',
  '/worker', '/%77orker', '/worker/%64anna', '/%77orker%2fdanna', '/worker%2fdanna', '/worker/danna/',
  '/api/%77orker/entries', '/api/worker%2fentries', '/api/%2577orker/entries',
  '/api/%77orker/entries/1.png', '/%77orker%2fdanna.png',
  '/_next/image?url=%2Fneoma%2Fneoma-slides.pdf&w=640&q=75',
] as const

type Response = { path: string; status: number; type: string | null; location: string | null }
function get(path: string, host: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: base.hostname, port: base.port, path, method: 'GET', headers: { host } }, response => {
      // Discard bodies. In particular, never write PDF or payroll contents.
      response.resume()
      response.on('end', () => resolve({ path, status: response.statusCode ?? 0, type: typeof response.headers['content-type'] === 'string' ? response.headers['content-type'] : null, location: typeof response.headers.location === 'string' ? response.headers.location : null }))
      response.on('error', reject)
    })
    request.setTimeout(30000, () => request.destroy(new Error(`Timed out: ${path}`)))
    request.on('error', reject)
    request.end()
  })
}

async function main() {
  await mkdir(output, { recursive: true })
  const results = []
  for (const host of [base.host, 'backofbeyondranch.farm', 'localhost.evil']) for (const path of paths) {
    const chain = [await get(path, host)]
    for (let redirects = 0; redirects < 4 && chain.at(-1)!.location; redirects++) {
      const target = chain.at(-1)!.location!
      const resolved = new URL(target, base)
      assert.ok(resolved.origin === base.origin || resolved.hostname === host, 'redirect stays on the tested request host')
      chain.push(await get(resolved.pathname + resolved.search, host))
    }
    const final = chain.at(-1)!
    results.push({ host, path, chain, blocked: [400, 404].includes(final.status) && final.type !== 'application/pdf' })
  }
  const assets = []
  for (const path of ['/place-art/editorial/west_point.jpg', '/place-art/editorial/%77est_point.jpg', '/place-art/editorial/west_point.%6apg']) {
    const result = await get(path, base.host)
    assert.equal(result.status, 200, 'ordinary owned image remains available')
    assert.match(result.type ?? '', /^image\//)
    assets.push(result)
  }
  const bypasses = results.filter(result => !result.blocked)
  await writeFile(`${output}/results.json`, JSON.stringify({ status: baseline ? 'baseline_capture' : bypasses.length ? 'failed' : 'passed', base: base.origin, label, baseline, cases: results.length, bypasses, assets, results }, null, 2))
  console.log(JSON.stringify({ status: baseline ? 'baseline_capture' : bypasses.length ? 'failed' : 'passed', cases: results.length, bypasses: bypasses.length, ordinaryAssets: assets.length, output }))
  if (!baseline) assert.deepEqual(bypasses, [], 'no encoded or alternate unsigned backend URL serves protected content')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
