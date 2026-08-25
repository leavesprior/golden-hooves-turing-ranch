/**
 * Level 2 — Explore the Gold Country.
 *
 * Reuses gold_country_explore / location / travel. Each case is a real
 * Calaveras/Amador place already in GOLD_COUNTRY_LOCATIONS, mapped onto a
 * game already on this site (Oregon Trail fort, Carmen HQ, WITW witness,
 * Diggings, warrant, Dirk Gently, Doctor Who time-slip).
 *
 * Visit goal: 5 of 8 cases. Cabin is the HQ (Oregon Trail fort analog).
 */

export type Level2Case = {
  id: string
  title: string
  example: string
  verb: string
}

export const LEVEL2_CASES: readonly Level2Case[] = [
  {
    id: 'bobr_cabin',
    title: 'Ranch HQ',
    example: 'Oregon Trail fort / Carmen Sandiego bureau',
    verb: 'Set camp. The Gold Country map opens from the porch.',
  },
  {
    id: 'angels_camp',
    title: 'The jumping frog',
    example: 'Oregon Trail town + Twain',
    verb: 'Investigate the hotel where Twain heard the frog.',
  },
  {
    id: 'murphys',
    title: 'Black Bart’s register',
    example: 'Where in Time witness',
    verb: 'Read who signed the Murphys Hotel book.',
  },
  {
    id: 'volcano',
    title: 'Cobblestone theatre',
    example: 'Diggings chapter 2',
    verb: 'Walk the 1850s town. The play is still running.',
  },
  {
    id: 'kennedy_mine',
    title: 'The Argonaut fire',
    example: 'Adventure ch4 mine mystery',
    verb: 'Follow the warrant into the Kennedy / Argonaut shafts.',
  },
  {
    id: 'jackson',
    title: 'National Hotel noir',
    example: 'Sandiego chase town',
    verb: 'A decoy trail runs Main Street.',
  },
  {
    id: 'mokelumne_hill',
    title: 'Holistic coincidence',
    example: 'Dirk Gently',
    verb: 'The hill, the river, and the ranch are the same case.',
  },
  {
    id: 'moaning_cavern',
    title: 'Time-slip chamber',
    example: 'Doctor Who',
    verb: 'The chamber is 13,000 years deep. Something slipped.',
  },
] as const

export const LEVEL2_VISIT_GOAL = 5

export const LEVEL2_CASE_IDS: readonly string[] = LEVEL2_CASES.map((c) => c.id)

export function caseForLocation(locationId: string): Level2Case | undefined {
  return LEVEL2_CASES.find((c) => c.id === locationId)
}

export function level2Progress(discoveredIds: readonly string[]): {
  visited: string[]
  remaining: string[]
  count: number
  goal: number
  complete: boolean
} {
  const have = new Set(discoveredIds)
  const visited = LEVEL2_CASE_IDS.filter((id) => have.has(id))
  const remaining = LEVEL2_CASE_IDS.filter((id) => !have.has(id))
  return {
    visited,
    remaining,
    count: visited.length,
    goal: LEVEL2_VISIT_GOAL,
    complete: visited.length >= LEVEL2_VISIT_GOAL,
  }
}
