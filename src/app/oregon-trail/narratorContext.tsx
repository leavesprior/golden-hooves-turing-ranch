'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react'
import {
  getEscalationTier,
  shouldNarratorLie,
  shouldNarratorWithhold,
  shouldNarratorDrink,
  getEscalationComment,
  getPatternReaction,
  findTrustTrigger,
  ESCALATION_COMMENTS,
  type EscalationTier,
} from './data/narratorEscalation'

// The Unreliable Narrator - Douglas Adams Style
// The game occasionally lies to you, withholds information, or comments sarcastically

export type NarratorMood =
  | 'neutral'        // Just doing the job
  | 'amused'         // Player did something funny
  | 'annoyed'        // Player made a bad choice
  | 'impressed'      // Player did something clever
  | 'bored'          // Nothing interesting happening
  | 'cryptic'        // Feeling mysterious
  | 'apologetic'     // About to lie or withhold info
  | 'drinking'       // Narrator has been drinking (unreliable)

export interface NarratorComment {
  id: string
  text: string
  mood: NarratorMood
  isLie: boolean
  truthRevealedAfter?: number  // Reveal truth after this many actions
  timestamp: number
  category: NarratorCategory
}

export type NarratorCategory =
  | 'observation'    // Commenting on what happened
  | 'warning'        // Hinting at danger (may be false)
  | 'withholding'    // Admitting to hiding information
  | 'lie'            // Active deception
  | 'fourth_wall'    // Breaking the fourth wall
  | 'sarcasm'        // Sarcastic commentary
  | 'philosophy'     // Existential musings
  | 'complaint'      // Narrator complaints about player

export interface NarratorState {
  mood: NarratorMood
  intoxication: number       // 0-10, affects reliability
  annoyanceLevel: number     // 0-10, affects sarcasm
  trustLevel: number         // 0-10, player's trust in narrator
  comments: NarratorComment[]
  activeComment: NarratorComment | null
  liesInProgress: NarratorComment[]  // Lies that will be revealed
  hiddenInformation: string[]        // Things narrator is hiding
  playerActions: string[]            // Actions narrator is tracking
  fourthWallBroken: boolean         // Has player cracked the fourth wall

  // Escalation system (#7)
  patternCounts: Record<string, number>  // How many times each pattern detected
  escalationTier: string                  // Current tier name
  consecutiveGruelingDays: number         // Track grueling pace streak
  consecutiveBareBonesDays: number        // Track bare_bones ration streak
  firedDesperationEvents: string[]        // One-time events already triggered
}

interface NarratorContextValue {
  state: NarratorState

  // Core narrator actions
  comment: (text: string, category: NarratorCategory, isLie?: boolean) => void
  lie: (falseText: string, trueText: string, revealAfter?: number) => void
  withhold: (information: string) => void
  revealWithheld: (index: number) => string | null
  dismissComment: () => void

  // Mood management
  setMood: (mood: NarratorMood) => void
  getMoodModifiedText: (text: string) => string

  // Reliability
  isReliable: () => boolean
  getReliabilityPercent: () => number
  makeNarratorDrink: () => void
  soberUp: () => void

  // Fourth wall
  breakFourthWall: () => void
  hasBrokenFourthWall: () => boolean

  // Commentary generation
  getRandomComment: (context: string) => string
  getEventComment: (eventType: string, outcome: string) => string

  // Track player behavior
  recordPlayerAction: (action: string) => void
  getPlayerPattern: () => string | null

  // Escalation system (#7)
  modifyTrust: (delta: number, reason?: string) => void
  triggerTrustEvent: (eventName: string) => void
  getEscalationInfo: () => { tier: EscalationTier; trustLevel: number }
  getEscalatedComment: (situation: 'travel' | 'event' | 'town') => string | null
  recordPaceAndRations: (pace: string, rations: string) => void
}

const NarratorContext = createContext<NarratorContextValue | undefined>(undefined)

