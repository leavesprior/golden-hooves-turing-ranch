/**
 * Gold Country Encounters - Random travel encounters and location search areas
 * Used during gold_country_travel phase and location exploration
 */

export interface TravelEncounter {
  id: string
  title: string
  description: string
  type: 'combat' | 'trade' | 'rescue' | 'wildlife' | 'mystery' | 'opportunity'
  icon: string
  choices: EncounterChoice[]
  minDistance?: number  // Only trigger if travel distance > this
}

export interface EncounterChoice {
  id: string
  text: string
  outcome: EncounterOutcome
  statCheck?: { stat: 'strength' | 'athleticism' | 'diplomacy' | 'luck' | 'expertise' | 'shrewdness'; difficulty: number }
}

export interface EncounterOutcome {
  message: string
  goldDelta?: number
  healthDelta?: number
  karmaDelta?: number   // good karma
  foodDelta?: number
  reputationDelta?: number
  itemGained?: string
  discoveredLocation?: string
}

export interface SearchArea {
  id: string
  name: string
  description: string
  location: string
  icon: string
  searchDifficulty: number  // 1-10
  statBonus?: 'expertise' | 'shrewdness' | 'luck'
  findings: SearchFinding[]
}

export interface SearchFinding {
  id: string
  description: string
  probability: number  // 0-1
  isClue: boolean
  clueId?: string  // links to investigation system
  itemGained?: string
  goldGained?: number
  karmaGained?: number
}

// === TRAVEL ENCOUNTERS ===

