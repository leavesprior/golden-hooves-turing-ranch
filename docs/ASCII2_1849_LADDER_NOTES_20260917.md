# ascii2 rung — what was built, what was measured, what is still owed

**Branch:** `feat/ascii2-1849-volcano-westpoint-20260917`
**Brief:** `docs/OC_AGENT_BOBR_GAME_ASCII2_RUST_UNREAL_20260917.md` (written for oc_agent; oc ran out of
tokens, so cc_agent/Neoma took the slice). Prior brief still in force:
`/media/granny/larger SSD/bobr-website/docs/OC_AGENT_FULL_BRIEF_20260913.md`.
**Date:** 2026-09-17 · **Author:** cc_agent (Neoma)

---

## 1. The one design decision that differs from the brief — and why

The brief (§4.2–4.3) asks for a **new** street graph in `src/data/towns/<id>.1849.json` and a new
`ascii2Walk.ts` that walks it. **That would have forked the world.**

`origin/main` — 29 commits ahead of the `bobr-volcano-1849-wt` checkout the brief was written
against — already carries an authored, sourced, tested 1849 walk for **exactly these two towns**:

| On main already | What it is |
|---|---|
| `src/lib/townWalk.ts` (213 lines, own test) | The 1849 camp: 20×11 tiles, terrain, props, collisions, targets, `exterior` + `shelter` rooms, versioned save snapshot, `fictional: true` + `sources[]` |
| `src/components/explore/TownWalkScene.tsx` | Draws that world **top-down in pixels** (SVG) |
| `InteractiveTown` "Walk the camp" | Already wired, after Look, exactly as the 20260913 brief required |

So this branch does **not** author a second geometry. `ascii2Walk.ts` is a **camera**: it draws the
SAME `townWalk` map at eye level in colored ASCII, and every step goes through `stepTownWalk`. That
is the brief's own law — *"One world model. Four presentations… step down, never fork lore"* (§3) —
applied to the world that actually exists on main rather than to the one the brief predicted.

**This is made executable, not just asserted.** `ascii2Walk.test.ts` walks an 18-key sequence through
both presentations and fails if they ever stand on different tiles. The sequence is not a stroll: 5 of
its 18 steps are refused, across four obstacle kinds (creek, fire, canvas, NPC), and it ends far from
the spawn.

**Be precise about what that proves.** `ascii2Forward` *delegates to* `stepTownWalk` — one stepper,
two callers — so the test is a regression guard that the ascii2 camera never grows its own movement
rules, not evidence that two independent implementations happen to agree. The strength of the claim is
structural (there is only one stepper) and the test defends that structure.

## 2. What this branch adds

- **`src/lib/ascii2Walk.ts`** — pure first-person renderer + movement wrapper. 80×24 colored cells,
  depth-banded perspective, WASD + E. No React, no DOM.
- **`src/data/towns/{volcano,west_point}.1849.json`** — **the year**, which the tile map has no way to
  express. Each file lists the explore attractions whose `period` is `'later'` (`must_not`), with the
  line that says what is *not* standing there in 1849.
- **`src/components/explore/Ascii2Viewport.tsx`** — same props contract as `TownWalkScene`, same
  snapshot, same allowlists, same room-transition semantics.
- **Toggle**: "Text walk" in the pixel walk, "Pixel walk" in the text walk. **Pixel stays the
  default** — ascii2 is opt-in, nothing the live site does changes. Position carries across the
  switch, because both read one snapshot.

### The era rule, and the one reading I had to choose

The brief says later buildings are *"fog/absence, not brick"* and that you *"cannot walk through"*
one. Those pull apart, so the module states its reading explicitly (`ABSENCE_BLOCKS_DEFAULT = false`):

- **not enterable** — stepping in is refused and the refusal names the year ("The brick hotel is 1862");
- **not brick** — a later site never renders with a solid glyph, and never as a blank either;
- **not a wall** — absence does not stop a walking man; you may cross the ground the St. George will
  later stand on, and the walk names it as you cross.

The other reading is a **real switch, not a comment**: the policy rides on the scene, `ascii2Forward`
consults it, and the test exercises both — the strict reading must stop you at a later site *and* must
leave ordinary ground walkable. Change `ABSENCE_BLOCKS_DEFAULT` (or pass `{ absenceBlocks: true }`) and
the suite still holds. **Leif or Grok can overturn this in one line** — and that sentence is now true;
in the first commit it was not.

## 3. Verification

