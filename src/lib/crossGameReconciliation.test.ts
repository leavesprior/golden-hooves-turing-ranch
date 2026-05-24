/**
 * G3 regression tests — server-side reconciliation, NO client-trusted amnesty.
 *
 * Run with:  npx tsx --test src/lib/crossGameReconciliation.test.ts
 *
 * These drive the CLIENT storage layer (`CrossGameStorage`) with an in-memory
 * localStorage/window polyfill (no jsdom dependency) and a stubbed `fetch` that
 * simulates `/api/grant` + `/api/grant/verify`. They assert the property the
 * brief demands:
 *
 *   - A raw legacy localStorage milestone is NOT honored (amnesty is gone).
 *   - Reconciliation issues a valid grant ONLY for a truly-earned milestone
 *     (server says yes); a forged/unearned milestone gets nothing.
 *   - The legit signed-grant path still counts a milestone as eligible.
 *
 * The server's authority is simulated by the `earnedMilestones` set: the stub
 * `/api/grant` signs only milestones the "server" has proof for, mirroring the
 * real GAP-2 eligibility gate (`grantEligibility.ts`).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Minimal in-memory localStorage + window polyfill (no jsdom).
// ---------------------------------------------------------------------------
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(k: string): string | null { return this.store.has(k) ? this.store.get(k)! : null; }
  setItem(k: string, v: string): void { this.store.set(k, String(v)); }
  removeItem(k: string): void { this.store.delete(k); }
  clear(): void { this.store.clear(); }
  key(i: number): string | null { return [...this.store.keys()][i] ?? null; }
  get length(): number { return this.store.size; }
}

interface TestGlobals {
  window?: unknown;
  localStorage?: MemoryStorage;
  StorageEvent?: unknown;
  crypto?: unknown;
  fetch?: unknown;
}

function installBrowserEnv(): MemoryStorage {
  const g = globalThis as unknown as TestGlobals;
  const ls = new MemoryStorage();
  g.localStorage = ls;
  g.window = { dispatchEvent: () => true, localStorage: ls };
  // StorageEvent stub — crossGameProgression dispatches one on save.
  g.StorageEvent = class { constructor(public type: string, public init?: unknown) {} };
  if (!g.crypto) g.crypto = { randomUUID: () => `uuid-${Math.random().toString(36).slice(2)}` };
  return ls;
}

/**
 * Stub the grant API. `/api/grant` signs (returns a token) ONLY for milestones
 * the "server" can prove were earned — exactly the GAP-2 contract. Everything
 * else returns 403 -> null token. `/api/grant/verify` accepts only tokens this
 * stub minted.
 */
function installGrantApi(earnedMilestones: Set<string>): { issued: string[] } {
  const g = globalThis as unknown as TestGlobals;
  const issued: string[] = [];
  const minted = new Set<string>();

  g.fetch = async (input: unknown, init?: { body?: string }) => {
    const url = String(input);

    if (url === '/api/grant') {
      const body = JSON.parse(init?.body ?? '{}') as { payload?: { milestoneId?: string } };
      const milestoneId = body.payload?.milestoneId ?? '';
      if (!earnedMilestones.has(milestoneId)) {
        return { ok: false, status: 403, json: async () => ({ ok: false, reason: 'milestone_not_earned' }) };
      }
      const now = Math.floor(Date.now() / 1000);
      const payload = Buffer.from(JSON.stringify({
        type: 'milestone',
        payload: { milestoneId },
        iat: now,
        exp: now + 30 * 24 * 60 * 60,
      }), 'utf8').toString('base64url');
      const token = `hdr.${payload}.sig-${milestoneId}`;
      minted.add(token);
      issued.push(milestoneId);
      return { ok: true, status: 201, json: async () => ({ ok: true, token }) };
    }

    if (url.startsWith('/api/grant/verify')) {
      const token = decodeURIComponent(url.split('token=')[1] ?? '');
      if (minted.has(token)) {
        const part = token.split('.')[1];
        const decoded = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
        return { ok: true, status: 200, json: async () => ({ ok: true, payload: decoded }) };
      }
      return { ok: false, status: 401, json: async () => ({ ok: false, reason: 'invalid_token' }) };
    }

    return { ok: false, status: 404, json: async () => ({}) };
  };

  return { issued };
}

/** Wait for fire-and-forget grant issuance promises to settle. */
async function flush(): Promise<void> {
  await new Promise(r => setTimeout(r, 10));
}

/** Hand-place a raw milestone in localStorage as a pre-1.2.0 / forged client. */
function plantLegacyMilestone(ls: MemoryStorage, milestoneId: string, extraMeta: Record<string, unknown> = {}): void {
  const state = {
    version: '1.1.0',
    milestones: [{
      id: milestoneId,
      source: 'clue_game',
      timestamp: new Date().toISOString(),
      metadata: extraMeta,
    }],
    characterQualities: {},
    timeEchoes: {},
    reputation: null,
    bounties: [],
    karmaPool: {},
    karmaTransfers: [],
    spiritualAwareness: {},
    mapDiscoveries: [],
    historicalDepth: 0,
    eventLog: [],
    lastSyncTimestamp: new Date().toISOString(),
  };
  ls.setItem('bobr_cross_game_progression', JSON.stringify(state));
}

