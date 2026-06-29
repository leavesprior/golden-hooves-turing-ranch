# BOBR Art Brief — STEP 3 (route to Grok, per-item Leif approval)

**Branch:** `fix/clue-consistency-from-live-20260625` · **Date:** 2026-06-25
**Status:** NOT routed. Grok cannot be driven autonomously (tab discipline + per-item Leif approval). This doc is the handoff packet.

## Global art requirements (apply to every asset)
- **Resolution:** 32–64px sprites, **rendered hi-res** (crisp pixel scaling, not blurry upscales).
- **Period-accurate:** correct era clothing, tools, architecture, signage for the depicted year.
- **Time-sensitive & MOVING:** deliver **animated sprite sheets** (idle + walk + one action frame minimum), with **era-correct conditions** (weather, light, season per scene).
- **Continuity:** characters must match the canon character the player built and carry forward (links to grok's "braided LegacyState" consistency line — same character across eras/subgames).
- **Hard rule:** the **coconut-run captain MUST be a kid** (child sprite, not an adult).

## A. Mystery #4 — CORRECTED to the Argonaut Fire (was: fabricated Kennedy flood)
⚠️ The mystery was rewritten this session (commit `2f9a18b`) from a fabricated "1922 Kennedy flood" to the **real 1922 Argonaut Mine fire**. Any prior art brief referencing a *flood*, *foreman Mahoney*, or *pump failure* is VOID. New scene needs:
1. **Argonaut headframe at night, Aug 27 1922** — single shaft, fire/smoke rising from the collar; period gold-quartz mine. (era: 1922 night, lamplight)
2. **Trapped miners building a bulkhead** in a crosscut — timber/rock/mud wall, carbide lamps; a miner scratching soot-message on rock ("gas getting strong, 3 o'clock"). Respectful, not gory.
3. **The rescue tunnel from the Kennedy mine** — crews clearing a caved drift / blasting a crosscut; canary on a pole. (the "Tunnel of Hope")
4. **Memorial** — 47 names, multi-nation (Italian/Serb/Spanish); St. Sava Serbian Orthodox church motif.
- Keep these tied to the existing Kennedy-site attractions (km_headframe, km_museum, km_tailings_wheels, km_memorial). Historically apt: the rescue originated at Kennedy; Argonaut+Kennedy = CHL #786.

## B. Chase NPCs (Carmen-style chase — Cyrus Vane "the Tare")
1. **Cyrus Vane wanted-poster** — gentleman-of-the-road, soft-spoken, **works on foot (afraid of horses)**; flour-sack/linen-duster Black-Bart energy but distinct. Poster styling, period typography.
2. **Eb Crandall** — chase NPC sprite (animated).
3. **Permit clerk** — chase NPC sprite (animated).
4. **Cynthia** — chase NPC sprite (animated).
5. **Elias Cole** — chase NPC sprite (animated).

## C. NPC portrait set
- ~**50 NPC portraits** for towns/encounters — period-accurate, era-correct, consistent style with the chase set.

## Routing checklist (for Leif)
- [ ] Leif approves each item (per-item).
- [ ] List Grok tabs first (tab discipline) before any browser routing.
- [ ] Coconut-run captain = kid (verify on delivery).
- [ ] Delivered assets reviewed against this brief before wiring into the game.
