# Adventure — Ability Wiring Map

How to make a S.A.D.D.L.E. pick (advantage) *actually do something* in gameplay,
instead of being flavor text. Two abilities already follow this pattern; the rest
are a recipe away.

## The pattern (proven 2026-06-09)

1. **Structured intent on the data.** Add a typed field to `Advantage`
   (`src/app/adventure/data/advantages.ts`) describing the effect — not prose.
   - e.g. `startingReputation?: { faction: FactionId; amount: number }`
2. **One consume-point in the owning system**, gated on the pick id.
   - Read the player's picks once: `JSON.parse(localStorage.getItem('bobr_adventure_picks')).picks` → `string[]`.
   - Helper shape: `const has = picks.includes('<id>')` → apply the effect at the single place that system computes the thing.
3. **Idempotency where it matters.** One-time effects (starting bonuses) need a guard
   flag on `AdventureState` (see `startingAbilitiesApplied`). Per-event effects
   (multipliers) don't — they recompute each time.
4. **Verify both branches** (with-pick vs without) — ideally behaviorally.

### Reference implementations (in `src/app/adventure/play/page.tsx`)
- **badge_of_authority / local_connections / wanted_man** → `startingReputation`
  field + a one-time guarded effect calling `modifyReputation(...)`. Guard:
  `adventureState.startingAbilitiesApplied`.
- **quick_learner** → `skillCheckXP(amount)` helper (`picks.includes('quick_learner') ? ×2 : ×1`)
  applied at the skill-check XP sites: `handleNPCTalk` (15/5) and clue XP (`handleAddXP`).

---

## Per-ability consume-point map

| Ability | Effect | Consume-point (file:where) | Notes / hook |
|---|---|---|---|
| `quick_draw` | Always act first in confrontations | `components/adventure/ConfrontationView.tsx:63` — `useState<Phase>('player_turn')` + the enemy-initiative path | ⚠️ Initial phase is already `player_turn`. Quick Draw only *matters* if an ambush/surprise path can start on `enemy_turn`. Wire alongside (or first build) a surprise-round mechanic, then force `player_turn` when the pick is present. |
| `silver_tongue` | Shop prices −20% | `components/adventure/LocationView.tsx` — shop items carry `cost` (l.75–83); apply `Math.ceil(cost*0.8)` at the **purchase** site (`handleSearch`/buy handler) | Pure multiplier; no idempotency needed. Show the discounted price in the UI too. |
| `trail_hardened` | Travel encounters less dangerous | travel-encounter resolution (`rollTravelEncounter` consumer in `play/page.tsx handleEncounterResolved`) | Reduce failure odds / damage when present. Needs the encounter object's danger field. |
| `iron_constitution` | Immune to disease events | same travel-encounter path; skip/auto-pass encounters tagged disease | Add an encounter `type`/`tag` check; if disease + pick → auto-resolve success. |
| `gold_nose` | Better rewards from search | `components/adventure/LocationView.tsx:145` `handleSearch` | Multiply the search reward (gold/XP) when present. Mirror of `skillCheckXP`. |
| `wilderness_sage` | Camp scout always succeeds | `components/adventure/CampManagement.tsx` scout action | Force success on the scout roll when present. |
| `eagle_eye` | Crime-scene clues reveal an extra trait | clue/search reveal logic in `LocationView` | Display-layer: reveal one more detail. Pairs with born_detective. |
| `born_detective` | Witness reliability always visible | NPC render in `LocationView` (witnessType lives in `chapterLocations.ts`) | ⚠️ No reliability-display infra found yet — needs a small UI addition first, then gate it on the pick. |
| `empathic` | NPC mood always visible | NPC render in `LocationView` | ⚠️ Same — needs an NPC-mood field + display before it can be gated. |

Legend: ⚠️ = needs a small piece of *missing* infrastructure before the gate is meaningful (not just a gate on existing logic).

## Order of least → most effort
1. `gold_nose`, `silver_tongue` — pure multipliers on existing values (cleanest, like `skillCheckXP`).
2. `trail_hardened`, `iron_constitution`, `wilderness_sage` — gate an existing roll/branch.
3. `quick_draw` — needs a surprise-round mechanic to exist to matter.
4. `eagle_eye`, `born_detective`, `empathic` — need a display/data piece built first.

## Verification note
Anything touching **confrontations or the explore-map walk** can only be behaviorally
verified in a **foreground browser tab** — Chrome pauses requestAnimationFrame in
background/occluded tabs, so automated playtests stall the walk and never reach a
confrontation. Code-verify + tsc, then confirm in a real playthrough.

_Last updated 2026-06-09. Pattern proven by `startingReputation` + `skillCheckXP`._
