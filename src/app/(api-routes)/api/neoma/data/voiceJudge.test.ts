/**
 * Unit tests for the phrase-level Voice Judge.
 *
 * No test runner is installed in this project, so this is a zero-dependency
 * self-contained harness runnable with the bundled tsx:
 *
 *   node_modules/.bin/tsx "src/app/(api-routes)/api/neoma/data/voiceJudge.test.ts"
 *
 * Exit code 0 = all pass, 1 = at least one failure.
 */

import {
  judgeVoice,
  rewriteOutLeaks,
  effectiveForbidden,
  COWBOY_STEREOTYPE_PHRASES,
} from './voiceJudge'

let passed = 0
let failed = 0

function ok(cond: boolean, name: string, detail = '') {
  if (cond) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`)
  }
}

const tobiasOwn = {
  forbiddenPhrases: ['i reckon', 'these here', "lookin'", 'partner', 'tarnation'],
}
const benOwn = {
  forbiddenPhrases: ['as an ai', 'language model', 'dude', 'basically'],
}

console.log('judgeVoice — the POC leak family')
{
  // The exact recurring POC leak.
  ok(!judgeVoice('I reckon the gold ain’t the point.', COWBOY_STEREOTYPE_PHRASES).clean,
    'catches "I reckon"')
  // Bare "reckon" — old exact-list scrubber missed this when only "i reckon" was listed.
  ok(!judgeVoice('Reckon you came a long way for nothing.', COWBOY_STEREOTYPE_PHRASES).clean,
    'catches bare "reckon"')
  // Curly apostrophe — the form the model actually emits.
  ok(!judgeVoice('I see you lookin’ at that map.', COWBOY_STEREOTYPE_PHRASES).clean,
    'catches curly-apostrophe "lookin’"')
  // Straight apostrophe variant.
  ok(!judgeVoice("I see you lookin' at that map.", COWBOY_STEREOTYPE_PHRASES).clean,
    'catches straight-apostrophe "lookin\'"')
  ok(!judgeVoice('These here hills keep their secrets.', COWBOY_STEREOTYPE_PHRASES).clean,
    'catches "these here"')
  ok(!judgeVoice('Much obliged, partner.', COWBOY_STEREOTYPE_PHRASES).clean,
    'catches "partner" / "much obliged"')
}

console.log('judgeVoice — preserves canon voice (no false positives)')
{
  // Real Tobias canon lines must read as clean.
  const canon = [
    'The real treasure ain’t gold. I learned that the hard way, and the slow way.',
    'I called it Back of Beyond. So far out even the coyotes needed a map to find their way home.',
    'Old Thunder carried me up every one of these hills. Faithful unto death, that horse.',
    'The wind in the oaks said more true things to me than any man in the camps ever did.',
    'I buried it in four places. Not to hide it from you — to find out what you’d become looking for it.',
  ]
  for (const line of canon) {
    const v = judgeVoice(line, COWBOY_STEREOTYPE_PHRASES)
    ok(v.clean, `canon clean: "${line.slice(0, 40)}…"`, v.leaks.join(','))
  }
  // "reckon" must NOT fire inside "reckoning" / "wreckoning".
  ok(judgeVoice('There will be a reckoning for what you did.', COWBOY_STEREOTYPE_PHRASES).clean,
    'does not false-fire on "reckoning"')
  // "looking" (no apostrophe) is fine.
  ok(judgeVoice('to find out what you’d become looking for it.', COWBOY_STEREOTYPE_PHRASES).clean,
    'does not false-fire on plain "looking"')
}

console.log('judgeVoice — reports which phrases leaked')
{
  const v = judgeVoice('I reckon you been lookin’ at these here rocks, partner.', COWBOY_STEREOTYPE_PHRASES)
  ok(!v.clean, 'multi-leak flagged not clean')
  ok(v.leaks.includes('reckon') || v.leaks.includes('i reckon'), 'reports reckon')
  ok(v.leaks.includes("lookin'"), 'reports lookin (canonical straight form)', v.leaks.join(','))
  ok(v.leaks.includes('these here'), 'reports these here')
  ok(v.leaks.includes('partner'), 'reports partner')
}

console.log('effectiveForbidden — union of own + cowboy floor + meta')
{
  const tob = effectiveForbidden(tobiasOwn, true)
  ok(tob.includes('reckon'), 'prospector floor injects bare "reckon"')
  ok(tob.includes('as an ai'), 'meta-leak set always included')
  ok(tob.includes('partner'), 'own list retained')

  // Ben Coon: folksy is in-voice, so cowboy floor must NOT be forced on him.
  const ben = effectiveForbidden(benOwn, false)
  ok(!ben.includes('reckon'), 'non-prospector skips cowboy floor')
  ok(ben.includes('as an ai'), 'meta-leak set still applies to Ben')
  ok(ben.includes('dude'), 'Ben own list retained')
}

console.log('rewriteOutLeaks — removes leak, preserves measured prose')
{
  const r1 = rewriteOutLeaks('I reckon the real treasure was never gold.', COWBOY_STEREOTYPE_PHRASES)
  ok(judgeVoice(r1, COWBOY_STEREOTYPE_PHRASES).clean, 'rewrite is clean', r1)
  ok(/real treasure was never gold/i.test(r1), 'rewrite preserves the substance', r1)
  ok(/^[A-Z]/.test(r1), 'rewrite re-capitalises after sentence-initial cut', r1)

  const r2 = rewriteOutLeaks('You been lookin’ at that map, partner.', COWBOY_STEREOTYPE_PHRASES)
  ok(judgeVoice(r2, COWBOY_STEREOTYPE_PHRASES).clean, 'mid-sentence rewrite clean', r2)
  ok(!/\s,/.test(r2) && !/,\s*$/.test(r2.trim()), 'rewrite tidies dangling punctuation', r2)
}

console.log('')
console.log(`Voice Judge: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
