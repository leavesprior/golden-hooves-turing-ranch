# Starting SADDLE and paid teamster recovery

This follow-up completes the four remaining items in brief §6: pass the created SADDLE block into trail state, apply Durability to ford injury severity, charge tacos for a teamster, and align sheet warnings with the existing travel engine. It preserves the six stats, seven background IDs and bonuses, existing kid-mode DCs, and Golden Frog Trail completion gates.

The isolated worktree is `bobr-live-saddle-teamster-wt`, branch `fix/live-saddle-and-teamster-20260913`. Final integrated verification used code commit `e2f1b7fe8fa99fd069f763b663aba8e1cd338f69` on merged main `db6b9d264fdae430e13c1e020bdc58ed4f0ac690`. The earlier temporary dependency was E commit `54fe1efe90e81ad44e2202fe3f67a6b05485879f`; its wallet implementation is now present through merged main. This slice calls that existing durable receipt API without copying or replacing it. Release remains root-owned.

## Starting stats and travel

`CharacterCreationScreen` calculates `withBackgroundBonuses(statsRef.current, selectedBackground)` once and gives that same finalized block to `createCharacter` and `beginJourney`. It avoids reading a stale character render immediately after creation. Displayed background totals now use the existing creation cap of 18, matching the value actually saved.

`BEGIN_JOURNEY` accepts an optional snapshot. `copySaddleSnapshot` validates all six existing finite numeric stats, copies them, and bounds them to the existing 1–20 gameplay range. Optional callers and older saves keep their established fallback; no extra character sheet or new stat system is introduced. The ordinary trail save keeps the snapshot. Daily travel and hunting use their existing `state.saddle` consumers.

**Boundary:** this is the starting snapshot. It does not continuously synchronize later trait, gear, or level-up modifiers from the character provider. UI/browser verification below uses ordinary creation without a reward-triggering inventory item, and proves the starting bonuses reach actual travel.

## Ford severity policy

This is authored game balance, not a historical or physiological claim. For fording, the reduction is `max(0, floor((boundedDurability - 5) / 4))`, with finite Durability bounded to 1–20 and invalid values treated as 5. Thus Durability 1–8 has zero reduction; 9–12 prevents one injury point; 13–16 prevents two; 17–20 prevents three.

The reduction applies to the existing negative party-health delta and, when present, the existing specific injury's damage. Baseline 5 remains exact: critical failure is still −20 party health plus the existing 40-point specific injury; ordinary failure remains −8, or −15 in high water. At 17–20 those values become −17/37 and −5/−12 respectively. Existing choice, roll, difficulty, success, critical status, outcome prose, death resolution, failure art, resource losses, and RNG draw count remain unchanged. The other four crossing methods are unchanged. The existing death transition still evaluates the resulting health normally.

## Teamster order and payment

The no-oxen event now offers **20 tacos, two oxen, two days**. The previous 20-food deduction is removed; the two oxen and two days are retained. The UI intercepts this choice before generic event outcomes, and the reducer refuses the generic hire path even for old saved events containing the former food-price outcome.

The provider saves a small versioned `teamsterHire` record with a distinct `teamster_…` ID and cost 20 before any payment. It then awaits E's `spendTravelFare(id, 20, memo)` and confirms `hasTravelFareReceipt(id, 20)`. Only then does it save and accept the guarded completion transition. That transition adds the yoke and days once and clears the pending event/order.

The existing local autosave writer performs both critical saves. A failed preparation save cannot debit. A failed wallet write cannot add oxen or days. A failed completion save leaves the pending order and already-durable wallet receipt; retry and reload reuse the same order ID without a second debit. A provider ref and UI ref reject concurrent same-event attempts. A paid pending order disables walking/abandoning until completion; an unpaid failed attempt can be cancelled through the existing walk/abandon choices after a successful cancellation save.

`SaveLoadIntegration` protects a newer wallet when an older slot contains the exact valid pending teamster order and its local receipt exists. Pending-order retention also recognizes the supported My Farm overlay (`ranch_management` with `previousPhase: event` and the unresolved no-oxen event). This preserves the same order through Farm → reload → Back to Trail, and protects an older farm slot's post-payment wallet. Hiring still requires the actual event screen; unrelated phases cannot complete the order. A mismatched order, invalid cost/version, unrelated event, or missing receipt does not activate wallet protection. Existing Gold Country trip protection remains intact.

These are local campaign guarantees, not a server transaction, blockchain settlement, cross-tab lock, or arbitrary old-slot rollback prevention. E's receipt history retains the latest 64 operations. Normal play keeps one teamster order active; this slice does not claim durable exactly-once behavior after intentionally abandoning that campaign and evicting its receipt through many unrelated purchases.

