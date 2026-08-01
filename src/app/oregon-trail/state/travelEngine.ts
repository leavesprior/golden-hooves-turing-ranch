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
import {
  rollHazard,
  NEUTRAL_STATS,
  type SaddleStats,
  type HazardResult,
} from '../data/trailHazards'

/** Compute landmark state after traveling to newDistance */
function computeLandmarkState(
  newDistance: number,
  newMilesUntil: number,
  prevNextLandmark: string,
): { currentLandmark: string; nextLandmark: string; milesUntilNextLandmark: number; landmarkPhase: GamePhase } {
  if (newMilesUntil <= 0) {
    const currentIndex = LANDMARKS.findIndex(l => l.name === prevNextLandmark)
    const landmark = LANDMARKS[currentIndex]
    const nextName = LANDMARKS[currentIndex + 1]?.name || 'Gold Country'
    const nextMiles = (LANDMARKS[currentIndex + 1]?.distance || 2000) - newDistance
    let phase: GamePhase = 'traveling'
    if (landmark.type === 'river') phase = 'river'
    else if (landmark.type === 'fort' || landmark.type === 'town') phase = 'town'
    return { currentLandmark: landmark.name, nextLandmark: nextName, milesUntilNextLandmark: nextMiles, landmarkPhase: phase }
  }
  return { currentLandmark: '', nextLandmark: prevNextLandmark, milesUntilNextLandmark: newMilesUntil, landmarkPhase: 'traveling' }
}

