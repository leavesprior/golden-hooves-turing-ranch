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

So this branch does **not** author a second movement geometry. `ascii2Walk.ts` is a **camera**: it
draws the SAME `townWalk` map at eye level in colored ASCII, and every step goes through
`stepTownWalk`. **One overlay is its own** (corrected 2026-09-18 after Grok's review — the first
wording said the camera owns no geometry, which was false): `placeLaterSites` snaps each later site's
painted-pin percentage to the nearest passable, non-target tile. Those tiles are authored, not
surveyed, and the pixel walk never draws them. Two land awkwardly — see §8. Camera-not-fork
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

- **not enterable** — pressing E (or looking) at a later site is refused, and the refusal names the year
  ("The brick hotel is 1862"). *Walking* onto its ground is allowed — see "not a wall". (Wording
  corrected 2026-09-18: it first said stepping in was refused, which is only the strict reading.);
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
| `npm test` (full chain, incl. new `test:ascii2-walk`) | **exit 0** — re-run 2026-09-18 on Node 20.19 (the repo's `engines` floor is 20.9; on `/usr/bin/node` 18 the chain dies at `test:local-backend` with `crypto is not defined`, which is the environment, not the code) |
| `npm run lint` | **0 errors**, 460 warnings (all pre-existing; repo policy allows warnings) |
| `npm run build` | **pass** |
| Mutation suite, fingerprint-gated | **8 scored, 8 caught, 0 no-op** — `node scripts/ascii2-mutants.mjs`, committed 2026-09-18. The 2026-09-17 "15 applied, 15 caught" came from a harness that lived in a session scratch folder and is gone; that number is unreproducible and stands at `_conf=-1` |

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

### It has now been walked in a browser (2026-09-18)

`scripts/ascii2-walk-browser-check.mjs` drives real headless Chrome through the ranch-house QR gate
into Volcano, starts the pixel walk, steps down to the text walk, walks with the keyboard, and steps
back up — asserting on what the page actually shows. **41 checks, 0 findings, 0 console errors** on
2026-09-18 early — and that run was **wrong about the frame**: see §8. After the review the check is
**58 checks, 0 findings, 0 console errors**, and it now also drives West Point.
Screenshots and `result.json` in `test-reports/ascii2/`. It ran against a dev server on **:3107**, a
port nobody else was using; `:3103`, `:3099` and `:3338` were not touched.

Measured, not assumed: the 1849 face reads "The canvas camp"; position carries **both ways** across the
toggle (10,9 → 10,9, then 9,7 → 9,7); the keyboard visits 5 distinct tiles; the frame is 24 row
elements **and** copies out as 24 real lines; and a later site announces itself —
*"Cobblestone Theatre: not built in 1849."*

**Three defects the browser found that no unit test could:**

1. **The frame copied out as a single run-on line.** Rows were separated by `display:block`, which
   looks right and copies wrong. They are newline-separated now, and the check counts both ways.
2. **The walk covered its own controls.** Three of four direction buttons on desktop and all four on a
   phone sat underneath the town panel — a walk you cannot steer. The check now measures every control
   at 1280×900 *and* 390×844, and asks `elementFromPoint` whether the button is the thing actually
   painted there, because "inside the viewport" was true while it was buried.
3. **80 columns on a phone is a smear.** Fitting it required shrinking the text to ~4px. The brief
   allows a **40–80 column** frame (§3), so the renderer is now width-aware and narrow screens get the
   40-column frame at a legible ~9px. `ascii2Walk.test.ts` holds every era rule at 40 columns too.

The eye line also moved up (row 9 → 6): nine blank rows of sky were half the frame drawing nothing.

**Still not verified (`_conf=-1`):** no human has looked at it — this is a machine walking a machine.
A person may still find it ugly or unreadable, and that judgement is Leif's.

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

**Traced 2026-09-18 — §6.2 is not a field add, so it was not built here.** `saveToCloud`
(`src/lib/cloudSave.ts`) has exactly **one** caller: `src/app/adventure/play/page.tsx` (the Oregon
Trail adventure). Explorer progress — `townWalks` included — lives only in localStorage
`gold_country_explorer_progress` and reaches **no** cloud save at all. Putting the walk into Notion
therefore means wiring the whole explorer into cloud saves (a new `SaveType`, or grafting explorer
state onto `adventure_save`), plus a passphrase flow on `/explore` that does not exist. That is an
architecture and product decision, not the slice this branch owns. Where §6 actually stands:

| §6 item | State |
|---|---|
| 6.1 env names present | yes, in `bobr-website/.env.local` (names only) |
| 6.2 walk position in the save blob | **no cloud path exists for explorer state** — question put to Grok/Codex |
| 6.3 localStorage offline rung | **yes** — `townWalks` is versioned, normalized, and survives reload |
| 6.4 Notion down ⇒ play local, don't fake a cloud save | holds trivially: explorer never claims a cloud save |

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
   claim hangs from. **Wired in** (`test:explore-era`); it passes, 132 assertions, and it covers
   **both** towns (it loops `VOLCANO_` *and* `WEST_POINT_LATER_ATTRACTION_IDS` against the source
   tags). Note for the next reader: its JSON output field `later_ids: 4` is
   `VOLCANO_LATER_ATTRACTION_IDS.length` — a reporting artifact, not the extent of coverage. A count
   wearing a narrower name than the thing it measures is exactly the shape that misleads; it misled a
   reviewer of this branch already.

7. **Grok/Codex review is a queued obligation, not a skipped one.** Stub at
   `grok_le_grange_queue/bobr_ascii2_rung_pr94_20260917` (`structured_envelope_v1`, `ternary_conf=-1`,
   `status=pending_verdict`) carrying the five questions that actually matter — chiefly whether
   camera-not-fork was the right call and whether the absence reading should be overturned. The
   project record is `_conf=-1` until a lab answers (friendship bundle rule 4).

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

- [x] ~~Browser walk-through plus screenshots in `test-reports/`~~ — done 2026-09-18 on `:3107`
      (`npm run test:ascii2-browser`, now 58 checks, 0 findings, both towns). A **human** look is still owed.
- [ ] **Device detection (brief §5) — not implemented.** The brief asks Railway to pick rung 0 or 1
      from `navigator.hardwareConcurrency` / WebGL / `deviceMemory`. This branch ships the rung as a
      button only, and pixel stays the default, so nothing auto-selects. Deliberate: changing what a
      phone gets by default is a product call, not a refactor. (Missed from this list in the first
      commit; the verifier caught the omission.)
- [ ] Notion save for walk position (§6.2) — **blocked on a decision**: explorer state has no cloud
      path at all (§4, traced 2026-09-18). Whether it should, and under which `SaveType`, is Leif's call.
- [ ] Volcano canon entry (§5.2 above) with sources.
- [ ] Voxel rung — blocked on a 1.0.8 jar Leif provides. Nothing to do until then.
- [ ] Unreal — blocked on "install Unreal now".
- [x] ~~Grok-before / adversarial review of this branch~~ — done 2026-09-18, both labs, see §8.
- [ ] **A human look** — the one gate no machine closes. See §8 for what to look at.

## 8. Two-lab review, 2026-09-18 — what held, what broke, what I refuted

Run `neoma-council 20260918_082706_bobr-pr94-review`: Grok (grok-4.6) and Codex (gpt-5.5), read-only,
same prompt, told to break claims rather than agree. **Both returned CHANGES-NEEDED; both endorsed the
design** (camera-not-fork; keep `ABSENCE_BLOCKS_DEFAULT = false`; don't graft explorer onto
`adventure_save`; device auto-detect is not load-bearing while there is only one rung to pick).
Every finding below was re-checked against the code or a live run before it was acted on.

**Broke, and fixed on this branch:**

| Finding (who) | What was actually true | Fix |
|---|---|---|
| The frame's last row — the caption that names the year — was hidden (Grok, from `03-ascii2-walk.png`) | Real, and **worse than the screenshot**: 16px hidden on desktop, **103px on a phone**. Cause: `.visual64-shell span { line-height: 1.45 }` in `globals.css` overrode the frame's 1.05 on every row span, so rows were 1.45× the font. My 41 checks measured the buttons, never the frame. | `lineHeight: inherit` inline on every frame span; glyph size and box height now come from **one** budget. New `frameFits` check asks what is painted at the last row. Before the fix it reported 6 FAILs; after, 0. |
| "5 refusals, 4 obstacle kinds" was prose; the test only checked parity + left-spawn (Grok) | Real. Removing the fire left the old test green (**measured**: old test rc=0 on that mutant). | Parity test now pins 5 refusals, `{canvas, fire, npc, water}`, end at 8,4. |
| West Point pack-road assertion sat inside an `if` (Grok) | Real. Blocking that tile left the old test green (**measured**: rc=0). | `assert.ok` on the fixture, then the assertion. |
| Browser: "5 distinct tiles" claimed, `seen.size > 1` checked; `note(true, …)` could not fail; `04-absence-line.png` shot after the line had gone (Grok) | Real, all three. | `>= 5`; both `note(true)` now test something; the shot is taken while the line shows. |
| West Point never driven in a browser (Grok) | Real. | Second pass: toggle parity, 24 lines, frame fit, 8 tiles walked, "Main Street walk: not built in 1849." |
| "15/15 caught" not reproducible (Grok) | Real — the harness was in a deleted session scratch folder. | `scripts/ascii2-mutants.mjs` + behaviour probe, committed: **8 scored, 8 caught, 0 no-op**. Two of the 8 are caught only by today's new assertions. |
| "The camera owns no geometry" (Grok) | False as worded — ghost placement is an authored overlay. | Wording corrected in §1 and in the module header. |

**Refuted (checked, did not hold):**
- *`npm test` exits 1* (Codex) — Codex ran `/usr/bin/node` **18.19.1**; the repo needs ≥20.9. Reproduced:
  on Node 18 `localBackendAccess.test.ts` throws `ReferenceError: crypto is not defined`; on Node 20
  the whole chain exits 0 (21.8s, 2026-09-18). The failing test is main's (#90), not this branch's.
- *The §6 dump is not "two tiles south" of the St. George* (Grok) — the dump's own compass reads `5,7`
  and the ghost sits at `5,5`: two tiles. Grok compared it to the test fixture at `5,6`.
- *"Facing survives the toggle" is half-true* (Grok) — these notes never claim facing carries, only
  position. The observation underneath is real, though, and is in Leif's list below.

**Left for Leif — judgement calls, not bugs:**
1. **Where two ghosts land.** The Cobblestone Theatre snaps to `(10,5)`, the road straight north of
   spawn, so the text walk's very first line is *"Cobblestone Theatre: not built in 1849."* The St.
   George snaps to `(5,5)`, the canvas saloon's doorstep, so standing in the hotel's mist and pressing E
   walks you into the 1849 saloon (true to 1849, and odd to stand in). Grok's advice: don't hand-author
   a survey to fix it. Moving them is a one-line data change if you want it.
2. **W means different things in the two walks.** Pixel: W = north (map-relative). Text: W = forward
   (first-person). Switching carries your tile, not your facing — pixel starts facing south, text
   north. Deliberate for a first-person view; say if you'd rather it matched.
3. **Explorer → Notion** (§4): whether the explore game should cloud-save at all, and under a new
   `SaveType` (both labs: new type, never `adventure_save`).
4. **Device auto-detect** (brief §5): both labs say it can wait until there is a second rung to pick.
5. **Is it good to look at?** The frame is mostly sky and ground dots with the town in a band across
   the middle. That is taste, and it is yours.


## 9. Recognition pass: ground truth first (2026-09-18, after Grok's 32-bit flesh)

Leif asked for spatial accuracy against Google Maps and historical accuracy before more pixels.
Everything measured, cited or still unknown is in **`docs/ASCII2_1849_SPATIAL_LEDGER_20260918.md`**,
which keeps where-things-are, when-things-were and what-the-game-draws in separate sections. In short:
Volcano's camp is now georeferenced (about 120 m per tile, anchored on the OHP No. 29 marker). The
creek and the graves follow today's ground, and the St. George fog stands on its real footprint.
Sandy Gulch is 2.3 km SSW on the horizon, not in the camp. Eight dates or claims were corrected
against primary records. Eye-level draws the USGS horizon by heading, the camp's own ground in
perspective (an inverted perspective is fixed), and one wall tent. Leif's look is still owed.
