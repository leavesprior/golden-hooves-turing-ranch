/**
 * GAP-1 / GAP-2 regression tests for the BOBR signed-grant substrate.
 *
 * Run with:  npx tsx --test src/lib/server/grantForgery.test.ts
 *
 * Properties asserted:
 *   1. GAP-1 — a forged / unsigned grant is REJECTED by server-side HMAC verify
 *      (both the low-level `verifyGrant` and the `/api/grant/verify` handler).
 *   2. GAP-2 — `/api/grant` REJECTS a milestone the server cannot prove was
 *      earned (no marker progress for the session), and rejects milestones with
 *      no server-side proof source at all.
 *   3. A legitimately-earned milestone (server-logged marker progress) issues a
 *      signed grant that then verifies end-to-end.
 *
 * These tests drive the real route handlers + real sqlite store; unique session
 * ids per test isolate state in the shared dev DB.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// The signing primitive enforces a >=32-char secret and (in prod) throws at
// import. Set a test secret BEFORE importing anything that touches it.
// (NODE_ENV is left as-is — it must NOT be 'production' for these tests; the
//  test:grants npm script controls the environment.)
process.env.BOBR_GRANT_SIGNING_SECRET =
  process.env.BOBR_GRANT_SIGNING_SECRET ?? 'test-only-grant-secret-at-least-32-characters-long';

import { NextRequest } from 'next/server';
import { signGrant, verifyGrant, getGrantSigningSecret } from './grantSigning';
import { POST as grantPost } from '@/app/(api-routes)/api/grant/route';
import { GET as grantVerifyGet } from '@/app/(api-routes)/api/grant/verify/route';
import { dbRecordMarkerProgress } from '@/lib/discountCodesDb';
import { getLocationsForDifficulty, EARLY_DISCOUNT_MARKER } from '@/lib/locations';

function uniqueSession(label: string): string {
  return `test_${label}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; // safe-mint: test-only session id; mints no value.
}

function base64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
}

/** Build a NextRequest the route handlers accept. */
function postRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/grant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function verifyRequest(token: string): NextRequest {
  const url = `http://localhost/api/grant/verify?token=${encodeURIComponent(token)}`;
  return new NextRequest(url, { method: 'GET' });
}

/** Seed the server-side marker event log so a session is genuinely eligible. */
function earnMarkers(sessionId: string, difficulty: 'easy' | 'medium' | 'hard', count: number) {
  const slugs = getLocationsForDifficulty(difficulty).slice(0, count).map(l => l.slug);
  assert.ok(slugs.length >= count, 'fixture: not enough locations to seed markers');
  for (const slug of slugs) {
    dbRecordMarkerProgress({ sessionId, markerSlug: slug });
  }
}

// ---------------------------------------------------------------------------
// GAP-1: forged / unsigned grants must be rejected by server HMAC verification.
// ---------------------------------------------------------------------------

test('GAP-1: a hand-crafted unsigned grant is rejected by verifyGrant()', () => {
  const now = Math.floor(Date.now() / 1000);
  // The exact attack from the brief: JWT-shaped blob, far-future exp, bogus sig.
  const header = base64url({ alg: 'HS256', typ: 'BOBR-GRANT', kid: 'bobr-grants-v1' });
  const payload = base64url({
    type: 'milestone',
    payload: { milestoneId: 'clue_game_unlocked', sessionId: 'forger' },
    iat: now,
    exp: now + 10_000_000,
    jti: 'forged-jti',
  });
  const forged = `${header}.${payload}.not-a-real-signature`;

  assert.equal(verifyGrant(forged, getGrantSigningSecret()), null);
});

test('GAP-1: a grant signed with the WRONG secret is rejected', () => {
  const wrongSecret = 'an-entirely-different-secret-32-characters!!';
  const token = signGrant(
    { type: 'milestone', payload: { milestoneId: 'clue_game_unlocked', sessionId: 'x' } },
    wrongSecret,
  );
  // Server verifies with the real secret → mismatch → null.
  assert.equal(verifyGrant(token, getGrantSigningSecret()), null);
});

test('GAP-1: /api/grant/verify rejects a forged token with 401', async () => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: 'HS256', typ: 'BOBR-GRANT', kid: 'bobr-grants-v1' });
  const payload = base64url({
    type: 'milestone',
    payload: { milestoneId: 'clue_game_unlocked' },
    iat: now,
    exp: now + 10_000_000,
    jti: 'forged',
  });
  const res = await grantVerifyGet(verifyRequest(`${header}.${payload}.zzz`));
  assert.equal(res.status, 401);
  const json = await res.json();
  assert.equal(json.ok, false);
  assert.equal(json.reason, 'invalid_token');
});

// ---------------------------------------------------------------------------
// GAP-2: /api/grant must not sign a milestone the server can't prove was earned.
// ---------------------------------------------------------------------------

test('GAP-2: /api/grant rejects an UNEARNED milestone (no marker progress) with 403', async () => {
  const sessionId = uniqueSession('unearned'); // never logs any markers
  const res = await grantPost(postRequest({
    type: 'milestone',
    payload: { milestoneId: 'clue_game_unlocked', sessionId },
  }));
  assert.equal(res.status, 403);
  const json = await res.json();
  assert.equal(json.ok, false);
  assert.equal(json.reason, 'milestone_not_earned');
});

test('GAP-2: /api/grant rejects a milestone with NO server-side proof source as unverifiable', async () => {
  const sessionId = uniqueSession('unverifiable');
  // `karma_lawful_good` is pure client-side progress — no server log proves it.
  const res = await grantPost(postRequest({
    type: 'milestone',
    payload: { milestoneId: 'karma_lawful_good', sessionId },
  }));
  assert.equal(res.status, 403);
  const json = await res.json();
  assert.equal(json.reason, 'eligibility_unverifiable');
});

test('GAP-2: /api/grant still rejects a non-allowlisted milestoneId', async () => {
  const sessionId = uniqueSession('badmilestone');
  const res = await grantPost(postRequest({
    type: 'milestone',
    payload: { milestoneId: 'totally_made_up_milestone', sessionId },
  }));
  // Caught by isMilestoneId in validatePayload before eligibility.
  assert.equal(res.status, 400);
});

// ---------------------------------------------------------------------------
// Legit path: an earned milestone issues a signed grant that verifies E2E.
// ---------------------------------------------------------------------------

test('LEGIT: an earned milestone issues a signed grant that verifies end-to-end', async () => {
  const sessionId = uniqueSession('earned');
  earnMarkers(sessionId, 'easy', EARLY_DISCOUNT_MARKER);

  // Issue
  const issueRes = await grantPost(postRequest({
    type: 'milestone',
    payload: { milestoneId: 'clue_game_unlocked', sessionId },
  }));
  assert.equal(issueRes.status, 201, 'earned milestone should be signed');
  const issued = await issueRes.json();
  assert.equal(issued.ok, true);
  assert.equal(typeof issued.token, 'string');

  // The signed token must independently verify at the low level...
  const verified = verifyGrant(issued.token, getGrantSigningSecret());
  assert.ok(verified, 'issued token must pass HMAC verify');
  assert.equal(verified!.type, 'milestone');
  assert.equal((verified!.payload as { milestoneId?: string }).milestoneId, 'clue_game_unlocked');

  // ...and through the public verify endpoint.
  const verifyRes = await grantVerifyGet(verifyRequest(issued.token));
  assert.equal(verifyRes.status, 200);
  const verifyJson = await verifyRes.json();
  assert.equal(verifyJson.ok, true);
  assert.equal(verifyJson.payload.payload.milestoneId, 'clue_game_unlocked');
});