export function computeTravel(
  prev: OregonTrailState,
  stats: SaddleStats = NEUTRAL_STATS,
  rng: () => number = Math.random,
): OregonTrailState {
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
  let dailyDistance = Math.round(baseDistance * paceMultiplier * (1 - weatherPenalty) * speedBonus)

  // Town-stop guarantee (Leif 2026-07-20): never travel PAST the next landmark in
  // a single tick. Clamp the day's distance to the gap so the party always ARRIVES
  // at each landmark/town and gets the choice to enter it, instead of overshooting.
  // This is what let the 50-mi endgame gaps (Sacramento Valley -> West Point ->
  // Gold Country) skip West Point + Cynthia's Inn at grueling pace / with speed
  // bonuses, and also skip the `newDistance >= 2000` arrival straight past West
  // Point. Carrying the remainder to the next tick means a fast day can no longer
  // swallow the intermediate stop — you stop at West Point (1950) first, THEN
  // reach Gold Country (2000) on the following tick.
  if (prev.milesUntilNextLandmark > 0 && dailyDistance > prev.milesUntilNextLandmark) {
    dailyDistance = prev.milesUntilNextLandmark
  }

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

  // === STARVATION ===
  // An empty larder used to cost only posse loyalty, which meant a party could
  // walk to California on nothing at all. Food is consumed BELOW (newFood), so
  // test the projected larder, not yesterday's. Rations set the severity: a
  // company on `filling` that runs dry falls furthest, because it was eating.
  const projectedFood = prev.food - foodConsumed
  let starving = false
  if (projectedFood <= 0) {
    starving = true
    const deficit = Math.min(4, Math.ceil(Math.abs(projectedFood) / Math.max(1, prev.party.length)))
    healthChange -= 6 + deficit
    if (prev.pace === 'grueling') healthChange -= 3  // marching hungry is worse
  }

  // === REGION HAZARDS ===
  // Snakes, storms, grizzlies, wolves, cholera, alkali water, the Sierra snow —
  // drawn from the pool for THIS stretch of trail and resolved against S.A.D.D.L.E.
  // A starving, exhausted party attracts more trouble than a fed one.
  const hazardChance = 0.18 + (starving ? 0.08 : 0) + (prev.pace === 'grueling' ? 0.04 : 0)
  const hazard: HazardResult | null = rollHazard(prev, stats, rng, hazardChance)
  const hz = hazard?.effects ?? {}
  healthChange += hz.healthDelta ?? 0
  // The hazard's account of the day. Every return path below carries it, so an
  // event or a desperation beat taking the screen cannot silently eat it.
  const dayMessage = hazard?.text ?? null
  const hazardRecord = hazard
    ? { id: hazard.hazard.id, name: hazard.hazard.name, avoided: hazard.avoided, text: hazard.text }
    : undefined

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

  // Check for desperation events (3-day cooldown)
  const despEvent = checkDesperationEvent(
    resourceSnapshot,
    prev.firedDesperationEvents,
    newScarcityDays,
    prev.day,
    prev.lastDesperationEventDay,
  )

  // Calculate new resource values
  // Hazard resource effects. `foodLost` is signed: a negative value is a GAIN,
  // which is how the honest-trade branch of `native_encounter` pays out.
  const newFood = Math.max(0, prev.food - foodConsumed + foodCascadeDelta - (hz.foodLost ?? 0))
  // Pan Galactic Gargle Blaster hangover: a daily morale drag while it lasts.
  const hangoverDrag = (prev.hangoverUntilDay ?? 0) > prev.day ? -6 : 0
  const newMorale = Math.max(0, Math.min(100,
    prev.morale + moraleCascadeDelta + (bonuses.morale || 0) + hangoverDrag + (hz.moraleDelta ?? 0)))
  const newWagonCond = Math.max(0, Math.min(100,
    prev.wagonCondition + wagonCascadeDelta - wagonDegradation - (hz.wagonDamage ?? 0)))
  const newOxen = Math.max(0, prev.oxen + oxenCascadeDelta - (hz.oxenLost ?? 0))
  const newAmmunition = Math.max(0, prev.ammunition - (hz.ammoLost ?? 0))
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
    // Spreading `prev` here used to DISCARD `updatedParty` — the very object whose
    // zeroed health triggered this branch — so the save persisted a living party at
    // full health behind an "everyone has perished" screen. Carry the day that
    // actually happened: the party as it died, the ground it covered, the empty
    // larder that did it. The ending has to be able to explain itself.
    //
    // The general-case line is #52's (the Passing sequence) — kept verbatim, since
    // GameOverScreen now renders "The Trail Claims Its Own" / "The Name Goes On"
    // around it and the prose has to sit inside that. When we KNOW what killed
    // them, say so instead: an ending that can name its own cause is better than
    // one that can't.
    return {
      ...prev,
      phase: 'game_over' as GamePhase,
      party: updatedParty,
      day: prev.day + 1,
      distance: prev.distance + dailyDistance,
      totalMilesTraveled: prev.totalMilesTraveled + dailyDistance,
      daysOnTrail: prev.daysOnTrail + 1,
      food: newFood,
      oxen: newOxen,
      ammunition: newAmmunition,
      morale: newMorale,
      wagonCondition: newWagonCond,
      clothing: newClothing,
      scarcityDays: newScarcityDays,
      message: hazard && !hazard.avoided
        ? `${hazard.text}\n\nThe party does not rise from this camp.`
        : starving
          ? 'The last of the food went days ago. The party does not rise from this camp.'
          : 'The last of the party lay down within sight of the next rise. The trail keeps its own counsel about who reaches the end of it.',
    }
  }

  // Recalculate bonuses after potential desertion
  const newRoles = survivors.map(m => m.role)
  const newBonuses = calculatePartyBonuses(newRoles)
  const activeComps = getActiveCompositionBonuses(newRoles)

  // If a desperation event fired, show it instead of normal travel
  if (despEvent) {
    const despDistance = prev.distance + dailyDistance
    const despMilesUntil = prev.milesUntilNextLandmark - dailyDistance
    const despLandmark = computeLandmarkState(despDistance, despMilesUntil, prev.nextLandmark)
    return {
      ...prev,
      day: prev.day + 1,
      distance: despDistance,
      currentLandmark: despLandmark.currentLandmark || prev.currentLandmark,
      landmarkArrivalDay: despLandmark.currentLandmark ? prev.day + 1 : prev.landmarkArrivalDay,
      nextLandmark: despLandmark.nextLandmark,
      milesUntilNextLandmark: Math.max(0, despLandmark.milesUntilNextLandmark),
      food: newFood,
      morale: newMorale,
      wagonCondition: newWagonCond,
      oxen: newOxen,
      ammunition: newAmmunition,
      clothing: newClothing,
      // A desperation beat must not swallow the day's hazard either — its costs
      // were already applied, so its account travels with them.
      lastHazard: hazardRecord,
      party: survivors,
      totalMilesTraveled: prev.totalMilesTraveled + dailyDistance,
      daysOnTrail: prev.daysOnTrail + 1,
      scarcityDays: newScarcityDays,
      activeDesperationEvent: despEvent,
      lastDesperationEventDay: prev.day + 1,
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
      // A desperation beat owns the screen, but the trail message it returns to
      // must still carry the town's authored welcome and the day's hazard —
      // otherwise arriving on a scarcity day silently costs both.
      message: [desertionMessage, dayMessage].filter(Boolean).join('\n\n') || null,
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
  const landmarkState = computeLandmarkState(newDistance, newMilesUntil, prev.nextLandmark)
  const newLandmark = landmarkState.currentLandmark || prev.currentLandmark
  // #15: landmarkState.currentLandmark is non-empty exactly when a landmark is
  // newly reached this tick — record the arrival day so scenic place art shows
  // only on that day (currentLandmark is never cleared; it's load-bearing).
  const newArrivalDay = landmarkState.currentLandmark ? prev.day + 1 : prev.landmarkArrivalDay
  const nextLandmarkName = landmarkState.nextLandmark
  const nextLandmarkMiles = landmarkState.milesUntilNextLandmark
  const newPhase = landmarkState.landmarkPhase

  // Random events (30% chance when traveling)
  if (newPhase === 'traveling' && Math.random() < 0.3) {
    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]
    return {
      ...prev,
      day: prev.day + 1,
      distance: newDistance,
      currentLandmark: newLandmark,
      landmarkArrivalDay: newArrivalDay,
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
      ammunition: newAmmunition,
      weather: getRandomWeather(newDistance),
      scarcityDays: newScarcityDays,
      partyBonuses: newBonuses,
      compositionBonusNames: activeComps.map(c => c.name),
      // An event taking the screen must not silently swallow the day's hazard —
      // its costs were already applied above, so its account has to survive too.
      lastHazard: hazardRecord,
      message: [desertionMessage, dayMessage].filter(Boolean).join('\n\n') || null,
    }
  }

  // Normal weather changes
  const newWeather = Math.random() < 0.15 ? getRandomWeather(newDistance) : prev.weather

  return {
    ...prev,
    day: prev.day + 1,
    distance: newDistance,
    currentLandmark: newLandmark,
    landmarkArrivalDay: newArrivalDay,
    nextLandmark: nextLandmarkName,
    milesUntilNextLandmark: Math.max(0, nextLandmarkMiles),
    food: newFood,
    morale: newMorale,
    wagonCondition: newWagonCond,
    oxen: newOxen,
    ammunition: newAmmunition,
    clothing: newClothing,
    lastHazard: hazardRecord,
    party: survivors,
    totalMilesTraveled: prev.totalMilesTraveled + dailyDistance,
    daysOnTrail: prev.daysOnTrail + 1,
    phase: newPhase,
    weather: newWeather,
    scarcityDays: newScarcityDays,
    partyBonuses: newBonuses,
    compositionBonusNames: activeComps.map(c => c.name),
    // Precedence: losing a person outranks everything; then what the player must
    // act on; then the day's hazard. These stack rather than one silently eating
    // the other. The town's ARRIVAL prose is NOT here — TownScreen owns it, via
    // the lib/townVisits localStorage ledger from #53, which deliberately
    // survives resetGame() so a town remembers the FAMILY across a Passing.
    message: desertionMessage ||
             [
               newPhase === 'river' ? `You have arrived at ${newLandmark}. The river must be crossed.` :
               newPhase === 'town' ? `You have arrived at ${newLandmark}.` : null,
               dayMessage,
             ].filter(Boolean).join('\n\n') || null,
  }
}
