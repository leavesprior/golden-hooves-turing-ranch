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

  // === MEMOIR-INSPIRED HISTORICALLY GROUNDED ENCOUNTERS ===

  {
    id: 'archaeological_discovery',
    title: 'Miwok Grinding Rocks',
    description: 'While clearing brush from a granite outcrop, you uncover a series of deep mortar holes worn into the bedrock — Miwok grinding rocks, used for centuries to process acorns into flour. Scattered obsidian flakes and a cracked pestle lie nearby. This is an ancient food-processing site, older than any European presence in California.',
    type: 'mystery',
    icon: '🪨',
    choices: [
      {
        id: 'study_carefully',
        text: 'Study the site carefully and document what you find',
        outcome: {
          message: 'You spend hours sketching the mortar patterns and measuring the depth of the grinding holes — some are nearly a foot deep, representing generations of use. You find a perfectly preserved obsidian scraper and note the site\'s position relative to the creek. A Miwok woman watching from the tree line nods once and disappears. Your journal gains invaluable ethnographic notes.',
          karmaDelta: 20,
          reputationDelta: 10,
          itemGained: 'miwok_grinding_site_notes',
          discoveredLocation: 'miwok_heritage_site',
        },
        statCheck: { stat: 'shrewdness', difficulty: 10 },
      },
      {
        id: 'take_artifacts',
        text: 'Collect the obsidian tools and pestle as artifacts',
        outcome: {
          message: 'You pocket the obsidian scraper and the cracked pestle. They\'ll fetch a price from the curiosity dealers in Sacramento. As you leave, you notice moccasin prints in the soft earth around the site — someone was watching. The weight in your pack feels heavier than it should.',
          goldDelta: 30,
          karmaDelta: -15,
        },
      },
      {
        id: 'leave_undisturbed',
        text: 'Mark the location in your journal and leave everything as you found it',
        outcome: {
          message: 'You carefully replace the brush and mark the site only in your personal journal. This place belongs to the people who made it. Walking away, you spot a red-tailed hawk circling overhead — the Miwok say they carry messages between worlds. You feel you\'ve done the right thing.',
          karmaDelta: 15,
          reputationDelta: 5,
        },
      },
    ],
  },
  {
    id: 'horse_endurance_race',
    title: 'Fifty-Mile Endurance Race',
    description: 'A crowd has gathered at the livery in Murphys. A hand-painted banner reads: "SIERRA FOOTHILLS ENDURANCE — 50 MILES — ANGELS CAMP TO VOLCANO AND RETURN." The entry fee is steep, the course brutal — switchback trails through oak woodland, two river crossings, and a climb over the Mokelumne ridge. But the winner\'s purse glitters.',
    type: 'opportunity',
    icon: '🏇',
    choices: [
      {
        id: 'enter_race',
        text: 'Pay the entry fee and ride — fifty miles of glory or disaster',
        outcome: {
          message: 'The first twenty miles are exhilarating — you and your mount find a rhythm through the golden hills. The river crossings test your nerve. By mile thirty-five your thighs are screaming and your horse is lathered white. You finish fourth out of eleven — no prize money, but the crowd cheers your finish and the horsemen nod respect. Your mount is spent but proud.',
          goldDelta: -20,
          healthDelta: -20,
          reputationDelta: 15,
          karmaDelta: 10,
        },
        statCheck: { stat: 'athleticism', difficulty: 14 },
      },
      {
        id: 'bet_on_favorite',
        text: 'Put your money on the Miwok rider everyone\'s watching',
        outcome: {
          message: 'The Miwok rider on the paint horse — they call him Windchaser — rides like he was born in the saddle. He takes the lead at the first ridge and never relinquishes it. Your bet pays double. The old-timers grumble, but the horsemen know quality when they see it.',
          goldDelta: 40,
        },
        statCheck: { stat: 'luck', difficulty: 10 },
      },
      {
        id: 'watch_and_learn',
        text: 'Watch the race and study the riders\' techniques',
        outcome: {
          message: 'You position yourself at the difficult switchback above the river crossing and watch every rider negotiate it. The best riders shift their weight back on the descent, give their mounts loose rein at the water, and lean forward on the climb. You fill three pages of your journal with observations that will make you a better horseman.',
          reputationDelta: 3,
          karmaDelta: 5,
        },
      },
    ],
    minDistance: 30,
  },
  {
    id: 'barn_raising',
    title: 'Community Barn Raising',
    description: 'A settlement of German immigrant families is raising a barn. The frame timbers are cut and the foundation laid, but they need every able body to lift the walls. Women have set up trestle tables laden with sauerkraut, fresh bread, and apple strudel. The foreman shouts instructions in accented English.',
    type: 'opportunity',
    icon: '🪵',
    choices: [
      {
        id: 'pitch_in',
        text: 'Roll up your sleeves and help lift walls',
        outcome: {
          message: 'You spend the day hauling timbers, holding cross-braces, and driving pegs. The work is backbreaking but honest. By sundown the barn stands — walls, roof beams, and a good start on shingles. The community feeds you until you can barely walk, and the foreman presses a pouch of gold dust into your hand. "Gut gearbeitet," he says.',
          healthDelta: -15,
          foodDelta: 30,
          goldDelta: 15,
          reputationDelta: 10,
          karmaDelta: 5,
        },
        statCheck: { stat: 'strength', difficulty: 8 },
      },
      {
        id: 'organize',
        text: 'Organize the work crews and keep the project on schedule',
        outcome: {
          message: 'You notice the crews are tripping over each other — too many on the south wall, nobody on the roof beams. You reorganize the teams, set up a water station, and establish a rhythm of work and rest. The barn goes up in record time. The foreman offers you a permanent job. You decline, but the community remembers your name.',
          reputationDelta: 15,
          karmaDelta: 10,
          foodDelta: 25,
        },
        statCheck: { stat: 'diplomacy', difficulty: 10 },
      },
      {
        id: 'decline_politely',
        text: 'Wish them well but you\'ve got miles to make',
        outcome: {
          message: 'You tip your hat and ride on. The sounds of hammering and laughter fade behind you. Sometimes you have to choose the road over the community. A small regret settles in your chest.',
          reputationDelta: -3,
        },
      },
    ],
  },
  {
    id: 'wildfire_threat',
    title: 'Pine Forest Wildfire',
    description: 'The western sky is the color of a bruise. Smoke rolls through the ponderosa pines in thick waves and the air tastes of ash. A settlement of twenty families sits directly in the fire\'s path. The men are digging firebreaks with shovels and mattocks, but the wind is shifting and their faces show they know the math is against them.',
    type: 'combat',
    icon: '🔥',
    choices: [
      {
        id: 'fight_fire',
        text: 'Grab a shovel and join the fire line',
        outcome: {
          message: 'You fight fire for fourteen hours straight. The heat blisters your hands through wet rags. Twice the wind shifts and you run. At dawn the fire crowns into a stand of dead timber and your line holds — barely. The settlement survives. The families weep openly and the foreman grips your hand until your knuckles ache.',
          healthDelta: -30,
          reputationDelta: 20,
          karmaDelta: 25,
          foodDelta: -15,
        },
        statCheck: { stat: 'strength', difficulty: 14 },
      },
      {
        id: 'evacuate',
        text: 'Help families evacuate to the river instead',
        outcome: {
          message: 'You help load wagons, carry children, and lead livestock to the river flat where the fire cannot reach. By the time everyone is safe, the settlement is gone — every structure consumed. But not a single life is lost. In the ash-gray morning, a woman thanks you for saving her family Bible and her grandmother\'s quilt.',
          healthDelta: -10,
          karmaDelta: 10,
        },
      },
      {
        id: 'use_fire_break',
        text: 'Organize a backburn to starve the approaching fire',
        outcome: {
          message: 'It\'s a gambler\'s technique — setting a controlled fire to consume the fuel before the wildfire arrives. You choose the line carefully, watching the wind. The backburn catches, races toward the wildfire, and the two fires meet in a roaring collision that collapses into smoke. The settlement stands. The old-timers who knew the technique nod their approval.',
          healthDelta: -15,
          reputationDelta: 18,
          karmaDelta: 20,
        },
        statCheck: { stat: 'expertise', difficulty: 12 },
      },
    ],
  },
  {
    id: 'flash_flood_ravine',
    title: 'Flash Flood in the Ravine',
    description: 'The sky was clear an hour ago, but a thunderstorm upstream has sent a wall of brown water surging down the ravine you\'re crossing. The water is knee-deep and rising fast, carrying branches and debris. Your mule brays in panic. The ravine walls are steep but not unclimbable.',
    type: 'rescue',
    icon: '🌊',
    choices: [
      {
        id: 'climb_high',
        text: 'Abandon the trail and scramble up the ravine wall',
        outcome: {
          message: 'You haul yourself up the crumbling sandstone, grabbing manzanita roots and finding toeholds in the rock. Your mule, lighter than you expect, follows with scrambling hooves. Ten feet above the trail, you watch the flood crest pass — logs, a dead deer, someone\'s mining sluice. The water drops as fast as it rose. Your knees are bleeding but you\'re alive.',
          healthDelta: -15,
          karmaDelta: 5,
        },
        statCheck: { stat: 'athleticism', difficulty: 12 },
      },
      {
        id: 'brace_against_rock',
        text: 'Wedge yourself and the mule behind a boulder and hold on',
        outcome: {
          message: 'You find a granite boulder the size of a wagon and press the mule behind it. The water hits you waist-high and the current tries to peel you off the rock. You hold. Your arms burn. A branch slams your shoulder. You hold. After twenty minutes the worst passes and you emerge battered, soaked, but intact.',
          healthDelta: -25,
          foodDelta: -10,
        },
        statCheck: { stat: 'strength', difficulty: 14 },
      },
      {
        id: 'find_alternate_route',
        text: 'You saw a game trail fifty yards back — take it uphill',
        outcome: {
          message: 'The deer trail switchbacks up through scrub oak to a ridge above the ravine. From up here you can see the flash flood filling the narrow canyon like water in a bathtub. The detour adds two hours but your pack stays dry and your bones stay unbroken. Sometimes the smart play is the slow play.',
          healthDelta: -5,
          foodDelta: -5,
        },
        statCheck: { stat: 'expertise', difficulty: 10 },
      },
    ],
  },
  {
    id: 'first_frost',
    title: 'First Frost of the Season',
    description: 'You wake before dawn to a world rimmed in white. The first hard frost has come two weeks early. Ice crystals coat the grass, the water trough is frozen solid, and your breath hangs in clouds. In the nearby settlement, a rancher\'s wife is shouting — their newborn calves are shivering in the open pasture and their late tomatoes are blackening on the vine.',
    type: 'wildlife',
    icon: '❄️',
    choices: [
      {
        id: 'build_shelter',
        text: 'Help build emergency shelter for the livestock',
        outcome: {
          message: 'You spend the morning hauling pine boughs and canvas to create windbreaks for the calves. The rancher\'s wife directs the effort with military precision — she has done this before. By noon every animal is sheltered and fed. The calves survive. She insists you take a smoked ham and a jar of preserved peaches.',
          healthDelta: -10,
          foodDelta: 25,
          karmaDelta: 15,
          reputationDelta: 8,
        },
        statCheck: { stat: 'expertise', difficulty: 10 },
      },
      {
        id: 'start_fires',
        text: 'Build warming fires around the perimeter',
        outcome: {
          message: 'You kindle fires in a ring around the pasture, using the dry manzanita that burns hot and fast. The warmth helps — most of the calves survive the night — but two in the far corner were already too cold. The rancher thanks you quietly. Better than losing them all.',
          healthDelta: -5,
          foodDelta: 10,
          karmaDelta: 5,
        },
        statCheck: { stat: 'luck', difficulty: 8 },
      },
      {
        id: 'accept_losses',
        text: 'Nature takes its course — focus on your own gear',
        outcome: {
          message: 'You secure your own camp, break the ice in your canteens, and layer every piece of clothing you own. The rancher loses four calves and most of the late garden. You lose nothing. The moral arithmetic is complicated.',
          healthDelta: -5,
          foodDelta: -10,
        },
      },
    ],
  },
  {
    id: 'trading_post_barter',
    title: 'Frontier Trading Post',
    description: 'A log building at the crossroads flies a faded American flag and a hand-lettered sign: "HARRIS & SON — GENERAL MERCHANDISE." Inside: barrels of flour, bolts of calico, kegs of nails, patent medicines, Bowie knives, and a glass case of pistols. Hides and furs hang from the rafters. The proprietor, a lean Yankee with ink-stained fingers, weighs everything on a beam scale.',
    type: 'trade',
    icon: '🏪',
    choices: [
      {
        id: 'barter_shrewdly',
        text: 'Negotiate hard — you know what these goods are worth in Sacramento',
        outcome: {
          message: 'You point out the weevils in his flour, the rust on his nails, and the fact that his "genuine Colt" is a Belgian copy. Harris narrows his eyes, then laughs. "You know your business." He gives you wholesale prices and throws in a pound of coffee. You leave with a full pack and most of your gold intact.',
          goldDelta: -15,
          foodDelta: 45,
          itemGained: 'quality_supplies_bundle',
          reputationDelta: 5,
        },
        statCheck: { stat: 'shrewdness', difficulty: 10 },
      },
      {
        id: 'trade_fairly',
        text: 'Pay his prices without haggling — fair is fair',
        outcome: {
          message: 'Harris appreciates a customer who doesn\'t waste his time. He fills your order honestly, adds a handful of dried apples "for the road," and tells you which trail to avoid this week. Fair dealing breeds fair dealing.',
          goldDelta: -25,
          foodDelta: 40,
          karmaDelta: 5,
          reputationDelta: 3,
        },
      },
      {
        id: 'sell_information',
        text: 'Trade trail gossip and intelligence instead of gold',
        outcome: {
          message: 'Harris lives for news. You tell him about the road agents near Mokelumne Hill, the new strike at Volcano, and the flash flood that took out the Stanislaus bridge. His eyes light up — information is currency out here. He trades you supplies at a steep discount and asks you to stop by whenever you pass through.',
          goldDelta: -10,
          foodDelta: 30,
          karmaDelta: 5,
          reputationDelta: 8,
        },
        statCheck: { stat: 'diplomacy', difficulty: 8 },
      },
    ],
  },
  {
    id: 'miwok_elder_meeting',
    title: 'Meeting with a Miwok Elder',
    description: 'Near a grove of ancient valley oaks, you encounter a small Miwok encampment. An elderly woman sits weaving a basket so fine it could hold water. Her grandchildren play nearby. She watches your approach without fear — she has seen many strangers cross this land. A younger man stands nearby, hand on a knife, protective but not hostile.',
    type: 'trade',
    icon: '🪶',
    choices: [
      {
        id: 'listen_respectfully',
        text: 'Sit at a respectful distance and wait to be spoken to',
        outcome: {
          message: 'You sit. Minutes pass. The elder finishes a row of her basket, then speaks in accented English learned from the mission padres. She tells you which plants cure fever, where the cleanest springs are, and that the mountain you\'ve been calling "Bald Peak" is named Tutokanula — the place where the condor nested. Knowledge worth more than gold.',
          karmaDelta: 15,
          reputationDelta: 12,
          healthDelta: 10,
          itemGained: 'miwok_medicinal_knowledge',
        },
        statCheck: { stat: 'diplomacy', difficulty: 8 },
      },
      {
        id: 'offer_trade',
        text: 'Offer trade goods — flour, cloth, steel needles',
        outcome: {
          message: 'The elder examines your steel needles with expert fingers and nods. In exchange she gives you a basket of acorn flour prepared in the traditional way, a pouch of dried herbs, and directions to a spring that never runs dry. The young man relaxes. Trade is the oldest language.',
          goldDelta: -10,
          foodDelta: 30,
          healthDelta: 10,
          karmaDelta: 10,
          reputationDelta: 8,
        },
        statCheck: { stat: 'diplomacy', difficulty: 10 },
      },
      {
        id: 'show_artifacts',
        text: 'Show the grinding rock artifacts you\'ve been carrying',
        outcome: {
          message: 'The elder\'s face changes when she sees the obsidian scraper. The young man\'s hand tightens on his knife. She speaks rapidly in Miwok, then turns to you: "This belongs to our grandmothers. You carry their work in your pocket like a stone." The silence that follows is heavier than any punishment. She gestures for you to leave the artifacts and go.',
          karmaDelta: -10,
          reputationDelta: -8,
        },
      },
    ],
  },
  {
    id: 'stagecoach_breakdown',
    title: 'Stagecoach Stranded',
    description: 'A Wells Fargo stagecoach sits canted at a bad angle where the road crosses a dry wash. The rear wheel has shattered — spokes snapped clean through. Six passengers mill about in the dust: a Sacramento banker in a too-clean suit, a mother with two children, a nun, and a man whose bulging coat suggests he\'s armed. The driver curses and kicks the wheel.',
    type: 'rescue',
    icon: '🐴',
    choices: [
      {
        id: 'repair_wheel',
        text: 'Inspect the damage — you might be able to fashion a repair',
        outcome: {
          message: 'The hub is intact and three spokes are salvageable. You cut green oak limbs for replacement spokes, whittle them to fit, and use rawhide soaked in the creek to bind them tight. It won\'t survive Sacramento roads, but it\'ll reach Angels Camp. The banker tips you generously. The driver shakes your hand twice.',
          goldDelta: 35,
          reputationDelta: 12,
          karmaDelta: 10,
          healthDelta: -10,
        },
        statCheck: { stat: 'expertise', difficulty: 10 },
      },
      {
        id: 'escort_passengers',
        text: 'Escort the passengers to the nearest settlement on foot',
        outcome: {
          message: 'You lead the group three miles to a mining camp where they can wait for a replacement coach. You carry the smaller child on your shoulders. The nun recites prayers the entire way. The armed man, it turns out, is a federal marshal who thanks you quietly and gives you a letter of introduction to any sheriff in the Mother Lode. That letter is worth its weight in gold.',
          healthDelta: -15,
          karmaDelta: 15,
          reputationDelta: 10,
          itemGained: 'us_marshal_introduction',
        },
        statCheck: { stat: 'strength', difficulty: 8 },
      },
      {
        id: 'rob_passengers',
        text: 'The passengers are stranded and helpless — relieve them of valuables',
        outcome: {
          message: 'The banker hands over his watch and wallet without a fight. The mother clutches her children and screams. The nun says nothing but her eyes will haunt your sleep. The armed man reaches for his coat and you realize too late he\'s a federal marshal. You get away, but barely, and the territory will remember your face.',
          goldDelta: 45,
          karmaDelta: -30,
          reputationDelta: -20,
          healthDelta: -10,
        },
        statCheck: { stat: 'athleticism', difficulty: 6 },
      },
    ],
  },
  {
    id: 'abandoned_mine_shaft',
    title: 'Abandoned Mine Shaft',
    description: 'A dark rectangular hole in the hillside, framed by rotting timbers. A rusty ore cart sits on corroded rails. From deep inside, you hear something — dripping water, or maybe a voice. A tattered notice nailed to the timber reads: "CLAIM ABANDONED — UNSAFE — ENTER AT OWN RISK." Someone has scratched beneath it in pencil: "HELP."',
    type: 'mystery',
    icon: '⛏️',
    choices: [
      {
        id: 'explore_carefully',
        text: 'Light a torch and explore the shaft carefully',
        outcome: {
          message: 'The mine goes back two hundred feet, shored with timber that groans under the weight of the mountain. At the far end, a collapsed wall reveals a vein of white quartz laced with gold — the original miners missed it by ten feet. You chip out a sample that assays later at nearly pure. The "help" message was scratched by a miner who found the vein and died before he could tell anyone.',
          goldDelta: 80,
          healthDelta: -10,
          itemGained: 'rich_quartz_sample',
          discoveredLocation: 'hidden_gold_vein',
        },
        statCheck: { stat: 'shrewdness', difficulty: 12 },
      },
      {
        id: 'call_out',
        text: 'Call into the shaft — someone might be alive in there',
        outcome: {
          message: '"Hello? Anyone down there?" Silence. Then a weak voice: "Here... water..." You find a Chinese miner forty feet in, his leg pinned under a fallen timber. He\'s been there two days. You lever the timber off, splint his leg, and carry him to daylight. He weeps and presses a jade pendant into your hand — his only possession of value.',
          karmaDelta: 25,
          reputationDelta: 15,
          healthDelta: -10,
          itemGained: 'jade_pendant',
        },
        statCheck: { stat: 'diplomacy', difficulty: 8 },
      },
      {
        id: 'mark_and_leave',
        text: 'Mark the location on your map and move on — mines kill the curious',
        outcome: {
          message: 'You scratch a clearer warning on the timber, note the coordinates in your journal, and push on. Discretion is the better part of valor, especially when the timbers are rotting and the mountain is patient. You\'ll mention it in Jackson.',
          karmaDelta: 3,
          reputationDelta: 2,
        },
      },
    ],
  },
  {
    id: 'medicine_show',
    title: 'Doctor Whitmore\'s Traveling Medicine Show',
    description: 'A painted wagon — "DR. EZEKIEL WHITMORE\'S ELECTRO-MAGNETIC VITALIZER" — has drawn a crowd in the settlement square. A man in a threadbare frock coat and top hat waves bottles of amber liquid. "Cures rheumatism, dyspepsia, melancholy, and the French disease! Guaranteed or your money cheerfully refunded!" Behind him, a pretty woman plays the accordion.',
    type: 'trade',
    icon: '🧪',
    choices: [
      {
        id: 'buy_cure_all',
        text: 'Buy a bottle — it might actually work',
        outcome: {
          message: 'You sniff the bottle. It\'s colored water with a generous pour of whiskey and a dash of laudanum. "Doctor" Whitmore watches your face carefully. The stuff will make you feel better for about four hours, then worse for two days. At least the whiskey is decent.',
          goldDelta: -15,
          healthDelta: 10,
        },
        statCheck: { stat: 'shrewdness', difficulty: 6 },
      },
      {
        id: 'expose_fraud',
        text: 'Challenge the "doctor" publicly — people deserve the truth',
        outcome: {
          message: 'You ask Whitmore where he studied medicine. He stammers. You ask him to name three bones in the human hand. He can\'t. You uncork a bottle and identify the ingredients aloud: "Whiskey, water, laudanum, and food coloring." The crowd turns ugly. Whitmore and the accordion player flee in their wagon. An actual physician in the crowd buys you dinner.',
          karmaDelta: 20,
          reputationDelta: 15,
          foodDelta: 15,
        },
        statCheck: { stat: 'diplomacy', difficulty: 10 },
      },
      {
        id: 'join_the_show',
        text: 'Offer to be a "satisfied customer" for a cut of the profits',
        outcome: {
          message: 'You play the part beautifully — hobbling up on a cane, taking a swig, and throwing the cane away with theatrical joy. The crowd buys thirty bottles. Whitmore pays you handsomely and offers you a permanent position. You decline but pocket the gold. The accordion player winks.',
          goldDelta: 25,
          karmaDelta: -5,
        },
        statCheck: { stat: 'luck', difficulty: 8 },
      },
    ],
  },
  {
    id: 'obsidian_cache_find',
    title: 'Obsidian Cache in the Lava Fields',
    description: 'Where an ancient lava flow meets the limestone foothills, you find a scatter of black volcanic glass glinting in the afternoon sun. Some pieces are rough chunks, but others have been carefully shaped — fluted points, scrapers, blades with edges sharper than steel. This is an obsidian cache, either a natural source or an ancient workshop. The glass is prized by collectors and native traders alike.',
    type: 'mystery',
    icon: '🖤',
    choices: [
      {
        id: 'collect_carefully',
        text: 'Select the best pieces for trade — obsidian commands good prices',
        outcome: {
          message: 'You choose a dozen of the finest pieces: translucent black blades that catch the light like dark water. In Jackson, a curiosity dealer offers you an excellent price. In Murphys, a Miwok trader offers you even more — obsidian from this particular flow, she says, is sacred. You choose your buyer carefully.',
          goldDelta: 50,
          itemGained: 'obsidian_trade_collection',
          reputationDelta: 5,
        },
        statCheck: { stat: 'expertise', difficulty: 10 },
      },
      {
        id: 'study_origin',
        text: 'Study the geology and try to trace the obsidian to its volcanic source',
        outcome: {
          message: 'The obsidian here is unusual — mahogany-colored inclusions suggest it came from a specific flow, possibly the one near what miners call Glass Mountain to the north. You note the chemistry of the stone, its fracture patterns, and the fact that shaped pieces were carried here from at least fifty miles away. This was a trade route, and the obsidian was currency before gold.',
          karmaDelta: 10,
          reputationDelta: 8,
          itemGained: 'obsidian_geological_notes',
          discoveredLocation: 'ancient_trade_route',
        },
        statCheck: { stat: 'shrewdness', difficulty: 12 },
      },
      {
        id: 'leave_for_others',
        text: 'This cache has been here for centuries — leave it for those who understand it',
        outcome: {
          message: 'You photograph the site in your memory, note its position, and walk away. The obsidian will be here long after the Gold Rush is forgotten. Some things should remain where they were placed.',
          karmaDelta: 15,
        },
      },
    ],
  },
  {
    id: 'hydraulic_mining_protest',
    title: 'Hydraulic Mining Protest',
    description: 'The hillside above the valley has been blasted to red clay by hydraulic monitors — massive nozzles that tear mountains apart with pressurized water. Below, farmland is buried under mining debris. A group of angry farmers blocks the road with wagons, demanding the mining company stop. The mine foreman and a dozen armed men stand opposite. Both sides are shouting.',
    type: 'opportunity',
    icon: '⚖️',
    choices: [
      {
        id: 'side_with_farmers',
        text: 'Stand with the farmers — the land belongs to everyone',
        outcome: {
          message: 'You join the farmer\'s line. Your presence — and the rifle on your shoulder — tips the numbers. The mine foreman backs down for today, promising to "consult with the owners." The farmers know it\'s temporary, but the momentum matters. A Sacramento journalist takes your name for a story. The fight against hydraulic mining will eventually reach the courts and win, but that\'s years away.',
          karmaDelta: 15,
          reputationDelta: 12,
        },
        statCheck: { stat: 'diplomacy', difficulty: 10 },
      },
      {
        id: 'side_with_miners',
        text: 'The miners have legal claims — this is their right',
        outcome: {
          message: 'You tell the farmers the law is on the miners\' side, which is technically true in 1855. The foreman nods gratefully and the monitors resume their work. Red slurry pours into the valley. The farmers glare at you with a hatred that will outlast the Gold Rush itself.',
          goldDelta: 20,
          karmaDelta: -10,
          reputationDelta: -8,
        },
      },
      {
        id: 'mediate',
        text: 'Step between both sides and propose a compromise',
        outcome: {
          message: 'You propose what will later become law: the miners can work, but must build settling ponds to keep debris out of the farmland below. Both sides hate the compromise, which means it\'s probably fair. The foreman agrees to try it for one season. The farmers agree to lift the blockade. Nobody thanks you, but nobody dies today either. That\'s enough.',
          karmaDelta: 20,
          reputationDelta: 15,
          goldDelta: 10,
        },
        statCheck: { stat: 'diplomacy', difficulty: 14 },
      },
    ],
  },
  {
    id: 'chinese_camp_visit',
    title: 'Chinese Mining Camp',
    description: 'A cluster of neat wooden buildings and canvas shelters houses a Chinese mining community. They\'ve been pushed to this played-out claim by miners who took the richer ground. Despite this, the camp is orderly — a communal kitchen sends up the smell of ginger and garlic, a herbalist\'s shop displays dried roots and powders, and miners work the tailings with patient skill that extracts gold the American miners left behind.',
    type: 'trade',
    icon: '🏮',
    choices: [
      {
        id: 'trade_chinese_camp',
        text: 'Trade at fair prices — their goods are excellent',
        outcome: {
          message: 'The herbalist sells you medicines that actually work — willow bark tea, ginger for nausea, a poultice that heals cuts twice as fast as anything from Sacramento. The prices are fair. A miner\'s wife sells you preserved vegetables and dried fish. The food alone is worth the visit. You leave healthier and better supplied than when you arrived.',
          goldDelta: -15,
          foodDelta: 35,
          healthDelta: 15,
          karmaDelta: 10,
        },
      },
      {
        id: 'learn_techniques',
        text: 'Ask to learn their gold recovery techniques',
        outcome: {
          message: 'An older miner, after watching you for an hour, agrees to show you the wing dam technique — diverting a creek to expose the bedrock beneath. He demonstrates how to read the rock for gold traps that American miners walk past. His method is slower but recovers three times as much gold per cubic yard. You fill your journal with sketches and notes.',
          karmaDelta: 10,
          reputationDelta: 5,
          itemGained: 'chinese_mining_techniques',
        },
        statCheck: { stat: 'expertise', difficulty: 8 },
      },
      {
        id: 'defend_from_harassers',
        text: 'A group of drunk miners is heading this way with bad intentions — stand in their path',
        outcome: {
          message: 'Three men from the American camp swagger down the road with axe handles and ugly words. You step into the road and tell them to turn around. They hesitate — you\'re armed and sober, which gives you every advantage. After a tense minute they leave, cursing. The Chinese camp foreman bows formally and invites you to dinner. The meal is the best you\'ve had in Gold Country.',
          healthDelta: -5,
          karmaDelta: 25,
          reputationDelta: 15,
          foodDelta: 20,
        },
        statCheck: { stat: 'athleticism', difficulty: 12 },
      },
    ],
  },
  {
    id: 'thunderstorm_shelter',
    title: 'Sierra Thunderstorm',
    description: 'The sky turns green-black in twenty minutes. Lightning walks the ridgeline above you, striking the tallest ponderosa pines with cracks that shake your teeth. The rain arrives not in drops but in sheets — horizontal, stinging, cold. You are on an exposed trail with no settlement for miles. Your horse trembles.',
    type: 'wildlife',
    icon: '⛈️',
    choices: [
      {
        id: 'find_cave_shelter',
        text: 'You spotted a limestone overhang a quarter mile back — make for it',
        outcome: {
          message: 'The overhang is shallow but dry, and a previous traveler left a fire ring and a stack of dry kindling. You tether your horse in the lee of the rock, start a fire, and wait out the storm wrapped in your blanket. Lightning strikes a tree two hundred yards away with a sound like cannon fire. Inside your stone shelter, you are warm and dry and grateful.',
          healthDelta: 5,
          foodDelta: -5,
        },
        statCheck: { stat: 'expertise', difficulty: 10 },
      },
      {
        id: 'press_through',
        text: 'Put your head down and ride — storms pass',
        outcome: {
          message: 'You ride for two hours through the worst weather the Sierra can produce. Hail the size of acorns hammers your shoulders. A lightning strike fifty yards to your left leaves you temporarily deaf in one ear. Your horse slips twice on the muddy trail. But you cover six miles and reach the next settlement, where a fire and whiskey are waiting. You look like a drowned cat but you made distance.',
          healthDelta: -25,
          foodDelta: -10,
          reputationDelta: 5,
        },
        statCheck: { stat: 'strength', difficulty: 14 },
      },
      {
        id: 'build_lean_to',
        text: 'Build a quick lean-to from pine boughs and your ground cloth',
        outcome: {
          message: 'You lash your ground cloth between two pines at an angle, pile pine boughs on top for insulation, and hunker down. The shelter leaks — of course it leaks — but it breaks the wind and keeps the worst of the rain off. Your horse stands with its rear to the storm, stoic as only horses can be. By morning the sky is washed clean and the trail steams in the sun.',
          healthDelta: -10,
          foodDelta: -5,
        },
        statCheck: { stat: 'expertise', difficulty: 8 },
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