// Narrator comment templates by mood and category
const COMMENT_TEMPLATES: Record<NarratorMood, Record<NarratorCategory, string[]>> = {
  neutral: {
    observation: [
      'This happened.',
      'You did that.',
      'The narrator takes note.',
    ],
    warning: [
      'Something seems off.',
      'Be careful.',
      'The narrator has concerns.',
    ],
    withholding: [
      'There is more to this, but the narrator is not inclined to share.',
      'The narrator knows something you do not.',
    ],
    lie: [],
    fourth_wall: [
      'The narrator exists.',
      'This is a game.',
    ],
    sarcasm: [
      'Well, that happened.',
      'Fascinating.',
    ],
    philosophy: [
      'Such is life on the trail.',
      'The West cares not for your plans.',
    ],
    complaint: [
      'The narrator has been doing this all day.',
    ],
  },
  amused: {
    observation: [
      'The narrator suppresses a chuckle.',
      'Well, that was entertaining.',
      'The narrator is enjoying this far more than is professional.',
    ],
    warning: [
      'This should be amusing to watch.',
      'The narrator eagerly awaits the consequences.',
    ],
    withholding: [
      'The narrator knows something delightful, but telling you would spoil the fun.',
    ],
    lie: [],
    fourth_wall: [
      'The narrator hopes you\'re having as much fun as they are.',
    ],
    sarcasm: [
      'Oh, this is going to be good.',
      'The narrator prepares popcorn.',
    ],
    philosophy: [
      'Comedy is just tragedy plus time. This is comedy.',
    ],
    complaint: [],
  },
  annoyed: {
    observation: [
      'The narrator sighs heavily.',
      'Again?',
      'The narrator expected better.',
    ],
    warning: [
      'The narrator would warn you, but what\'s the point?',
      'Don\'t come crying to the narrator when this goes wrong.',
    ],
    withholding: [
      'The narrator could help, but won\'t.',
      'The narrator is withholding information out of spite.',
    ],
    lie: [],
    fourth_wall: [
      'The narrator is considering a career change.',
      'This is why the narrator drinks.',
    ],
    sarcasm: [
      'Oh, brilliant move. Truly.',
      'The narrator\'s faith in humanity dwindles.',
      'Yes, that\'s definitely the best choice. The narrator is being sarcastic.',
    ],
    philosophy: [
      'Free will is a curse.',
    ],
    complaint: [
      'The narrator did not sign up for this.',
      'The narrator would like to speak to the game designer.',
    ],
  },
  impressed: {
    observation: [
      'The narrator did not see that coming.',
      'Well played.',
      'The narrator tips their metaphorical hat.',
    ],
    warning: [
      'Even the narrator is impressed, and they know what\'s coming.',
    ],
    withholding: [
      'The narrator will make an exception and share something useful.',
    ],
    lie: [],
    fourth_wall: [
      'The narrator admits you are better at this than expected.',
    ],
    sarcasm: [
      'The narrator would be sarcastic, but this actually was clever.',
    ],
    philosophy: [
      'Perhaps humans aren\'t entirely hopeless.',
    ],
    complaint: [],
  },
  bored: {
    observation: [
      'This is happening. The narrator supposes.',
      'The narrator stifles a yawn.',
      'Events continue to occur.',
    ],
    warning: [
      'Something might happen. Or not. The narrator cannot bring themselves to care.',
    ],
    withholding: [
      'The narrator probably knows something, but can\'t remember. Too bored.',
    ],
    lie: [],
    fourth_wall: [
      'The narrator wonders how many more locations there are.',
    ],
    sarcasm: [
      'Thrilling.',
      'Edge of seat. Riveted.',
    ],
    philosophy: [
      'Existence is long.',
    ],
    complaint: [
      'The narrator wishes something interesting would happen.',
    ],
  },
  cryptic: {
    observation: [
      'The stars align. Or perhaps they do not.',
      'The narrator sees much, says little.',
      'Wheels within wheels.',
    ],
    warning: [
      'Beware the thing you cannot see.',
      'The path ahead is shrouded.',
    ],
    withholding: [
      'The narrator knows. The narrator always knows.',
      'Some truths are better left unspoken.',
    ],
    lie: [],
    fourth_wall: [
      'Time is a flat circle. The narrator has seen all of this before.',
    ],
    sarcasm: [],
    philosophy: [
      'What is a narrator but a voice in the void?',
      'The trail goes ever on, until it doesn\'t.',
    ],
    complaint: [],
  },
  apologetic: {
    observation: [
      'The narrator feels they should mention...',
      'In fairness, the narrator should note...',
    ],
    warning: [
      'The narrator hates to say this, but...',
    ],
    withholding: [
      'The narrator apologizes for what they\'re about to not tell you.',
      'The narrator wishes they could be more helpful. They cannot.',
    ],
    lie: [],
    fourth_wall: [
      'The narrator is sorry. The game made them do it.',
    ],
    sarcasm: [],
    philosophy: [
      'The narrator was only doing their job.',
    ],
    complaint: [],
  },
  drinking: {
    observation: [
      'The narrator shees... sees what happened.',
      'That defin... definately occurred.',
      '*hic*',
    ],
    warning: [
      'Watch out for the... thing. You know the one.',
      'Danger! Maybe. The narrator isn\'t sure.',
    ],
    withholding: [
      'The narrator knows a shecret... secret. But they forgot what.',
    ],
    lie: [],
    fourth_wall: [
      'The narrator may have had a few.',
      'Is it warm in here or is it jusht... just the narrator?',
    ],
    sarcasm: [
      'You\'re my besht... best player. No really.',
    ],
    philosophy: [
      'What even IS a trail, really?',
    ],
    complaint: [
      'The narrator needs a break.',
    ],
  },
}