export const TRAVEL_ENCOUNTERS: TravelEncounter[] = [
  {
    id: 'bandit_ambush',
    title: 'Bandit Ambush!',
    description: 'A group of road agents blocks the trail ahead. Their leader tips his hat menacingly.',
    type: 'combat',
    icon: '🔫',
    choices: [
      {
        id: 'fight',
        text: 'Stand your ground and fight',
        outcome: {
          message: 'After a brief skirmish, you drive off the bandits! They drop some supplies in their retreat.',
          goldDelta: 25,
          healthDelta: -10,
          reputationDelta: 5,
        },
        statCheck: { stat: 'strength', difficulty: 5 },
      },
      {
        id: 'negotiate',
        text: 'Try to talk your way out',
        outcome: {
          message: 'Your silver tongue convinces them you\'re not worth the trouble. They wave you through.',
          reputationDelta: 3,
        },
        statCheck: { stat: 'diplomacy', difficulty: 6 },
      },
      {
        id: 'pay_toll',
        text: 'Pay the "toll" (30 gold)',
        outcome: {
          message: 'You hand over the gold. The bandit grins. "Pleasure doin\' business."',
          goldDelta: -30,
        },
      },
    ],
    minDistance: 2,
  },
  {
    id: 'traveling_merchant',
    title: 'Traveling Merchant',
    description: 'A well-stocked wagon pulls alongside you. "Genuine Gold Rush supplies! Best prices this side of Sacramento!"',
    type: 'trade',
    icon: '🛒',
    choices: [
      {
        id: 'buy_supplies',
        text: 'Buy food and medicine (40 gold)',
        outcome: {
          message: 'You stock up on supplies. The merchant throws in a lucky charm for free.',
          goldDelta: -40,
          foodDelta: 50,
          healthDelta: 10,
        },
      },
      {
        id: 'trade_info',
        text: 'Trade information instead',
        outcome: {
          message: 'The merchant shares valuable intel about a hidden location in exchange for your trail news.',
          discoveredLocation: 'sandy_gulch',
        },
        statCheck: { stat: 'shrewdness', difficulty: 4 },
      },
      {
        id: 'decline',
        text: 'Decline politely and move on',
        outcome: {
          message: '"Suit yourself! But you\'ll regret it when you\'re hungry!" The wagon moves on.',
        },
      },
    ],
  },
  {
    id: 'lost_traveler',
    title: 'Lost Traveler',
    description: 'A disoriented traveler stumbles toward you, dehydrated and confused. "Please... which way to town?"',
    type: 'rescue',
    icon: '🆘',
    choices: [
      {
        id: 'help_fully',
        text: 'Share water and escort them to safety',
        outcome: {
          message: 'The grateful traveler recovers and shares information about a nearby discovery.',
          karmaDelta: 20,
          foodDelta: -10,
          reputationDelta: 8,
          discoveredLocation: 'indian_grinding_rock',
        },
      },
      {
        id: 'give_directions',
        text: 'Point them toward the nearest town',
        outcome: {
          message: '"Thank you, stranger." They stumble off in the right direction.',
          karmaDelta: 5,
        },
      },
      {
        id: 'ignore',
        text: 'Keep moving - can\'t help everyone',
        outcome: {
          message: 'You press on, trying not to think about the traveler. Your conscience nags.',
          karmaDelta: -10,
        },
      },
    ],
  },
  {
    id: 'grizzly_bear',
    title: 'Grizzly Bear!',
    description: 'A massive California grizzly blocks the trail, sniffing the air. It\'s between you and your destination.',
    type: 'wildlife',
    icon: '🐻',
    choices: [
      {
        id: 'stand_tall',
        text: 'Stand tall and make yourself big',
        outcome: {
          message: 'The bear decides you\'re not worth the trouble and lumbers away into the brush.',
          reputationDelta: 3,
        },
        statCheck: { stat: 'athleticism', difficulty: 5 },
      },
      {
        id: 'back_away',
        text: 'Slowly back away',
        outcome: {
          message: 'You retreat carefully. The bear watches you go, then returns to foraging.',
        },
      },
      {
        id: 'offer_food',
        text: 'Toss some food as a distraction',
        outcome: {
          message: 'The bear takes the bait! While it eats, you slip past safely.',
          foodDelta: -20,
        },
      },
    ],
  },
  {
    id: 'mysterious_stranger',
    title: 'Mysterious Stranger',
    description: 'A figure in a long coat sits by a campfire, face hidden by shadow. "Join me for a spell?"',
    type: 'mystery',
    icon: '🕵️',
    choices: [
      {
        id: 'sit_and_talk',
        text: 'Sit and listen to their story',
        outcome: {
          message: 'The stranger shares a cryptic clue about the investigation. "Follow the laundry marks..."',
          itemGained: 'mysterious_note',
          reputationDelta: 2,
        },
      },
      {
        id: 'question',
        text: 'Demand to know their identity',
        outcome: {
          message: 'The figure stands and tips their hat. "In due time, friend." They vanish into the night.',
        },
        statCheck: { stat: 'shrewdness', difficulty: 7 },
      },
      {
        id: 'walk_away',
        text: 'Best not to engage with strangers',
        outcome: {
          message: 'You pass by. The stranger calls out: "You\'ll wish you\'d listened, when the time comes."',
        },
      },
    ],
    minDistance: 3,
  },
  {
    id: 'abandoned_wagon',
    title: 'Abandoned Wagon',
    description: 'An overturned wagon sits by the trail. Supplies are scattered, but no one is in sight.',
    type: 'opportunity',
    icon: '🛞',
    choices: [
      {
        id: 'search_wagon',
        text: 'Search the wagon for useful supplies',
        outcome: {
          message: 'You find food, a few gold coins, and a torn map fragment.',
          goldDelta: 35,
          foodDelta: 25,
          itemGained: 'torn_map_fragment',
        },
      },
      {
        id: 'look_for_owner',
        text: 'Look for the wagon\'s owner',
        outcome: {
          message: 'You find the owner injured nearby. They gratefully offer a reward for your help.',
          karmaDelta: 15,
          goldDelta: 50,
          reputationDelta: 5,
        },
        statCheck: { stat: 'expertise', difficulty: 4 },
      },
      {
        id: 'leave_it',
        text: 'Leave it alone - could be a trap',
        outcome: {
          message: 'Smart thinking. You notice boot prints in the dust leading to an ambush point.',
          reputationDelta: 2,
        },
        statCheck: { stat: 'luck', difficulty: 3 },
      },
    ],
  },
  {
    id: 'gold_nugget_stream',
    title: 'Glittering Stream',
    description: 'Sunlight catches something in the creek bed. It could be gold... or just fool\'s gold.',
    type: 'opportunity',
    icon: '✨',
    choices: [
      {
        id: 'pan_for_gold',
        text: 'Spend time panning the stream',
        outcome: {
          message: 'Your patience pays off! Real gold flakes settle in the pan.',
          goldDelta: 60,
        },
        statCheck: { stat: 'luck', difficulty: 5 },
      },
      {
        id: 'mark_location',
        text: 'Mark the location and continue',
        outcome: {
          message: 'You note the spot on your map. Could be worth coming back to.',
          itemGained: 'stream_location_note',
        },
      },
    ],
  },
  {
    id: 'stagecoach_holdup',
    title: 'Stagecoach in Trouble',
    description: 'Ahead, a stagecoach is being robbed by masked men. The driver is pinned down.',
    type: 'combat',
    icon: '🐎',
    choices: [
      {
        id: 'intervene',
        text: 'Rush in to help the stagecoach',
        outcome: {
          message: 'You help drive off the robbers! The grateful Wells Fargo driver rewards you handsomely.',
          goldDelta: 75,
          karmaDelta: 20,
          reputationDelta: 10,
          healthDelta: -15,
        },
        statCheck: { stat: 'strength', difficulty: 6 },
      },
      {
        id: 'sneak_around',
        text: 'Circle around and flank the robbers',
        outcome: {
          message: 'Your surprise attack scatters the bandits. The stagecoach escapes safely.',
          goldDelta: 50,
          karmaDelta: 15,
          reputationDelta: 8,
        },
        statCheck: { stat: 'shrewdness', difficulty: 5 },
      },
      {
        id: 'stay_hidden',
        text: 'Stay hidden and wait for it to pass',
        outcome: {
          message: 'The robbers take what they want and ride off. The driver limps away.',
          karmaDelta: -5,
        },
      },
    ],
    minDistance: 3,
  },

  // === DISASTER / SURVIVAL ENCOUNTERS ===

  {
    id: 'mokelumne_flash_flood',
    title: 'Flash Flood on the Mokelumne!',
    description: 'Without warning, a wall of brown water roars down the Mokelumne River canyon. The ford you were crossing churns white with debris. Uprooted oaks crash past.',
    type: 'combat',
    icon: '🌊',
    choices: [
      {
        id: 'sprint_for_high_ground',
        text: 'Sprint for the canyon rim — every second counts',
        outcome: {
          message: 'You scramble up the loose shale as the surge swallows the trail behind you. You make it — breathless, scraped, alive. Below, the flood carries off a wagon that was not so lucky.',
          healthDelta: -15,
          reputationDelta: 5,
        },
        statCheck: { stat: 'athleticism', difficulty: 6 },
      },
      {
        id: 'lash_to_tree',
        text: 'Lash yourself to the nearest oak and ride it out',
        outcome: {
          message: 'The flood tears at your legs for a terrifying hour. When the waters recede you are bruised and shaking, but alive. You find a miner\'s pack wedged in the roots — he was not so fortunate.',
          healthDelta: -30,
          goldDelta: 45,
          itemGained: 'miner_pack',
        },
        statCheck: { stat: 'strength', difficulty: 5 },
      },
      {
        id: 'help_stranded_family',
        text: 'A family is stranded on a gravel bar — pull them to safety first',
        outcome: {
          message: 'You form a human chain and haul the children and mother to high ground before the worst surge arrives. The father, a Jackson merchant, vows you have friends in his town forever.',
          healthDelta: -20,
          karmaDelta: 25,
          reputationDelta: 15,
        },
        statCheck: { stat: 'strength', difficulty: 7 },
      },
    ],
    minDistance: 2,
  },
  {
    id: 'pine_forest_wildfire',
    title: 'Wildfire in the Pines!',
    description: 'The wind shifts and suddenly the hillside above the trail is a curtain of orange flame. Ponderosa pines explode like torches. The smoke is already thickening to soup.',
    type: 'combat',
    icon: '🔥',
    choices: [
      {
        id: 'read_the_fire',
        text: 'Read the wind and find the fire break',
        outcome: {
          message: 'You recall the old miners\' rule: fire climbs uphill, move downhill and across. You pick your line perfectly, bursting out of the smoke into a rocky clearing. Your lungs burn but you are clear.',
          healthDelta: -10,
          reputationDelta: 8,
        },
        statCheck: { stat: 'expertise', difficulty: 6 },
      },
      {
        id: 'soak_cloth_run',
        text: 'Wet your bandana, cover your face, and run hard through the smoke',
        outcome: {
          message: 'Half blind in the roiling smoke, you run on instinct. You stumble out the far side coughing blood-dark soot. It takes two days to recover your breath fully.',
          healthDelta: -25,
          foodDelta: -15,
        },
      },
      {
        id: 'shelter_in_place_creek',
        text: 'Drop into the nearby creek bed and wait for the fire to pass',
        outcome: {
          message: 'You submerge to your chin in the cold creek while the fire roars overhead. Embers hiss around you. When silence returns, the hillside is black and smoking — but you find scorched but usable mining equipment left behind by fleeing prospectors.',
          healthDelta: -5,
          itemGained: 'scorched_mining_tools',
          goldDelta: 20,
        },
        statCheck: { stat: 'luck', difficulty: 4 },
      },
    ],
    minDistance: 2,
  },
  {
    id: 'mine_collapse_rescue',
    title: 'Mine Collapse — Men Trapped!',
    description: 'A deep boom shakes the ground and a column of dust erupts from a nearby shaft entrance. Panicked miners rush out screaming "Timber gave way! Three men down below!"',
    type: 'rescue',
    icon: '⛏️',
    choices: [
      {
        id: 'descend_the_shaft',
        text: 'Tie a rope to the headframe and descend into the shaft',
        outcome: {
          message: 'In near-total darkness you locate the trapped men in an air pocket. Two are injured but alive. The third did not survive. The rescued miners share their emergency gold cache with you out of gratitude.',
          healthDelta: -20,
          karmaDelta: 30,
          goldDelta: 80,
          reputationDelta: 20,
        },
        statCheck: { stat: 'strength', difficulty: 7 },
      },
      {
        id: 'organize_rescue_crew',
        text: 'Organize the surviving miners into a proper rescue brigade',
        outcome: {
          message: 'You take command, assign roles, and coordinate a methodical dig. It takes four hours but all three men come out alive. The mining company superintendent shakes your hand and enters your name in his ledger favorably.',
          karmaDelta: 20,
          reputationDelta: 25,
          goldDelta: 50,
        },
        statCheck: { stat: 'diplomacy', difficulty: 5 },
      },
      {
        id: 'flee_the_collapse',
        text: 'The ground is still settling — get away from the unstable zone',
        outcome: {
          message: 'A second tremor confirms your fear: the whole hillside is shifting. You retreat just before another section collapses. From a safe distance you watch the rescue unfold without you. The men survive, but word spreads that you ran.',
          reputationDelta: -10,
          karmaDelta: -10,
          healthDelta: 5,
        },
      },
    ],
    minDistance: 3,
  },
  {
    id: 'cholera_outbreak_camp',
    title: 'Cholera Outbreak at Camp',
    description: 'The mining camp ahead is flying a yellow quarantine flag. A hollow-eyed man meets you at the perimeter: "Cholera. Came up the river two nights ago. Half the men are down. We\'re out of medicine."',
    type: 'rescue',
    icon: '🤒',
    choices: [
      {
        id: 'share_medicine_treat',
        text: 'Share your medicine supplies and help tend the sick',
        outcome: {
          message: 'You spend an exhausting day mixing saline solutions and keeping men hydrated. Most survive. One older miner presses a pouch of gold dust into your hands: "Take it. You saved my life."',
          healthDelta: -15,
          foodDelta: -20,
          karmaDelta: 30,
          goldDelta: 60,
          reputationDelta: 15,
        },
        statCheck: { stat: 'expertise', difficulty: 5 },
      },
      {
        id: 'boil_water_advise',
        text: 'Advise them on clean water and boiling — leave your extra food',
        outcome: {
          message: 'You explain what you know about contaminated water and demonstrate boiling techniques. The camp doctor thanks you. New cases slow by evening. You leave feeling you made a difference without risking your health.',
          foodDelta: -30,
          karmaDelta: 20,
          reputationDelta: 10,
        },
        statCheck: { stat: 'diplomacy', difficulty: 4 },
      },
      {
        id: 'detour_around_camp',
        text: 'Detour wide around the camp — cholera kills fast',
        outcome: {
          message: 'You swing two miles out of your way through dense chaparral to avoid the camp. It costs you half a day and shreds your boots on the volcanic rock. Prudent, but haunting.',
          healthDelta: -10,
          foodDelta: -10,
          karmaDelta: -5,
        },
      },
    ],
    minDistance: 2,
  },

  // === NPC-FOCUSED ENCOUNTERS ===

  {
    id: 'chinese_railroad_workers',
    title: 'Chinese Workers\' Camp',
    description: 'A neat camp of Chinese railroad laborers is set along the grade. They watch you approach with cautious dignity. The foreman speaks careful English: "You look hungry, stranger. We have rice and pork fat."',
    type: 'trade',
    icon: '🏮',
    choices: [
      {
        id: 'accept_share_meal',
        text: 'Accept their hospitality and share your own stories',
        outcome: {
          message: 'Over a fire of pine knots you swap stories through halting translation. They show you a tunnel shortcut through the ridge that saves miles of trail. When you leave, the foreman tucks a packet of dried ginger into your pack — good for the stomach on bad water.',
          foodDelta: 40,
          karmaDelta: 20,
          reputationDelta: 10,
          itemGained: 'dried_ginger',
          discoveredLocation: 'railroad_tunnel_cut',
        },
      },
      {
        id: 'trade_tools_for_food',
        text: 'Offer your spare tools in trade for medicine',
        outcome: {
          message: 'They examine your tools approvingly and produce a well-stocked medicine kit assembled from ingredients shipped from San Francisco\'s Chinatown. A fair trade — and you part with genuine respect on both sides.',
          foodDelta: 20,
          healthDelta: 20,
          itemGained: 'herbal_medicine_kit',
          karmaDelta: 10,
        },
        statCheck: { stat: 'shrewdness', difficulty: 4 },
      },
      {
        id: 'warn_about_danger',
        text: 'Warn them about the vigilante group you heard is riding this road',
        outcome: {
          message: 'The foreman\'s face tightens when you describe the riders. He moves the camp deeper into the ravine. A week later you hear the riders found an empty grade. The foreman sends word to you through a Jackson merchant: "We remember."',
          karmaDelta: 25,
          reputationDelta: 12,
          foodDelta: 25,
        },
      },
    ],
  },
  {
    id: 'traveling_preacher',
    title: 'Reverend on the Road',
    description: 'A lean man in a weathered black coat has set up a crude pulpit of stacked whiskey barrels beside the trail. His voice carries above the wind: "The Lord\'s pharmacy is open, friend — free of charge!"',
    type: 'rescue',
    icon: '\u271D',
    choices: [
      {
        id: 'attend_the_sermon',
        text: 'Stop and listen — you could use some uplift',
        outcome: {
          message: 'His sermon weaves scripture with Gold Rush wisdom in a way that is genuinely moving. He lays hands on your shoulders and speaks a quiet blessing. You leave with your spirits truly lifted and a loaf of cornbread the congregation pressed on you.',
          healthDelta: 15,
          karmaDelta: 15,
          foodDelta: 20,
          reputationDelta: 5,
        },
      },
      {
        id: 'ask_for_healing',
        text: 'Your wounds are bad — ask if he has real medicine',
        outcome: {
          message: 'He has more than you expected: proper wound dressings, tincture of iodine, and whiskey for sterilizing. "God helps those who come prepared," he says with a wink, dressing your wounds with practiced hands.',
          healthDelta: 30,
          itemGained: 'field_dressing_kit',
        },
        statCheck: { stat: 'diplomacy', difficulty: 3 },
      },
      {
        id: 'donate_to_collection',
        text: 'Drop gold in the collection plate — these communities need churches',
        outcome: {
          message: 'Word travels fast in Gold Country. Two days later, a miner who heard of your generosity at the Reverend\'s camp buys you a meal in town and insists on introducing you to the assay office manager.',
          goldDelta: -20,
          karmaDelta: 20,
          reputationDelta: 18,
        },
      },
    ],
  },
  {
    id: 'pony_express_rider',
    title: 'Pony Express Rider!',
    description: 'A rider thunders toward you at a full gallop, mochila strapped tight. He reins in hard: "Route\'s flooded south of Placerville — they\'re redirecting via Sonora Pass. There\'s talk of road agents on the lower road too. You riding that way?"',
    type: 'mystery',
    icon: '🐴',
    choices: [
      {
        id: 'heed_the_warning_detour',
        text: 'Take the Sonora Pass detour he recommends',
        outcome: {
          message: 'The high pass adds half a day but the road is clear and dry. You pass the flooded lower crossing from above — three wagons are mired axle-deep in the mud. You made the right call.',
          foodDelta: -15,
          reputationDelta: 5,
          discoveredLocation: 'sonora_pass_cutoff',
        },
      },
      {
        id: 'ask_for_the_dispatches',
        text: 'Ask if any dispatches concern this region\'s gold shipments',
        outcome: {
          message: 'He hesitates — then shows you a header page. A large shipment is being routed through Jackson tomorrow. In the wrong hands that information is dangerous. In yours, it becomes a trading chip with the local Wells Fargo agent.',
          itemGained: 'dispatch_header',
          reputationDelta: 8,
          karmaDelta: 5,
        },
        statCheck: { stat: 'shrewdness', difficulty: 6 },
      },
      {
        id: 'press_on_lower_road',
        text: 'Thank him but press on — the lower road saves a full day',
        outcome: {
          message: 'You nearly make it through before hitting the flooded ford. You spend four miserable hours winching your gear across on a makeshift raft. Wet, exhausted, and two gold coins lighter for the ferryman who appears from nowhere.',
          goldDelta: -20,
          healthDelta: -15,
          foodDelta: -10,
        },
      },
    ],
    minDistance: 2,
  },
  {
    id: 'native_guide_shortcut',
    title: 'Miwok Guide at the Crossroads',
    description: 'A Northern Sierra Miwok man sits calmly at a trail junction, watching you study your map with obvious confusion. "Three roads," he says in accented English. "Two long. One short. I know the short one."',
    type: 'opportunity',
    icon: '🗺️',
    choices: [
      {
        id: 'accept_the_guide',
        text: 'Accept his offer and follow his lead',
        outcome: {
          message: 'He leads you along a deer path that threads through manzanita and oak woodland, hitting the main trail two miles ahead of the junction. The shortcut saves three hours. At the parting he points to a spring in a granite bowl that does not appear on any map.',
          foodDelta: 10,
          reputationDelta: 10,
          karmaDelta: 15,
          discoveredLocation: 'hidden_granite_spring',
        },
      },
      {
        id: 'offer_trade_for_map',
        text: 'Offer him gold to draw the shortcut on your map',
        outcome: {
          message: 'He considers the gold with a slight smile, then draws clean, accurate lines on your map marking not just the shortcut but also the locations of two grinding rock sites and a reliable water source. It is the most useful cartography you have received in months.',
          goldDelta: -15,
          itemGained: 'annotated_trail_map',
          reputationDelta: 8,
        },
        statCheck: { stat: 'diplomacy', difficulty: 4 },
      },
      {
        id: 'decline_politely',
        text: 'Decline — you prefer to trust your own map',
        outcome: {
          message: 'He shrugs without offense and resumes watching the crossroads. Two hours later, after following the wrong fork a mile and a half, you wish you had listened.',
          healthDelta: -5,
          foodDelta: -10,
        },
      },
    ],
  },
  {
    id: 'widow_broken_wagon',
    title: 'Widow with a Broken Axle',
    description: 'A woman in travel-worn black dress stands beside a wagon with a shattered rear axle, three young children watching from inside. "My husband is gone six months now. I just need to reach my sister in Stockton."',
    type: 'rescue',
    icon: '🛻',
    choices: [
      {
        id: 'repair_the_axle',
        text: 'Use your tools and timber to splice a replacement axle',
        outcome: {
          message: 'It takes the better part of an afternoon with green timber and iron banding, but the axle holds. She insists you take her late husband\'s surveying instruments — too heavy for her to carry and too good to leave. She becomes a contact in Stockton who proves invaluable later.',
          healthDelta: -5,
          karmaDelta: 25,
          reputationDelta: 15,
          itemGained: 'surveying_instruments',
        },
        statCheck: { stat: 'expertise', difficulty: 5 },
      },
      {
        id: 'share_supplies_escort',
        text: 'Escort her to the next town and share your food',
        outcome: {
          message: 'Walking beside the limping wagon, you keep watch while she nurses the smallest child through a fever. By nightfall you reach Mokelumne Hill. The town doctor treats the child for free when he hears what you did. Your reputation in town grows.',
          foodDelta: -25,
          karmaDelta: 20,
          reputationDelta: 20,
          goldDelta: 30,
        },
      },
      {
        id: 'send_help_from_town',
        text: 'Continue ahead and send a repair crew back from the next town',
        outcome: {
          message: 'You reach town and hire two men with a spare axle to ride back. It costs you gold and the job takes most of the day, but the widow and children arrive safely by dark. A decent compromise.',
          goldDelta: -25,
          karmaDelta: 10,
          reputationDelta: 8,
        },
      },
    ],
  },

  // === FACTION CONFRONTATIONS ===

  {
    id: 'railroad_agent_demand',
    title: 'Central Pacific Right-of-Way',
    description: 'A well-dressed man with a brass-capped walking stick blocks the road. Behind him stand two large men. "Central Pacific Railroad surveys this corridor. Your trail crosses our right-of-way. There will be a fee for continued use."',
    type: 'combat',
    icon: '🚂',
    choices: [
      {
        id: 'pay_the_fee',
        text: 'Pay the crossing fee (25 gold) and move on',
        outcome: {
          message: 'You hand over the gold. The agent tips his hat with practiced smoothness. Word reaches you later that the "fee" was entirely unofficial — the man\'s pockets, not the railroad\'s.',
          goldDelta: -25,
        },
      },
      {
        id: 'cite_public_road_law',
        text: 'Cite the public road statute — this trail predates their survey',
        outcome: {
          message: 'You hold your ground with legal arguments sharp enough to make the agent uncomfortable. He backs down, muttering. The two large men step aside. Your spine just earned you a free crossing and the respect of miners watching nearby.',
          reputationDelta: 12,
          karmaDelta: 5,
        },
        statCheck: { stat: 'diplomacy', difficulty: 7 },
      },
      {
        id: 'find_alternate_route',
        text: 'Turn back and find an alternate route',
        outcome: {
          message: 'You backtrack a mile and pick your way through scrub oak. It costs time and scratches, but you cross railroad land without surrendering a cent — or your dignity.',
          healthDelta: -5,
          foodDelta: -5,
        },
        statCheck: { stat: 'expertise', difficulty: 3 },
      },
    ],
    minDistance: 2,
  },
  {
    id: 'vigilance_committee',
    title: 'Vigilance Committee Checkpoint',
    description: 'Six men with rifles and flour-sack hoods stand across the road. Their leader carries a lantern in one hand and a noose in the other. "Lots of strangers in Gold Country lately. We check papers now. Who are you and what\'s your business?"',
    type: 'combat',
    icon: '🪢',
    choices: [
      {
        id: 'show_credentials',
        text: 'Present your papers and answer their questions directly',
        outcome: {
          message: 'Your straightforward honesty visibly discomfits them — they expected guilt. The leader lowers the lantern. "You\'re clear. But watch yourself." They part to let you through. You notice one man\'s boots match a description from a robbery report.',
          reputationDelta: 5,
          itemGained: 'vigilante_boot_sketch',
        },
        statCheck: { stat: 'diplomacy', difficulty: 5 },
      },
      {
        id: 'invoke_merchants_name',
        text: 'Drop the name of the Jackson merchant who vouched for you',
        outcome: {
          message: 'The name registers immediately. One of the masked men nods. "He\'s good people." The leader waves you through with no further questioning. Reputation in Gold Country is its own currency.',
          reputationDelta: 3,
        },
        statCheck: { stat: 'shrewdness', difficulty: 4 },
      },
      {
        id: 'refuse_and_push_through',
        text: 'Refuse their authority and push your way through',
        outcome: {
          message: 'Three rifles come up fast. You push through anyway, which impresses nobody and nearly gets you shot. You make it — barely — but word spreads that you are difficult. Two towns later, doors are slower to open.',
          healthDelta: -20,
          reputationDelta: -15,
          karmaDelta: -5,
        },
      },
    ],
    minDistance: 3,
  },
  {
    id: 'claim_jumpers',
    title: 'Rival Claim Jumpers',
    description: 'At the creek crossing, two hard-looking men are digging in a claim that has another man\'s marker stake. The legitimate miner stands to one side, fists clenched, outnumbered. He catches your eye — a silent plea.',
    type: 'combat',
    icon: '\u2692\uFE0F',
    choices: [
      {
        id: 'back_the_miner',
        text: 'Stand with the legitimate miner and enforce the claim',
        outcome: {
          message: 'You level your gaze at the jumpers and make clear you are not moving. The arithmetic changes — now it is two against two. They curse and gather their tools, riding off. The grateful miner splits his next pan\'s take with you.',
          goldDelta: 40,
          karmaDelta: 20,
          reputationDelta: 15,
          healthDelta: -10,
        },
        statCheck: { stat: 'strength', difficulty: 6 },
      },
      {
        id: 'find_assayer_resolve',
        text: 'Propose taking the claim dispute to the district assayer for arbitration',
        outcome: {
          message: 'Both parties grudgingly agree. The assayer reads the original filing date and rules for the legitimate miner. The jumpers slink off. You receive a finder\'s fee for preventing bloodshed.',
          goldDelta: 25,
          karmaDelta: 15,
          reputationDelta: 18,
        },
        statCheck: { stat: 'diplomacy', difficulty: 5 },
      },
      {
        id: 'mind_your_own_business',
        text: 'Keep moving — claim disputes can turn deadly fast',
        outcome: {
          message: 'Prudence keeps you safe. Regret follows you down the trail. You hear shots behind you an hour later.',
          karmaDelta: -15,
        },
      },
    ],
    minDistance: 2,
  },
  {
    id: 'toll_collector',
    title: 'Unofficial Road Toll',
    description: 'A chain is strung across the road. A stout man in a canvas apron holds out his palm. "Road improvements, friend. Two bits per traveler, dollar per wagon. Private road now — county sold the franchise."',
    type: 'trade',
    icon: '\u26D3\uFE0F',
    choices: [
      {
        id: 'pay_the_toll',
        text: 'Pay and move on — arguing costs time (15 gold)',
        outcome: {
          message: 'You pay. The chain drops. Twenty feet past it you see the "improvements" — a single board laid over a puddle. California entrepreneurship at its finest.',
          goldDelta: -15,
        },
      },
      {
        id: 'demand_the_franchise_papers',
        text: 'Demand to see the county franchise documentation',
        outcome: {
          message: 'The collector blinks. He never expected literacy. He fumbles, produces nothing credible, and eventually drops the chain free of charge, muttering about the lack of respect for honest business. Behind you, four other travelers slip through on your coattails.',
          reputationDelta: 10,
          karmaDelta: 5,
        },
        statCheck: { stat: 'shrewdness', difficulty: 5 },
      },
      {
        id: 'bribe_with_information',
        text: 'Offer gossip about a rich strike nearby instead of gold',
        outcome: {
          message: 'You spin a convincing tale about a rich quartz vein two canyons east. His eyes light up. He abandons the chain entirely, packs his mule, and rides off to investigate. You walk through the unguarded toll station with a grin.',
          reputationDelta: 5,
          karmaDelta: -5,
        },
        statCheck: { stat: 'diplomacy', difficulty: 4 },
      },
    ],
  },

  // === OPPORTUNITY / DISCOVERY ENCOUNTERS ===

  {
    id: 'abandoned_gold_sluice',
    title: 'Abandoned Sluice Box',
    description: 'Tucked in a side ravine, a long wooden sluice box has been left behind mid-operation. The rocker is still dripping. Whoever ran it left in a hurry — or never came back.',
    type: 'opportunity',
    icon: '💰',
    choices: [
      {
        id: 'work_the_sluice',
        text: 'Work the remaining gravel through the box',
        outcome: {
          message: 'The riffles at the bottom have been collecting for days unattended. You rake out a respectable pouch of fine gold dust and three pea-sized nuggets. Someone\'s loss, your gain.',
          goldDelta: 90,
          healthDelta: -5,
        },
        statCheck: { stat: 'expertise', difficulty: 4 },
      },
      {
        id: 'look_for_original_owner',
        text: 'Check for a claim marker and try to find the owner',
        outcome: {
          message: 'A stake sixty feet upstream bears faded initials: R.H.M. You ask around Jackson and find the widow of Robert H. Marsh, whose husband disappeared three months ago. She weeps and rewards you with half the gold she finds when she sends workers to work the claim.',
          goldDelta: 50,
          karmaDelta: 30,
          reputationDelta: 20,
        },
        statCheck: { stat: 'shrewdness', difficulty: 5 },
      },
      {
        id: 'take_the_sluice_box',
        text: 'The box itself is worth money — dismantle it and take it',
        outcome: {
          message: 'The ironwood box is well-made and sells for good money at the hardware in Jackson. No one comes asking, at least not while you\'re in town.',
          goldDelta: 35,
          karmaDelta: -5,
        },
      },
    ],
    minDistance: 2,
  },
  {
    id: 'hot_springs_healing',
    title: 'Hot Springs in the Foothills',
    description: 'Steam rises from a cluster of granite boulders above the trail. A carved wooden sign reads: "WHEELER HOT SPRINGS — God\'s Own Pharmacy." A few miners soak in stone-rimmed pools, looking remarkably relaxed.',
    type: 'opportunity',
    icon: '\u2668\uFE0F',
    choices: [
      {
        id: 'soak_and_rest',
        text: 'Strip off your boots and soak — you\'ve earned it',
        outcome: {
          message: 'The mineral water is just below scalding and smells of sulfur. Within an hour your trail-battered muscles unknot and your various cuts begin to close cleanly. You sleep the best night in weeks wrapped in your bedroll beside the springs.',
          healthDelta: 40,
          foodDelta: -10,
        },
      },
      {
        id: 'trade_information_at_springs',
        text: 'Talk to the miners soaking here — hot springs are gossip hubs',
        outcome: {
          message: 'You learn that a large strike was reported near Volcano this week, that the sheriff of Mokelumne Hill is corrupt, and that a Chinese herbalist in Jackson can heal almost anything. Worth every sore muscle.',
          healthDelta: 15,
          reputationDelta: 8,
          discoveredLocation: 'volcano_new_strike',
          itemGained: 'springs_gossip_notes',
        },
        statCheck: { stat: 'diplomacy', difficulty: 3 },
      },
      {
        id: 'fill_canteens_move_on',
        text: 'Fill your canteens with the warm mineral water and push on',
        outcome: {
          message: 'You resist the temptation and fill your canteens. The mineral water tastes foul but the local miners claim it prevents dysentery. They may be right.',
          healthDelta: 10,
          foodDelta: 5,
        },
      },
    ],
  },
  {
    id: 'wild_horse_herd',
    title: 'Wild Horse Herd',
    description: 'A band of mustangs — descendants of Spanish stock gone feral — grazes the dry grass of the valley below the trail. A magnificent roan stallion watches you from the ridge. One limping mare near the edge looks manageable.',
    type: 'wildlife',
    icon: '🐎',
    choices: [
      {
        id: 'attempt_to_rope_roan',
        text: 'Try to rope the roan stallion — that horse would transform your journey',
        outcome: {
          message: 'You get close — very close — before he explodes in a wheeling pivot and leads the herd over the ridge in a drumroll of hooves. You are left in a cloud of dust, breathless and bruised from a fall, but alive and entertained.',
          healthDelta: -15,
        },
        statCheck: { stat: 'athleticism', difficulty: 8 },
      },
      {
        id: 'gentle_the_lame_mare',
        text: 'Approach the limping mare slowly — calm and patient',
        outcome: {
          message: 'An hour of patient work, grain in the open palm, voice kept low. She lets you touch her neck. You find a prickly-pear spine deep in her hoof, work it out, and pack the wound. By morning she follows you willingly. A strong traveling companion gained.',
          healthDelta: -5,
          karmaDelta: 20,
          itemGained: 'wild_mare',
          reputationDelta: 10,
        },
        statCheck: { stat: 'expertise', difficulty: 6 },
      },
      {
        id: 'observe_and_move_on',
        text: 'Watch them for a while — some things are better left wild',
        outcome: {
          message: 'You sit on a granite outcrop and watch the herd for the better part of an hour. The stallion eventually decides you are harmless and grazes toward you. A moment of pure Gold Country magic that costs nothing and gives everything.',
          karmaDelta: 10,
          reputationDelta: 3,
          healthDelta: 5,
        },
      },
    ],
    minDistance: 2,
  },
  {
    id: 'old_spanish_mission',
    title: 'Abandoned Mission Outpost',
    description: 'Hidden in a live-oak grove, an adobe structure with a ruined bell tower sits half-reclaimed by nature. A Mission-era acequia still runs clean water to a crumbling fountain. The storeroom door is ajar.',
    type: 'mystery',
    icon: '\u26EA',
    choices: [
      {
        id: 'enter_and_search',
        text: 'Explore the storeroom and chapel carefully',
        outcome: {
          message: 'The storeroom holds dried corn, olive oil in sealed clay pots, and a leather-bound register written in Spanish dating to 1823. Behind the altar, a stone-sealed cache contains silver candlesticks and a priest\'s personal gold cross. History in your hands.',
          goldDelta: 70,
          foodDelta: 35,
          itemGained: 'mission_register_1823',
          reputationDelta: 5,
        },
        statCheck: { stat: 'expertise', difficulty: 4 },
      },
      {
        id: 'take_water_leave_rest',
        text: 'Fill your canteens from the acequia and leave the rest undisturbed',
        outcome: {
          message: 'The spring water is ice cold and clear. You fill every vessel you carry. In the chapel doorway a painted saint watches you go with serene approval. You feel oddly at peace.',
          foodDelta: 20,
          healthDelta: 15,
          karmaDelta: 15,
        },
      },
      {
        id: 'document_report_to_church',
        text: 'Document the site and promise to report it to the diocese in Stockton',
        outcome: {
          message: 'You sketch the site carefully in your journal. When you reach Jackson you post a letter to the Bishop of Stockton. Three months later word comes back: the mission is to be restored. A gold rush family writes to thank you for preserving their ancestors\' history.',
          karmaDelta: 25,
          reputationDelta: 20,
          itemGained: 'mission_site_sketch',
        },
        statCheck: { stat: 'shrewdness', difficulty: 3 },
      },
    ],
    minDistance: 3,
  },

  // === TIMED / SEASONAL ENCOUNTERS ===

  {
    id: 'early_snowfall_mountain_pass',
    title: 'Early Snowfall at the Pass',
    description: 'October clouds have built all morning. Now the first flakes are falling — thick, serious flakes, not a tease. The Carson Pass road is still open, but the old-timers who know this country are turning their mules around.',
    type: 'combat',
    icon: '\u2744\uFE0F',
    choices: [
      {
        id: 'push_through_before_storm',
        text: 'Push hard and get over the pass before it closes',
        outcome: {
          message: 'You make the summit in a white-out, navigating by the rock cairns the road crew placed. The descent is brutal — ice under the snow, zero visibility — but you reach the lower elevation as the storm locks the pass shut behind you. Made it.',
          healthDelta: -25,
          foodDelta: -20,
          reputationDelta: 10,
        },
        statCheck: { stat: 'athleticism', difficulty: 7 },
      },
      {
        id: 'shelter_and_wait',
        text: 'Find shelter and wait for the storm to pass',
        outcome: {
          message: 'You locate a trapper\'s stone hut marked on your map and hole up for two days. Your food runs low but you emerge to clear skies and packed snow that actually makes the road faster. The delay cost you, but frostbite costs more.',
          healthDelta: 5,
          foodDelta: -30,
        },
        statCheck: { stat: 'expertise', difficulty: 4 },
      },
      {
        id: 'find_low_route',
        text: 'Find the low winter route through Calaveras County instead',
        outcome: {
          message: 'The low route adds nearly two days of travel but the road stays open all winter. You arrive at your destination late but intact, having found a placer camp along the detour that shares a hot meal and trail news.',
          foodDelta: -25,
          goldDelta: 15,
          healthDelta: -5,
          discoveredLocation: 'calaveras_winter_road',
        },
        statCheck: { stat: 'shrewdness', difficulty: 5 },
      },
    ],
    minDistance: 4,
  },
  {
    id: 'spring_runoff_river_crossing',
    title: 'Spring Runoff — River Crossing Treacherous',
    description: 'Snowmelt has turned the Stanislaus from a gentle ford into a churning brown monster. The rope ferry is down — the cable snapped yesterday. Downstream, two men are arguing over a log raft that looks barely able to carry one person.',
    type: 'combat',
    icon: '🌊',
    choices: [
      {
        id: 'build_better_raft',
        text: 'Spend three hours building a proper raft — do it right',
        outcome: {
          message: 'Your raft is not pretty but it is buoyant and steerable. You pole across in tense silence, reading the current perfectly. On the far bank two grateful merchants pay you generously to ferry their packs across on your raft before you dismantle it.',
          healthDelta: -10,
          goldDelta: 55,
          reputationDelta: 8,
        },
        statCheck: { stat: 'expertise', difficulty: 5 },
      },
      {
        id: 'swim_with_pack_above_head',
        text: 'Strip down and swim it — you\'ve crossed worse',
        outcome: {
          message: 'The current hits you like a freight wagon. You swim hard at a forty-five-degree angle, lose your pack for a terrifying moment, and crawl out a quarter-mile downstream gasping and hypothermic. Everything is wet. Your pride is wetter.',
          healthDelta: -35,
          foodDelta: -20,
        },
        statCheck: { stat: 'athleticism', difficulty: 8 },
      },
      {
        id: 'wait_for_ferry_repair',
        text: 'Wait at the camp for the ferry crew to repair the cable',
        outcome: {
          message: 'Two days of waiting. The ferry crew is understaffed and in no hurry. You help them splice the cable and the grateful ferryman waves your crossing fee. The delay is frustrating but you arrive dry.',
          foodDelta: -25,
          healthDelta: 5,
          reputationDelta: 5,
        },
      },
    ],
    minDistance: 2,
  },
  {
    id: 'harvest_festival_settlement',
    title: 'Autumn Harvest Festival',
    description: 'The smell of roasting corn and woodsmoke draws you off the trail. A placer mining settlement has transformed itself for the day: fiddles, a dance floor of packed earth, barrels of cider, and a trading fair with goods from Sacramento.',
    type: 'trade',
    icon: '\uD83C\uDF42',
    choices: [
      {
        id: 'trade_at_the_fair',
        text: 'Browse the trading fair and buy discounted supplies',
        outcome: {
          message: 'Festival prices are actually fair — or close to it. You stock up on dried beans, hard tack, and a well-made pair of boots that the cobbler from Sonora is selling. The cider is free. The music makes the miles ahead feel shorter.',
          goldDelta: -30,
          foodDelta: 60,
          healthDelta: 10,
          itemGained: 'quality_trail_boots',
        },
      },
      {
        id: 'enter_the_fiddling_contest',
        text: 'Enter the fiddling contest — winner takes the gold pot',
        outcome: {
          message: 'You play the only three reels you know, twice each, with everything you have. The crowd cheers. You do not win the gold pot — a traveling Irishman from Nevada City destroys you in the finals — but the ten-dollar runner-up prize and the supper you receive make it worthwhile.',
          goldDelta: 25,
          reputationDelta: 12,
          karmaDelta: 10,
          healthDelta: 10,
        },
        statCheck: { stat: 'luck', difficulty: 5 },
      },
      {
        id: 'gather_intelligence',
        text: 'Work the crowd for news and intelligence about the region',
        outcome: {
          message: 'Between the cider and the dancing, Gold Country talks freely. You learn which road agents have been seen where, which mines are truly producing, and that someone matching a description from your investigation was seen in Murphys last week.',
          reputationDelta: 10,
          foodDelta: 20,
          karmaDelta: 5,
          itemGained: 'festival_intelligence_notes',
          discoveredLocation: 'murphys_lead',
        },
        statCheck: { stat: 'shrewdness', difficulty: 4 },
      },
    ],
  },
]