## Sheet wording

Snow and desert/grueling travel descriptions now name the health effects actually read by the engine; they do not promise a clothing-specific frostbite rule or an extra-water ration mechanic. One ox is described as straining the wagon and lowering morale, consistent with scarcity cascades. Zero oxen distinguishes a stopped wagon from a deliberately abandoned wagon whose party continues on foot.

## Verification and evidence

Focused tests in the normal `npm test` chain:

- `state/liveSaddle.test.ts`: exact six-stat action copy, background bonus once, optional legacy fallback, save roundtrip, actual reducer travel consumers and hunting.
- `data/riverDurability.test.ts`: all five methods × three roll values × three river conditions × nine Durability values, with unchanged non-injury outcome fields and RNG counts; baseline and upper-band injury values.
- `state/teamsterHire.test.ts`: generic legacy bypass prevention, validated/copy-isolated order, pure guarded preparation/completion/cancellation, donor fields, load migration, existing durable wallet replay, and exact slot predicate.
- Existing oxen tests now require generic hiring to wait for the paid order; existing river-art, kid-mode, and other regression tests remain registered.

`tools/liveSaddleTeamster.browser.ts` runs **18 full-app cases** across desktop 1280×960 and phone 390×844, starting with actual title Continue. Three creation cases allocate points through real keyboard/touch controls, finalize, leave Independence, travel, and reload. The saved character and starting snapshot must match exactly. Actual rainy miles, wagon wear, and strained-travel health must match the existing resolver and differ from the no-snapshot fallback as appropriate. Six teamster cases cover double-click, insufficient funds with walking, failed order save, failed wallet write, failed post-payment completion save with reload/retry, and paid-pending Farm → reload → Back → finish. They check exact debit, days, oxen, food, donor progress, order identity, write ordering, zero-oxen stopped distance, paid-pending controls, and horizontal layout. Only the farm regression uses a clearly labeled prior-completed-campaign fixture to expose My Farm; it does not claim to earn that completion. All other cases keep farming locked.

`tools/teamsterProvider.browser.ts` runs **eight cases** with the actual React wallet provider, trail provider/reducer, and actual `SaveLoadIntegration` in StrictMode. It covers concurrent hire/abandon calls, preparation failure, wallet failure followed by unpaid walking, loading matching/missing/invalid pending event slots, and matching/missing pending farm slots after a real debit and failed completion save. Matching slots preserve the paid wallet and retry to completion once. Only unrelated auth identity, save callback registration, mystery state, and network adapters are controlled; authenticated account APIs are not exercised.

**Final integrated results:** full `npm test`, nonincremental TypeScript, normal production build, and full lint all passed. Lint reported 460 existing repository warnings and zero errors. The frozen full-app harness passed **18/18 against production** with 30 screenshots; the actual provider/loader harness passed **8/8**. Both runs reported zero page errors and identical start/end source hashes. Build ID: `Bcc1nWQcFaTdNHl4L62Sn`. Runtime: Node `v20.19.0`, npm `11.12.1`, Chrome `151.0.7922.71`. Owned ports 3362/3363 are stopped.

The compact tracked record is [LIVE_SADDLE_TEAMSTER_VERIFICATION_20260913.json](./LIVE_SADDLE_TEAMSTER_VERIFICATION_20260913.json). Raw local evidence is in `artifacts/live-saddle-teamster/production-integrated/results.json` and `provider-integrated/results.json`, with command logs, `VALIDATION.json`, and `BROWSER_QA.md` alongside. It records source, harness, and result hashes. The working tree was clean throughout code verification; only these documentation records were added afterward. Results prove the bounded paths above, not every campaign system or public deployment.

Earlier checkpoints remain distinguishable: development initially passed 16/16 and provider 6/6; independent review then found the farm-overlay retention gap. After its correction, targeted desktop/phone farm checks passed 2/2 and provider checks passed 8/8 before final integration. The old-base `production-final` run was deliberately interrupted for that fix and is not a final pass; `production-integrated` is the complete final production run.

## Preserved baseline finding

The first development fixture included an already-owned towel. After real creation, the existing automatic Hoopy Frood effect added trait modifiers twice under development StrictMode: finalized gambler Luck 18 became saved character Luck 22, and Durability 5 became 7. The first strict comparison therefore failed. That original evidence remains in `artifacts/live-saddle-teamster/development/results.json` and its error screenshot.

The final fixture uses a neutral prior keepsake so starting creation can be verified independently. H does not repair that pre-existing trait duplication, change towel rewards, or add continuous character-to-trail synchronization. Production repeats the ordinary no-towel creation paths separately. A first build also caught missing explicit result types in the newly added provider harness; those annotations were corrected before final build verification, without product behavior changes.
