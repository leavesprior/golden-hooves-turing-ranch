import type { PlayerRole, VolcanoChoiceId } from '@/lib/bobrLocalCampaign'

export type EncounterTriggerKind = 'story' | 'marker' | 'geofence' | 'ar_anchor'
export type EncounterActorId = 'actor' | 'miner' | 'headmistress'

export interface EncounterActor {
  id: EncounterActorId
  name: string
  role: string
  historicalBasis: 'documented_person' | 'fictional_composite'
  scenePrompt: string
  facts: string[]
  fallback: string
}

export interface EncounterAction {
  id: VolcanoChoiceId
  availableTo: PlayerRole | 'all'
  evidenceId: string
  risk: 'low' | 'medium' | 'high'
}

export interface EncounterDefinitionV1 {
  schemaVersion: 1
  id: string
  locationId: string
  era: { year: number; label: string }
  title: string
  triggers: Array<{
    kind: EncounterTriggerKind
    locationId: string
    radiusMeters?: number
    /** Coordinates stay absent until a verified field-pilot survey supplies them. */
    coordinates?: { latitude: number; longitude: number }
  }>
  agePolicy: {
    under18: 'protected_historical_context'
    adult: 'contextual_historical_content'
  }
  actors: EncounterActor[]
  actions: EncounterAction[]
  authority: {
    llmMayAddFacts: false
    llmMayChangeState: false
    rewardsRequireCanonicalAction: true
    physicalVerificationRequiredForPartnerReward: true
  }
}

export const VOLCANO_THEATRE_ENCOUNTER: EncounterDefinitionV1 = {
  schemaVersion: 1,
  id: 'volcano_false_assay_v1',
  locationId: 'volcano_theatre_district',
  era: { year: 1879, label: 'Volcano during the theatre and mining era' },
  title: 'The curtain will not rise',
  triggers: [
    { kind: 'story', locationId: 'volcano_theatre_district' },
    { kind: 'marker', locationId: 'volcano_theatre_district' },
    { kind: 'geofence', locationId: 'volcano_theatre_district' },
    { kind: 'ar_anchor', locationId: 'volcano_theatre_district' },
  ],
  agePolicy: {
    under18: 'protected_historical_context',
    adult: 'contextual_historical_content',
  },
  actors: [
    {
      id: 'actor',
      name: 'Thaddeus Vale',
      role: 'retired theatre actor, fictional composite',
      historicalBasis: 'fictional_composite',
      scenePrompt: 'Old actor. Knows stage machinery, disguises, and every bad exit.',
      facts: ['He knows the stage machinery.', 'He saw muddy boots near the trapdoor.', 'He values the company more than the gold.'],
      fallback: 'Vale studies the curtain rope. "A good exit leaves the audience looking the wrong way. Those boots were meant to be seen. What was hidden while we watched them?"',
    },
    {
      id: 'miner',
      name: 'Nell Rourke',
      role: 'veteran miner, fictional composite',
      historicalBasis: 'fictional_composite',
      scenePrompt: 'Veteran miner. Reads ore, paper, tools, and false claims.',
      facts: ['She can read assay paperwork.', 'The ticket uses a real form.', 'The written wet-ore weight is impossible.'],
      fallback: 'Rourke rubs the ticket between two fingers. "Paper is honest enough. That weight is not. Ask who needed a real form to prove ore that never crossed a scale."',
    },
    {
      id: 'headmistress',
      name: 'Mrs. Bell',
      role: 'St. George house mistress, fictional composite',
      historicalBasis: 'fictional_composite',
      scenePrompt: 'House mistress. Protects people, ledgers, rooms, and private truth.',
      facts: ['She protects guest privacy.', 'She controls the room ledger.', 'She saw Vane ask about proving an overnight stay.'],
      fallback: 'Mrs. Bell closes the ledger. "A room number proves a key was issued, not that a body slept behind the door. Tell me why your question helps the missing man, and I may tell you who asked first."',
    },
  ],
  actions: [
    { id: 'inspect_trapdoor', availableTo: 'sleuth', evidenceId: 'staged-route-order', risk: 'low' },
    { id: 'treat_understudy', availableTo: 'doctor', evidenceId: 'ledger-question', risk: 'low' },
    { id: 'protect_witness', availableTo: 'priest', evidenceId: 'vane-threat', risk: 'low' },
    { id: 'test_assay_ticket', availableTo: 'miner', evidenceId: 'impossible-wet-weight', risk: 'low' },
    { id: 'help_stage_manager', availableTo: 'all', evidenceId: 'hidden-ticket', risk: 'medium' },
    // Accusations are no longer encounter actions: they are a distinct deduction step
    // (see SUSPECTS in bobrLocalCampaign) so a wrong guess costs time, never the trail.
  ],
  authority: {
    llmMayAddFacts: false,
    llmMayChangeState: false,
    rewardsRequireCanonicalAction: true,
    physicalVerificationRequiredForPartnerReward: true,
  },
}

export function validateEncounterDefinition(encounter: EncounterDefinitionV1): string[] {
  const errors: string[] = []
  if (encounter.schemaVersion !== 1) errors.push('unsupported schema version')
  if (!encounter.id.trim()) errors.push('encounter id is required')
  if (!encounter.locationId.trim()) errors.push('location id is required')
  if (encounter.triggers.length === 0) errors.push('at least one trigger is required')
  if (!encounter.triggers.some((trigger) => trigger.kind === 'story')) errors.push('story fallback trigger is required')
  if (new Set(encounter.actors.map((actor) => actor.id)).size !== encounter.actors.length) errors.push('actor ids must be unique')
  if (new Set(encounter.actions.map((action) => action.id)).size !== encounter.actions.length) errors.push('action ids must be unique')
  if (!encounter.actions.some((action) => action.availableTo === 'all')) errors.push('at least one action must be available to all roles')
  if (encounter.actors.some((actor) => actor.facts.length === 0 || !actor.fallback.trim())) errors.push('every actor needs facts and an authored fallback')
  if (encounter.authority.llmMayAddFacts || encounter.authority.llmMayChangeState) errors.push('LLM authority must remain bounded')
  for (const trigger of encounter.triggers) {
    if (trigger.coordinates) {
      if (trigger.coordinates.latitude < -90 || trigger.coordinates.latitude > 90) errors.push('trigger latitude is invalid')
      if (trigger.coordinates.longitude < -180 || trigger.coordinates.longitude > 180) errors.push('trigger longitude is invalid')
    }
    if (trigger.radiusMeters !== undefined && trigger.radiusMeters <= 0) errors.push('trigger radius must be positive')
  }
  return errors
}
