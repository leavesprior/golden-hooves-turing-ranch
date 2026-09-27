/**
 * Chapter 6 unlock + the discount-path regression guard.
 *
 * Finishing chapter 5 must still reach ClueGameUnlock (Cynthia → QR hunt →
 * discount) exactly as before. page.tsx is a component, so the guard reads its
 * source: the `chapter >= 5` block must still end in setShowClueGameUnlock(true)
 * followed directly by return, with nothing routing to Chapter 6 in between.
 *   npx tsx src/lib/ch6/unlock.test.ts
 */
import { readFileSync } from 'node:fs'
import { CH6_UNLOCK_FLAG, withCh6Unlocked } from './unlock'
import { QUESTS } from '../../app/adventure/data/quests'
import { CHAPTER_6_LOCATIONS, getLocationById } from '../../app/adventure/data/chapterLocations'

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })

// --- the flag helper ---
check('the flag is ch6_unlocked', CH6_UNLOCK_FLAG === 'ch6_unlocked')
check('adds the flag', withCh6Unlocked(['a']).join(',') === 'a,ch6_unlocked')
check('adds it only once', withCh6Unlocked(['ch6_unlocked', 'a']).filter(f => f === CH6_UNLOCK_FLAG).length === 1)
check('handles a save with no flags', withCh6Unlocked(undefined).join(',') === 'ch6_unlocked')
const input = Object.freeze(['x'])
check('never mutates the flags it was given', withCh6Unlocked(input).length === 2 && input.length === 1)

// --- the discount path (page.tsx) ---
const page = readFileSync(new URL('../../app/adventure/play/page.tsx', import.meta.url), 'utf8')
const start = page.indexOf('if (adventureState.chapter >= 5) {')
const block = start < 0 ? '' : page.slice(start, page.indexOf('\n    }', start))
check('the chapter-5 finale block exists', start >= 0 && block.length > 0)
check('it still says the ranch line', block.includes("narratorComment('And so the story ends. Or does it? Check the ranch for the real treasure.', 'fourth_wall')"))
check('it still shows ClueGameUnlock and returns right after',
  /setShowClueGameUnlock\(true\)\s*\n\s*return\s*$/.test(block), block)
check('ClueGameUnlock is shown exactly once in the block', (block.match(/setShowClueGameUnlock\(/g) ?? []).length === 1)
const flagAt = block.indexOf('withCh6Unlocked(')
check('the Chapter 6 flag is written before ClueGameUnlock, not instead of it',
  flagAt >= 0 && flagAt < block.indexOf('setShowClueGameUnlock(true)'))
check('nothing in the block routes away or bumps the chapter',
  !/router\.|window\.location|chapter:\s*|setShowCamp|celebrate\(/.test(block), block)

// --- the data ---
const quest = QUESTS.find(q => q.id === 'ch6_liars_bench')
check('the Liar\'s Bench quest exists in chapter 6', quest?.chapter === 6)
check('it is gated on the Chapter 6 flag', quest?.prerequisite?.flag === CH6_UNLOCK_FLAG)
check('its giver is at its location', !!quest && CHAPTER_6_LOCATIONS.some(l => l.id === quest.giverLocation && l.npcs.some(n => n.id === quest.giver)))
check('its location resolves', getLocationById('ch6_liars_bench')?.chapter === 6)
check('chapter 1–5 quest lists never include it (page filters q.chapter <= chapter)',
  [1, 2, 3, 4, 5].every(ch => !QUESTS.filter(q => q.chapter <= ch).some(q => q.id === 'ch6_liars_bench')))

// Gate 1: until the author consents, the narrator is only ever "Stovepipe".
// Also no BBC Doctor Who IP (Doctor Who stays a wink, never named).
const ch6Text = JSON.stringify(CHAPTER_6_LOCATIONS) + JSON.stringify(quest)
const banned = /Royal|Garrison|Rastafar|cannabis|TARDIS|Dalek|police box|sonic screwdriver|the Doctor\b/i
check('Chapter 6 data names only "Stovepipe" and no BBC IP', !banned.test(ch6Text), ch6Text.match(banned)?.[0])

const failed = results.filter(r => !r.pass)
for (const r of results) console.log(`${r.pass ? '✓' : '✗'} ${r.name}${r.pass ? '' : ` — ${JSON.stringify(r.detail)}`}`)
console.log(failed.length === 0 ? `\nch6 unlock: ALL ${results.length} PASS` : `\nch6 unlock: ${failed.length} FAILURE(S)`)
process.exit(failed.length === 0 ? 0 : 1)
