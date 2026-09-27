/**
 * Chapter 6 — Stovepipe's tall tales and the Truth / Stretcher / Whopper call.
 *
 *   Truth     — it happened as told.
 *   Stretcher — something real, told bigger than it was.
 *   Whopper   — it did not happen (or not there, or not like that).
 *
 * A right call is worth +25 Reasoning, a wrong one −25. This module only
 * returns that number. It never touches karma, the karma ledger or
 * karmaServerSync — Reasoning is a Chapter 6 score, not currency.
 *
 * Every tale carries the VERIFIED row of 05_verification.md it rests on.
 * A tale without a verified source does not ship.
 */

export type TaleCall = 'truth' | 'stretcher' | 'whopper'

export const TALE_CALLS: readonly TaleCall[] = Object.freeze(['truth', 'stretcher', 'whopper'])
export const REASONING_STEP = 25

export interface Tale {
  id: string
  telling: string // what Stovepipe says
  answer: TaleCall
  why: string // the honest record, shown after the call
  source: string // 05_verification.md section + the source it cites
}

export interface TaleVerdict {
  right: boolean
  answer: TaleCall
  reasoningDelta: number
  why: string
}

export function isTaleCall(value: unknown): value is TaleCall {
  return typeof value === 'string' && (TALE_CALLS as readonly string[]).includes(value)
}

/** Judge a call. An unrecognised call counts as wrong, never as right. */
export function judgeTale(tale: Tale, call: unknown): TaleVerdict {
  const right = isTaleCall(call) && call === tale.answer
  return { right, answer: tale.answer, reasoningDelta: right ? REASONING_STEP : -REASONING_STEP, why: tale.why }
}

/** Sum of Reasoning over a set of calls, each tale judged at most once. */
export function reasoningFor(calls: ReadonlyArray<{ tale: Tale; call: unknown }>): number {
  const judged = new Set<string>()
  let total = 0
  for (const { tale, call } of calls) {
    if (judged.has(tale.id)) continue
    judged.add(tale.id)
    total += judgeTale(tale, call).reasoningDelta
  }
  return total
}

// Leg 0 — the tutorial on the Liar's Bench, Sonora. One of each call.
// (The design's draft tale "Sonora was near the state capital" has no
// verified row in 05, so it is not used.)
export const LIARS_BENCH_TALES: readonly Tale[] = Object.freeze([
  {
    id: 'ch6_tale_vigilance_1851',
    telling: 'Sonora got its Vigilance Committee on a Sunday, high noon, June 29th, 1851. Folks here don\'t forget a date like that.',
    answer: 'truth',
    why: 'True. The committee formed in Sonora at Sunday noon, June 29, 1851, after someone tried to burn the town.',
    source: '05 §12 — Lang, History of Tuolumne County (1882) p.79–80',
  },
  {
    id: 'ch6_tale_miners_tax',
    telling: 'The Foreign Miners\' Tax? Twenty dollars a month, and they squeezed the Mexican and Chilean miners with it for years and years.',
    answer: 'stretcher',
    why: 'The $20 a month is right, and it hit Mexican and South American miners hard. But it began in 1850 and was repealed on March 14, 1851. That\'s under a year, not years.',
    source: '05 §12 — Foreign Miners\' Tax Act of 1850; Lang (1882) p.44',
  },
  {
    id: 'ch6_tale_wells_fargo_140',
    telling: 'See that Wells Fargo building, Landmark Number 140? Stands right here on Sonora\'s main street.',
    answer: 'whopper',
    why: 'Landmark 140, the Wells Fargo Express Company Building, is in Chinese Camp, not Sonora. The town of Sonora has no landmark number of its own.',
    source: '05 §1 — OHP ListedResources Detail/140',
  },
].map(t => Object.freeze(t)) as Tale[])
