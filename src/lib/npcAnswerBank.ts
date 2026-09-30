/**
 * jev answer bank — the no-model voice for Gold Country NPCs.
 *
 * When Neoma's model cannot be reached, a street NPC still answers in character:
 * jev sorts the visitor's question into a category by its words, then picks from
 * a Neoma-written list for that category, filled with the NPC's own name, title
 * and town. A clue question gets the NPC's own clue hint when it has one. Anything
 * jev cannot sort falls back to the NPC's canon lines, in turn.
 *
 * 1849 voice: no later-era names or years (the angelsCampSlice era guard).
 */

export type QuestionCategory =
  | 'identity'
  | 'place'
  | 'gold'
  | 'clue'
  | 'time'
  | 'people'
  | 'trade'
  | 'farewell'
  | 'other'

// Order matters: the first category whose words match wins.
const CATEGORY_WORDS: [QuestionCategory, RegExp][] = [
  ['farewell', /\b(bye|goodbye|farewell|so long|thank(s| you)|good night)\b/i],
  ['clue', /\b(clue|hint|help|outlaw|bandit|thief|robber|stranger|seen|suspect|mystery|case|warrant|wanted|missing|crime|who did)\b/i],
  ['time', /\b(year|future|time|century|phone|car|electric|frog|slip|where do you come|from the future|what day)\b/i],
  ['identity', /\b(who are you|your name|what do you do|how did you|why are you|about you|yourself|come to)\b/i],
  ['gold', /\b(gold|claim|mine|mining|nugget|pan|panning|dig|diggings|placer|vein|lode)\b/i],
  ['trade', /\b(buy|sell|price|cost|trade|whiskey|supplies|store|goods|pay|money|coin)\b/i],
  ['people', /\b(who else|anyone|anybody|know|friend|family|kin|wife|husband|brother|sister|neighbou?r)\b/i],
  ['place', /\b(where|town|place|here|camp|street|this hill|this town|around here|what is this)\b/i],
]

export function classifyQuestion(question: string): QuestionCategory {
  for (const [category, words] of CATEGORY_WORDS) if (words.test(question)) return category
  return 'other'
}

export interface AnswerBankNpc {
  name: string
  title?: string
  town?: string
  clueHint?: string
  canonLines: string[]
}

// Neoma's lists. {name} {title} {town} are filled from the NPC.
const BANK: Record<Exclude<QuestionCategory, 'other'>, string[]> = {
  identity: [
    '{name}, {title}. That is the whole of it, and more than most here will tell you.',
    'I am {name}. In {town} a person is what they do, and I do what a {title} does.',
    'You ask who I am like a lawman asks. {name}. Remember it or do not; {town} will.',
  ],
  place: [
    'This is {town}. Mud, canvas, and more hope than the ground can hold.',
    '{town}, stranger. Walk the street and you will learn it faster than I can tell it.',
    'Every camp swears it is the richest. {town} swears it louder.',
  ],
  gold: [
    'Gold is in the creek, in the hill, and mostly in the stories. Ask the ones with blistered hands.',
    'I have seen men wash a fortune in a week and drink it in a night. The gold does not care which.',
    'The claims here are staked tight. A man steps over a line and the line steps back.',
  ],
  clue: [
    'I keep my eyes open and my mouth mostly shut. Look where the others do not bother to look.',
    'Strangers come through {town} every day. The ones worth watching are the ones who arrive too clean.',
    'If I knew for certain, I would be richer or dead. Ask again when you have found something.',
  ],
  time: [
    'You carry yourself like someone from a long way off, and I do not mean the States.',
    'Time runs strange out here. Some days a week, some weeks a day. You look like you know the feeling.',
    'Whatever year you think it is, stranger, {town} thinks it is this one. Best to agree.',
  ],
  people: [
    'Everybody knows everybody in {town}, and nobody knows anybody. That is a camp for you.',
    'Ask around. Folks here talk plenty. It is the truth that comes dear.',
    'I know enough names to fill a ledger and enough secrets to burn it.',
  ],
  trade: [
    'Prices here would make a banker weep. Flour costs what silver costs back East.',
    'Everything is for sale in {town}. Some of it is even worth the price.',
    'Pay in dust or coin, and do not ask me to weigh it twice.',
  ],
  farewell: [
    'Go careful, stranger. {town} is kinder to the watchful.',
    'Mind the road. It remembers everyone who walks it.',
    'Safe trails. And if anyone asks, you never spoke to {name}.',
  ],
}

function fill(template: string, npc: AnswerBankNpc): string {
  return template
    .replace(/\{name\}/g, npc.name)
    .replace(/\{title\}/g, npc.title || 'a working soul')
    .replace(/\{town\}/g, npc.town || 'this camp')
}

/**
 * Answer the visitor's `turn`-th question (1-based) without a model. Deterministic:
 * the same question at the same turn gives the same answer, and consecutive turns
 * in one category walk the list instead of repeating.
 */
export function answerFromBank(npc: AnswerBankNpc, question: string, turn: number): { category: QuestionCategory; text: string } {
  const category = classifyQuestion(question)
  if (category === 'clue' && npc.clueHint) return { category, text: npc.clueHint }
  if (category === 'other') {
    const lines = npc.canonLines.length > 0 ? npc.canonLines : BANK.place
    return { category, text: fill(lines[turn % lines.length], npc) }
  }
  const list = BANK[category]
  return { category, text: fill(list[(turn - 1 + list.length) % list.length], npc) }
}