// Special lies the narrator might tell
const NARRATOR_LIES = [
  {
    false: 'There is nothing suspicious about the barn.',
    true: 'There was, in fact, something very suspicious about the barn.',
  },
  {
    false: 'The witness is telling the truth.',
    true: 'The witness was lying through their teeth.',
  },
  {
    false: 'This appears to be a safe route.',
    true: 'The narrator knew about the ambush the whole time.',
  },
  {
    false: 'The outlaw definitely went north.',
    true: 'The outlaw went south. The narrator was testing you.',
  },
  {
    false: 'Your supplies should last the journey.',
    true: 'The narrator was optimistic. Foolishly so.',
  },
]

const initialState: NarratorState = {
  mood: 'neutral',
  intoxication: 0,
  annoyanceLevel: 0,
  trustLevel: 10,
  comments: [],
  activeComment: null,
  liesInProgress: [],
  hiddenInformation: [],
  playerActions: [],
  fourthWallBroken: false,
  // Escalation system (#7)
  patternCounts: {},
  escalationTier: 'Trustworthy',
  consecutiveGruelingDays: 0,
  consecutiveBareBonesDays: 0,
  firedDesperationEvents: [],
}

export function NarratorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NarratorState>(initialState)

  // Make a comment
  const comment = useCallback((text: string, category: NarratorCategory, isLie: boolean = false) => {
    const newComment: NarratorComment = {
      id: `comment_${Date.now()}`,
      text,
      mood: state.mood,
      isLie,
      timestamp: Date.now(),
      category,
    }

    setState(prev => ({
      ...prev,
      comments: [...prev.comments.slice(-49), newComment],
      activeComment: newComment,
    }))

    // Auto-dismiss after delay (unless fourth wall breaking)
    if (category !== 'fourth_wall') {
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          activeComment: prev.activeComment?.id === newComment.id ? null : prev.activeComment,
        }))
      }, 5000)
    }
  }, [state.mood])

  // Tell a lie that will be revealed later
  const lie = useCallback((falseText: string, trueText: string, revealAfter: number = 3) => {
    const lieComment: NarratorComment = {
      id: `lie_${Date.now()}`,
      text: falseText,
      mood: 'apologetic',
      isLie: true,
      truthRevealedAfter: revealAfter,
      timestamp: Date.now(),
      category: 'lie',
    }

    setState(prev => ({
      ...prev,
      comments: [...prev.comments.slice(-49), lieComment],
      activeComment: lieComment,
      liesInProgress: [...prev.liesInProgress, { ...lieComment, text: trueText }],
    }))
  }, [])

  // Withhold information
  const withhold = useCallback((information: string) => {
    setState(prev => ({
      ...prev,
      hiddenInformation: [...prev.hiddenInformation, information],
    }))

    // Comment about withholding
    comment(
      COMMENT_TEMPLATES[state.mood].withholding[
        Math.floor(Math.random() * COMMENT_TEMPLATES[state.mood].withholding.length)
      ] || 'The narrator knows something you do not.',
      'withholding'
    )
  }, [comment, state.mood])

  // Reveal previously withheld information
  const revealWithheld = useCallback((index: number): string | null => {
    if (index < 0 || index >= state.hiddenInformation.length) return null

    const info = state.hiddenInformation[index]

    setState(prev => ({
      ...prev,
      hiddenInformation: prev.hiddenInformation.filter((_, i) => i !== index),
    }))

    comment(`Fine. The narrator will tell you: ${info}`, 'fourth_wall')
    return info
  }, [state.hiddenInformation, comment])

  // Dismiss active comment
  const dismissComment = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeComment: null,
    }))
  }, [])

  // Set narrator mood
  const setMood = useCallback((mood: NarratorMood) => {
    setState(prev => ({
      ...prev,
      mood,
    }))
  }, [])

  // Modify text based on mood
  const getMoodModifiedText = useCallback((text: string): string => {
    if (state.intoxication > 5) {
      // Drunk narrator slurs
      return text
        .replace(/s(?=[aeiou])/gi, 'sh')
        .replace(/the /gi, 'the... ')
        .replace(/\. /g, '. *hic* ')
    }

    if (state.mood === 'annoyed' && Math.random() > 0.7) {
      return text + ' The narrator supposes.'
    }

    if (state.mood === 'bored') {
      return text + '...'
    }

    return text
  }, [state.intoxication, state.mood])

  // Check narrator reliability
  const isReliable = useCallback((): boolean => {
    // Narrator is unreliable when drunk or very annoyed
    return state.intoxication < 5 && state.annoyanceLevel < 8
  }, [state.intoxication, state.annoyanceLevel])

  // Get reliability percentage
  const getReliabilityPercent = useCallback((): number => {
    const intoxPenalty = state.intoxication * 5
    const annoyPenalty = state.annoyanceLevel * 3
    return Math.max(0, 100 - intoxPenalty - annoyPenalty)
  }, [state.intoxication, state.annoyanceLevel])

  // Make narrator drink (decrease reliability)
  const makeNarratorDrink = useCallback(() => {
    setState(prev => ({
      ...prev,
      intoxication: Math.min(10, prev.intoxication + 2),
      mood: prev.intoxication >= 3 ? 'drinking' : prev.mood,
    }))

    if (state.intoxication >= 3) {
      comment('The narrator *hic* is fine.', 'observation')
    }
  }, [state.intoxication, comment])

  // Sober up narrator
  const soberUp = useCallback(() => {
    setState(prev => ({
      ...prev,
      intoxication: Math.max(0, prev.intoxication - 1),
      mood: prev.intoxication <= 2 ? 'neutral' : prev.mood,
    }))
  }, [])

  // Break the fourth wall
  const breakFourthWall = useCallback(() => {
    setState(prev => ({
      ...prev,
      fourthWallBroken: true,
    }))

    comment(
      'You shouldn\'t be able to talk to me directly. How did you... never mind. What do you want?',
      'fourth_wall'
    )
  }, [comment])

  // Check if fourth wall has been broken
  const hasBrokenFourthWall = useCallback((): boolean => {
    return state.fourthWallBroken
  }, [state.fourthWallBroken])

  // Generate random contextual comment
  const getRandomComment = useCallback((context: string): string => {
    const mood = state.mood
    const templates = COMMENT_TEMPLATES[mood]

    // Determine category based on context
    let category: NarratorCategory = 'observation'
    if (context.includes('danger') || context.includes('warning')) {
      category = 'warning'
    } else if (context.includes('choice') || context.includes('decision')) {
      category = Math.random() > 0.5 ? 'sarcasm' : 'observation'
    }

    const options = templates[category]
    if (!options || options.length === 0) {
      return 'The narrator has nothing to say.'
    }

    return options[Math.floor(Math.random() * options.length)]
  }, [state.mood])

  // Generate event-specific comment
  const getEventComment = useCallback((eventType: string, outcome: string): string => {
    const isGoodOutcome = outcome.includes('success') || outcome.includes('good') || outcome.includes('found')

    if (isGoodOutcome && state.mood !== 'annoyed') {
      setMood('impressed')
      return 'The narrator acknowledges your competence. Grudgingly.'
    }

    if (!isGoodOutcome && state.annoyanceLevel < 5) {
      setState(prev => ({
        ...prev,
        annoyanceLevel: prev.annoyanceLevel + 1,
      }))
      setMood('annoyed')
      return 'The narrator saw that coming.'
    }

    return getRandomComment(eventType)
  }, [state.mood, state.annoyanceLevel, getRandomComment, setMood])

  // Record player action (for pattern detection)
  const recordPlayerAction = useCallback((action: string) => {
    setState(prev => ({
      ...prev,
      playerActions: [...prev.playerActions.slice(-29), action],
    }))
  }, [])

  // Detect player patterns
  const getPlayerPattern = useCallback((): string | null => {
    if (state.playerActions.length < 5) return null

    const recent = state.playerActions.slice(-5)

    // Check for repetitive behavior
    if (new Set(recent).size === 1) {
      return `same_action_repeated`
    }

    // Check for aggressive behavior
    const aggressiveActions = recent.filter(a =>
      a.includes('intimidate') || a.includes('threaten') || a.includes('fight')
    )
    if (aggressiveActions.length >= 3) {
      return 'aggressive_pattern'
    }

    // Check for cautious behavior
    const cautiousActions = recent.filter(a =>
      a.includes('wait') || a.includes('careful') || a.includes('investigate')
    )
    if (cautiousActions.length >= 4) {
      return 'cautious_pattern'
    }

    return null
  }, [state.playerActions])

  // Sober up over time
  useEffect(() => {
    if (state.intoxication > 0) {
      const timer = setInterval(soberUp, 30000) // Sober up every 30 seconds
      return () => clearInterval(timer)
    }
  }, [state.intoxication, soberUp])

  // === ESCALATION SYSTEM (#7) ===

  // Modify narrator trust directly
  const modifyTrust = useCallback((delta: number, reason?: string) => {
    setState(prev => {
      const newTrust = Math.max(0, Math.min(10, prev.trustLevel + delta))
      const tier = getEscalationTier(newTrust)

      // When trust drops, check if narrator should drink or switch mood
      let newIntox = prev.intoxication
      let newMood = prev.mood
      if (delta < 0 && shouldNarratorDrink(newTrust)) {
        newIntox = Math.min(10, prev.intoxication + 2)
        if (newIntox >= 4) newMood = 'drinking'
      }

      // Mood bias from escalation tier
      if (tier.moodBias.length > 0 && Math.random() < 0.3) {
        newMood = tier.moodBias[Math.floor(Math.random() * tier.moodBias.length)] as NarratorMood
      }

      return {
        ...prev,
        trustLevel: newTrust,
        intoxication: newIntox,
        mood: newMood,
        escalationTier: tier.name,
      }
    })
  }, [])

  // Trigger a named trust event (e.g. 'party_member_died', 'arrived_at_landmark')
  const triggerTrustEvent = useCallback((eventName: string) => {
    const trigger = findTrustTrigger(eventName)
    if (!trigger) return

    modifyTrust(trigger.trustDelta)

    if (trigger.annoyanceDelta) {
      setState(prev => ({
        ...prev,
        annoyanceLevel: Math.max(0, Math.min(10, prev.annoyanceLevel + trigger.annoyanceDelta!)),
      }))
    }

    if (trigger.intoxicationDelta) {
      setState(prev => ({
        ...prev,
        intoxication: Math.min(10, prev.intoxication + trigger.intoxicationDelta!),
      }))
    }

    if (trigger.narratorReaction) {
      comment(trigger.narratorReaction, trigger.category === 'pattern' ? 'complaint' : 'observation')
    }
  }, [modifyTrust, comment])

  // Get escalation info for UI display
  const getEscalationInfo = useCallback(() => {
    const tier = getEscalationTier(state.trustLevel)
    return { tier, trustLevel: state.trustLevel }
  }, [state.trustLevel])

  // Get an escalation-modified comment for a situation
  const getEscalatedComment = useCallback((situation: 'travel' | 'event' | 'town'): string | null => {
    // At high trust, no escalated comments
    if (state.trustLevel >= 8) return null

    // Chance-based: not every comment is escalated
    if (Math.random() > 0.4) return null

    // Check for fourth wall break at low trust
    if (state.trustLevel <= 3 && Math.random() < 0.15) {
      const lines = ESCALATION_COMMENTS.fourth_wall_low_trust
      return lines[Math.floor(Math.random() * lines.length)]
    }

    return getEscalationComment(state.trustLevel, situation)
  }, [state.trustLevel])

  // Record pace/rations for streak tracking (triggers escalation)
  const recordPaceAndRations = useCallback((pace: string, rations: string) => {
    setState(prev => {
      const newGrueling = pace === 'grueling' ? prev.consecutiveGruelingDays + 1 : 0
      const newBareBones = rations === 'bare_bones' ? prev.consecutiveBareBonesDays + 1 : 0

      const updates: Partial<NarratorState> = {
        consecutiveGruelingDays: newGrueling,
        consecutiveBareBonesDays: newBareBones,
      }

      return { ...prev, ...updates }
    })
  }, [])

  // Pattern detection with escalation reactions
  const patternCountsRef = useRef(state.patternCounts)
  patternCountsRef.current = state.patternCounts

  useEffect(() => {
    const pattern = getPlayerPattern()
    if (!pattern) return

    const newCounts = { ...patternCountsRef.current }
    newCounts[pattern] = (newCounts[pattern] || 0) + 1

    const reaction = getPatternReaction(pattern, newCounts)
    if (reaction) {
      modifyTrust(reaction.trustDelta)
      if (reaction.annoyanceDelta) {
        setState(prev => ({
          ...prev,
          annoyanceLevel: Math.max(0, Math.min(10, prev.annoyanceLevel + reaction.annoyanceDelta)),
        }))
      }
      if (reaction.narratorResponse) {
        comment(reaction.narratorResponse, 'complaint')
      }
      if (reaction.specialAction === 'start_drinking') {
        makeNarratorDrink()
      }
      if (reaction.specialAction === 'break_fourth_wall') {
        breakFourthWall()
      }
    }

    setState(prev => ({ ...prev, patternCounts: newCounts }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.playerActions.length])

  // Auto-trigger escalation for pace/rations streaks
  useEffect(() => {
    if (state.consecutiveGruelingDays === 3) {
      triggerTrustEvent('grueling_pace_3_days')
    }
    if (state.consecutiveBareBonesDays === 3) {
      triggerTrustEvent('bare_bones_3_days')
    }
  }, [state.consecutiveGruelingDays, state.consecutiveBareBonesDays, triggerTrustEvent])

  // Check for lies to reveal
  useEffect(() => {
    const lies = state.liesInProgress.filter(lie => {
      if (!lie.truthRevealedAfter) return false
      const actionsSinceLie = state.playerActions.length
      return actionsSinceLie >= lie.truthRevealedAfter
    })

    if (lies.length > 0) {
      lies.forEach(lie => {
        comment(
          `The narrator confesses: ${lie.text}. The narrator apologizes. Sort of.`,
          'fourth_wall'
        )
      })

      setState(prev => ({
        ...prev,
        liesInProgress: prev.liesInProgress.filter(l => !lies.includes(l)),
      }))
    }
  }, [state.playerActions.length, state.liesInProgress, comment])

  const value: NarratorContextValue = {
    state,
    comment,
    lie,
    withhold,
    revealWithheld,
    dismissComment,
    setMood,
    getMoodModifiedText,
    isReliable,
    getReliabilityPercent,
    makeNarratorDrink,
    soberUp,
    breakFourthWall,
    hasBrokenFourthWall,
    getRandomComment,
    getEventComment,
    recordPlayerAction,
    getPlayerPattern,
    // Escalation system (#7)
    modifyTrust,
    triggerTrustEvent,
    getEscalationInfo,
    getEscalatedComment,
    recordPaceAndRations,
  }

  return (
    <NarratorContext.Provider value={value}>
      {children}
    </NarratorContext.Provider>
  )
}

export function useNarrator() {
  const context = useContext(NarratorContext)
  if (!context) {
    throw new Error('useNarrator must be used within a NarratorProvider')
  }
  return context
}

// Helper to get mood color
export function getNarratorMoodColor(mood: NarratorMood): string {
  switch (mood) {
    case 'neutral': return 'text-gray-400'
    case 'amused': return 'text-yellow-400'
    case 'annoyed': return 'text-orange-400'
    case 'impressed': return 'text-emerald-400'
    case 'bored': return 'text-gray-500'
    case 'cryptic': return 'text-purple-400'
    case 'apologetic': return 'text-blue-400'
    case 'drinking': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

// Helper to get narrator avatar based on mood
export function getNarratorAvatar(mood: NarratorMood): string {
  switch (mood) {
    case 'neutral': return '\ud83d\udcdd'  // memo
    case 'amused': return '\ud83d\ude0f'   // smirk
    case 'annoyed': return '\ud83d\ude12'  // unamused
    case 'impressed': return '\ud83e\uddd0'  // monocle
    case 'bored': return '\ud83d\ude34'    // sleeping
    case 'cryptic': return '\ud83d\udd2e'  // crystal ball
    case 'apologetic': return '\ud83d\ude05' // sweat smile
    case 'drinking': return '\ud83c\udf7a'  // beer
    default: return '\ud83d\udcdd'
  }
}
