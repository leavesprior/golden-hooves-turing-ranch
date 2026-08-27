/**
 * L3 bounty alley — Doom-like back-of-business chase, 1849.
 * Stats are passed in as checks (Fallout-2 called shots). No client mint.
 */

export type AlleyPlace = 'store_back' | 'barrel_lane' | 'hole_drift'

export type ChasePhase = 'run' | 'catch' | 'called' | 'resolved'

export type CatchTool = 'rope' | 'gun'

export type CalledShot = 'hand' | 'knee' | 'chest'

export type ChaseOutcome = 'alive' | 'dead' | 'escaped'

export type ChaseState = {
  place: AlleyPlace
  distance: number
  phase: ChasePhase
  tools: { rope: boolean; gun: boolean }
  theyShot: boolean
  disarmed: boolean
  hobbled: boolean
  wet: boolean
  dryFlask: boolean
  outcome: ChaseOutcome | null
  log: string[]
  ascii: boolean
}

export const CATCH_MS = 3500
export const POWDER_MS = 900
export const ALLEY_LENGTH = 5

export function agilityDifficulty(state: ChaseState): number {
  if (state.hobbled) return 8
  if (state.wet) return 13
  return 11
}

/** Player Luck vs their shot. Wet caps fail more — lower DC, they miss more. */
export function theyFireLuckDifficulty(state: ChaseState): number {
  return state.wet ? 8 : 12
}

/** Player gun called shots. Wet charge is +2 unless the shop flask stayed dry. */
export function gunShotDifficulty(state: ChaseState, shot: CalledShot): number {
  const base = shot === 'chest' ? 14 : 12
  if (state.wet && !state.dryFlask) return base + 2
  return base
}

export const ALLEY_FOR_FRONT: Record<string, AlleyPlace> = {
  jackson_store: 'store_back',
  murphys_barrels: 'barrel_lane',
  kennedy_hole: 'hole_drift',
}

export const ALLEY_LOOK: Record<AlleyPlace, { title: string; ascii: string; wall: string }> = {
  store_back: {
    title: 'Behind the spring-camp store',
    ascii: '||  ||  ||  ||\n||  ##  ##  ||\n||  crates   ||',
    wall: 'canvas and crate-wood. Crates and bottles by the flap. No brick, no warehouse.',
  },
  barrel_lane: {
    title: 'The lane of barrels',
    ascii: '||  o o  o  ||\n||  ===  ==  ||\n||  wine     ||',
    wall: 'French barrels, tent-store canvas, mud underfoot.',
  },
  hole_drift: {
    title: 'The drift off the new hole',
    ascii: '||  /\\  /\\  ||\n||  ##  ##  ||\n||  timber   ||',
    wall: 'Green timber, dark quartz talk, a lamp nobody took.',
  },
}

export function startChase(place: AlleyPlace, wet = false, dryFlask = false): ChaseState {
  const look = ALLEY_LOOK[place]
  return {
    place,
    distance: ALLEY_LENGTH,
    phase: 'run',
    tools: { rope: true, gun: true },
    theyShot: false,
    disarmed: false,
    hobbled: false,
    wet,
    dryFlask,
    outcome: null,
    log: wet
      ? [`The alley. ${look.wall} Rain. The mud takes a foot.${dryFlask ? ' Your flask stayed dry.' : ''}`]
      : [`The alley. ${look.wall}`],
    ascii: true,
  }
}

export function fleshWalls(state: ChaseState): ChaseState {
  if (!state.ascii) return state
  return { ...state, ascii: false, log: [...state.log, 'The walls take paint. Timber. Canvas. 1849.'] }
}

export function stepChase(state: ChaseState, agilityOk: boolean): ChaseState {
  if (state.phase !== 'run') return state
  if (!agilityOk) {
    const slip = Math.min(ALLEY_LENGTH, state.distance + 1)
    return {
      ...state,
      distance: slip,
      log: [...state.log, state.wet ? 'Wet boards. He gains a step.' : 'Mud. He gains a step.'],
    }
  }
  const cut = state.hobbled ? 2 : 1
  const next = Math.max(0, state.distance - cut)
  if (next === 0) {
    return {
      ...state,
      distance: 0,
      phase: 'catch',
      log: [...state.log, 'You have him in the lane. Rope or iron. Seconds.'],
    }
  }
  return { ...state, distance: next, log: [...state.log, 'Closer.'] }
}