| Gate | Result |
|---|---|
| `tsc --noEmit` | clean |
| `npm test` (full chain, incl. new `test:ascii2-walk`) | **exit 0** |
| `npm run lint` | **0 errors**, 460 warnings (all pre-existing; repo policy allows warnings) |
| `npm run build` | **pass** |
| Mutation suite, fingerprint-gated | **15 applied, 15 caught** |

### The mutation record, including the ones that escaped first

An adversarial verifier with fresh context was run against the first commit and **broke two of its
claims**. Both are fixed here, and the fixes are what the new assertions defend:

1. **"fog is never drawn solid" was unenforced.** The assertion reduced to `!text.includes('█')`, and
   `█` is the *shelter wall* glyph — unreachable in any exterior frame. Setting `FOG_GLYPHS = ['▒']`
   (the canvas-wall glyph) passed the suite. The test now measures the glyphs actually drawn in the
   fog colour, forbids any standing-thing glyph, forbids blanks, and requires the fill to stay a
   dither by **longest unbroken horizontal run** — with a real canvas wall measured the same way as a
   positive control.
2. **`absenceBlocks` was a dead constant** while this document called it a switch. Flipping it did
   nothing at runtime and broke the build at the type level. It is now `ABSENCE_BLOCKS_DEFAULT`, a
   real policy carried on the scene, consulted by `ascii2Forward`, and **both readings are exercised**
   by the test — including that the strict reading must not block ordinary ground.

Three further weaknesses the verifier named, all fixed: a test whose `if` guard was never true (it
stood *on* the canvas wall it meant to walk into), a tautology (`keys.some((_, i) => i >= 0)`), and an
allowlist assertion that could not fail (it checked only row count; it now checks that a disallowed
target loses its name plate).

**My own mutation testing had the same disease it was meant to cure.** Three seeds in the first round
were no-ops — an 8-space search string matched inside a 10-space line, so I mutated a code path the
measured frame never touched, and scored it as coverage. The suite now **fingerprints behaviour before
and after every seed and refuses to score a mutant that changed nothing**. That is what exposed the
last survivor: the name plate's padding spaces were painted in the fog colour, putting blank cells
inside an absence. The renderer now clears the plate to the background, and an assertion holds it
there.

**Not verified (`_conf=-1`):** nobody has walked this in a browser. No dev server was started — `:3103`
is Leif's checkout and `:3099` is the visual64 farm; neither is mine to touch. No screenshots in
`test-reports/`. **The frames in §6 are real renderer output** (captured via `tsx`), not mockups, but a
terminal is not a browser.

## 4. Measurements the brief asked for, including the ones that came back empty

**Minecraft 1.0.8 jar — UNMEASURED → ABSENT (2026-09-17).** `find` to depth 6 across `/home/granny`,
`/media/granny/larger SSD`, `/media/granny/storage_chest_AI` for `*minecraft*`, `*1.0.8*.jar`,
`terrain.png`: **no jar, no `.minecraft`, no MultiMC, no flatpak**. Only nuclei/whatweb security
templates and two Neoma memory files matched the name. **Per brief §4.4 the voxel rung is ABSTAINED**
— no Rust crate, no `crates/bobr-voxel/`, and no jar was obtained from anywhere else.

