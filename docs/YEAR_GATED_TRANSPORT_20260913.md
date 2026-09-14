# Slice 7 — year-gated Gold Country transport

This change adds travel choices to the existing Gold Country map and town streets. Every different-town trip passes through the existing travel screen and arrival reducer. It does not add a second travel resolver or change Chapter 1 mileage, damage, SADDLE stats, farm rules, shops, or rewards.

## Playable route and calendar

From an existing town, use **Travel from this town**, choose a known destination, then choose Wagon (On foot with zero oxen), Stage, or Rail. Existing map pins open the same choices. The current town still opens directly. Adjacent towns now take time instead of bypassing travel through “Enter.”

The displayed simulation year starts at 1849. It uses 360 days per year, with elapsed days `(day - 1) + (goldCountryDay - 1)` and an optional integer minute remainder from 0 to 1439. Missing legacy Gold Country counters begin at day 1, minute 0. Invalid, negative, fractional, or overflowing counters reject travel instead of guessing a date. This is a game calendar, not a Gregorian date or a claim that an existing 1849 case has changed its historical period.

| Travel | Availability | Adjacent / other duration | Fare |
| --- | --- | --- | --- |
| Wagon / on foot | Existing known roads | 480 / 1440 minutes | None |
| Stage | 1852 onward | 240 / 720 minutes, plus delay | `4 + 2 × game distance` tacos |
| Rail | 1869 onward, Sacramento–Roseville pair only | 90 minutes, plus delay | 8 tacos |

The two regional gateways are additive route boards outside the painted map. The list and shared quote policy both reject them before their 1869 availability year, including attempts by wagon or stage. No railway station is placed at Volcano or West Point. Gateways have no invented shop, NPC, search reward, GPS-presence action, or mapped town pin. Their approximate city-area coordinates are explicitly not surveyed station positions.

Paid trips read the existing character’s Luck, bounded to its 1–20 range, and one random roll. That exact roll, effective Luck, event and duration are persisted at departure. Weather, robbery alerts and wreck delays change minutes only. Stage delays are 30/60/120 minutes; rail delays are 15/30/60 minutes. Higher Luck cannot worsen an identical roll, and even the longest paid delay is shorter than the ordinary road trip. These are simulation choices, not historical fares, schedules, or damage odds.

## Historical evidence and authored choices

