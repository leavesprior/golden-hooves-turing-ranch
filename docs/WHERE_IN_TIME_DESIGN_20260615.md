# "Where in Time Is ___?" — the unified BOBR game (design canon)

**2026-06-15.** Leif's vision: a Carmen-Sandiego chase that travels across **time** (Gold Rush → present → future), with Oregon-Trail journey flow → Fallout-2 exploration, Douglas-Adams/Hitchhiker absurdist science comedy, a quantum / consciousness-outside-spacetime layer, the Pryor family history grounding it, and the player's trail performance carrying forward.

**Status:** design canon. This is a MAJOR guest-facing loop redesign → **Grok-before gate before any production deploy** (the adjacent Living Ranch vision already cleared Grok 9.2/10 ADOPT-WITH-CHANGES; this temporal extension + the "future is another player's present" economy mechanic are NOT yet consulted). Family canon (real Pryor history) = Leif per-item approval. Fix-first: DonationPanel client-mint + chain dev-keys before anything economy-facing ships.

## The core inversion
Carmen asks *where in the world*. This asks *where — and **when** — in time*. The quarry **Cyrus Vane "the Tare"** slips across **eras**, and he is the **same crime in every era's costume**: the assayer who shaves gold (1849) → the timber speculator (1883) → the land/rebate fraudster (1982) → the AI that mints fake reviews & karma (present) → forgery-of-presence itself (the future). Clues are period-attributes of a **time**, not just a place ("he paid in Spanish reales — so he's slipped before '49").

## The era ladder (the same land — West Point / Back of Beyond — across time)
1. **1849 Gold Rush** [EXISTS, richest] — Kit Carson's West Point trading post (CHL #268), Sandy Gulch, the Harris Ranch. Vane salts claims, shaves scales.
2. **1883 The Forester's Age** [NEW — family bridge] — the generation of Greg's forester father (Cal Fire lineage); on-site oak milling. Vane: crooked timber-claim speculator.
3. **1982 The Ranch Begins** [NEW — family bridge] — the Pryors buy 13 acres off the subdivided 1,000-acre ranch; passive-solar permit, undergrounded power line, the '83-milled oak. Vane: land-subdivider / solar-rebate fraud.
4. **Present — Back of Beyond Ranch** [EXISTS as the finale] — the real property; Cynthia greets you; QR markers; Elias Cole the ghost post-rider. Vane: AI minting fake karma/reviews.
5. **The Future = another player's present** [NEW — capstone] — not a painted set; the not-yet-collapsed actions of players who haven't arrived yet, read through the shared ledger. Vane "hides in the future" = hides in forgeable presence.

## The comedy register (fully built — wire, don't build)
`oregon-trail/narratorContext.tsx` is literally "The Unreliable Narrator — Douglas Adams Style" with an `intoxication` meter, `isLie`/`truthRevealedAfter`, `fourth_wall` + `philosophy` categories; `data/adamsEasterEggs.ts` covers Hitchhiker/towel/42/Dirk Gently. **The Guide becomes the frame narrator of the time-chase.** Re-skin the narrator's "drinking" as **temporal vertigo** (jumping eras disorients it); `isLie`+`truthRevealedAfter` become **paradox** (a thing true only two hops later). Twain (`twainCrossMode.ts`, a real 1860s time-local) narrates the player's arrival in 1982/2026 — the comedic core, a one-data-source extension.

## The quantum / consciousness-outside-spacetime layer (grounded in Neoma's own ternary work)
- **"Machine consciousness outside spacetime" = the narrator.** It sees all eras at once (reads the whole ledger across time) — which is *why* it's unreliable: a consciousness outside time genuinely can't tell you "what happens next" without collapsing it. Clue states are **superposed (`_conf=-1`) until observed** by a witness in that era, then collapse to fact. The comedy and the physics are the same mechanic (re-skin of the ternary `-1` observation-collapse, `ternary_consciousness_design_20260405`).
- **"The future = another player's present."** A player who reaches the present-day ranch (by booking + staying) becomes a **future witness**; their on-property, server-verified actions (Cynthia's-Witness kindness → signed good karma; QR-marker presence) write to the shared ledger. The *next* player chasing Vane "into the future" investigates **what another guest actually did**. Karma burned on real red-legged-frog stewardship becomes permanent future-era state the next player inherits. **Integrity (load-bearing):** routes through server-verified presence only (HMAC marker chain, geofence, QSD presence binding) — money only touches NEUTRAL; good/bad earn-only; no client-mint/model-mint. The villain's forgery and the security model are the same theme.

## The unified flow (binds the existing games in time-order)
Prologue (600–1500 AD Dreamtime — the Guide opens) → Oregon Trail (the 1849 journey → arrives at West Point) → **the "exploring point": trail flow hands off to Fallout-2-style free-roam** (already exists: `gold_country_explore`; resources/karma carry over — do well on the trail = better off here) → Adventure RPG / the chase loop → Explore (real towns = field investigation; solving a town corroborates a witness, shaves Vane's lead) → [1883 → 1982 family eras] → present-day ranch (QR markers, you ARE the future witness) → Karma Market + stewardship burn (persists into the next player's future).

## Fallout-2 adaptation (structure, not grimness)
Borrow the **two-mode loop** (world-map travel → walkable local map) + the **bottom HUD** (scrolling message-log + Pip-Boy MAP/stat buttons) — but render in our **warm Gold Country pixel palette**, amber-CRT not institutional-green, **top-down/oblique 2D not isometric** (no new iso engine). The travel screen is 80% done (`ChaseMap.tsx` SVG node-graph + `chapterLocations.connectedTo`). FO2 soundtrack MP3s already bundled in `public/rpg/sounds/fallout/`.

## First build (this session): `/adventure/where-in-time`
A self-contained playable prototype (like chase-demo was) — the era-chase: the Guide gives a period-attribute clue, you pick the **era** (the land's state across time), the Wanted Poster gains a per-era trait (what Vane forged in each age), wrong era costs causality, and the reckoning reveals he's the same crime in every costume + the quantum frame. Grounds the intermediate eras in real family/land history. Isolated route, no risk to live games.

## Existing vs new (the work is BINDING + a few reframes)
**Wire (exists):** Carmen engine ×2, 4-rule clue grammar, Cyrus Vane, Adams/Twain unreliable narrator + the Guide, the 3-era ladder, time-echoes, cross-game ledger + cross-mode narration, Explore town mysteries, the place-art pipeline, QR-marker finale, server-mint integrity, QSD presence vision, the Oregon→explore handoff + resource carry.
**Author (new):** time-as-search-axis; the 1883/1982 family eras; "future = another player's present" ledger-read; the consciousness-outside-spacetime narrator framing; Vane's per-era costume.
