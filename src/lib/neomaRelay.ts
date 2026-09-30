/**
 * Neoma pull relay (Leif 2026-09-30).
 *
 * The site never reaches into the house. A Neoma worker on Main or Tower connects
 * OUT when the node is on, pulls chat jobs, answers with the local model through
 * the character's own prompt, and posts the answer back. Both calls are signed
 * with NEOMA_RELAY_SECRET (the hash Neoma holds). With no secret set, the relay
 * is off and chat falls through to the other providers and then jev.
 *
 * State is in memory on the single web instance (globalThis so every route
 * module shares it). A restart drops pending jobs; callers then fall back.
 */
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

export interface RelayMessage { role: string; content: string }
export interface RelayJob { id: string; messages: RelayMessage[]; maxTokens: number; createdAt: number }

const WORKER_FRESH_MS = 30_000
const MAX_SKEW_MS = 60_000
const MAX_ANSWER_CHARS = 2000
const MAX_QUEUE = 20

interface RelayState {
  queue: RelayJob[]
  waiters: Map<string, (text: string | null) => void>
  lastPullAt: number
  pullWaiters: Set<() => void>
}

const g = globalThis as unknown as { __neomaRelay?: RelayState }
const state: RelayState = g.__neomaRelay ??= { queue: [], waiters: new Map(), lastPullAt: 0, pullWaiters: new Set() }

export function relaySecret(): string | null {
  const s = process.env.NEOMA_RELAY_SECRET
  return s && s.length >= 32 ? s : null
}

/** Signature = hex HMAC-SHA256(secret, `${ts}.${body}`); ts in ms, within 60s. */
export function signRelay(secret: string, ts: string, body: string): string {
  return createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')
}

export function verifyRelay(ts: string | null, sig: string | null, body: string, now = Date.now()): boolean {
  const secret = relaySecret()
  if (!secret || !ts || !sig || !/^\d{10,16}$/.test(ts) || !/^[0-9a-f]{64}$/.test(sig)) return false
  if (Math.abs(now - Number(ts)) > MAX_SKEW_MS) return false
  const want = Buffer.from(signRelay(secret, ts, body), 'hex')
  const got = Buffer.from(sig, 'hex')
  return want.length === got.length && timingSafeEqual(want, got)
}

export function workerIsLive(now = Date.now()): boolean {
  return relaySecret() !== null && now - state.lastPullAt < WORKER_FRESH_MS
}

/** Queue a job for the worker and wait for its answer; null on timeout or when no worker is on. */
export async function askRelay(messages: RelayMessage[], maxTokens: number, timeoutMs: number): Promise<string | null> {
  if (!workerIsLive() || state.queue.length >= MAX_QUEUE) return null
  const job: RelayJob = { id: randomUUID(), messages, maxTokens, createdAt: Date.now() }
  const answer = new Promise<string | null>(resolve => {
    state.waiters.set(job.id, resolve)
    setTimeout(() => {
      if (state.waiters.delete(job.id)) {
        state.queue = state.queue.filter(j => j.id !== job.id)
        resolve(null)
      }
    }, timeoutMs)
  })
  state.queue.push(job)
  for (const wake of state.pullWaiters) wake()
  return answer
}

/** Worker side: take waiting jobs, holding the request open up to waitMs for one to arrive. */
export async function pullJobs(waitMs: number): Promise<RelayJob[]> {
  state.lastPullAt = Date.now()
  if (state.queue.length === 0) {
    await new Promise<void>(resolve => {
      const wake = () => { state.pullWaiters.delete(wake); resolve() }
      state.pullWaiters.add(wake)
      setTimeout(wake, waitMs)
    })
    state.lastPullAt = Date.now()
  }
  const jobs = state.queue
  state.queue = []
  return jobs
}

/** Worker side: deliver an answer. False when the job is unknown or already timed out. */
export function answerJob(id: string, text: string): boolean {
  const resolve = state.waiters.get(id)
  if (!resolve) return false
  state.waiters.delete(id)
  resolve(text.slice(0, MAX_ANSWER_CHARS))
  return true
}
