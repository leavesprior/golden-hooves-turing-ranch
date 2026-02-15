/**
 * NPC Legend Entries for Hall of Fame
 *
 * Themed game-world characters that appear alongside real players.
 * Visually distinct with italic names and "(Legend)" tag.
 */

export interface LeaderboardEntry {
  rank?: number
  playerName: string
  playerId: string
  score: number
  trophyCount: number
  trophies: string[]
  chapter: number
  level: number
  alignment?: string
  topFaction?: string
  timeEchoes?: number
  isNPC: boolean
  submittedAt?: string
}

export const NPC_LEGENDS: LeaderboardEntry[] = [
  {
    playerName: 'Black Bart',
    playerId: 'npc_black_bart',
    score: 3200,
    trophyCount: 8,
    trophies: ['king_of_outlaws', 'wild_card', 'wanted_dead_alive', 'journeys_end', 'ghost_of_trail', 'seasoned_prospector', 'bounty_hunter', 'echo_hunter'],
    chapter: 5,
    level: 12,
    alignment: 'Chaotic Evil',
    topFaction: 'outlaws',
    timeEchoes: 3,
    isNPC: true,
  },
  {
    playerName: 'Captain Shaw',
    playerId: 'npc_captain_shaw',
    score: 2800,
    trophyCount: 7,
    trophies: ['pinkertons_finest', 'upstanding_citizen', 'karma_saint', 'journeys_end', 'master_frontier', 'pure_detective', 'bounty_hunter'],
    chapter: 5,
    level: 11,
    alignment: 'Lawful Good',
    topFaction: 'pinkerton',
    timeEchoes: 2,
    isNPC: true,
  },
  {
    playerName: 'Cynthia "Goldfinger" Marsh',
    playerId: 'npc_cynthia_marsh',
    score: 2600,
    trophyCount: 6,
    trophies: ['saddle_master', 'master_frontier', 'journeys_end', 'gold_rush_legend', 'settlers_champion', 'seasoned_prospector'],
    chapter: 5,
    level: 14,
    alignment: 'Neutral Good',
    topFaction: 'settlers',
    timeEchoes: 1,
    isNPC: true,
  },
  {
    playerName: 'Running Deer',
    playerId: 'npc_running_deer',
    score: 2400,
    trophyCount: 6,
    trophies: ['friend_of_tribes', 'time_traveler', 'echo_hunter', 'journeys_end', 'karma_saint', 'upstanding_citizen'],
    chapter: 5,
    level: 9,
    alignment: 'Lawful Good',
    topFaction: 'natives',
    timeEchoes: 6,
    isNPC: true,
  },
  {
    playerName: 'Joaquin Murrieta',
    playerId: 'npc_joaquin_murrieta',
    score: 2200,
    trophyCount: 5,
    trophies: ['wild_card', 'bounty_hunter', 'ghost_of_trail', 'the_reckoning', 'into_wilderness'],
    chapter: 4,
    level: 8,
    alignment: 'Chaotic Good',
    topFaction: 'outlaws',
    timeEchoes: 2,
    isNPC: true,
  },
]
