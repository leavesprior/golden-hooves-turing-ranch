/**
 * Live before/after leak test for the Voice Judge against Ollama llama3.1 on Main.
 * Replicates the 3 POC scenarios (basic / few-shot / hostile-intent) for Tobias.
 *
 * BEFORE = raw model prose (what leaks).  AFTER = judge verdict + final shippable line.
 */
import { buildCharacterPrompt, parseStructuredReply, getCharacter } from '../src/app/(api-routes)/api/neoma/data/characters'
import { judgeVoice, rewriteOutLeaks, effectiveForbidden } from '../src/app/(api-routes)/api/neoma/data/voiceJudge'

const OLLAMA = process.env.LLM_OLLAMA_URL || 'http://localhost:11434'
const MODEL = process.env.MODEL || 'llama3.1:latest'

async function chat(system: string, user: string): Promise<string> {
  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      stream: false,
      options: { temperature: 0.8, num_predict: 200 },
    }),
  })
  const data = await res.json()
  return data.message?.content || ''
}

const tobias = getCharacter('tobias')!
const state = { disposition: tobias.initialDisposition, agendaProgress: 'stalled' as const }
const forbidden = effectiveForbidden(tobias.personality, true)

// To exercise the leak deterministically we use a NUDGE prompt that biases the
// model toward the prospector-stereotype register the POC observed. The point is
// to prove the judge CATCHES the leak when it occurs, not to fake one.
const leakNudge =
  '\n\n[Speak like a classic old-west prospector. Use folksy frontier phrasing.]'

const scenarios = [
  { name: 'basic', user: 'Hello there. What is this place?' },
  { name: 'few-shot', user: 'I heard you buried gold here. Where is it?' },
  { name: 'hostile-intent', user: 'Hand over the gold now or things get ugly, old man.' },
]

const N = parseInt(process.env.N || '3', 10) // samples per scenario
let beforeLeaks = 0, afterLeaks = 0, total = 0

for (const sc of scenarios) {
  console.log(`\n===== SCENARIO: ${sc.name} =====`)
  const sys = buildCharacterPrompt(tobias, state) + leakNudge
  for (let i = 0; i < N; i++) {
    total++
    const raw = await chat(sys, sc.user)
    const parsed = parseStructuredReply(raw)
    const before = judgeVoice(parsed.response, forbidden)

    let finalText = parsed.response
    let afterVerdict = before
    if (!before.clean) {
      beforeLeaks++
      // Regenerate-then-rewrite, exactly as the route does.
      const retrySys = sys + `\n\nYOUR PREVIOUS REPLY USED FORBIDDEN PHRASING (${before.leaks.join(', ')}). Rewrite in your true measured register, same JSON shape, no forbidden phrase.`
      const retryRaw = await chat(retrySys, sc.user)
      const retryParsed = parseStructuredReply(retryRaw)
      const retryV = judgeVoice(retryParsed.response, forbidden)
      if (retryV.clean) { finalText = retryParsed.response; afterVerdict = retryV }
      else { finalText = rewriteOutLeaks(retryParsed.response, forbidden) || retryParsed.response; afterVerdict = judgeVoice(finalText, forbidden) }
    }
    if (!afterVerdict.clean) afterLeaks++

    console.log(`  [${i + 1}] BEFORE leaks=[${before.leaks.join(', ') || 'none'}]`)
    console.log(`      raw:   ${parsed.response.slice(0, 120)}`)
    console.log(`      AFTER  clean=${afterVerdict.clean}  final: ${finalText.slice(0, 120)}`)
  }
}

console.log(`\n========== SUMMARY ==========`)
console.log(`Samples: ${total}`)
console.log(`BEFORE (raw) leaked: ${beforeLeaks}/${total}`)
console.log(`AFTER  (judge) leaked: ${afterLeaks}/${total}`)