// crossGameProgression has no module-level mutable state (it reads/writes
// through the polyfilled localStorage on every call), so a single import is
// safe across tests — each test installs a fresh in-memory storage + fetch.
import { CrossGameStorage } from './crossGameProgression';
async function loadStorage() {
  return CrossGameStorage;
}

// ---------------------------------------------------------------------------
// G3: a raw legacy localStorage milestone is NOT honored.
// ---------------------------------------------------------------------------

test('G3: a raw legacy localStorage milestone is NOT honored (amnesty gone)', async () => {
  const ls = installBrowserEnv();
  installGrantApi(new Set()); // server proves NOTHING earned
  const CrossGameStorage = await loadStorage();

  // Pre-1.2.0 client with a milestone but no signed grant.
  plantLegacyMilestone(ls, 'clue_game_unlocked');

  // Before any amnesty could possibly kick in: not eligible.
  assert.equal(CrossGameStorage.hasMilestone('clue_game_unlocked' as never), false,
    'raw milestone must not be honored on load');

  // Even a milestone carrying a stale legacy-amnesty marker (forged or left
  // over from a pre-1.2.0 client) must NOT be honored.
  plantLegacyMilestone(ls, 'clue_game_unlocked', {
    grantStatus: 'legacy_amnesty',
    legacyAmnestyExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  assert.equal(CrossGameStorage.hasMilestone('clue_game_unlocked' as never), false,
    'stale legacyAmnestyExpiresAt must be inert — no amnesty honored');
  assert.equal(CrossGameStorage.isUnlocked('clue_game' as never), false,
    'game must stay locked off a forged amnesty milestone');
});

// ---------------------------------------------------------------------------
// G3: reconciliation denies a forged milestone (server says not earned).
// ---------------------------------------------------------------------------

test('G3: reconciliation does NOT issue a grant for a forged/unearned milestone', async () => {
  const ls = installBrowserEnv();
  const { issued } = installGrantApi(new Set()); // nothing earned on the server
  const CrossGameStorage = await loadStorage();

  plantLegacyMilestone(ls, 'clue_game_unlocked');

  // init() triggers migration (1.1.0 -> 1.2.0) + one-time reconciliation.
  CrossGameStorage.init();
  await flush();

  assert.deepEqual(issued, [], 'server denied — no grant issued for forged milestone');
  assert.equal(CrossGameStorage.hasMilestone('clue_game_unlocked' as never), false,
    'forged milestone remains un-honored after reconciliation');

  // The pending window must have been cleared on the 403 so it is not honored
  // during the 5-minute pending TTL.
  const raw = JSON.parse(ls.getItem('bobr_cross_game_progression')!);
  const m = raw.milestones.find((x: { id: string }) => x.id === 'clue_game_unlocked');
  assert.notEqual(m?.metadata?.grantStatus, 'pending',
    'denied milestone must not be left in honored pending state');
});

// ---------------------------------------------------------------------------
// G3: reconciliation issues a valid grant ONLY for a truly-earned milestone.
// ---------------------------------------------------------------------------

test('G3: reconciliation issues a grant for a truly-earned milestone', async () => {
  const ls = installBrowserEnv();
  const { issued } = installGrantApi(new Set(['clue_game_unlocked'])); // server confirms earned
  const CrossGameStorage = await loadStorage();

  plantLegacyMilestone(ls, 'clue_game_unlocked');

  CrossGameStorage.init();
  await flush();

  assert.deepEqual(issued, ['clue_game_unlocked'], 'earned milestone should get a fresh grant');
  // A signed grant token now exists -> milestone is honored.
  assert.equal(CrossGameStorage.hasMilestone('clue_game_unlocked' as never), true,
    'earned milestone honored after a real signed grant is issued');
  assert.ok(ls.getItem('bobr_grant_milestone_clue_game_unlocked'),
    'signed grant token cached for the earned milestone');
});

// ---------------------------------------------------------------------------
// Legit path: recordMilestone for an earned milestone ends up honored.
// ---------------------------------------------------------------------------

test('LEGIT: recordMilestone for an earned milestone is honored end-to-end', async () => {
  installBrowserEnv();
  const { issued } = installGrantApi(new Set(['clue_game_unlocked']));
  const CrossGameStorage = await loadStorage();

  CrossGameStorage.recordMilestone('clue_game_unlocked' as never, 'clue_game' as never);
  await flush();

  assert.deepEqual(issued, ['clue_game_unlocked']);
  assert.equal(CrossGameStorage.hasMilestone('clue_game_unlocked' as never), true);
});

// ---------------------------------------------------------------------------
// Reconciliation is one-time (idempotent): re-running init does not re-fire.
// ---------------------------------------------------------------------------

test('G3: reconciliation runs once (idempotent across loads)', async () => {
  const ls = installBrowserEnv();
  const { issued } = installGrantApi(new Set(['clue_game_unlocked']));
  const CrossGameStorage = await loadStorage();

  plantLegacyMilestone(ls, 'clue_game_unlocked');
  CrossGameStorage.init();
  await flush();
  const firstCount = issued.length;

  // Second init on the now-1.2.0 state must NOT re-fire reconciliation.
  CrossGameStorage.init();
  await flush();
  assert.equal(issued.length, firstCount, 'reconciliation must not re-run on subsequent loads');
});
