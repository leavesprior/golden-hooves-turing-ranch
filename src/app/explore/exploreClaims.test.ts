// Guest-facing claim guard for the explore TOWNS array (research 2026-09-23,
// ~/Documents/BOBR/research/volcano_local/VOLCANO_LOCAL_PLACES_20260923.md).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const src = readFileSync(join(process.cwd(), 'src/app/explore/ExploreClient.tsx'), 'utf8')
let failed = 0
function ok(cond: boolean, msg: string) {
  if (!cond) { failed++; console.error('FAIL', msg) } else console.log('ok', msg)
}

// Wrong or unsupported claims are gone.
ok(!/Sutter Gold Mine',/.test(src), 'no Sutter Gold Mine attraction in Angels Camp')
ok(!/Angels Hotel Bar/.test(src), 'no visitable Angels Hotel Bar')
ok(!/Angels Camp Lodging/.test(src), 'no Twain lodging claim in Angels Camp')
ok(!/restored Mark Twain Cabin/.test(src), 'Twain cabin is not called restored')
ok(!/San Andreas Gulch/.test(src), 'no San Andreas Gulch attraction')
ok(!/Jumping Frog Park/.test(src), 'no Jumping Frog Park')
ok(!/Black Bart Evidence Trail/.test(src), 'no Black Bart Evidence Trail')
ok(!/'The pack road'/.test(src), 'no pack road attraction name')
ok(!/Historic General Store/.test(src), 'no undocumented historic general store')
ok(!/Sandy Gulch Mine/.test(src), 'Sandy Gulch is a landmark, not a mine')
ok(!/French Cemetery/.test(src), 'no French Cemetery')
ok(!/exact spot is unmarked/.test(src), 'Carson Hill secret does not contradict the CHL #274 marker')

// Corrected claims are present.
ok(/Calaveras County Fair & Jumping Frog Jubilee/.test(src), 'jubilee uses its official name')
ok(/May 13–16, 2027/.test(src), 'next jubilee dates given')
ok(/apartments since 1962/.test(src), 'Angels Hotel is apartments since 1962')
ok(/reportedly heard the frog yarn/.test(src), 'Twain frog yarn stays reportedly')
ok(/replica cabin, built around the original chimney/.test(src), 'Jackass Hill cabin is a replica')
ok(/Carson Hill marker \(CHL #274\)/.test(src), 'Carson Hill marker replaces Sutter')
ok(/Gerald Turner Park/.test(src) && /287 Treat Ave/.test(src), 'real San Andreas park named')
ok(/pleaded guilty here on November 17, 1883/.test(src), 'Black Bart plea date')
ok(/near Copperopolis, on November 3, 1883/.test(src), 'handkerchief found near Copperopolis')
ok(/Murieta "rendezvous" story is legend/.test(src), 'Murieta labeled legend')
ok(/branches off the Big Tree Road in the 1850s/.test(src), 'West Point Road is 1850s, not 1849')
ok(/plaque\\'s tradition, not the written record/.test(src), 'Kit Carson naming is plaque tradition')
ok(/Sandy Gulch \(CHL #253\)/.test(src), 'Sandy Gulch landmark name')
ok(/Public access to the hill itself is unverified/.test(src), 'French Hill access unverified')
ok(/8592 W Center St/.test(src), 'Protestant cemetery address')

// Ids pinned elsewhere (hotspots, editorial, mysteries) are kept.
for (const id of ['ac_sutter_mine', 'ac_twain_cabin', 'ace_ross_saloon', 'ace_twain_cabin', 'sa_gulch_camp', 'sa_frog_park', 'sa_bart_capture', 'wp_trail_camp', 'wp_general_store', 'wp_sandy_gulch', 'mh_french_cemetery', 'mh_gallows']) {
  ok(src.includes(`id: '${id}'`), `${id} kept`)
}

if (failed) { console.error(`${failed} failed`); process.exit(1) }
console.log('exploreClaims: all ok')
