# BOBR Location-Content Audit (2026-06-11)

Companion artifacts: research fact pack at MB `research/bobr_game_goldcountry_factpack_20260611` (retrieve: `neoma-note get research bobr_game_goldcountry_factpack_20260611`). Screenshots: `/tmp/bobr-content-audit/`.

## Headline finding #0
"Mokelumne Hill" (the owner's complaint) is NOT in the adventure game (`chapterLocations.ts`, 46 locations). It lives on `src/app/oregon-trail/data/goldCountryLocations.ts` (file headed "Migrated from Carmen Sandiego game"; its `driveTime` = the "directions" the owner saw) and `src/app/explore/page.tsx`.

## Structural findings (dominate everything else)
1. **Authored NPC content never reaches the player.** `dialogues.ts` (2,817 lines) + `DialogueView.tsx` imported nowhere; `quests.ts` (1,845 lines) imported nowhere. Live "TALK TO PEOPLE" = `handleNPCTalk` (play/page.tsx:972): skill check + one-line narratorComment echoing dialogueHint. Drift evidence: dialogue authored for `ch4_mill_owner` but NPC id is `ch4_miller`.
2. **The only real-world "directions" data is largely fabricated.** goldCountryLocations.ts driveTimes vs reality from West Point: Murphys "25 min" (~50 real), Natural Bridges "20 min" (~50, near Vallecito), Mokelumne Hill "35 min" (~25), Kennedy Mine listed 50 min vs Jackson 55 — they're 0.0005° apart. Re-derive all 11.
3. **Presentation demotes the best content.** `LocationView.tsx:258` renders `historicalFact` (densest, most Carmen-usable text) at 10px italic 60% opacity, unattributed. Chapter map: bare emoji, no names except hover (hostile to deduction + touch). EXPLORE truncates names. Map info panel (ChapterMap.tsx:294-363) shows full description+fact pre-travel — good bones.
4. **Timeline incoherence:** ch4 has Murrieta (d. 1853) + Black Bart (1875-83) simultaneous; Grattan commands Fort Kearny in 1849 (commissioned 1853, Laramie); Clemens in 1850s Angels Camp (1865 real). Needs per-chapter year stamps / style-guide acknowledgment.

## Factual errors to fix (verified against fact pack)
- ch2_st_george: description says built 1852, own historicalFact says 1862 → **1867 rebuild after Oct 1862 fire** (per research; "1852" wrong).
- ch4_jackson: "1903 Kennedy Mine fire killed 47" → the 47-death fire was **Argonaut Mine, 1922** (goldCountryLocations says "1922 at Kennedy" — three-way contradiction).
- ch3_murphys: "20,000 peak population" → real peak ~3,000.
- ch5_hidden_chamber: Saddle Ridge Hoard found **2013/announced 2014**, not 2015.
- ch5_hydraulic_scar: "5,000 PSI" monitors → real nozzle pressure ~100-150 PSI (off 30×).
- ch5_ghost_town: Bodie is a **CA State Historic Park**, not NPS.
- ch4_rattlesnake_dick: Barter born **Quebec** not England; George/Cyrus Skinner mixed up; Rattlesnake Bar is on the American River near Auburn (~60 mi north — wrong county; reframe as rumor/red herring).
- goldCountryLocations mokelumne_hill fact: "17 murders in a single weekend during 1851" garbles the legend → **a man killed each week for 17 straight weeks** (correct elsewhere on the site).
- "Oldest hotel" three-way conflict: /explore Hotel Leger vs /explore Nevada City National Hotel vs ch4 Jackson National Hotel — none gets the unqualified title; use "one of California's oldest operating hotels" per the defensible claims.
- ch1_tent_city Farnham: her 1849 scheme collapsed (~3 women came); soften "married within a week".
- ch2_cobblestone: real Cobblestone Theatre is a small stone building, not open-air amphitheatre.
- ch2_chinese_camp: real town is in Tuolumne Co. ~60 mi south — either rename the camp generically or acknowledge distance.
- ch3_donner_pass connectedTo Angels Camp: 100+ road-miles apart — needs travel-text acknowledgment (long stage journey), not adjacency pretense.

## Per-chapter scores (a=historical, b=tourist, c=investigative, 1-5)
Ch1: independence 4/2/3 · alcove_spring 5/2/3 · blue_river 3/1/2 · fort_kearny 3/2/3 · platte_bridge 3/1/2 · pawnee_camp 4/1/2 · sacramento_waterfront 5/3/4 · sutters_fort 5/4/4 · tent_city 4/2/3
Ch2: volcano_main 4/3/4 · st_george 3/4/3 · masonic_lodge 2/2/2 · cobblestone 3/3/3 · miners_camp 3/2/2 · **cemetery 1/1/1 (worst)** · **hangtown 5/4/5 (best)** · drytown 4/3/4 · rough_and_ready 5/3/4 · chinese_camp 5/2/4
Ch3: angels_camp 4/4/4 · murphys 3/4/4 · moaning_cavern 4/4/4 · big_trees 5/4/4 · jumping_frog 4/3/4 · natural_bridges 4/3/2 · secret_mine 2/1/2 · donner_pass 5/3/4 · carson_trail 5/3/4
Ch4: ranch_site 3/2/2 · lumber_mill 2/1/2 · creek 3/1/2 · neighbor 3/1/2 · jackson 3/4/4 · cave_system 2/1/2 · murrieta_camp 5/2/5 · black_bart_road 5/3/5 · tax_office 4/1/3 · rattlesnake_dick 3/1/4
Ch5: ranch_house 3/2/2 · barn 3/1/2 · orchard 3/1/2 · old_mine 3/1/2 · lookout 3/2/2 · hidden_chamber 2/1/2 · hydraulic_scar 4/2/3 · ghost_town 3/2/2
Carmen-migrated surface (goldCountryLocations.ts, 11 entries): ~25-word descriptions, 1-line facts; mokelumne_hill 2/2/2.
/explore: best PATTERN on site (description+funFact+insiderTip+duration+Maps link) but mixed reliability; "courthouse museum with hanging records"/"Old Gallows Site marked" at Moke Hill appear invented (old courthouse is part of Hotel Leger).

## Shallowest entry classes
1. goldCountryLocations mokelumne_hill (owner's complaint, verbatim): "Once the wildest town in the Mother Lode, with a murder a week during the Gold Rush. The spirits of the past linger here." + "35 min from BOBR".
2. Self-referential clue class (kill entirely): "Q: What do the weathered headstones tell according to the location description? A: 'stories'" (ch2_cemetery); "What is the travel danger level? — moderate"; "What minimum reputation… — 0" — quiz questions about UI fields, the opposite of Carmen rule 3.
3. ch2_masonic_lodge: no date, no lodge name; clue answer "stone".
4. ch4_lumber_mill: fictional Henderson mill, no real anchor (Wilseyville/White Pines exist); NO discoveryClues (also missing: ch4_creek, ch4_neighbor, ch4_cave_system, ch3_secret_mine).
5. Airbnb cross-promo breaking world coherence: "What cooking appliance does Pryor's ranch kitchen have that theatre boarding houses lacked? — dishwasher".

## The quality bar (best-entry DNA)
ch2_hangtown · ch4_black_bart_road · ch4_murrieta_camp · ch1_sutters_fort · ch3_donner_pass. Common DNA: **a date, a named person, a number, a surviving artifact, one ironic hook** — the Carmen §2 attribute set.

## Missing content types
- Directions/real geography: zero on adventure surface (no county/road/distance-from-ranch on any of 46); OT driveTimes wrong; only /explore has Maps links. No "from the ranch take Hwy 26…" anywhere.
- Surviving-today notes: field doesn't exist (St. George operates; Hangman's Tree stump under a Placerville bar; Old Abe displayed; Kennedy headframe stands).
- Era anchoring: no per-chapter year stamp.
- Deducible attributes: present in top ~10, absent in ~20 (all ch5, most ch4 fiction, masonic/cemetery/theatre).
- West Point (the ranch's town) not in the adventure; Mokelumne Hill name-dropped but unvisitable.

## Priority list for rewrite
1. ch2_volcano_main 2. ch4_ranch_site 3. Mokelumne Hill (fix both surfaces + add to ch4) 4. ch4_jackson 5. ch2_cemetery 6. ch2_masonic_lodge 7. ch2_st_george 8. ch2_miners_camp (Soldiers Gulch real — lean in) 9. goldCountryLocations driveTimes (all 11) 10. ch3_angels_camp 11. ch3_murphys 12. ch5_ranch_house 13. add West Point location 14. ch4_black_bart_road + murrieta_camp (timeline framing, keep content) 15. ch1_independence.

## Structural recommendations
Wire or delete orphaned dialogues.ts/quests.ts (4,662 unreachable lines = cheapest depth win) · fix ch4_miller/ch4_mill_owner id · kill self-referential clue class · resolve oldest-hotel conflict · promote historicalFact in LocationView · names on map icons.
