# Town investigation rooms and aliases — slice B

Named fallback towns use the starter's camp-room structure with supported trail witness types. S.A.D.D.L.E. and karma can add a willing talker, craftsperson, traveler, law officer, or rough company to the first room. These rooms are reconstructed scene staging, not a surveyed historical building inventory. Unknown stops retain the existing generic fallback. Exact normalized names and townRegistry source aliases are used; nearby landmarks are not matched by substring.

Volcano retains all four existing authored NPCs and their words, now labeled with their camp places. Player variance does not append generic people to authored casts. Ana's representative portrayal and pending dignity review are unchanged.

The campaign stop named West Point opens a **Sandy Gulch 1849 reconstruction**. William and Dan Carsner are documented people; the new dialogue is invented historical reconstruction and is labeled as such on both the selection card and in the conversation. The prompt restricts factual claims to the sourced nugget discovery and trading-camp setting. It does not speak for Northern Sierra Miwok people. John R. Smith and the original Carsner ghosts remain at their existing Living Trail node IDs, outside this investigation cast.

Sources opened September 14, 2026:

- [California OHP, Sandy Gulch, landmark 253](https://ohp.parks.ca.gov/ListedResources/Detail/253): Sandy Gulch was a trading center in 1849, on Miwok home ground; William and Dan Carsner found nuggets in its coarse sands. Its later quartz/mining infrastructure is not used as an 1849 scene fact.
- [Calaveras Heritage Council, Mining in Sandy Gulch](https://www.calaverashistory.org/mining-in-sandy-gulch): dates the Carsner discovery to 1849 and identifies later mills and lode mining as later developments. The article attributes its research to the 2015 Costello/McGreevy cultural-resources survey.
- [California OHP, West Point, landmark 268](https://ohp.parks.ca.gov/ListedResources/Detail/268): its wording about a pre-gold trading post and Kit Carson does **not** establish the 1852/1854 dates asserted elsewhere in the handoff. This PR adds no such West Point chronology claim. The narrower Sandy Gulch evidence supports the playable reconstruction.

NPC IDs still pass through openWitnessDialogue, WitnessScreen, getNPCById, and the existing server-owned character adapter. The Carsner reconstruction supplies an optional authored DialogueTree to the existing engine: a nugget-discovery clue, camp question, and Diplomacy check about rumor. Other NPCs retain their existing trees. There is no new chat route, model provider, historical fact generator, or persistence store. Existing exact NPC location lookups are preserved before resolving aliases, including bobr_cabin and all Living Trail nodes.

Run `npm run test:town-investigation` for cast, alias, ghost isolation, room identity, witness compatibility, player thresholds, mutation isolation, and server-adapter regressions. The suite also runs in `npm test`.

Validation on the local production build: twelve focused cases and the full test command passed; typecheck and build passed; lint had zero errors and 458 retained warnings. Ten desktop/mobile browser scenarios covered West Point at both sides of the Diplomacy threshold, all four Volcano interviews, and Fort Kearny room/witness variation. They exercised clue collection, NPC interview IDs, time accounting, and reload persistence. Bell's existing offline fallback was exercised; Ana's dialogue was not extended. All 42 existing NPC definitions and the original fifteen-file starter patch remained unchanged.

Browser checks used disposable prior-completion saves with APIs offline. They do not establish live model behavior or full-campaign progression. The shared mystery generator and older generic witness dialogue retain existing fictional and anachronistic material (for example, Wells Fargo stagecoach copy); this slice only grounds the new Sandy Gulch cast and questions, not every investigation narrative.
