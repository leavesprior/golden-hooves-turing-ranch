/**
 * Investigation actions — pure state transforms for mystery/RPG phase navigation.
 */

import type { OregonTrailState, GamePhase } from './types'

export function applyGoToCharacterCreation(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'character_creation', previousPhase: prev.phase }
}

export function applyOpenInvestigation(prev: OregonTrailState): OregonTrailState {
  return {
    ...prev,
    phase: 'investigation',
    previousPhase: prev.phase,
    investigation: {
      ...prev.investigation,
      hoursInvestigated: 0,
      witnessesInterviewed: [],
      locationsSearched: [],
    },
  }
}

export function applyCloseInvestigation(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: prev.previousPhase || 'town', previousPhase: null }
}

export function applyInvestigateLocation(prev: OregonTrailState, locationId: string): OregonTrailState {
  return {
    ...prev,
    investigation: {
      ...prev.investigation,
      locationsSearched: [...prev.investigation.locationsSearched, locationId],
      hoursInvestigated: prev.investigation.hoursInvestigated + 1,
    },
  }
}

export function applyOpenWitnessDialogue(prev: OregonTrailState, witnessType: string): OregonTrailState {
  return {
    ...prev,
    phase: 'witness',
    previousPhase: prev.phase,
    investigation: { ...prev.investigation, activeWitness: witnessType },
  }
}

export function applyCloseWitnessDialogue(prev: OregonTrailState): OregonTrailState {
  return {
    ...prev,
    phase: prev.previousPhase || 'investigation',
    previousPhase: null,
    investigation: {
      ...prev.investigation,
      activeWitness: null,
      witnessesInterviewed: prev.investigation.activeWitness
        ? [...prev.investigation.witnessesInterviewed, prev.investigation.activeWitness]
        : prev.investigation.witnessesInterviewed,
      hoursInvestigated: prev.investigation.hoursInvestigated + 1,
    },
  }
}

export function applyOpenDossier(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'dossier', previousPhase: prev.phase }
}

export function applyCloseDossier(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: prev.previousPhase || 'town', previousPhase: null }
}

export function applyOpenTelegraph(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'telegraph', previousPhase: prev.phase }
}

export function applyCloseTelegraph(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: prev.previousPhase || 'town', previousPhase: null }
}

export function applyOpenJournal(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: 'journal', previousPhase: prev.phase }
}

export function applyCloseJournal(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: prev.previousPhase || 'traveling', previousPhase: null }
}

export function applySpendInvestigationTime(prev: OregonTrailState, hours: number): OregonTrailState {
  return {
    ...prev,
    investigation: {
      ...prev.investigation,
      hoursInvestigated: prev.investigation.hoursInvestigated + hours,
    },
  }
}

export function applyReturnToPreviousPhase(prev: OregonTrailState): OregonTrailState {
  return { ...prev, phase: prev.previousPhase || 'traveling', previousPhase: null }
}
