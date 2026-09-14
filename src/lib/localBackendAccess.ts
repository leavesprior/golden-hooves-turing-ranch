/** Local-only Bridge progression. This is not user authentication or LAN authority. */
export const LOCAL_BRIDGE_COOKIE = 'bobr_local_bridge'
export const LOCAL_BRIDGE_TTL_MS = 260_000
export const LOCAL_BRIDGE_ENDPOINT = '/api/local-backend/bridge'
export const LOCAL_SLIDES_PATH = '/neoma/neoma-slides.pdf'

export interface LocalBackendConfig {
  enabled: boolean
  workerEnabled: boolean
  slidesEnabled: boolean
  secret: string
}

export function localBackendConfig(env: Record<string, string | undefined>): LocalBackendConfig {
  const secret = env.LOCAL_BACKEND_BRIDGE_SECRET ?? ''
  return {
    enabled: env.DM_TABLE_ENABLED === 'true' && secret.trim().length >= 32,
    workerEnabled: env.WORKER_TIMESHEETS_ENABLED === 'true',
    slidesEnabled: env.LOCAL_BACKEND_SLIDES_ENABLED === 'true',
    secret,
  }
}

/** Do not reuse the broader LAN_CANARY/HSTS policy, trust forwarded hosts, or match prefixes. */
export function localBackendOrigin(url: string, hostHeader: string | null): string | null {
  if (!hostHeader || !/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i.test(hostHeader)) return null
  try {
    const request = new URL(url)
    if (request.protocol !== 'http:' && request.protocol !== 'https:') return null
    const authority = new URL(`${request.protocol}//${hostHeader}`)
    // NextRequest normalizes loopback URLs to localhost. The original Host
    // remains authoritative for origin binding; both must still be loopback,
    // with the same port. A public URL/Host never inherits this exception.
    if (!['localhost', '127.0.0.1', '[::1]'].includes(request.hostname)
      || authority.port !== request.port || request.username || request.password) return null
    return authority.origin
  } catch { return null }
}

export type LocalBackendRoute = 'entry' | 'grant' | 'worker' | 'slides'

/** Static serving decodes percent escapes after middleware. Classify the same
 * protected ground before applying flags/grants; never rewrite the request. */
function decodedBackendPath(raw: string): string {
  let path = raw
  for (let pass = 0; pass < 3; pass++) {
    try {
      const decoded = decodeURIComponent(path)
      if (decoded === path) break
      path = decoded
    } catch { break }
  }
  const segments: string[] = []
  for (const segment of path.replace(/\\/g, '/').split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') segments.pop()
    else segments.push(segment)
  }
  return `/${segments.join('/')}`
}

export function localBackendRoute(rawPath: string): LocalBackendRoute | null {
  const path = decodedBackendPath(rawPath)
  if (path === '/dm-table' || path.startsWith('/dm-table/')) return 'entry'
  if (path === LOCAL_BRIDGE_ENDPOINT || path.startsWith(`${LOCAL_BRIDGE_ENDPOINT}/`)) return 'grant'
  if (path === '/worker' || path.startsWith('/worker/') || path === '/api/worker' || path.startsWith('/api/worker/')) return 'worker'
  if (path === LOCAL_SLIDES_PATH) return 'slides'
  return null
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function keyFor(secret: string) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function issueLocalBridgeGrant(origin: string, config: LocalBackendConfig, now = Date.now()): Promise<{ token: string; expiresAt: number } | null> {
  if (!config.enabled || config.secret.trim().length < 32 || !Number.isSafeInteger(now) || now < 0) return null
  const expiresAt = now + LOCAL_BRIDGE_TTL_MS
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
  const payload = `v1.${now}.${expiresAt}.${nonce}`
  const signature = await crypto.subtle.sign('HMAC', await keyFor(config.secret), new TextEncoder().encode(`${origin}\n${payload}`))
  return { token: `${payload}.${base64url(new Uint8Array(signature))}`, expiresAt }
}

export async function verifyLocalBridgeGrant(token: string | null | undefined, origin: string, config: LocalBackendConfig, now = Date.now()): Promise<boolean> {
  if (!config.enabled || config.secret.trim().length < 32 || typeof token !== 'string' || token.length > 200) return false
  const parts = token.split('.')
  if (parts.length !== 5 || parts[0] !== 'v1' || !/^\d{1,16}$/.test(parts[1]) || !/^\d{1,16}$/.test(parts[2]) || !/^[a-f0-9]{32}$/.test(parts[3]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[4])) return false
  const issuedAt = Number(parts[1]), expiresAt = Number(parts[2])
  if (!Number.isSafeInteger(now) || !Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(expiresAt)
    || issuedAt > now || expiresAt <= now || expiresAt - issuedAt !== LOCAL_BRIDGE_TTL_MS) return false
  try {
    const signature = Uint8Array.from(atob(parts[4].replace(/-/g, '+').replace(/_/g, '/') + '='), char => char.charCodeAt(0))
    return await crypto.subtle.verify('HMAC', await keyFor(config.secret), signature, new TextEncoder().encode(`${origin}\n${parts.slice(0, 4).join('.')}`))
  } catch { return false }
}

export async function allowLocalBackendRequest(input: {
  path: string
  url: string
  host: string | null
  method?: string
  requestOrigin?: string | null
  cookie?: string | null
  config: LocalBackendConfig
  now?: number
}): Promise<boolean> {
  const route = localBackendRoute(input.path)
  if (!route) return true
  const origin = localBackendOrigin(input.url, input.host)
  if (!origin || !input.config.enabled) return false
  if (route === 'entry' || route === 'grant') return true
  if (route === 'worker' && !input.config.workerEnabled) return false
  if (route === 'slides' && !input.config.slidesEnabled) return false
  if (route === 'worker' && !['GET', 'HEAD', 'OPTIONS'].includes((input.method ?? 'GET').toUpperCase())
    && input.requestOrigin !== origin) return false
  return verifyLocalBridgeGrant(input.cookie, origin, input.config, input.now)
}
