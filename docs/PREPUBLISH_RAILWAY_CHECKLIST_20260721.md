# Pre-publish Railway checklist — 2026-07-21

Grok's three must-dos before publish to a real business domain.

## 1. Railway secrets + `/data` volume

### Secrets (Railway → Service → Variables)

| Variable | Required | Notes |
|----------|----------|--------|
| `MARKER_SESSION_SECRET` | **YES** | `openssl rand -hex 32`. Without it, production uses an ephemeral secret (logs CRITICAL) — early-bird tokens do not survive redeploy and must not share the old hardcoded dev string. |
| `DM_QUEUE_SIGNING_SECRET` | if DM Table live | Capability HMAC |
| `DM_QUEUE_ADMIN_TOKEN` | if DM Table live | Admin POST gate |
| `NOTION_API_KEY` / `NOTION_DATABASE_ID` | if Hall of Fame | optional |

### Volume

1. Railway → Service → **Volumes** → add volume.
2. Mount path: **`/data`**
3. Confirms at runtime: `discount_codes.db` and `worker.db` land under `/data` (see `discountCodesDb.ts`, `workerDb.ts`).
4. If `/data` is missing in production, logs **`[CRITICAL] /data volume missing`** and falls back to `/tmp` (data loss on redeploy).

### CLI (when service is linked)

```bash
cd ~/bobr-visual64
railway link   # pick project + service
railway variables set MARKER_SESSION_SECRET="$(openssl rand -hex 32)"
# Volume: create in dashboard (CLI volume UX varies by plan)
```

## 2. Full quality gate (exact merge commit)

```bash
cd ~/bobr-visual64
npx tsc --noEmit
npm run lint
npm test
npm run build
```

DM queue route tests are wired: `npm run test:dm-security` includes  
`src/app/(api-routes)/api/neoma/dm/queue/route.test.ts`.

## 3. Sacred-site decision — **GATED OFF (default)**

**Decision (2026-07-21, implement default):** strip/gate gamification, do not auto-award karma/XP for sacred or burial sites on a live domain.

| Layer | Behavior |
|-------|----------|
| `visitSpiritualSite` | no-op unless `NEXT_PUBLIC_SACRED_SITE_GAMEPLAY=1` |
| Explore town visit | does not call spiritual register unless flag `=1` |
| Educational data | `spiritualSites.ts` may remain for future reviewed content |
| Re-enable | only after Leif + tribal review; set env `NEXT_PUBLIC_SACRED_SITE_GAMEPLAY=1` |

Coordinates were already internal-only (not guest-facing map pins). Risk was **gamifying** sacred/burial content via town visit → karma/XP.

## Ship path

- Branch: `feat/bobr-visual64-local` (never push straight to `main` — Railway auto-deploys).
- Use `/ship` skill: branch verify → PR → CI → squash merge.
