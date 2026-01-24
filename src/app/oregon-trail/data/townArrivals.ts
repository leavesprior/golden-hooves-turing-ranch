// Unique Town Arrival Messages - No Repetition Dialogue System
// Each town has first-time, return, and frequent visitor messages

export interface TownArrivalMessage {
  text: string
  mood: 'welcoming' | 'suspicious' | 'weary' | 'mysterious' | 'business' | 'foreboding'
}

export interface TownArrivalSet {
  first: TownArrivalMessage[]
  return: TownArrivalMessage[]
  familiar: TownArrivalMessage[]
  regular: TownArrivalMessage[]
}

// Calculate visit tier based on visit count
export function getVisitTier(visitCount: number): 'first' | 'return' | 'familiar' | 'regular' {
  if (visitCount === 0) return 'first'
  if (visitCount === 1) return 'return'
  if (visitCount < 5) return 'familiar'
  return 'regular'
}

// Town-specific arrival messages
export const TOWN_ARRIVALS: Record<string, TownArrivalSet> = {
  'Independence, Missouri': {
    first: [
      { text: 'The jumping-off point. Everything west of here is either adventure or regret—often both.', mood: 'mysterious' },
      { text: 'Independence bustles with dreamers and schemers. The trail begins where the certainty ends.', mood: 'business' },
    ],
    return: [
      { text: 'Back to Independence. The town seems smaller now that you know what lies beyond.', mood: 'weary' },
      { text: 'Independence again. The merchants recognize you. Their prices, unfortunately, remain high.', mood: 'business' },
    ],
    familiar: [
      { text: 'The familiar chaos of Independence greets you. You know which vendors to avoid now.', mood: 'business' },
    ],
    regular: [
      { text: 'Independence. At this point, you could navigate the town blindfolded. You consider trying.', mood: 'weary' },
    ],
  },

  'Kansas River Crossing': {
    first: [
      { text: 'The Kansas River sprawls before you, muddy and indifferent to your schedule.', mood: 'foreboding' },
      { text: 'Your first major river. It looks wider than the maps suggested. Maps lie.', mood: 'mysterious' },
    ],
    return: [
      { text: 'The Kansas River again. It hasn\'t gotten any narrower since last time.', mood: 'weary' },
    ],
    familiar: [
      { text: 'You know this river. It knows you. Mutual respect has been established through previous near-drownings.', mood: 'mysterious' },
    ],
    regular: [
      { text: 'The Kansas River. You\'ve crossed it so many times the fish recognize you.', mood: 'weary' },
    ],
  },

  'Fort Kearny': {
    first: [
      { text: 'Fort Kearny rises from the prairie—a promise of order in the wilderness. The prices suggest civilization comes at a cost.', mood: 'business' },
      { text: 'Soldiers patrol the walls. You\'re not sure if they\'re keeping danger out or opportunity in.', mood: 'suspicious' },
    ],
    return: [
      { text: 'Fort Kearny\'s familiar walls come into view. The soldiers wave. You owe one of them karma from a card game.', mood: 'welcoming' },
    ],
    familiar: [
      { text: 'The fort commander nods as you enter. Word of your travels has preceded you.', mood: 'welcoming' },
    ],
    regular: [
      { text: '"The usual?" asks the quartermaster. You\'re not sure if you should be proud or concerned.', mood: 'business' },
    ],
  },

  'Chimney Rock': {
    first: [
      { text: 'Chimney Rock. Exactly as strange as advertised. Nature apparently had a phase.', mood: 'mysterious' },
      { text: 'The rock points skyward like a finger giving directions no one asked for.', mood: 'mysterious' },
    ],
    return: [
      { text: 'Chimney Rock again. It\'s still pointing. You\'re still not sure where.', mood: 'weary' },
    ],
    familiar: [
      { text: 'You\'ve carved your name here before. You find it weathered but legible. Time moves on.', mood: 'mysterious' },
    ],
    regular: [
      { text: 'Chimney Rock. Your initials are somewhere on it, multiplied by several visits. Future archaeologists will be confused.', mood: 'mysterious' },
    ],
  },

  'Fort Laramie': {
    first: [
      { text: 'Fort Laramie. Traders, trappers, and travelers mix in organized chaos. Everyone has something to sell or a story to tell.', mood: 'business' },
      { text: 'The gateway to the mountains. Beyond here, the trail gets interesting. That\'s not entirely good.', mood: 'foreboding' },
    ],
    return: [
      { text: 'The familiar bustle of Fort Laramie. A trader waves—he remembers your negotiating style.', mood: 'business' },
    ],
    familiar: [
      { text: 'Fort Laramie knows you now. Innkeepers set aside your preferred table. This feels like progress.', mood: 'welcoming' },
    ],
    regular: [
      { text: '"Let me guess," says the merchant, "Supplies, information, and a refusal to pay full price." They know you well.', mood: 'business' },
    ],
  },

  'Independence Rock': {
    first: [
      { text: 'Independence Rock. Thousands of names carved over decades. Your story joins the stone library.', mood: 'mysterious' },
      { text: 'They say reach here by Independence Day for good luck. You check the calendar nervously.', mood: 'foreboding' },
    ],
    return: [
      { text: 'You find your previous carvings. They look lonely. You add to them.', mood: 'mysterious' },
    ],
    familiar: [
      { text: 'Your section of the rock is becoming an autobiography. Future travelers will have questions.', mood: 'mysterious' },
    ],
    regular: [
      { text: 'You could write a book on this rock at this point. You might be doing exactly that.', mood: 'mysterious' },
    ],
  },

  'South Pass': {
    first: [
      { text: 'The Continental Divide. Water here chooses between oceans. You\'re just trying to choose a campsite.', mood: 'mysterious' },
      { text: 'South Pass. The highest point on the trail, and strangely, the easiest climbing. The mountains are being suspicious.', mood: 'suspicious' },
    ],
    return: [
      { text: 'You cross the divide again. The water still hasn\'t decided which ocean to visit.', mood: 'weary' },
    ],
    familiar: [
      { text: 'South Pass feels almost routine now. The altitude affects you less. Or you\'ve stopped noticing.', mood: 'weary' },
    ],
    regular: [
      { text: 'Another crossing. The continental divide greets you like an old acquaintance—cordially but with nothing new to say.', mood: 'weary' },
    ],
  },

  'Fort Bridger': {
    first: [
      { text: 'Fort Bridger. Jim Bridger\'s legendary trading post. The man himself may or may not be a tall tale.', mood: 'mysterious' },
      { text: 'Mountain men gather here, trading stories taller than the peaks. Some might even be true.', mood: 'suspicious' },
    ],
    return: [
      { text: 'Fort Bridger again. The mountain men remember you. Their stories have grown since last time.', mood: 'welcoming' },
    ],
    familiar: [
      { text: 'A trapper slaps your back. "Thought you\'d be dead by now!" It\'s meant as a compliment.', mood: 'welcoming' },
    ],
    regular: [
      { text: 'Fort Bridger treats you like family now—which means they lie to you affectionately.', mood: 'welcoming' },
    ],
  },

  'Soda Springs': {
    first: [
      { text: 'The springs bubble with water that tastes like it\'s made a poor life choice. Allegedly therapeutic.', mood: 'mysterious' },
      { text: 'Nature\'s own soda fountain. It\'s not good soda, but it\'s memorable.', mood: 'mysterious' },
    ],
    return: [
      { text: 'The springs are still bubbling. Still tasting strange. Some things are reliably weird.', mood: 'weary' },
    ],
    familiar: [
      { text: 'You know exactly which spring tastes least offensive now. This counts as wilderness expertise.', mood: 'mysterious' },
    ],
    regular: [
      { text: 'Someone asks which spring to drink from. You find yourself giving a lecture. When did you become an expert in fizzy water?', mood: 'mysterious' },
    ],
  },

  'Fort Hall': {
    first: [
      { text: 'Fort Hall. The last outpost before things get truly western. Stock up on certainty while you can.', mood: 'business' },
      { text: 'British traders built this post. Now it\'s American. The wilderness doesn\'t care either way.', mood: 'mysterious' },
    ],
    return: [
      { text: 'Fort Hall\'s familiar buildings appear through the dust. The trail remembers you.', mood: 'welcoming' },
    ],
    familiar: [
      { text: 'The traders here tell newcomers about you. You\'re not sure their version is accurate.', mood: 'suspicious' },
    ],
    regular: [
      { text: '"Your usual?" asks everyone at Fort Hall. You wonder when you became predictable.', mood: 'business' },
    ],
  },

  'Snake River Crossing': {
    first: [
      { text: 'The Snake River lives up to its name—winding, unpredictable, and potentially deadly.', mood: 'foreboding' },
      { text: 'A river named Snake. What could go wrong? Everything, is what.', mood: 'foreboding' },
    ],
    return: [
      { text: 'The Snake again. It hasn\'t gotten any friendlier. Rivers hold grudges apparently.', mood: 'foreboding' },
    ],
    familiar: [
      { text: 'You know this river\'s moods now. Today it seems... contemplative. Still dangerous.', mood: 'foreboding' },
    ],
    regular: [
      { text: 'The Snake River. You\'ve developed a professional relationship with it. Professional meaning it tolerates you sometimes.', mood: 'weary' },
    ],
  },

  'Fort Boise': {
    first: [
      { text: 'Fort Boise. An oasis in increasingly difficult terrain. The Hudson\'s Bay Company welcomes your currency.', mood: 'business' },
      { text: 'Trees begin to reappear here. You didn\'t realize how much you missed them until now.', mood: 'welcoming' },
    ],
    return: [
      { text: 'Fort Boise stands ready with supplies and, importantly, shade.', mood: 'welcoming' },
    ],
    familiar: [
      { text: 'The garrison nods as you enter. You\'ve become part of the fort\'s rhythm.', mood: 'welcoming' },
    ],
    regular: [
      { text: 'At this point, you could run Fort Boise if they asked. You pray they don\'t ask.', mood: 'weary' },
    ],
  },

  'Blue Mountains': {
    first: [
      { text: 'The Blue Mountains. Named for their color at dusk. Notorious for other reasons entirely.', mood: 'foreboding' },
      { text: 'Dense forest and steep grades. The end is near—in the hopeful sense.', mood: 'foreboding' },
    ],
    return: [
      { text: 'The Blue Mountains again. You\'d forgotten how much you hated this part.', mood: 'weary' },
    ],
    familiar: [
      { text: 'You know every treacherous turn now. This doesn\'t make them less treacherous.', mood: 'foreboding' },
    ],
    regular: [
      { text: 'The mountains seem almost disappointed you keep surviving them. You choose not to gloat.', mood: 'weary' },
    ],
  },

  'The Dalles': {
    first: [
      { text: 'The Dalles. The Columbia River churns through basalt. The end of the trail is close enough to taste.', mood: 'welcoming' },
      { text: 'Rocky shores and desperate choices. Continue by water or land? Both have killed many.', mood: 'foreboding' },
    ],
    return: [
      { text: 'The Dalles. Still roaring. Still impressive. Still slightly terrifying.', mood: 'foreboding' },
    ],
    familiar: [
      { text: 'Fishermen wave from the banks. They\'ve seen you struggle through before and seem amused.', mood: 'welcoming' },
    ],
    regular: [
      { text: 'You\'ve navigated The Dalles enough to offer tours. You don\'t, but you could.', mood: 'weary' },
    ],
  },

  'Sacramento Valley': {
    first: [
      { text: 'The Sacramento Valley spreads before you—golden and promising. You made it to California.', mood: 'welcoming' },
      { text: 'Fertile land, endless potential, and somewhere out there: gold. The journey\'s end is the beginning.', mood: 'mysterious' },
    ],
    return: [
      { text: 'The Valley welcomes you back with open fields and familiar trails.', mood: 'welcoming' },
    ],
    familiar: [
      { text: 'Farmers wave from their plots. You\'re known here now. Your reputation precedes you.', mood: 'welcoming' },
    ],
    regular: [
      { text: 'Home away from home, if home were made of gold fever and endless possibility.', mood: 'welcoming' },
    ],
  },

  'West Point': {
    first: [
      { text: 'West Point. A small town with large ambitions. Cynthia\'s Inn glows warmly in the evening.', mood: 'welcoming' },
      { text: 'The heart of Gold Country. Every rock tells a story of fortune sought and sometimes found.', mood: 'mysterious' },
    ],
    return: [
      { text: 'West Point remembers you. The innkeeper has your usual room prepared.', mood: 'welcoming' },
    ],
    familiar: [
      { text: 'You\'re becoming a fixture here. The locals include you in their gossip.', mood: 'welcoming' },
    ],
    regular: [
      { text: '"Your usual spot," says Cynthia, gesturing to the best table. You belong here now.', mood: 'welcoming' },
    ],
  },

  'Gold Country': {
    first: [
      { text: 'Gold Country. The promised land. The hills glitter with possibility—and danger.', mood: 'mysterious' },
      { text: 'You made it. Two thousand miles of trail behind you, untold adventure ahead.', mood: 'welcoming' },
    ],
    return: [
      { text: 'Gold Country welcomes you back. The streams remember the feel of your pan.', mood: 'welcoming' },
    ],
    familiar: [
      { text: 'The prospectors nod as you pass. You\'re one of them now, for better or worse.', mood: 'welcoming' },
    ],
    regular: [
      { text: 'More at home in Gold Country than you ever were back East. The trail changed you.', mood: 'welcoming' },
    ],
  },
}

// Get a random message for a town visit
export function getTownArrivalMessage(
  townName: string,
  visitCount: number
): TownArrivalMessage | null {
  const townData = TOWN_ARRIVALS[townName]
  if (!townData) return null

  const tier = getVisitTier(visitCount)
  const messages = townData[tier]

  if (!messages || messages.length === 0) return null

  return messages[Math.floor(Math.random() * messages.length)]
}

// Generic messages for unknown towns
export const GENERIC_ARRIVALS: TownArrivalSet = {
  first: [
    { text: 'A new settlement. Every building has a story you\'re about to interrupt.', mood: 'mysterious' },
    { text: 'Another stop on the endless trail. Let\'s see what this place has to offer.', mood: 'business' },
  ],
  return: [
    { text: 'Back again. The town looks different, or maybe you do.', mood: 'weary' },
  ],
  familiar: [
    { text: 'Familiar streets and familiar faces. You\'re building a second life out here.', mood: 'welcoming' },
  ],
  regular: [
    { text: 'At this point, you could draw a map of this place from memory.', mood: 'weary' },
  ],
}
