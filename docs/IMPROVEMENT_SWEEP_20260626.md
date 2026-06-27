# BOBR Live-Game Improvement Sweep — 2026-06-26

**Session:** full-auto / team-of-agents / deep-research. Goal: *"a full and advanced game the way it is, with improvements noted — amazing results."*

**Method:** 6 `Explore` agents fanned out across the live subgames → each finding **adversarially verified** by an Opus-4.8 agent that re-read the cited code (several plausible-but-wrong findings were killed: settlement routing, karma desync, Mandelbrot race, a misdiagnosed time-echo fix). **22 findings survived verification.** Safe ones implemented + tested; design-sensitive ones routed to Grok (CLI).

**Gates (every commit):** `tsc --noEmit` 0 errors · tests 29/29 · reward-guard pass · prod build EXIT 0.
**Grok verdict on direction:** **9/10** — *"decompose + harden before new features, no overreach."*

---

## ✅ Shipped (branch `feat/bobr-improvement-sweep-20260626`)

| # | Area | Fix | File |
|---|------|-----|------|
| 1 | oregon-trail | Random-event weather used `prev.distance` not `newDistance` → wrong weather in terrain-sensitive zones (mountains/desert) | `oregon-trail/state/travelEngine.ts:339` |
| 2 | investigations | Pressing the witness at exactly 0.5 leads went straight to `cold`, skipping the hard clue the press paid for. `next<=0` → `next<0` | `components/TownInvestigation.tsx:48` |
| 3 | karma-market | Two unlock checks hardcoded ID arrays duplicating data-layer helpers → now `getDomesticTreatCategories()` / `getAllRareMomentoIds()` | `karma-market/marketContext.tsx` |
| 4 | cross-progression | Adventure never synced SADDLE → cross-game `CharacterQualities`; chase-ledger free-witness gates + trophy card showed the 50-default. Now syncs on character load | `adventure/play/page.tsx` |
| 5 | adventure | Where-in-Time chase was undiscoverable from `/adventure` (only `/hub` + `/prologue`) → added a discoverability card | `adventure/page.tsx` |
| 6 | adventure | **Quest `skill_check` objectives had no auto-trigger** → entire quest paths uncompletable. Extended `QuestEvent`, exact target+stat+dc matching, fires on NPC-check success | `adventure/play/page.tsx` |

---

## 📝 Noted follow-ups (verified real, deferred with reason)

- **Quest skill_check — location-targeted checks** (the other half of #6): the generic `handleSkillCheck` lacks location context; needs an optional `target` threaded through LocationView/Camp/DialogueView/Confrontation. Grok-sketched. *NPC path shipped is strictly additive — no regression.* Also `item`/`choice` objectives stay on the explicit `fireQuestObjective` escape hatch for now.
- **`plantTimeEcho` metadata** (`prologue/prologueContext.tsx:280`): `recordMilestone` dedups by milestone *id*, and `time_echo_found` is a single id — so per-echo timestamps would only store the **first** echo. Needs per-echo id or a different dedup. *Naive fix is broken — do not ship as-is.*
- **Ranch `number_42` echo** (`ranch-treasure-hunt/page.tsx:165`): 5 echoes manifest at the ranch but the inline list has 4, the denominator is a hardcoded `/7`, and the counter sums *all* echoes. Three entangled pieces — fix as a unit.
- **Dead D&D inline creator** (`adventure/page.tsx:701-955`): confirmed unreachable (`setShowNewGame(true)` never called). **Grok: remove it** (SADDLE is the sole canonical stat system). Deferred to a dedicated 255-line cleanup commit.
- **Prologue convergence milestone** never recorded — tied to the unimplemented convergence (below).

## 🤝 Grok-before (consulted via Grok CLI — verdicts logged)

- **D&D ↔ SADDLE conversion** → **DO (prune).** SADDLE is canonical; D&D is dead for live play. Remove the dead creator + rpgContext D&D new-game surface. No mapping shim needed.
- **Marketplace server-persistence** → **DON'T.** Purchases (treats/momentos) gate only in-game cosmetic/explorer unlocks and have no real-money value; server-persisting them would re-open the client-mint surface the reward-guard deliberately closed. localStorage is correct.

## 🎨 Leif decision (large / content)

- **Convergence climax is an unimplemented stub** (`prologue/convergence/play/page.tsx`): the narrative payoff — synthesize multi-era evidence → confront the Cortez myth — currently does nothing (static UI + Back button). Real content+design task; the milestone `prologue_convergence_complete` is defined but unreachable. **Highest-value content gap; awaits Leif's go.**

## 💤 Deferred (low confidence / cosmetic)

Fractional-leads UI display · evidence dedup label-namespace · investigation clue non-empty validation · explorer-context quality sync.

---

*Full machine-readable ledger: MB `bobr_improvements/sweep_20260626`. Grok retros: `research/grok_collaboration_retro_20260626_*`.*
