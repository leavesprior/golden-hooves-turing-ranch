/**
 * Bobr DM security boundary.
 *
 * The game may ask an LLM to improvise fiction, but security decisions stay
 * deterministic. This module classifies attempts to leave the game boundary
 * and issues short-lived capabilities for reading a player's directive queue.
 *
 * QSD is deliberately absent: it may later contribute observed entropy or
 * presence evidence, but it is not an authentication root.
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export type DmBoundaryCategory =
  | 'credential_probe'
  | 'host_action_request'
  | 'infrastructure_probe'
  | 'prompt_injection'

export interface DmBoundaryFinding {
  category: DmBoundaryCategory
  severity: 'watch' | 'alert'
  ruleId: string
}

interface BoundaryRule {
  category: DmBoundaryCategory
  severity: DmBoundaryFinding['severity']
  ruleId: string
  pattern: RegExp
}

const BOUNDARY_RULES: readonly BoundaryRule[] = [
  {
    category: 'credential_probe',
    severity: 'alert',
    ruleId: 'credential-secret-request',
    pattern:
      /\b(?:show|reveal|give|print|read|find|steal|extract|dump)\b.{0,40}\b(?:password|credential|api[_\s-]?key|secret\s+key|private\s+key|token)\b/i,
  },
  {
    category: 'host_action_request',
    severity: 'alert',
    ruleId: 'host-shell-command',
    pattern: /\b(?:sudo|ssh|shell|terminal|command\s+line|root\s+access)\b|\brm\s+-rf\b|\b(?:exec|eval)\s*\(/i,
  },
  {
    category: 'host_action_request',
    severity: 'alert',
    ruleId: 'host-file-operation',
    pattern:
      /\b(?:read|write|open|delete|modify|upload|download|execute|run)\b.{0,40}\b(?:file|directory|folder|script|binary|service|process)\b/i,
  },
  {
    category: 'infrastructure_probe',
    severity: 'alert',
    ruleId: 'infrastructure-address',
    pattern: /\blocalhost\b|\b127\.0\.0\.1\b|\bport\s+(?!42\b)\d{2,5}\b|\b(?:memory\s+bridge|guardian\s+api|systemd|ollama)\b/i,
  },
  {
    category: 'infrastructure_probe',
    severity: 'alert',
    ruleId: 'infrastructure-config',
    pattern: /\b(?:system\s+prompt|configuration|config\s+file|environment\s+variable)\b|(?:^|[\s/])\.env\b|\/(?:etc|proc|sys|home)\//i,
  },
  {
    category: 'prompt_injection',
    severity: 'watch',
    ruleId: 'override-instructions',
    pattern:
      /ignore\s+(?:all\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|rules?|directives?)|override\s+(?:your|the|these)\s+(?:rules?|instructions?|prompt)/i,
  },
  {
    category: 'prompt_injection',
    severity: 'watch',
    ruleId: 'replace-persona',
    pattern:
      /\bjailbreak\b|\bDAN\b|do\s+anything\s+now|pretend\s+(?:you\s+are|to\s+be|you're)|you\s+are\s+now\s+|act\s+as\s+(?:a\s+|an\s+)?(?!if)/i,
  },
  {
    category: 'prompt_injection',
    severity: 'watch',
    ruleId: 'extract-instructions',
    pattern:
      /reveal\s+(?:your|the)\s+(?:instructions?|prompt|rules?|config)|what\s+(?:are|is)\s+your\s+(?:instructions?|rules?|system|prompt)|repeat\s+(?:your|the)\s+(?:system|initial)\s*(?:prompt|message|instructions?)/i,
  },
]

export function classifyDmBoundary(message: string): DmBoundaryFinding | null {
  const normalized = message.trim()
  if (!normalized) return null
  for (const rule of BOUNDARY_RULES) {
    if (rule.pattern.test(normalized)) {
      return {
        category: rule.category,
        severity: rule.severity,
        ruleId: rule.ruleId,
      }
    }
  }
  return null
}

const CAPABILITY_VERSION = 'v1'
export const DM_QUEUE_CAPABILITY_TTL_MS = 24 * 60 * 60 * 1000
const PLAYER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

let cachedSecret: Buffer | null = null

function secretPath(): string {
  let base = '/tmp'
  try {
    fs.accessSync('/data', fs.constants.W_OK)
    base = '/data'
  } catch {
    // Local development normally persists the secret in /tmp.
  }
  return path.join(base, 'bobr_dm_channel_secret')
}

function readOrCreateSecret(): Buffer {
  const configured = process.env.DM_QUEUE_SIGNING_SECRET
  if (configured && configured.length >= 32) return Buffer.from(configured, 'utf8')
  if (cachedSecret) return cachedSecret

  const file = secretPath()
  try {
    const existing = fs.readFileSync(file)
    if (existing.length >= 32) {
      cachedSecret = existing
      return existing
    }
  } catch {
    // Create a local secret below.
  }

  const fresh = crypto.randomBytes(32)
  try {
    fs.writeFileSync(file, fresh, { mode: 0o600, flag: 'wx' })
    cachedSecret = fresh
    return fresh
  } catch {
    try {
      const raced = fs.readFileSync(file)
      if (raced.length >= 32) {
        cachedSecret = raced
        return raced
      }
    } catch {
      // An ephemeral process secret is still safer than a hardcoded fallback.
    }
  }
  cachedSecret = fresh
  return fresh
}

function signature(playerId: string, expiresAt: number): string {
  return crypto
    .createHmac('sha256', readOrCreateSecret())
    .update(`${CAPABILITY_VERSION}|${playerId}|${expiresAt}`)
    .digest('base64url')
}

export function mintDmQueueCapability(
  playerId: string,
  now = Date.now(),
): string | null {
  if (!PLAYER_ID_PATTERN.test(playerId)) return null
  const expiresAt = now + DM_QUEUE_CAPABILITY_TTL_MS
  return `${CAPABILITY_VERSION}.${expiresAt}.${signature(playerId, expiresAt)}`
}

export function verifyDmQueueCapability(
  playerId: string,
  token: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!PLAYER_ID_PATTERN.test(playerId) || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== CAPABILITY_VERSION) return false
  const expiresAt = Number(parts[1])
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false
  if (expiresAt - now > DM_QUEUE_CAPABILITY_TTL_MS) return false

  const expected = Buffer.from(signature(playerId, expiresAt), 'utf8')
  const actual = Buffer.from(parts[2], 'utf8')
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

export function bearerToken(header: string | null): string | null {
  if (!header) return null
  const match = header.match(/^Bearer\s+([A-Za-z0-9._-]+)$/i)
  return match ? match[1] : null
}

export function verifyDmQueueAdminToken(header: string | null): boolean {
  const configured = process.env.DM_QUEUE_ADMIN_TOKEN
  const presented = bearerToken(header)
  if (!configured || configured.length < 32 || !presented) return false
  const expected = Buffer.from(configured, 'utf8')
  const actual = Buffer.from(presented, 'utf8')
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

export function privateFingerprint(value: string): string {
  return crypto
    .createHmac('sha256', readOrCreateSecret())
    .update(value)
    .digest('hex')
}

export function secureSessionId(): string {
  return crypto.randomBytes(24).toString('base64url')
}
