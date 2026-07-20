# Gold Country Canonical Registry — Design

**Status: DRAFT — Grok-before + Leif approval required before CI wiring.**
Date: 2026-07-20 · Origin: BOBR game-suite team-of-agents audit
(`memory/project-bobr-game-suite-teamofagents-audit-20260720.md`, accuracy section Codex web-verified).

## Problem

Gold Country history lives in **three separate location datasets** that drift out of agreement:

| Game | Dataset |
|------|---------|
| adventure | `src/app/adventure/data/*` |
| explore | `src/app/explore/data/*`, `src/app/explore/page.tsx` |
| oregon (Prospector's Tale) | `src/app/oregon-trail/data/*` |

The same real town gets a different founder, date, or "fact" in each. The 2026-07-20 audit
found ~10 factual errors and ~4 invented-as-canon items in the explore content alone
(e.g. "George Angel" vs. the real Henry Pinkney Angell; the Twain cabin misplaced at Angels
Camp instead of Jackass Hill; Black Bart "captured in San Andreas" when he was arrested in
San Francisco). Writing carefully does not fix this — **without one source of truth, accuracy
drifts no matter what.**

## The registry

`src/data/goldCountryCanon.ts` exports two typed tables:

- **`places: CanonPlace[]`** — `{ id, names[], county, era, real, lat?, lng?, notes, sources[], fictional?, needsTribalReview? }`
- **`people: CanonPerson[]`** — `{ id, names[], lifespan?, places[], real, sources[], notes?, fictional? }`

Rules the registry encodes:

1. **One canonical entry per real place/person**, keyed by a stable `id`.
2. **`names[]` holds every alias/spelling** content may use, so a lint (and eventually the
   content itself) can map any free-typed token back to a canonical id.
3. **Fiction only with `fictional: true` + a required `notes`** explaining what is invented and
   why. (Seed example: `jim_smiley` — Twain's fictional character, not a real claim-holder.)
4. **Every entry carries a `sources[]` line** (year + citation). New entries must add one.
5. **Culturally-sensitive Indigenous sites carry `needsTribalReview: true`** and must NOT be
   shipped as coordinate-specific game destinations without tribal review. (Seed example:
   `chawse_indian_grinding_rock` — public state-park facts are shown; precise coordinates
   deliberately omitted pending review.)

Seed scope: the entries the audit verified accurate **plus** the ones it corrected —
**14 places, 8 people.** This is a seed, not an exhaustive migration.

## The congruence rule (3 datasets → 1)

> All narrative content should eventually reference registry **IDs**, never free-typed
> place/person strings. The three location datasets should collapse to **this registry +
> thin per-game views** — a game picks which ids it exposes and layers gameplay data
> (drive time, XP, encounters) on top. A fact is then corrected in exactly one place.

Migration is incremental and out of scope for this pass; the registry + the accuracy fixes
already applied to `explore/*` are the first step.

## The lint gate (DRAFT, un-wired)

`scripts/canon-lint.mjs` greps the content datasets for **Title-Case place-like tokens**
(tokens whose head or tail word is a Gold-Country place suffix — Camp, Hill, Mine, Creek,
Caverns, Hotel, County, Gulch, Point, Valley, …) that are **not** present in the registry's
`names[]`. In strict mode it would exit non-zero, failing the build on an unknown place noun.

```bash
node scripts/canon-lint.mjs            # report only
node scripts/canon-lint.mjs --strict   # exit 1 on any unknown place token
```

**It is deliberately NOT wired** into `package.json` or CI. A heuristic that fails builds on
proper nouns needs a curated stoplist and a false-positive review first (the explore map
legitimately includes wider-radius towns). Person-name linting is out of scope for the draft —
person names collide with ordinary Title-Case prose too often.

## What still needs the hub / Grok / Leif

- **Grok-before** on: wiring `canon-lint` into the quality gate; the collapse of the 3 datasets
  to registry-ids + per-game views (a cross-lane refactor).
- **Leif + tribal review** before any Miwok/Maidu sacred site is shown as a coordinate-specific
  destination. `chawse_indian_grinding_rock` is flagged `needsTribalReview`; other sacred-site
  content in `src/app/explore/data/spiritualSites.ts` was left untouched and is flagged for the
  hub, not edited unilaterally.
- **Unowned-lane duplicates of the corrected facts** (e.g. `src/app/oregon-trail/data/worldMaps.ts`
  line 441 still says "Black Bart was captured here in 1883") are flagged for the owning lane —
  not edited in this pass.
