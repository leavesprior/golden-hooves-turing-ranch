import type { CharacterBackground } from '../characterContext'

export interface PlayerBackgroundPortrait {
  src: string
  label: string
  emoji: string
}

/** Fictional player-role art. Separate from named NPCs and their placeholder map. */
export const PLAYER_BACKGROUND_PORTRAITS: Readonly<Record<CharacterBackground, PlayerBackgroundPortrait>> = {
  pinkerton_veteran: { src: '/sprites/player-backgrounds/pinkerton_veteran.png', label: 'Pinkerton Veteran', emoji: '🕵' },
  frontier_scout: { src: '/sprites/player-backgrounds/frontier_scout.png', label: 'Frontier Scout', emoji: '🎯' },
  army_officer: { src: '/sprites/player-backgrounds/army_officer.png', label: 'Army Officer', emoji: '⚔' },
  gambler: { src: '/sprites/player-backgrounds/gambler.png', label: 'Gambler', emoji: '🃏' },
  doctor: { src: '/sprites/player-backgrounds/doctor.png', label: 'Doctor', emoji: '⚕' },
  preacher: { src: '/sprites/player-backgrounds/preacher.png', label: 'Preacher', emoji: '✝' },
  outlaw_reformed: { src: '/sprites/player-backgrounds/outlaw_reformed.png', label: 'Reformed Outlaw', emoji: '🎭' },
}

export function getPlayerBackgroundPortrait(background?: string | null): PlayerBackgroundPortrait | undefined {
  if (!background || !Object.hasOwn(PLAYER_BACKGROUND_PORTRAITS, background)) return undefined
  return PLAYER_BACKGROUND_PORTRAITS[background as CharacterBackground]
}