/** They fire first and try to take a choice away. One shot only. */
export function theyFire(state: ChaseState, hit: boolean, disable: CatchTool): ChaseState {
  if (state.phase !== 'catch' || state.theyShot) return state
  if (!hit) {
    return {
      ...state,
      theyShot: true,
      log: [...state.log, state.wet
        ? 'A click. Water in the nipple. Both choices hold.'
        : 'Powder. He missed. Both choices hold.'],
    }
  }
  return {
    ...state,
    theyShot: true,
    tools: { ...state.tools, [disable]: false },
    log: [...state.log, disable === 'gun' ? 'He shot the pistol from the crate. Iron is gone.' : 'He cut the coil. The rope is gone.'],
  }
}

export function catchTimeout(state: ChaseState): ChaseState {
  if (state.phase !== 'catch' || !state.theyShot) return state
  return {
    ...state,
    phase: 'resolved',
    outcome: 'escaped',
    log: [...state.log, 'The seconds ran out. He is in the dark again.'],
  }
}

export function chooseTool(
  state: ChaseState,
  tool: CatchTool,
  paperAllowsDead: boolean,
): ChaseState {
  if (state.phase !== 'catch' || !state.theyShot) return state
  if (!state.tools[tool]) {
    return { ...state, log: [...state.log, 'That choice is gone.'] }
  }
  if (tool === 'rope') {
    return {
      ...state,
      phase: 'resolved',
      outcome: 'alive',
      log: [...state.log, 'The rope holds. Alive to the paper.'],
    }
  }
  return {
    ...state,
    phase: 'called',
    log: [...state.log, paperAllowsDead
      ? 'Iron. Hand, knee, or the chest. A Fallout called shot.'
      : 'Iron. The paper says alive. Hand or knee. Not the chest.'],
  }
}

export function calledShot(
  state: ChaseState,
  shot: CalledShot,
  checkOk: boolean,
  paperAllowsDead: boolean,
): ChaseState {
  if (state.phase !== 'called') return state
  if (shot === 'chest') {
    if (!paperAllowsDead) {
      return { ...state, log: [...state.log, 'Your paper says alive. The chest is not yours.'] }
    }
    if (!checkOk) {
      return {
        ...state,
        phase: 'resolved',
        outcome: 'escaped',
        log: [...state.log, 'The shot goes wide. He is gone.'],
      }
    }
    return {
      ...state,
      phase: 'resolved',
      outcome: 'dead',
      log: [...state.log, 'The chest. The paper allowed it. It sits heavy.'],
    }
  }
  if (shot === 'hand') {
    if (!checkOk) {
      return {
        ...state,
        phase: 'resolved',
        outcome: 'escaped',
        log: [...state.log, 'You missed the hand. He fires and runs.'],
      }
    }
    return {
      ...state,
      disarmed: true,
      log: [...state.log, 'The pistol spins out of his hand. If he runs, take the knee.'],
    }
  }
  // knee
  if (!checkOk) {
    return {
      ...state,
      phase: 'resolved',
      outcome: state.disarmed ? 'escaped' : 'escaped',
      log: [...state.log, 'The knee shot misses. He is still running.'],
    }
  }
  if (state.disarmed) {
    return {
      ...state,
      hobbled: true,
      phase: 'resolved',
      outcome: 'alive',
      log: [...state.log, 'Disarmed, then the ankle. He does not run. Alive.'],
    }
  }
  return {
    ...state,
    hobbled: true,
    theyShot: false,
    phase: 'run',
    distance: Math.max(1, Math.min(2, state.distance)),
    log: [...state.log, 'The knee. He limps. Close again.'],
  }
}

export function alleyForFront(frontId: string): AlleyPlace {
  return ALLEY_FOR_FRONT[frontId] ?? 'store_back'
}