* Wells Fargo’s official history dates its founding to March 18, 1852. That date informs the user-requested game gate; it does **not** establish an 1852 scheduled coach on every game road. The UI calls these services fictional local charters. [Wells Fargo history](https://history.wf.com/serving-customers-since-1852/)
* California Historical Landmark 780-1 records Central Pacific track reaching Junction on April 25, 1864, beginning the daily 18-mile Sacramento–Roseville run. This supports the reviewed endpoints. [California Office of Historic Preservation](https://ohp.parks.ca.gov/?page_id=21450)
* The national transcontinental connection was completed on May 10, 1869. Rail opens in 1869 here to follow the brief, even though the local segment opened in 1864. [National Park Service](https://www.nps.gov/im/ncpn/bpd-gosp.htm)
* The route boards link named local history pages. [California State Railroad Museum, Sacramento](https://www.californiarailroad.museum/visit), [City of Roseville history](https://www.roseville.ca.us/government/departments/police_department/about_roseville_police/history_of_roseville_p_d)

The 360-day year, road connections, game distance units, route boards, prices and delays are authored game rules. No Black Bart identity is invented for an early robbery alert.

## Persistence and payment ordering

`GoldCountryTrip` lives in the existing Oregon Trail state. It holds an ID, version, departure clock, quote, original wagon encounter/choice, and one of `planned`, `paid`, `arrived`, or `cancelled`.

1. Departure synchronously saves the complete planned trip in the existing local trail autosave before attempting a fare. Ordinary free trips enter the paid/ready state without a wallet charge.
2. `spendTravelFare(id, amount, memo)` writes the debit and a matching receipt in one complete existing wallet-record write. The accepted in-memory wallet updates only after that write succeeds. Earlier ordinary wallet actions in the same event are included.
3. The paid trip is then saved. If that save fails, the plan remains available; the same ID reuses the durable receipt without another local debit or sync submission.
4. Only the matching ready trip may arrive. The existing arrival reducer updates location, whole-day counter and minute remainder, and marks the trip arrived. This complete state is saved before accepting the arrival. Repeated arrival calls and reloads cannot add its duration again.

Critical trip operations use the existing reducer once against the latest accepted state. The ordinary page debounce and unload writer read that same latest state at write time, so an older render cannot overwrite a newer paid trip. Wallet persistence likewise reads the latest accepted wallet.

Receipt IDs and amounts are validated; conflicting amounts reject. The wallet retains at most 64 receipts. The departure guard permits only one active journey. Receipts remain absent in untouched legacy wallets, and unrelated stored wallet fields are retained. Failed reads/writes or malformed receipt history do not silently discard receipts and charge again.

The read-only `hasTravelFareReceipt(id, amount)` checks the initialized accepted wallet. `SaveLoadIntegration` uses it when an explicitly loaded slot contains a valid pending Gold Country trip: a matching durable local receipt preserves the newer wallet instead of restoring the slot’s pre-fare balance. Without that exact match, normal slot balance/alignment restoration remains in force. Guest Continue already restores core trail state separately from the local wallet.

The page’s existing empty-wallet initialization remains unchanged. A missing wallet is initialized normally before a pending paid trip resumes. If initialization is unavailable, the unpaid-trip screen keeps Retry disabled and permits returning to the departure town. If the fare already has a receipt but its paid trip save failed, cancellation rejects and directs the player to resume the ticket. Turning back after an accepted paid departure does not refund the fare, and does not advance travel time.

## Compatibility and limits

* Old in-progress travel animations did not contain a durable completion/payment marker. Invalid or inconsistent trip records recover to route selection at their saved origin with a visible explanation, retaining inventory, party, quests and other progress. Ordinary legacy saves receive no fabricated journey.
* Existing nonadjacent wagon encounters remain in use. The encounter and selected choice now persist across reloads. Choice effects retain the donor’s existing good/neutral wallet changes; unused donor outcome fields and its former unused stat-check roll are not made into new damage/reward rules. A choice saves before its ordinary grants, preventing a replay from granting twice. A browser crash between that save and its grant can lose the grant; this slice does not add a distributed reward transaction system.
* The two local records are not a single cross-record database transaction. Persist-first ordering and an idempotent wallet receipt bridge their failure window for this browser. Receipts are neither server proof nor a cross-tab lock. Arbitrary storage edits, explicit old-save rollback, receipt eviction after later journeys, cross-device settlement, and existing server-balance reconciliation are outside this guarantee.
* Existing server/chain sync remains best effort. The fare submits those existing calls only on its first local debit. This change does not claim server exactly-once settlement, change API authority, or enable the optional EVM chain.

## Verification

`npm run test:gold-country-transport` runs the pure quote/calendar suite, 14 durable-fare cases, and 8 actual reducer integration cases. It is included in `npm test`. Coverage includes boundary years, gateway rejection for every mode, partial-day conservation checked independently with BigInt, 60,000 Luck comparisons, duplicate arrivals, cross-town bypass rejection, persisted encounters, invalid legacy saves, receipts, conflicts and storage failures.

The full existing `npm test` passed. TypeScript passed. Full ESLint reported zero errors and 464 warnings across the tree; both repository guard scripts passed. `npm run build` produced the production bundle successfully.

Browser tools:

```sh
node --import tsx tools/goldCountryTransport.browser.ts http://127.0.0.1:3360 production all
node --import tsx tools/goldCountryWallet.browser.ts wallet-provider-final
```

All 20 production full-app scenarios and all 5 provider scenarios passed, with no page errors. The tracked summary is [YEAR_GATED_TRANSPORT_VERIFICATION_20260913.json](./YEAR_GATED_TRANSPORT_VERIFICATION_20260913.json).

The full-app harness starts from disposable prior-campaign fixtures and uses the actual title Continue before town/road actions. Future years are fixture history, not a claim that the test played twenty years. It covers desktop 1280×960 and phone 390×844: 1851-to-1852 wagon/stage progression, rail via both real gateway endpoints, no funds, four interrupted storage boundaries, paid-receipt cancellation refusal, zero oxen, missing-wallet migration, and a saved Luck delay. Local API responses are mocked; real authenticated account APIs are not exercised.

The provider harness mounts the actual React wallet, Oregon Trail provider, reducer and save-loader integration with controlled unrelated contexts/network adapters. It verifies queued ordinary wallet changes before a fare, simultaneous duplicate calls, amount conflicts, write failure, older-slot matching/missing receipts, and cancellation/duplicate departure while the same fare is awaiting its paid-state continuation.

Local evidence is under `artifacts/year-gated-transport/`; the compact tracked verification result beside this document names the final runs. Earlier failed fixture probes are retained separately and are not passing evidence. No production endpoint is modified by these tools.
