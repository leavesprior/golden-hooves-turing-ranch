# Peril → Death → Successor — design & integration plan

**Directive (Leif, 2026-07-02):** keep characters alive with reasonable effort, in
the Oregon-Trail spirit — reckless travel can bring illness/snakebite/injury that
need *medicine + time*; heedless play can kill; on death the story continues
through a **successor** (the Legacy theme), not a hard game-over. Not brutally
hard — modern, soft-world players.

## What's built now (this branch)

`perilEngine.ts` — a **pure, fully unit-tested** survivability core (no RNG, no
React). `perilEngine.test.ts` proves the tuning intent, not just the mechanics:
a careful player recovers; a heedless one dies after a survivable window; death
yields a successor legacy.

- **Vitality** (0 → death), ceiling from Durability (`100 + (DUR-8)·10`, floor 20).
- **Conditions**: `snakebite | fever | dysentery | injury | exhaustion`, each mild
  (1) / serious (2) / grave (3). Re-inflicting keeps the worse; no duplicates.
- **Mitigations from existing advantages**: `immuneToDisease` (Iron Constitution
  negates fever/dysentery), `trailHardened` (travel perils land one lighter),
  `extraRest` (skill-tree rest bonus).
- **tick()** — each travel/day, untreated conditions drain vitality by severity.
  Default drain 6/severity → a serious condition gives ~8 ticks before death: a
  wide survivable window to reach camp.
- **treatWithMedicine()** — one dose removes 2 severity (cures serious, knocks
  grave → mild).
- **rest(days)** — the 7-day camp loop: regain 25 vitality/day and time-heal the
  worst condition one level/day. Recovery scales with how hurt you are; a full
  camp comfortably clears even a stacked affliction.
- **successorLegacy()** — heir inherits 50% gold, 25% reputation, and an
  `heir_of_<name>` keepsake trait.

**All lethality lives in `DEFAULT_PERIL_CONFIG`** — tune in one place.

## Not built yet — needs your decisions before wiring

This is deliberately **flag-gated** (`NEXT_PUBLIC_PERIL`) and un-wired until you
settle these, because they change how the game *feels* and can't be un-shipped
casually:

1. **Lethality tuning.** Are the defaults right? (drain 6/sev, rest 25/day,
   medicine −2, max 100). Want it gentler (lower drain / higher rest) or spicier?
2. **Which events inflict what.** Peril should fire from *travel encounters* (the
   existing `TravelEncounterOverlay` roll) and some *reckless dialogue choices*.
   Proposed: failed travel encounter → snakebite/injury (sev 1–2); "bad water /
   spoiled rations" flavor → fever/dysentery; a reckless choice (e.g. drink the
   saloon rotgut, ford the flooded river) → a rolled condition. **You pick which
   encounters/choices, and how nasty.**
3. **Medicine as an item.** Ride on the new `acquiredItems` inventory (Item 1):
   `medicine` bought at town shops / found on the trail, consumed via
   `treatWithMedicine`. Confirm the economy (price, where it's sold).
4. **Death framing + successor.** On vitality 0: a somber death scene (reuse the
   Oregon-Trail `GameOverScreen` pattern), then the heir takes up the trail —
   inheriting the legacy above and resuming at the current chapter's start.
   **Open:** who is the heir narratively (kin? a companion? a stranger who finds
   the body and the map?), and does the fallen leave a graveside marker like the
   real Old Thunder epitaph already in the data?
5. **Persistence.** Add `peril: PerilState` to `AdventureState` (save/load, with a
   defensive default like the other fields) — trivial once the model is blessed.
6. **Difficulty toggle?** Consider a "classic Oregon Trail" hard mode vs the
   default soft mode, since you named both audiences.

## Integration points (when you greenlight)

- `initPeril(durability)` at character load; store on `AdventureState.peril`.
- `handleTravel` / `TravelEncounterOverlay.onResolve` → `inflict()` on a bad
  outcome; `tick()` per leg. Honor `immuneToDisease`/`trailHardened` from the
  character's advantage flags (already in the pick data).
- Camp screen → `rest(days)` and a "use medicine" action → `treatWithMedicine`.
- A vitality HUD bar (the confrontation UI already derives a health number).
- Death check after each `tick`/`inflict`: if `isDead`, route to the death→heir
  flow and mint the successor via `successorLegacy` + `bobr_ot_character`.

**Dependency already handled:** Item 1 made consequences real (karma sink + quest
completion), so reckless play now also has moral/quest weight, not just physical.
