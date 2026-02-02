/**
 * Haunted Inns - Ghost encounters at specific trail locations
 *
 * Each encounter is historically grounded and offers choices with
 * karma/morale consequences. Triggered when resting at an inn.
 */

export interface GhostChoice {
  id: string
  text: string
  outcome: {
    message: string
    moraleDelta?: number
    healthDelta?: number
    goodKarmaDelta?: number
    badKarmaDelta?: number
    neutralKarmaDelta?: number
    traitReward?: string  // Discoverable trait for brave choices
  }
}

export interface GhostEncounter {
  id: string
  locationId: string  // Matches landmark name
  ghostName: string
  title: string
  description: string
  historicalBasis: string
  probability: number  // 0.0-1.0 chance when resting at inn
  choices: GhostChoice[]
  historicalFact: string  // Revealed after encounter
}

export const GHOST_ENCOUNTERS: GhostEncounter[] = [
  {
    id: 'ghost_captain',
    locationId: 'Fort Laramie',
    ghostName: 'The Captain',
    title: 'The Captain\'s Quarters',
    description: 'You settle into your room at the fort\'s inn. In the dead of night, heavy bootfalls echo down the hall. A translucent figure in a military uniform appears at the foot of your bed, pointing toward the window with a spectral hand. His mouth moves but no sound comes out.',
    historicalBasis: 'Fort Laramie is one of the most famously haunted sites in Wyoming. Multiple witnesses have reported seeing the ghost of a cavalry officer in the officers\' quarters.',
    probability: 0.25,
    choices: [
      {
        id: 'investigate',
        text: 'Follow where the ghost points',
        outcome: {
          message: 'You follow the Captain\'s gaze to the window. Moonlight illuminates old graffiti carved into the sill — names of soldiers long dead. Among them, a message: "Gold lies beyond the desert, but beware the sink." You feel strangely reassured.',
          moraleDelta: 5,
          goodKarmaDelta: 5,
          traitReward: 'spirit_touched',
        },
      },
      {
        id: 'speak',
        text: 'Address the spirit respectfully',
        outcome: {
          message: 'You speak calmly to the apparition. The Captain tilts his head, as if hearing you from a great distance. Then he salutes — and vanishes. You sleep soundly the rest of the night.',
          moraleDelta: 3,
          goodKarmaDelta: 3,
        },
      },
      {
        id: 'hide',
        text: 'Pull the blanket over your head',
        outcome: {
          message: 'You hide under the covers until dawn. The bootfalls continue for hours. You barely sleep and feel exhausted in the morning.',
          moraleDelta: -5,
          healthDelta: -3,
        },
      },
    ],
    historicalFact: 'Fort Laramie served as a military post from 1849 to 1890. The "Lady in Green" and ghostly cavalry officers have been reported by visitors and park rangers for over a century. The fort is now a National Historic Site.',
  },
  {
    id: 'ghost_widow',
    locationId: 'Chimney Rock',
    ghostName: 'The Pioneer\'s Widow',
    title: 'Campfire Apparition',
    description: 'While resting near Chimney Rock, your campfire flickers and dims. A woman in a tattered bonnet appears, cradling something invisible in her arms. Tears stream down her translucent face as she rocks back and forth, humming a lullaby.',
    historicalBasis: 'Thousands of emigrants died along the trail near major landmarks. Cholera, dysentery, and accidents claimed entire families. Many graves still dot the landscape around Chimney Rock.',
    probability: 0.2,
    choices: [
      {
        id: 'comfort',
        text: 'Sit quietly and listen to her song',
        outcome: {
          message: 'You sit and listen. The lullaby is hauntingly beautiful. The woman looks at you with grateful eyes, and the campfire blazes warm again. You feel a deep peace settle over you.',
          moraleDelta: 8,
          goodKarmaDelta: 8,
          traitReward: 'empathic_soul',
        },
      },
      {
        id: 'pray',
        text: 'Say a prayer for her and her child',
        outcome: {
          message: 'You bow your head and offer a quiet prayer. The widow smiles — the first joy her face has shown in 150 years. She fades away peacefully, leaving a wild flower where she sat.',
          moraleDelta: 5,
          goodKarmaDelta: 5,
        },
      },
      {
        id: 'flee',
        text: 'Grab your things and move camp',
        outcome: {
          message: 'You scramble away in the darkness, tripping over sagebrush. The lullaby follows you on the wind. You don\'t sleep well.',
          moraleDelta: -3,
          healthDelta: -2,
        },
      },
    ],
    historicalFact: 'An estimated 20,000-30,000 emigrants died along the overland trails between 1840-1860. That\'s roughly one grave every 50 yards from Missouri to California. Most died of cholera, not violence.',
  },
  {
    id: 'ghost_donner',
    locationId: 'Truckee Pass',
    ghostName: 'The Hungry Ones',
    title: 'Voices in the Snow',
    description: 'A sudden, unseasonable chill descends on Truckee Pass. Frost forms on your blankets despite the season. Through swirling snow that wasn\'t there moments ago, you see flickering campfires and hear desperate voices calling out — dozens of them, men, women, children — begging for help that never came.',
    historicalBasis: 'The Donner Party was trapped here in the winter of 1846-47. Of 87 emigrants, only 48 survived. Some resorted to cannibalism. Their camps were near what is now Donner Lake.',
    probability: 0.3,
    choices: [
      {
        id: 'leave_food',
        text: 'Leave food at the memorial site',
        outcome: {
          message: 'You place hardtack and jerky at the base of the memorial stone. The ghostly fires dim, the voices quiet to whispers of gratitude. The unnatural cold lifts. Your own party feels warmer, safer, as if protected.',
          moraleDelta: 10,
          goodKarmaDelta: 10,
          neutralKarmaDelta: -15,  // Food cost
          traitReward: 'donner_blessing',
        },
      },
      {
        id: 'bear_witness',
        text: 'Stand and bear witness to their suffering',
        outcome: {
          message: 'You stand in the ghostly snow and watch. You see their hollow eyes, their skeletal frames. It is the most terrible thing you have ever witnessed — and the most important. You will never forget, and that is what they wanted.',
          moraleDelta: 5,
          goodKarmaDelta: 7,
        },
      },
      {
        id: 'rush_through',
        text: 'Push through the pass as fast as possible',
        outcome: {
          message: 'You urge your party forward, averting your eyes. The voices grow angry, the wind tears at your clothing. You make it through, but the experience haunts your dreams.',
          moraleDelta: -5,
          healthDelta: -5,
          badKarmaDelta: 3,
        },
      },
    ],
    historicalFact: 'The Donner Party tragedy of 1846-47 became the most infamous event of westward migration. They were delayed by taking the untested Hastings Cutoff, recommended by Lansford Hastings who had never actually traversed it with wagons. The pass was later renamed Donner Pass in their memory.',
  },
  {
    id: 'ghost_mirage',
    locationId: 'Humboldt Sink',
    ghostName: 'The Desert Mirage Spirit',
    title: 'Ghost Wagons',
    description: 'The heat shimmers above the dry lakebed where the Humboldt River vanishes. You see a complete wagon train moving across the salt flats — but something is wrong. The wagons are transparent, the oxen skeletal, the drivers nothing but shadows. They move in perfect silence.',
    historicalBasis: 'Dehydration-induced hallucinations were commonly reported by emigrants crossing the Great Basin. Many also reported seeing "ghost wagons" — mirages of earlier parties reflected in the shimmering heat.',
    probability: 0.25,
    choices: [
      {
        id: 'follow',
        text: 'Follow the ghost wagons',
        outcome: {
          message: 'You follow the phantom train. It leads you to a natural spring hidden behind a rock outcrop — real water, clean and cold. The ghost wagons fade, having led you to salvation.',
          moraleDelta: 8,
          healthDelta: 5,
          traitReward: 'desert_wise',
        },
      },
      {
        id: 'salvage',
        text: 'Search the abandoned real wagons nearby',
        outcome: {
          message: 'While the mirages dance, you investigate actual abandoned wagons half-buried in sand. You find usable supplies — canteens, a compass, dried provisions.',
          neutralKarmaDelta: 20,
          moraleDelta: 3,
        },
      },
      {
        id: 'ignore',
        text: 'Ignore the visions and press on',
        outcome: {
          message: 'You shake your head and focus on the trail. The mirages fade, but the oppressive heat does not. Your party pushes forward, parched and weary.',
          moraleDelta: -2,
        },
      },
    ],
    historicalFact: 'The Humboldt Sink was called "the most miserable place on the face of the earth" by emigrants. The river simply vanishes into the alkaline desert. Thousands of wagons were abandoned here, and their remains could still be found well into the 20th century.',
  },
  {
    id: 'ghost_whisperer',
    locationId: 'City of Rocks',
    ghostName: 'The Stone Whisperer',
    title: 'Whispers in the Granite',
    description: 'As twilight falls on the ancient granite spires, you hear whispering. Not wind — words. In a language older than English, older than any tongue you know. The carvings on the rocks seem to glow faintly — emigrants\' names from the 1850s, and beneath them, something far more ancient.',
    historicalBasis: 'The granite formations at City of Rocks are 2.5 billion years old. The area held spiritual significance for the Shoshone people long before emigrants arrived. The combination of ancient rock and carved pioneer names creates an eerie atmosphere.',
    probability: 0.2,
    choices: [
      {
        id: 'listen',
        text: 'Press your ear to the stone and listen',
        outcome: {
          message: 'The granite vibrates beneath your palm. Images flash through your mind — vast ice sheets, ancient seas, the first people to walk this land. You pull away gasping, but with a profound understanding of how small and brief human concerns really are.',
          moraleDelta: 10,
          goodKarmaDelta: 5,
          traitReward: 'stone_listener',
        },
      },
      {
        id: 'carve',
        text: 'Add your name beside the pioneers\' carvings',
        outcome: {
          message: 'You carefully carve your name and the date into the soft granite, joining thousands who came before you. The whispering shifts — welcoming you into the great record of passage.',
          moraleDelta: 5,
          goodKarmaDelta: 3,
        },
      },
      {
        id: 'retreat',
        text: 'Back away from the stones',
        outcome: {
          message: 'You retreat to camp, uneasy. The whispering continues through the night, but it doesn\'t follow you. Just another strange thing in a strange land.',
          moraleDelta: -2,
        },
      },
    ],
    historicalFact: 'City of Rocks was named by emigrant James Wilkins in 1849. The granite spires are among the oldest exposed rock in North America at 2.5 billion years old. Over 1,500 pioneer inscriptions have been recorded, some dating to the earliest California Trail crossings.',
  },
]

/** Check if a ghost encounter triggers at a given location */
export function rollGhostEncounter(locationName: string): GhostEncounter | null {
  const encounter = GHOST_ENCOUNTERS.find(e => e.locationId === locationName)
  if (!encounter) return null
  return Math.random() < encounter.probability ? encounter : null
}

/** Get all possible encounters for a location (for testing/preview) */
export function getEncountersForLocation(locationName: string): GhostEncounter[] {
  return GHOST_ENCOUNTERS.filter(e => e.locationId === locationName)
}