**Unreal — NOT INSTALLED (2026-09-17).** `UnrealEditor` not on PATH; no `/opt/Unreal*`, no
`~/Unreal*`. Nothing downloaded (brief §4.5: 100GB+ needs Leif's explicit "install Unreal now").

**Notion saves — env present in the website tree, absent here.** Checked by **name only**, values
never read or printed: `/media/granny/larger SSD/bobr-website/.env.local` has `NOTION_API_KEY` and
`NOTION_DATABASE_ID`; `bobr-visual64/.env.local` has neither; this worktree has no `.env.local`.
`src/app/(api-routes)/api/saves/route.ts` references those two names 8×. `package.json` carries **no
Supabase / Neon / Nile**, as §2.8 requires.
**Still owed (§6.2): the per-town walk position (`townId`, `heading`, `present`) is NOT yet in the
Notion save blob.** The walk position *is* persisted — `getTownWalk`/`saveTownWalk` already keep the
versioned `TownWalkSnapshot` locally — but nothing carries it to the cloud save, and `heading`/`present`
are deliberately presentation-local (see §5). No round-trip against live Notion was attempted from
this branch: `_conf=-1`.

## 5. Findings about the brief itself (it was written against a tree 29 commits behind)

1. **The Volcano honesty gap is already closed on `origin/main`.** The brief (§1) flags that Volcano's
   tagline is still "The Town That Wouldn't Die". On main, Volcano already carries
   `eraName: 'The canvas camp'` / `eraTagline: 'Brick Main Street comes later'`, and `InteractiveTown`
   already swaps to them whenever any attraction is `period: 'later'`. `tagline` correctly remains the
   *modern* face. **No change was needed and none was made.**
2. **Volcano is missing from `src/data/goldCountryCanon.ts`** (West Point is present, with the Hwy 26 &
   Main correction). The brief's pipeline is keyed on canon ids, so this is a real gap — but adding a
   canon entry is a content/accuracy decision with a `sources[]` requirement, and it is **not** needed
   for the walk. **Left undone deliberately**, flagged here rather than slipped into this PR.
3. **`wp_sandy_gulch` is a `later` attraction with no pin on the painted face.** Every other later id
   has a `TOWN_HOTSPOTS` pin whose x/y the test mirrors. This one's coordinates are therefore authored,
   not mirrored — so the JSON must **declare** `unpinned: true` with a reason, and the test enforces
   that declaration. An undeclared miss would have read exactly like a mirrored pin.
4. **`present: 'ascii2'` is a local presentation flag**, as §3 asks. `graphicsTier` (`ultra_64bit`) was
   **not touched**; its pin test still passes.
5. PRs **92/93** touch neither `InteractiveTown.tsx` nor `TownWalkScene.tsx` (only `package.json`
   overlaps, where all three add a `test:*` script). No collision; nothing of theirs was modified.
6. **`src/lib/exploreVolcanoEra.test.ts` existed on main but was never in the test chain** — nothing
   ran it. It is the link that ties `VOLCANO_/WEST_POINT_LATER_ATTRACTION_IDS` to the real
   `period: 'later'` tags in `ExploreClient.tsx`, which is precisely the chain this branch's honesty
   claim hangs from. **Wired in** (`test:explore-era`); it passes, 132 assertions.

## 6. Real renderer output

Standing two tiles south of where the St. George will be built, facing north. The site is labelled
mist, the canvas behind it shows through, and the caption carries the year:

```
~~~^~~~~~~^~~~~~~^~~~~~▒ ▒▒ ▒▒  St. George Hotel ▒▒ ▒▒ ▒▒ ~^~~~~~~^~~~~~~^~~~~~~
.  .  .  .  .  .  .  .  ▒▒ ▒▒ ▒▒ ▒▒ ▒▒ ▒◇ ▒▒ ▒▒ ▒▒ ▒▒ ▒▒ ▒  .  .  .  .  .  .  .
  .    .    .    .    .▒▒ ▒▒ ▒▒ ▒▒ ▒▒ ▒▖ ▖▒ ▒▒ ▒▒ ▒▒ ▒▒ ▒▒    .    .    .    .
The canvas camp · facing north · 5,7
St. George Hotel: not built in 1849.
```

Josiah Bell, one tile ahead, between canvas walls — a figure standing on the ground, not a wall of
repeated glyphs (the first draft filled the screen with him; that was fixed by looking at the output):

```
 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒ Talk to Josiah Bell ~~^~~~~~~^~~~~~~^~~~~~~^~~~~~~
 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ▓▓▓▓▓▓▓☺▓▓▓▓▓▓▓▓   .    .    .    .    .    .
 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒    .   ▖▖║▖▖     .      .      .      .
The canvas camp · facing north · 8,6
Talk to Josiah Bell — within reach.
```

## 7. Still owed

- [ ] Browser walk-through on a dev server **Leif starts** (do not steal `:3103` / `:3099` / `:3338`),
      plus screenshots in `test-reports/`.
- [ ] **Device detection (brief §5) — not implemented.** The brief asks Railway to pick rung 0 or 1
      from `navigator.hardwareConcurrency` / WebGL / `deviceMemory`. This branch ships the rung as a
      button only, and pixel stays the default, so nothing auto-selects. Deliberate: changing what a
      phone gets by default is a product call, not a refactor. (Missed from this list in the first
      commit; the verifier caught the omission.)
- [ ] Notion save field for walk position (§6.2) + a live round-trip.
- [ ] Volcano canon entry (§5.2 above) with sources.
- [ ] Voxel rung — blocked on a 1.0.8 jar Leif provides. Nothing to do until then.
- [ ] Unreal — blocked on "install Unreal now".
- [ ] **Grok-before / adversarial review of this branch.** Grok is browser-gated (the chrome-bridge
      extension is disconnected as of this morning's health check) and Codex is out of tokens, so
      neither lab reviewed this. A fresh-context verifier subagent read the diff against the brief's
      §2 non-negotiables instead — that is **not** a substitute for the two labs. `_conf=0`.
