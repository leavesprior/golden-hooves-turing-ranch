/**
 * Companion Dialogues — Context-Sensitive Lines for Recruited Allies
 *
 * Each recruited enemy type (from enemyRecruitment.ts) has a set of
 * dialogue lines keyed by gameplay context. Lines are selected at
 * random to keep repeated encounters feeling fresh.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CompanionDialogueSet {
  allyType: string
  contexts: {
    idle: string[]
    low_health: string[]
    after_combat: string[]
    discovery: string[]
    chapter_end: string[]
    low_supplies: string[]
    near_danger: string[]
  }
}

export type DialogueContext = keyof CompanionDialogueSet['contexts']

// ============================================================================
// DIALOGUE DATA
// ============================================================================

export const COMPANION_DIALOGUES: CompanionDialogueSet[] = [
  // ── ROAD AGENT ─────────────────────────────────────────────────────────
  {
    allyType: 'Road Agent',
    contexts: {
      idle: [
        '"You know, I used to case this stretch of road every spring. Funny how the scenery changes when you ain\'t looking for marks."',
        '"See that ridge? Perfect for a holdup. Two men on top, one blocking the road below. Not that I\'m planning anything."',
        '"My old partner went straight too. Opened a dry goods store in Sacramento. Died of boredom inside a year."',
        '"The trick to a good robbery is making the victim think it was their idea to hand over the money. The trick to going honest is... well, I\'m still working on that part."',
        '"I ever tell you about the time I robbed a preacher? He forgave me on the spot. Made me feel worse than any lawman ever did."',
        '"These boots? Took \'em off a man in Stockton. He was bigger than me, but slower. That\'s usually how it works out."',
      ],
      low_health: [
        '"I\'ve been shot before... usually in the back. At least this time I saw it coming."',
        '"Don\'t look so worried. Takes more than this to put down a road agent. We\'re like cockroaches with better hats."',
        '"Patch me up and I\'ll be fine. I once rode thirty miles with a bullet in my leg. Didn\'t even know it was there till I took my boot off."',
      ],
      after_combat: [
        '"Not bad, for honest folk. You\'ve got a natural talent for violence. That\'s a compliment where I come from."',
        '"Amateurs. No flanking, no scout, no escape route. I\'d be embarrassed to call that an ambush."',
        '"I recognize that fighting style. Whoever trained those boys, I owe him money."',
      ],
      discovery: [
        '"Well now, what do we have here? In my old line of work, we called this a \'bonus.\'"',
        '"I\'ve ridden past this spot a hundred times and never noticed. Goes to show — you miss a lot when you\'re always running."',
        '"Stash that somewhere safe. And I mean safe from me, too. Old habits, you understand."',
      ],
      chapter_end: [
        '"Another stretch behind us. You know, this is the longest I\'ve traveled without robbing someone. Feels strange. Good, but strange."',
        '"If my old gang could see me now — riding honest, sleeping easy. They\'d laugh themselves sick."',
        '"We made it. I\'d drink to that, but I pawned my flask three territories ago."',
      ],
      low_supplies: [
        '"I know a cache about two miles east. Buried it last autumn after a job. Might still be there, if the coyotes ain\'t found it."',
        '"We could always rob somebody. I\'m joking. Mostly."',
        '"Tight rations. I\'ve lived on less. Once ate nothing but wild onions for a week. Don\'t recommend it."',
      ],
      near_danger: [
        '"Something\'s off. I can feel it in my teeth. That\'s ambush country up ahead — trust me, I\'d know."',
        '"Quiet your horse and listen. Hear that? That\'s the sound of someone trying too hard to be silent."',
        '"Keep your hand near your iron. We\'ve got company, and they ain\'t the sociable kind."',
      ],
    },
  },

  // ── CLAIM JUMPER ───────────────────────────────────────────────────────
  {
    allyType: 'Claim Jumper',
    contexts: {
      idle: [
        '"That creek bed\'s got color in it. I can see it from here. No, I ain\'t jumping your claim. Those days are behind me. Probably."',
        '"My daddy always said the gold ain\'t in the river — it\'s in the man selling shovels. Took me twenty years to understand that."',
        '"See how the quartz runs through that hillside? That\'s a vein. A real one. Most folks walk right past it."',
        '"I staked my first claim when I was sixteen. Lost it to a man with a better lawyer. That\'s when I learned the law ain\'t the same as justice."',
        '"You ever hold a nugget fresh from the earth? It\'s warm. Like it\'s alive. That warmth is what makes men crazy."',
        '"The Chinese miners work claims everyone else abandoned. They find gold where we see nothing. Respect that."',
      ],
      low_health: [
        '"Ain\'t nothing but a scratch. I\'ve taken worse from a pickaxe bounce."',
        '"Pour some whiskey on it and wrap it tight. That\'s frontier medicine, and it works better than anything a doctor charges for."',
        '"I\'ve been buried in a cave-in twice. This is nothing compared to digging yourself out of a collapsed shaft."',
      ],
      after_combat: [
        '"In the diggings, you fight or you lose everything. I learned to fight first and ask questions when the dust settles."',
        '"That was sloppy. In the mining camps, a fight like that ends with someone at the bottom of a shaft."',
        '"Good scrap. Reminds me of Saturday nights in Hangtown. Only with less whiskey."',
      ],
      discovery: [
        '"This here\'s prime digging ground. The geology don\'t lie — see the iron staining? That\'s a marker."',
        '"Would you look at that. I spent six months searching for something like this. You just stumbled onto it walking by. Life ain\'t fair."',
        '"Careful with that. A find like this draws attention. The wrong kind of attention."',
      ],
      chapter_end: [
        '"Another chapter done. You know, partner, you\'re the first person who gave me a fair shake since I came west."',
        '"Made it through. I\'ve survived worse, but not by much. The trail takes what it takes."',
        '"Time was, I\'d have jumped your claim and disappeared by now. Funny how people change when someone trusts them."',
      ],
      low_supplies: [
        '"I know how to pan for gold, but I never learned to pan for dinner. That was my mistake."',
        '"In the camps, a hungry miner is a dangerous miner. We should fix this before somebody gets desperate."',
        '"There\'s roots and berries in these hills if you know where to look. I know where to look."',
      ],
      near_danger: [
        '"I\'ve had claims jumped enough times to know the sound of men moving through brush. Stay low."',
        '"See those boot prints? Fresh. And headed the same direction we are. That ain\'t a coincidence."',
        '"Trouble ahead. I can smell it. Smells like gun oil and bad intentions."',
      ],
    },
  },

  // ── GANG OUTRIDERS ─────────────────────────────────────────────────────
  {
    allyType: 'Gang Outriders',
    contexts: {
      idle: [
        '"Joaquin ran a tight operation. Schedules, patrol routes, supply lines. It wasn\'t a gang — it was an army."',
        '"We used to ride this road every Tuesday. Merchants knew it too. Smart ones changed their schedule. The others... well."',
        '"Discipline wins fights. Joaquin taught us that. Charge when told, retreat when told, share the take equally. Simple rules."',
        '"The Pinkertons call us outlaws. Joaquin called us soldiers. The truth is probably somewhere between the two."',
        '"I miss the horses. Joaquin had the finest string in the territory. Every one of them stolen, but a good horse is a good horse."',
      ],
      low_health: [
        '"A flesh wound. Joaquin would have had us riding again within the hour. We don\'t stop for blood."',
        '"Bind it tight and keep moving. The Outriders don\'t rest until camp is made and the perimeter is set."',
        '"I\'ve lost more blood than this in training drills. Joaquin believed in realistic preparation."',
      ],
      after_combat: [
        '"Held the line. Good discipline. Joaquin would approve."',
        '"Textbook flanking maneuver. We drilled that a hundred times in the hills above Sonora."',
        '"Clean engagement. Controlled fire, coordinated movement. That\'s how professionals operate."',
        '"The enemy broke formation first. That\'s always the deciding factor. Hold your nerve and the fight is won."',
      ],
      discovery: [
        '"Joaquin had caches all through these mountains. Could be one of ours. Could be someone else\'s. Either way, it\'s ours now."',
        '"Intelligence is worth more than gold. Remember what we found here. It may matter later."',
        '"Mark this location. In military terms, this is a strategic asset. Don\'t leave it unguarded."',
      ],
      chapter_end: [
        '"Mission accomplished. Regroup, resupply, prepare for the next phase. That\'s the protocol."',
        '"We survived. In Joaquin\'s outfit, that was the only measure of success that mattered."',
        '"Good riding. The others would\'ve called you one of us. That\'s the highest compliment I know."',
      ],
      low_supplies: [
        '"Joaquin always maintained a three-day reserve. We should have done the same. Lesson learned."',
        '"An army marches on its stomach. Right now, our stomach is empty. This is a tactical problem, not a moral one."',
        '"We can forage. The Outriders survived in these hills for months when the law was closing in."',
      ],
      near_danger: [
        '"Ambush terrain. Stay sharp. Two riders on point, two on rear guard. Standard formation."',
        '"Multiple contacts ahead. I count three... no, four. Dismount and prepare defensive positions."',
        '"This is a kill zone. Narrow approach, high ground on both sides. We need to move through fast or find another route."',
      ],
    },
  },

  // ── DESPERATE PROSPECTOR ───────────────────────────────────────────────
  {
    allyType: 'Desperate Prospector',
    contexts: {
      idle: [
        '"Remarkable! The geological formations here suggest Mesozoic-era volcanic activity. The quartz intrusions are textbook."',
        '"I used to be a geology lecturer at a small college back East. Then I read about Sutter\'s Mill and... well. Here I am."',
        '"Did you know that pyrite — fool\'s gold — actually contains trace amounts of real gold? About 0.25 parts per million. I counted."',
        '"The creek water tastes different here. More minerals. That\'s either a good sign for gold or a very bad sign for our insides."',
        '"I haven\'t spoken to this many people in months. Sorry if I talk too much. Or too little. I\'ve lost track of what\'s normal."',
        '"Sometimes at night I hear the river and think it\'s calling my name. That\'s... that\'s probably not a good sign, is it?"',
      ],
      low_health: [
        '"We should ration carefully... very carefully. I\'ve calculated the caloric requirements and we\'re running at a deficit."',
        '"I\'m fine. Truly. I once survived three weeks on creek water and wild mustard greens. This is practically luxury."',
        '"The human body can endure far more than people think. I\'ve tested that theory personally. Multiple times."',
      ],
      after_combat: [
        '"I\'m sorry I wasn\'t more help. Fighting was never my strong suit. But I can patch wounds — I\'ve stitched myself up often enough."',
        '"Is everyone... is everyone all right? I don\'t handle violence well. My hands won\'t stop shaking."',
        '"That was terrifying. But we survived. That\'s what we do out here — we survive. One day at a time."',
      ],
      discovery: [
        '"Remarkable! The geological formations here suggest this entire valley was once an ancient riverbed. The gold settled in the bedrock!"',
        '"Let me see that — careful, careful! If my analysis is correct, this is high-purity placer gold. Possibly twelve carats or better."',
        '"I\'ve been searching for something exactly like this for two years. Two years! And you just... found it. Walking by."',
        '"Document everything. The location, the soil color, the mineral composition. This kind of find doesn\'t happen twice."',
      ],
      chapter_end: [
        '"We made it through another stretch. You know, traveling with people is... it\'s nice. I forgot what nice felt like."',
        '"Thank you for not leaving me behind. I know I slow things down sometimes. I\'m trying to be useful."',
        '"Another chapter. In my journal, I\'ll mark this one as the chapter where things started looking up. I hope that\'s not premature."',
      ],
      low_supplies: [
        '"We should ration carefully... very carefully. I\'ve calculated the optimal distribution. Two ounces of hardtack per person per meal."',
        '"I know every edible plant between here and Sacramento. Also several inedible ones, from personal experience."',
        '"Don\'t panic. Panic burns calories. We need to conserve everything — energy, food, hope."',
      ],
      near_danger: [
        '"Something\'s wrong. The birds stopped singing. In my experience, that means either a storm or something worse."',
        '"I don\'t like this. I don\'t like this at all. The last time I felt this way, I lost my camp to claim jumpers."',
        '"There are boot prints here that weren\'t here yesterday. Fresh ones. Heading toward our camp."',
      ],
    },
  },

  // ── BOUNTY HUNTERS ─────────────────────────────────────────────────────
  {
    allyType: 'Bounty Hunters',
    contexts: {
      idle: [
        '"We tracked a man from Omaha to Tucson once. Fourteen hundred miles. He thought he\'d lost us in Kansas City. He was wrong."',
        '"In this profession, you learn two things fast: patience and marksmanship. Everything else is paperwork."',
        '"Our previous contract was a counterfeiter in Portland. Before that, a horse thief in Cheyenne. We don\'t discriminate — a bounty is a bounty."',
        '"Don\'t take this the wrong way, but we ran your name when we first met. Clean record. We always check."',
        '"The best bounty hunters never fire a shot. Intimidation, positioning, cutting off escape routes. The gun is a last resort."',
      ],
      low_health: [
        '"Flesh wound. Apply pressure, keep moving. We\'ve operated in worse condition."',
        '"Medical attention can wait until the objective is secure. That\'s standard operating procedure."',
        '"One of us took a bullet in Abilene and finished the job before seeking treatment. We don\'t stop for inconvenience."',
      ],
      after_combat: [
        '"Target neutralized. Perimeter secure. Casualty report?"',
        '"Clean engagement. Four hostiles, zero escapes. Acceptable outcome."',
        '"Sloppy opposition. No coordination, no fallback plan. They deserved what they got."',
        '"Weapons check, ammunition count, injury assessment. Debrief in five minutes."',
      ],
      discovery: [
        '"Interesting. This matches intelligence from a previous contract. File it. It may be worth something later."',
        '"Evidence secured. We\'ll catalog and cross-reference. Old habits from the detective work."',
        '"A find like this changes the calculus of the operation. Adjust priorities accordingly."',
      ],
      chapter_end: [
        '"Another phase complete. Performance review: acceptable. Minimal casualties, objectives met."',
        '"Contract is progressing on schedule. We\'ll continue to provide services as agreed."',
        '"Good work. That\'s not a phrase we use lightly. Most clients get \'adequate\' at best."',
      ],
      low_supplies: [
        '"Supply shortage is a tactical problem. We\'ve operated on half rations before. Unpleasant but manageable."',
        '"Recommend we acquire supplies at the next opportunity. A hungry team is a compromised team."',
        '"Rationing protocol: essentials only, shared equally, no exceptions. That includes us."',
      ],
      near_danger: [
        '"Multiple hostiles. I count three... no, four. Two in the tree line, two behind the rocks. Standard ambush pattern."',
        '"Contact. Unknown number, unknown intent. Assume hostile until proven otherwise."',
        '"Defensive formation. You take center, we\'ll cover the flanks. If they move, we move faster."',
      ],
    },
  },
]

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get a random dialogue line for a given ally type and context.
 * Returns null if the ally type or context has no entries.
 */
export function getCompanionLine(allyType: string, context: DialogueContext): string | null {
  const set = COMPANION_DIALOGUES.find(d => d.allyType === allyType)
  if (!set) return null
  const lines = set.contexts[context]
  if (!lines || lines.length === 0) return null
  return lines[Math.floor(Math.random() * lines.length)]
}

/**
 * Get all dialogue lines for a given ally and context (useful for UI lists)
 */
export function getAllCompanionLines(allyType: string, context: DialogueContext): string[] {
  const set = COMPANION_DIALOGUES.find(d => d.allyType === allyType)
  if (!set) return []
  return set.contexts[context] ?? []
}

/**
 * Get the list of all supported ally types
 */
export function getCompanionAllyTypes(): string[] {
  return COMPANION_DIALOGUES.map(d => d.allyType)
}
