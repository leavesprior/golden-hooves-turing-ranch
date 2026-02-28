/**
 * Travel engine — pure state transform for the daily travel tick.
 *
 * computeTravel(state) => state
 *
 * This is the core simulation loop extracted from oregonTrailContext.travel().
 * It's a pure function with no side effects (no React hooks, no context calls).
 */

import type { OregonTrailState, GamePhase } from './types'
import { LANDMARKS, RANDOM_EVENTS, getRandomWeather } from './constants'
import {
  calculatePartyBonuses,
  checkDesertion,
  getActiveCompositionBonuses,
} from '../data/posseSystem'
import {
  getActiveCascades,
  getDailyDegradation,
  checkDesperationEvent,
  updateScarcityDays,
  type ResourceType,
} from '../data/scarcityCascades'

export function computeTravel(prev: OregonTrailState): OregonTrailState {
  if (prev.phase !== 'traveling') return prev

  // === POSSE BONUSES (#6) ===
  const roles = prev.party.map(m => m.role)
  const bonuses = calculatePartyBonuses(roles)
  const speedBonus = 1 + (bonuses.travel_speed || 0) / 100
  const foodEfficiency = 1 - (bonuses.food_efficiency || 0) / 100
  const wagonProtection = 1 - (bonuses.wagon_repair || 0) / 100

  // Calculate daily distance based on pace and conditions
  const paceMultiplier = { steady: 1, strenuous: 1.5, grueling: 2 }[prev.pace]
  const weatherPenalty = { fair: 0, rain: 0.2, storm: 0.5, snow: 0.6 }[prev.weather]
  const baseDistance = 15 // Miles per day with good conditions
  const dailyDistance = Math.round(baseDistance * paceMultiplier * (1 - weatherPenalty) * speedBonus)

  // Desert terrain check (Humboldt Sink → Forty Mile Desert region)
  const inDesertTerrain = prev.distance >= 1380 && prev.distance <= 1700

  // Food consumption based on rations (modified by cook/hunter posse bonus)
  const rationMultiplier = { filling: 3, meager: 2, bare_bones: 1 }[prev.rations]
  const desertFoodMultiplier = inDesertTerrain ? 1.5 : 1.0
  const foodConsumed = Math.ceil(prev.party.length * rationMultiplier * desertFoodMultiplier * foodEfficiency)

  // Health effects (medic bonus: disease_resist reduces health loss slightly)
  const medicBonus = (bonuses.disease_resist || 0) > 0 ? 1 : 0
  let healthChange = 0
  if (prev.rations === 'bare_bones') healthChange -= 3
  if (prev.rations === 'meager') healthChange -= 1
  if (prev.pace === 'grueling') healthChange -= 2
  if (prev.weather === 'storm') healthChange -= 2
  if (prev.weather === 'snow') healthChange -= 3
  // Desert heat exhaustion
  if (inDesertTerrain) {
    healthChange -= 2  // Base desert health drain
    if (prev.pace === 'grueling') healthChange -= 2  // Extra penalty for pushing hard in heat
  }
  healthChange += medicBonus  // Medic slightly reduces health loss

  // === SCARCITY CASCADES (#8) ===
  // Build resource snapshot for cascade calculation
  const resourceSnapshot: Record<ResourceType, number> = {
    food: prev.food,
    ammunition: prev.ammunition,
    medicine: prev.medicine,
    spareParts: prev.spareParts,
    oxen: prev.oxen,
    clothing: prev.clothing,
    morale: prev.morale,
    wagonCondition: prev.wagonCondition,
  }

  // Get cascade effects (resource interdependencies)
  const cascades = getActiveCascades(resourceSnapshot)
  let moraleCascadeDelta = 0
  let foodCascadeDelta = 0
  let wagonCascadeDelta = 0
  let oxenCascadeDelta = 0

  for (const cascade of cascades) {
    switch (cascade.targetResource) {
      case 'morale': moraleCascadeDelta += cascade.dailyDelta; break
      case 'food': foodCascadeDelta += cascade.dailyDelta; break
      case 'wagonCondition': wagonCascadeDelta += cascade.dailyDelta; break
      case 'oxen': oxenCascadeDelta += cascade.dailyDelta; break
    }
  }

  // Daily degradation (wagon wear, clothing wear)
  const degradation = getDailyDegradation(prev.weather, prev.pace)
  let wagonDegradation = 0
  let clothingDegradation = 0
  for (const deg of degradation) {
    if (deg.resource === 'wagonCondition') wagonDegradation += deg.loss
    if (deg.resource === 'clothing') clothingDegradation += deg.loss
  }
  // Apply wagon protection from mechanic
  wagonDegradation *= wagonProtection

  // Update scarcity day tracking
  const newScarcityDays = updateScarcityDays(resourceSnapshot, prev.scarcityDays)

  // Check for desperation events
  const despEvent = checkDesperationEvent(
    resourceSnapshot,
    prev.firedDesperationEvents,
    newScarcityDays,
  )

  // Calculate new resource values
  const newFood = Math.max(0, prev.food - foodConsumed + foodCascadeDelta)
  const newMorale = Math.max(0, Math.min(100, prev.morale + moraleCascadeDelta + (bonuses.morale || 0)))
  const newWagonCond = Math.max(0, Math.min(100,
    prev.wagonCondition + wagonCascadeDelta - wagonDegradation))
  const newOxen = Math.max(0, prev.oxen + oxenCascadeDelta)
  const newClothing = Math.max(0, prev.clothing - clothingDegradation)

  // === LOYALTY CHECK (#6) — hired posse members may desert ===
  let desertionMessage: string | null = null

  // Update party health and check loyalty
  const updatedParty = prev.party.map(member => {
    const updated = {
      ...member,
      health: Math.max(0, Math.min(100, member.health + healthChange)),
    }

    // Reduce special ability cooldowns
    if (updated.specialAbilityCooldown && updated.specialAbilityCooldown > 0) {
      updated.specialAbilityCooldown = updated.specialAbilityCooldown - 1
    }

    // Loyalty for hired members — base conditions + personality-specific modifiers
    if (updated.isHired && updated.loyalty !== undefined) {
      let loyaltyDelta = 0
      // Base conditions: food & morale (affects everyone)
      if (newFood <= 0) loyaltyDelta -= 3          // Starving: sharp drop
      else if (prev.rations === 'filling') loyaltyDelta += 2  // Well-fed: party appreciates it
      else if (prev.rations === 'meager') loyaltyDelta -= 1   // Short rations: mild grumbling
      if (newMorale <= 20) loyaltyDelta -= 2       // Low morale: doubt creeps in
      else if (newMorale >= 60) loyaltyDelta += 1  // Good spirits: trust grows

      // Personality-based modifiers by role — each character values different things
      switch (updated.role) {
        case 'cook':
          // Cookie takes pride in well-fed parties
          if (prev.rations === 'filling' && newFood > 20) loyaltyDelta += 1
          if (prev.rations === 'bare_bones') loyaltyDelta -= 1 // Insulted
          break
        case 'mechanic':
          // Patches happy when wagon is maintained
          if (newWagonCond >= 70) loyaltyDelta += 1
          if (newWagonCond < 30) loyaltyDelta -= 1
          break
        case 'medic':
          // Sister Grace: values compassion, healing, party wellbeing
          if (healthChange >= 0) loyaltyDelta += 1  // Party not suffering
          if (newMorale >= 50) loyaltyDelta += 1     // People's spirits are up
          if (prev.party.some(m => m.health < 30)) loyaltyDelta -= 1 // Someone suffering
          break
        case 'scout':
          // Hawkeye respects steady progress
          if (prev.pace === 'strenuous' || prev.pace === 'grueling') loyaltyDelta += 1
          break
        case 'guard':
          // Iron Bear values strength and safety
          if (newMorale >= 70) loyaltyDelta += 1  // Party feels safe
          break
        case 'diplomat':
          // Beau loves prosperity and comfort
          if (newMorale >= 70 && newFood > 30) loyaltyDelta += 1
          if (newMorale < 40) loyaltyDelta -= 1  // Bad vibes
          break
        case 'hunter':
          // Billy Buck happy when food is plentiful
          if (newFood > 40) loyaltyDelta += 1
          break
        case 'navigator':
          // Professor appreciates steady progress and discovery
          if (prev.pace !== 'steady') loyaltyDelta += 1
          break
      }
      updated.loyalty = Math.max(0, Math.min(100, updated.loyalty + loyaltyDelta))
    }

    return updated
  }).filter(member => {
    // Check if hired member deserts
    if (member.isHired && member.loyalty !== undefined) {
      const { deserts } = checkDesertion(member.loyalty)
      if (deserts) {
        desertionMessage = `${member.name} has deserted the party!`
        return false
      }
    }
    return true
  })

  // Check for deaths
  const survivors = updatedParty.filter(m => m.health > 0)
  if (survivors.length === 0) {
    return { ...prev, phase: 'game_over' as GamePhase, message: 'Your entire party has perished...' }
  }

  // Recalculate bonuses after potential desertion
  const newRoles = survivors.map(m => m.role)
  const newBonuses = calculatePartyBonuses(newRoles)
  const activeComps = getActiveCompositionBonuses(newRoles)

  // If a desperation event fired, show it instead of normal travel
  if (despEvent) {
    return {
      ...prev,
      day: prev.day + 1,
      distance: prev.distance + dailyDistance,
      milesUntilNextLandmark: prev.milesUntilNextLandmark - dailyDistance,
      food: newFood,
      morale: newMorale,
      wagonCondition: newWagonCond,
      oxen: newOxen,
      clothing: newClothing,
      party: survivors,
      totalMilesTraveled: prev.totalMilesTraveled + dailyDistance,
      daysOnTrail: prev.daysOnTrail + 1,
      scarcityDays: newScarcityDays,
      activeDesperationEvent: despEvent,
      firedDesperationEvents: despEvent.oneTimeOnly
        ? [...prev.firedDesperationEvents, despEvent.id]
        : prev.firedDesperationEvents,
      phase: 'event' as GamePhase,
      currentEvent: {
        id: despEvent.id,
        title: despEvent.title,
        description: despEvent.description,
        choices: despEvent.choices.map(c => ({
          id: c.id,
          text: c.text,
          outcome: {
            message: c.narratorReaction,
            ...Object.fromEntries(c.effects.map(e => {
              const key = e.resource === 'food' ? 'foodDelta'
                : e.resource === 'ammunition' ? 'ammoDelta'
                : e.resource === 'medicine' ? 'medicineDelta'
                : e.resource === 'spareParts' ? 'spareParts'
                : undefined
              return key ? [key, e.delta] : ['healthDelta', 0]
            }).filter(([k]) => k)),
          },
        })),
      },
      weather: getRandomWeather(prev.distance + dailyDistance),
      partyBonuses: newBonuses,
      compositionBonusNames: activeComps.map(c => c.name),
      message: desertionMessage,
    }
  }

  // Calculate new position
  const newDistance = prev.distance + dailyDistance
  const newMilesUntil = prev.milesUntilNextLandmark - dailyDistance

  // Check if reached destination - trigger Gold Country arrival
  if (newDistance >= 2000) {
    return {
      ...prev,
      phase: 'gold_country_arrival' as GamePhase,
      distance: 2000,
      party: survivors,
      food: newFood,
      morale: newMorale,
      wagonCondition: newWagonCond,
      oxen: newOxen,
      clothing: newClothing,
      scarcityDays: newScarcityDays,
      partyBonuses: newBonuses,
      compositionBonusNames: activeComps.map(c => c.name),
      message: 'You have reached Gold Country! The frontier awaits...',
    }
  }

  // Check if reached next landmark
  let newLandmark = prev.currentLandmark
  let nextLandmarkName = prev.nextLandmark
  let nextLandmarkMiles = newMilesUntil
  let newPhase: GamePhase = 'traveling'

  if (newMilesUntil <= 0) {
    const currentIndex = LANDMARKS.findIndex(l => l.name === prev.nextLandmark)
    const landmark = LANDMARKS[currentIndex]
    newLandmark = landmark.name
    nextLandmarkName = LANDMARKS[currentIndex + 1]?.name || 'Gold Country'
    nextLandmarkMiles = (LANDMARKS[currentIndex + 1]?.distance || 2000) - newDistance

    // Special locations trigger different phases
    if (landmark.type === 'river') {
      newPhase = 'river'
    } else if (landmark.type === 'fort' || landmark.type === 'town') {
      newPhase = 'town'
    }
  }

  // Random events (30% chance when traveling)
  if (newPhase === 'traveling' && Math.random() < 0.3) {
    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]
    return {
      ...prev,
      day: prev.day + 1,
      distance: newDistance,
      currentLandmark: newLandmark,
      nextLandmark: nextLandmarkName,
      milesUntilNextLandmark: Math.max(0, nextLandmarkMiles),
      food: newFood,
      morale: newMorale,
      wagonCondition: newWagonCond,
      oxen: newOxen,
      clothing: newClothing,
      party: survivors,
      totalMilesTraveled: prev.totalMilesTraveled + dailyDistance,
      daysOnTrail: prev.daysOnTrail + 1,
      phase: 'event',
      currentEvent: event,
      weather: getRandomWeather(prev.distance),
      scarcityDays: newScarcityDays,
      partyBonuses: newBonuses,
      compositionBonusNames: activeComps.map(c => c.name),
      message: desertionMessage,
    }
  }

  // Normal weather changes
  const newWeather = Math.random() < 0.15 ? getRandomWeather(newDistance) : prev.weather

  return {
    ...prev,
    day: prev.day + 1,
    distance: newDistance,
    currentLandmark: newLandmark,
    nextLandmark: nextLandmarkName,
    milesUntilNextLandmark: Math.max(0, nextLandmarkMiles),
    food: newFood,
    morale: newMorale,
    wagonCondition: newWagonCond,
    oxen: newOxen,
    clothing: newClothing,
    party: survivors,
    totalMilesTraveled: prev.totalMilesTraveled + dailyDistance,
    daysOnTrail: prev.daysOnTrail + 1,
    phase: newPhase,
    weather: newWeather,
    scarcityDays: newScarcityDays,
    partyBonuses: newBonuses,
    compositionBonusNames: activeComps.map(c => c.name),
    message: desertionMessage ||
             (newPhase === 'river' ? `You have arrived at ${newLandmark}. The river must be crossed.` :
              newPhase === 'town' ? `You have arrived at ${newLandmark}.` :
              null),
  }
}