// === SEARCH AREAS ===

export const LOCATION_SEARCH_AREAS: SearchArea[] = [
  // BOBR Cabin
  {
    id: 'cabin_guest_book',
    name: 'Guest Book',
    description: 'The cabin\'s guest book on the front table. Previous visitors have left notes.',
    location: 'bobr_cabin',
    icon: '📖',
    searchDifficulty: 2,
    statBonus: 'expertise',
    findings: [
      { id: 'guest_entry_suspicious', description: 'A recent entry with a fake name and an encoded message.', probability: 0.8, isClue: true, clueId: 'guest_book_code' },
      { id: 'guest_entry_normal', description: 'Normal guest entries praising the cabin and the view.', probability: 1.0, isClue: false },
    ],
  },
  {
    id: 'cabin_barn',
    name: 'The Barn',
    description: 'The ranch barn behind the cabin. Old equipment and hay bales.',
    location: 'bobr_cabin',
    icon: '🏚️',
    searchDifficulty: 4,
    statBonus: 'luck',
    findings: [
      { id: 'barn_map', description: 'A hand-drawn map tucked under a hay bale, marking locations around Gold Country.', probability: 0.5, isClue: true, clueId: 'hidden_map' },
      { id: 'barn_tools', description: 'Old mining tools. Could come in handy.', probability: 0.7, isClue: false, itemGained: 'mining_tools' },
    ],
  },

  // Angels Camp
  {
    id: 'angels_hotel_register',
    name: 'Angels Hotel Register',
    description: 'The historic hotel register where Twain signed in.',
    location: 'angels_camp',
    icon: '📜',
    searchDifficulty: 3,
    statBonus: 'expertise',
    findings: [
      { id: 'twain_entry', description: 'Twain\'s actual signature, dated 1864. Beneath it, a modern forgery.', probability: 0.7, isClue: true, clueId: 'forged_signature' },
      { id: 'hotel_history', description: 'Fascinating entries from Gold Rush era guests.', probability: 1.0, isClue: false, karmaGained: 5 },
    ],
  },
  {
    id: 'angels_saloon',
    name: 'Ross\'s Saloon',
    description: 'The bar where Twain heard the jumping frog story. Dark corners hold secrets.',
    location: 'angels_camp',
    icon: '🍺',
    searchDifficulty: 5,
    statBonus: 'shrewdness',
    findings: [
      { id: 'saloon_note', description: 'A crumpled note behind the bar referencing a meeting at Moaning Cavern.', probability: 0.6, isClue: true, clueId: 'cavern_meeting' },
      { id: 'saloon_coins', description: 'A few gold coins wedged between the floorboards.', probability: 0.4, isClue: false, goldGained: 15 },
    ],
  },

  // Murphys
  {
    id: 'murphys_hotel_register',
    name: 'Murphys Hotel Register',
    description: 'The famous guest register with signatures from Twain, Grant, and Black Bart.',
    location: 'murphys',
    icon: '📋',
    searchDifficulty: 3,
    statBonus: 'expertise',
    findings: [
      { id: 'bart_signature', description: 'Black Bart\'s entry, written in his distinctive poetic hand.', probability: 0.8, isClue: true, clueId: 'bart_handwriting' },
      { id: 'grant_entry', description: 'Ulysses S. Grant\'s bold signature from 1879.', probability: 1.0, isClue: false, karmaGained: 5 },
    ],
  },
  {
    id: 'murphys_wine_cellar',
    name: 'Wine Cellar',
    description: 'The deep wine cellars beneath the tasting rooms. Cool, dark, and full of secrets.',
    location: 'murphys',
    icon: '🍷',
    searchDifficulty: 6,
    statBonus: 'luck',
    findings: [
      { id: 'cellar_stash', description: 'A hidden compartment behind wine barrels containing stolen goods.', probability: 0.4, isClue: true, clueId: 'stolen_goods_stash' },
      { id: 'cellar_wine', description: 'A bottle of exceptional vintage. Worth keeping.', probability: 0.6, isClue: false, itemGained: 'fine_wine' },
    ],
  },

  // Moaning Cavern
  {
    id: 'moaning_cavern_depths',
    name: 'Cavern Depths',
    description: 'The deepest accessible section of the cavern. Few venture this far.',
    location: 'moaning_cavern',
    icon: '🕳️',
    searchDifficulty: 7,
    statBonus: 'expertise',
    findings: [
      { id: 'cavern_markings', description: 'Fresh tool marks on the cavern wall. Someone was here recently.', probability: 0.6, isClue: true, clueId: 'recent_excavation' },
      { id: 'cavern_bones', description: 'Ancient bone fragments. The geologist would want to see these.', probability: 0.5, isClue: false, itemGained: 'ancient_bones' },
    ],
  },

  // California Caverns
  {
    id: 'california_caverns_crystal_room',
    name: 'Crystal Chamber',
    description: 'A chamber filled with aragonite crystal formations. They shimmer in lantern light.',
    location: 'california_caverns',
    icon: '💎',
    searchDifficulty: 5,
    statBonus: 'luck',
    findings: [
      { id: 'crystal_cache', description: 'Hidden among the natural crystals, a stash of items that don\'t belong here.', probability: 0.5, isClue: true, clueId: 'crystal_cache_evidence' },
      { id: 'crystal_specimen', description: 'A loose aragonite crystal of exceptional quality.', probability: 0.7, isClue: false, itemGained: 'aragonite_crystal', goldGained: 30 },
    ],
  },

  // Big Trees
  {
    id: 'big_trees_hollow',
    name: 'Hollow Sequoia',
    description: 'A massive hollow sequoia trunk, large enough to walk inside.',
    location: 'big_trees',
    icon: '🌲',
    searchDifficulty: 4,
    statBonus: 'shrewdness',
    findings: [
      { id: 'hollow_stash', description: 'Letters hidden in the hollow tree, describing a smuggling operation.', probability: 0.6, isClue: true, clueId: 'smuggling_letters' },
      { id: 'hollow_carving', description: 'A beautiful carving from 1853, the year the grove was discovered.', probability: 0.8, isClue: false, karmaGained: 5 },
    ],
  },

  // Kennedy Mine
  {
    id: 'kennedy_mine_office',
    name: 'Mine Office',
    description: 'The old mine foreman\'s office. Dusty records line the walls.',
    location: 'kennedy_mine',
    icon: '📁',
    searchDifficulty: 5,
    statBonus: 'expertise',
    findings: [
      { id: 'mine_records', description: 'Production records that don\'t add up. Gold is going missing.', probability: 0.7, isClue: true, clueId: 'gold_theft_records' },
      { id: 'mine_diary', description: 'A miner\'s diary from 1922, written days before the disaster.', probability: 0.5, isClue: false, karmaGained: 10 },
    ],
  },
  {
    id: 'kennedy_mine_shaft',
    name: 'Upper Mine Shaft',
    description: 'The entrance to the upper levels of Kennedy Mine. Dark and foreboding.',
    location: 'kennedy_mine',
    icon: '⛏️',
    searchDifficulty: 8,
    statBonus: 'luck',
    findings: [
      { id: 'mine_gold_vein', description: 'A gold vein the foreman didn\'t report. Someone is mining secretly.', probability: 0.3, isClue: true, clueId: 'secret_mining' },
      { id: 'mine_gold_flakes', description: 'Gold flakes in the rubble. Enough to pocket.', probability: 0.6, isClue: false, goldGained: 40 },
    ],
  },

  // Mokelumne Hill
  {
    id: 'mokelumne_hotel_basement',
    name: 'Hotel Leger Basement',
    description: 'The infamous basement of Hotel Leger. Cold spots and creaking floors.',
    location: 'mokelumne_hill',
    icon: '🏚️',
    searchDifficulty: 6,
    statBonus: 'shrewdness',
    findings: [
      { id: 'hotel_ledger', description: 'A hidden ledger recording illicit transactions. Dates match recent crimes.', probability: 0.6, isClue: true, clueId: 'criminal_ledger' },
      { id: 'hotel_ghost', description: 'A cold draft and a whisper... "Check room seven..." Just the wind. Probably.', probability: 0.8, isClue: false, karmaGained: 3 },
    ],
  },
  {
    id: 'mokelumne_cemetery',
    name: 'French Cemetery',
    description: 'The old French cemetery on the hill. Weathered headstones and overgrown paths.',
    location: 'mokelumne_hill',
    icon: '⚰️',
    searchDifficulty: 5,
    statBonus: 'expertise',
    findings: [
      { id: 'cemetery_grave', description: 'A recent grave with no name. The earth is freshly turned.', probability: 0.5, isClue: true, clueId: 'unmarked_grave' },
      { id: 'cemetery_history', description: 'Headstones from the 1851 Chilean War. A sobering reminder of Gold Rush violence.', probability: 1.0, isClue: false, karmaGained: 5 },
    ],
  },

  // Ironstone Vineyards
  {
    id: 'ironstone_museum',
    name: 'Gold Museum',
    description: 'The museum housing the 44-pound gold specimen and Gold Rush artifacts.',
    location: 'ironstone_vineyards',
    icon: '🏛️',
    searchDifficulty: 4,
    statBonus: 'expertise',
    findings: [
      { id: 'museum_artifact', description: 'An artifact with a suspicious provenance that may be linked to recent thefts.', probability: 0.6, isClue: true, clueId: 'suspicious_artifact' },
      { id: 'museum_gold', description: 'The 44-pound gold specimen is breathtaking. You learn about its discovery in Jamestown.', probability: 1.0, isClue: false, karmaGained: 10 },
    ],
  },

  // Jackson
  {
    id: 'jackson_tunnels',
    name: 'Chinese Tunnels',
    description: 'The hidden tunnel network beneath Main Street, built by Chinese workers.',
    location: 'jackson',
    icon: '🕯️',
    searchDifficulty: 8,
    statBonus: 'shrewdness',
    findings: [
      { id: 'tunnel_evidence', description: 'Evidence of recent use: fresh footprints, a dropped lantern, and a coded note.', probability: 0.5, isClue: true, clueId: 'tunnel_activity' },
      { id: 'tunnel_artifacts', description: 'Preserved Chinese artifacts from the 1850s. A time capsule of a forgotten community.', probability: 0.7, isClue: false, karmaGained: 15, itemGained: 'chinese_artifact' },
    ],
  },
  {
    id: 'jackson_telegraph_office',
    name: 'Telegraph Office Records',
    description: 'Past telegraph messages are filed here. Some may contain clues.',
    location: 'jackson',
    icon: '📡',
    searchDifficulty: 4,
    statBonus: 'expertise',
    findings: [
      { id: 'telegraph_messages', description: 'Coded telegraph messages that match the pattern from the investigation.', probability: 0.7, isClue: true, clueId: 'coded_telegraphs' },
      { id: 'telegraph_news', description: 'News telegraphs from Sacramento about stagecoach robberies.', probability: 1.0, isClue: false },
    ],
  },

  // Natural Bridges
  {
    id: 'natural_bridges_creek',
    name: 'Coyote Creek Bed',
    description: 'The creek bed where gold has been found for over 150 years.',
    location: 'natural_bridges',
    icon: '🏞️',
    searchDifficulty: 3,
    statBonus: 'luck',
    findings: [
      { id: 'creek_gold', description: 'Gold flakes glint in the gravel. A good day for panning!', probability: 0.7, isClue: false, goldGained: 25 },
      { id: 'creek_evidence', description: 'A waterproof pouch caught on a rock. Inside: a journal page with meeting notes.', probability: 0.4, isClue: true, clueId: 'meeting_notes' },
    ],
  },
  {
    id: 'natural_bridges_cave',
    name: 'Under the Bridge',
    description: 'The natural cave formation beneath the bridge. Cool shade and hidden alcoves.',
    location: 'natural_bridges',
    icon: '🌉',
    searchDifficulty: 5,
    statBonus: 'shrewdness',
    findings: [
      { id: 'bridge_cache', description: 'A hidden cache of supplies and a half-burned map.', probability: 0.5, isClue: true, clueId: 'burned_map' },
      { id: 'bridge_swimming', description: 'The swimming hole is inviting. A quick dip refreshes body and spirit.', probability: 1.0, isClue: false, karmaGained: 5 },
    ],
  },
]

// Helper functions
export function getSearchAreasForLocation(locationId: string): SearchArea[] {
  return LOCATION_SEARCH_AREAS.filter(area => area.location === locationId)
}

export function getRandomEncounter(travelDistance: number): TravelEncounter | null {
  // Base encounter chance: 30%, increases with distance
  const encounterChance = Math.min(0.3 + (travelDistance * 0.05), 0.7)
  if (Math.random() > encounterChance) return null

  const eligible = TRAVEL_ENCOUNTERS.filter(e => !e.minDistance || travelDistance >= e.minDistance)
  if (eligible.length === 0) return null

  return eligible[Math.floor(Math.random() * eligible.length)]
}

export function resolveSearch(area: SearchArea, statValue: number = 0): SearchFinding | null {
  const bonusChance = area.statBonus ? statValue * 0.05 : 0

  for (const finding of area.findings) {
    const adjustedProbability = Math.min(finding.probability + bonusChance, 0.95)
    if (Math.random() < adjustedProbability) {
      return finding
    }
  }
  return null
}
