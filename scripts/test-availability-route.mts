/**
 * End-to-end test of the /api/availability route handlers against a REAL iCal
 * feed (served locally). Proves auth, the read-only import, and the merged
 * availability view — without needing a full dev server (Next holds a per-dir
 * .next lock, so a 2nd dev instance can't run alongside one already up).
 *
 * Prereq: a feed served at $AIRBNB_ICAL_URL (default http://localhost:8799/test.ics).
 * Run: DIRECT_BOOKING_ADMIN_TOKEN=testtoken123 \
 *      AIRBNB_ICAL_URL=http://localhost:8799/test.ics \
 *      npx tsx scripts/test-availability-route.mts
 */
process.env.DIRECT_BOOKING_ADMIN_TOKEN ||= 'testtoken123'
process.env.AIRBNB_ICAL_URL ||= 'http://localhost:8799/test.ics'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ok  - ${name}`)
  else { failures++; console.log(`  FAIL - ${name}${detail ? `  (${detail})` : ''}`) }
}

// Import AFTER env is set — ADMIN_TOKEN is read at module load.
const { GET, POST } = await import('../src/app/(api-routes)/api/availability/route')

// The handlers want a NextRequest; a plain Request is structurally enough for
// what they touch (.url / .headers), so cast through unknown to the param type.
type ReqArg = Parameters<typeof POST>[0]

// 1. POST with wrong token → 401
{
  const resp = await POST(new Request('http://localhost/api/availability', {
    method: 'POST', headers: { authorization: 'Bearer wrong' },
  }) as unknown as ReqArg)
  check('POST rejects bad token (401)', resp.status === 401, String(resp.status))
}

// 2. POST with correct token → 200 + imports the feed
{
  const resp = await POST(new Request('http://localhost/api/availability', {
    method: 'POST', headers: { authorization: 'Bearer testtoken123' },
  }) as unknown as ReqArg)
  const body = await resp.json()
  const airbnb = (body.results || []).find((r: { source: string }) => r.source === 'airbnb')
  check('POST sync authorized (200)', resp.status === 200, String(resp.status))
  check('airbnb feed imported ok', !!airbnb && airbnb.ok === true, JSON.stringify(airbnb))
  check('imported 2 blocked ranges', !!airbnb && airbnb.block_count === 2, JSON.stringify(airbnb))
}

// 3. GET reflects the imported feed — exclusive checkout respected
{
  const resp = await GET(new Request('http://localhost/api/availability?start=2026-07-01&end=2026-08-31') as unknown as ReqArg)
  const body = await resp.json()
  check('GET 200', resp.status === 200, String(resp.status))
  check('GET shows reserved night 7/17', (body.blocked_nights || []).includes('2026-07-17'))
  check('GET checkout 7/20 stays OPEN', !(body.blocked_nights || []).includes('2026-07-20'))
  check('GET shows 2nd block 8/01', (body.blocked_nights || []).includes('2026-08-01'))
}

// 4. GET validates bad input → 400
{
  const resp = await GET(new Request('http://localhost/api/availability?start=nope&end=2026-08-31') as unknown as ReqArg)
  check('GET rejects bad date (400)', resp.status === 400, String(resp.status))
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
