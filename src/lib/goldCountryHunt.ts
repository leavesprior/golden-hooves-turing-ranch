/**
 * Level 3 — the warrant hunt.
 *
 * L2 nails the paper. L3 is the man already gone: a Fallout-2 noir street
 * (show the paper, empty chairs) with Carmen Sandiego cards that point to
 * the next Gold Country town. Play year stays 1849. Local persist only.
 */

export type HuntClueKind = 'talk' | 'search'

export type HuntClue = {
  id: string
  posterId: string
  locationId: string
  kind: HuntClueKind
  sourceId: string
  /** Carmen card — short, all-caps, no anachronism. */
  card: string
  /** Next town the card points at. */
  pointsTo: string
  /** Noir line the source actually says. */
  voice: string
}

export type HuntTrail = {
  posterId: string
  hideNpcId: string
  hideFrontId: string
  hideLocationId: string
  emptyChair: string
  clues: readonly [HuntClue, HuntClue, HuntClue]
}

export const HUNT_NEED = 3
export const HUNT_CLUE_KEY = 'bobr_l3_hunt_clues'

export const HUNT_TRAILS: readonly HuntTrail[] = [
  {
    posterId: 'poster_lamp_shy',
    hideNpcId: 'ridge_stranger',
    hideFrontId: 'jackson_store',
    hideLocationId: 'jackson',
    emptyChair: 'The back table is empty. A lamp sits unbought. The chair is still warm.',
    clues: [
      {
        id: 'hunt_lamp_thorn',
        posterId: 'poster_lamp_shy',
        locationId: 'jackson',
        kind: 'talk',
        sourceId: 'sheriff_thorn',
        card: 'LEFT AT FIRST LIGHT · MURPHYS ROAD · NO LAMP',
        pointsTo: 'murphys',
        voice: 'He was at Abe’s back table. First light he was gone. Riders saw a lean man on the Murphys road. Would not take a lamp.',
      },
      {
        id: 'hunt_lamp_pierre',
        posterId: 'poster_lamp_shy',
        locationId: 'murphys',
        kind: 'talk',
        sourceId: 'vintner_pierre',
        card: 'PAID COIN · ASKED THE RIDGE ABOVE BOTILLEAS',
        pointsTo: 'kennedy_mine',
        voice: 'A lean fellow. Coin, never dust. He would not drink. He asked the way to the ridge above the spring.',
      },
      {
        id: 'hunt_lamp_mae',
        posterId: 'poster_lamp_shy',
        locationId: 'kennedy_mine',
        kind: 'talk',
        sourceId: 'mae_evans',
        card: 'BROTHER IN THE HOLE · HE CIRCLES BACK TO ABE’S STORE',
        pointsTo: 'jackson',
        voice: 'His brother is in the hole. The lean one comes back to Abe’s when the rain comes. He will not take a lamp.',
      },
    ],
  },
  {
    posterId: 'poster_watered_barrel',
    hideNpcId: 'barrel_cutter',
    hideFrontId: 'murphys_barrels',
    hideLocationId: 'murphys',
    emptyChair: 'Wine on the floorboards. No stout man. The barrels keep their own counsel.',
    clues: [
      {
        id: 'hunt_barrel_walsh',
        posterId: 'poster_watered_barrel',
        locationId: 'murphys',
        kind: 'talk',
        sourceId: 'deputy_walsh',
        card: 'STOUT · WINE CUFFS · RAN TOWARD THE MOANING HOLE',
        pointsTo: 'moaning_cavern',
        voice: 'Dust from under a pillow. Stout, wine on the cuffs. He ran for the moaning hole. The alcalde wants him living.',
      },
      {
        id: 'hunt_barrel_hector',
        posterId: 'poster_watered_barrel',
        locationId: 'moaning_cavern',
        kind: 'talk',
        sourceId: 'cave_guide_hector',
        card: 'WOULD NOT TAKE THE ROPE · ASKED FOR SOLDIERS GULCH',
        pointsTo: 'volcano',
        voice: 'Stout. Would not take the rope. Wine on the cuffs. He asked the way to Soldiers Gulch. Said the alcalde could wait.',
      },
      {
        id: 'hunt_barrel_bell',
        posterId: 'poster_watered_barrel',
        locationId: 'volcano',
        kind: 'talk',
        sourceId: 'volcano_saloon_bell',
        card: 'PAID COIN · SAID HE SLEEPS BY THE BARRELS',
        pointsTo: 'murphys',
        voice: 'Stout, wine cuffs, paid coin. He said he sleeps by Pierre’s barrels. Always the barrels.',
      },
    ],
  },
  {
    posterId: 'poster_off_roll',
    hideNpcId: 'off_roll_stranger',
    hideFrontId: 'kennedy_hole',
    hideLocationId: 'kennedy_mine',
    emptyChair: 'Green timber. No man off the roll. Dust on the cuff of the dark, and nothing in it.',
    clues: [
      {
        id: 'hunt_roll_giuseppe',
        posterId: 'poster_off_roll',
        locationId: 'kennedy_mine',
        kind: 'talk',
        sourceId: 'old_miner_giuseppe',
        card: 'LEFT WHEN THE PAPER WENT UP · ASKED MAE THE WAY TO BOTILLEAS',
        pointsTo: 'jackson',
        voice: 'Not on the roll. Dust in the cuffs. He left when Harris nailed the paper. Asked Mae the way to the spring camp.',
      },
      {
        id: 'hunt_roll_abe',
        posterId: 'poster_off_roll',
        locationId: 'jackson',
        kind: 'talk',
        sourceId: 'jackson_store_abe',
        card: 'BOUGHT NO LAMP · ASKED AFTER HIS BROTHER · RODE FOR THE SIXTEEN-FOOT HILL',
        pointsTo: 'mokelumne_hill',
        voice: 'A man from the ridge bought no lamp. Asked after a brother. Rode toward the hill where claims are sixteen feet.',
      },
      {
        id: 'hunt_roll_edgar',
        posterId: 'poster_off_roll',
        locationId: 'mokelumne_hill',
        kind: 'talk',
        sourceId: 'ghost_hunter_edgar',
        card: 'IN THE CELLAR · SAID THE PARTNERS WOULD NOT FOLLOW · BACK TO THE HOLE AT NIGHT',
        pointsTo: 'kennedy_mine',
        voice: 'Lamp-shy in the cellar. He said the partners would not cross the river. He goes back to the hole when it is dark.',
      },
    ],
  },
]

export function trailForPoster(posterId: string): HuntTrail | undefined {
  return HUNT_TRAILS.find((t) => t.posterId === posterId)
}

export function trailForHideNpc(npcId: string): HuntTrail | undefined {
  return HUNT_TRAILS.find((t) => t.hideNpcId === npcId)
}

type StorageLike = { getItem(k: string): string | null; setItem?(k: string, v: string): void }

function parseIds(raw: string | null): string[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function readHuntClues(storage?: StorageLike | null): string[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  return parseIds(s?.getItem(HUNT_CLUE_KEY) ?? null)
}

export function replaceHuntClues(ids: string[], storage?: StorageLike | null): string[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  const next = Array.from(new Set(ids.filter((x) => typeof x === 'string')))
  try { s?.setItem?.(HUNT_CLUE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return next
}

export function writeHuntClue(id: string, storage?: StorageLike | null): string[] {
  return replaceHuntClues([...readHuntClues(storage), id], storage)
}

export type HuntStatus = {
  posterId: string
  have: number
  need: number
  hot: boolean
  served: boolean
  inWind: boolean
  cards: HuntClue[]
  nextClue?: HuntClue
  nextLocationId?: string
}

export function huntStatus(
  posterId: string,
  takenIds: readonly string[],
  arrests: readonly string[],
  collected: readonly string[],
): HuntStatus | null {
  const trail = trailForPoster(posterId)
  if (!trail) return null
  const served = arrests.includes(trail.hideNpcId)
  const taken = takenIds.includes(posterId)
  const cards = trail.clues.filter((c) => collected.includes(c.id))
  const have = cards.length
  const hot = served || (taken && have >= HUNT_NEED)
  const inWind = taken && !hot && !served
  const nextClue = trail.clues.find((c) => !collected.includes(c.id))
  return {
    posterId,
    have,
    need: HUNT_NEED,
    hot,
    served,
    inWind,
    cards,
    nextClue,
    nextLocationId: nextClue?.locationId ?? (hot && !served ? trail.hideLocationId : undefined),
  }
}

export function huntIsHot(
  posterId: string,
  takenIds: readonly string[],
  arrests: readonly string[],
  collected: readonly string[],
): boolean {
  return huntStatus(posterId, takenIds, arrests, collected)?.hot === true
}

export function npcInWind(
  npcId: string,
  takenIds: readonly string[],
  arrests: readonly string[],
  collected: readonly string[],
): boolean {
  const trail = trailForHideNpc(npcId)
  if (!trail) return false
  return huntStatus(trail.posterId, takenIds, arrests, collected)?.inWind === true
}

export function emptyChairForFront(
  frontId: string,
  takenIds: readonly string[],
  arrests: readonly string[],
  collected: readonly string[],
): string | null {
  for (const trail of HUNT_TRAILS) {
    if (trail.hideFrontId !== frontId) continue
    const st = huntStatus(trail.posterId, takenIds, arrests, collected)
    if (st?.inWind) return trail.emptyChair
  }
  return null
}

export function paperClueAt(
  sourceId: string,
  takenIds: readonly string[],
  arrests: readonly string[],
  collected: readonly string[],
): HuntClue | undefined {
  for (const trail of HUNT_TRAILS) {
    if (!takenIds.includes(trail.posterId)) continue
    if (arrests.includes(trail.hideNpcId)) continue
    const clue = trail.clues.find((c) => c.sourceId === sourceId && !collected.includes(c.id))
    if (clue) return clue
  }
  return undefined
}

export function showPaperTo(
  sourceId: string,
  takenIds: readonly string[],
  arrests: readonly string[],
  storage?: StorageLike | null,
): HuntClue | null {
  const collected = readHuntClues(storage)
  const clue = paperClueAt(sourceId, takenIds, arrests, collected)
  if (!clue) return null
  writeHuntClue(clue.id, storage)
  return clue
}

export function huntTowns(
  takenIds: readonly string[],
  arrests: readonly string[],
  collected: readonly string[],
): string[] {
  const ids = new Set<string>()
  for (const posterId of takenIds) {
    const st = huntStatus(posterId, takenIds, arrests, collected)
    if (!st || st.served) continue
    if (st.nextLocationId) ids.add(st.nextLocationId)
  }
  return Array.from(ids)
}

export function activeHuntStatuses(
  takenIds: readonly string[],
  arrests: readonly string[],
  collected: readonly string[],
): HuntStatus[] {
  return takenIds
    .map((id) => huntStatus(id, takenIds, arrests, collected))
    .filter((s): s is HuntStatus => !!s)
}

/** Level 3 is complete when at least one taken warrant has been served. */
export function huntLevelComplete(
  takenIds: readonly string[],
  arrests: readonly string[],
  collected: readonly string[],
): boolean {
  return activeHuntStatuses(takenIds, arrests, collected).some((h) => h.served)
}

/** Same amount as characterContext XP_REWARDS.OUTLAW_CAPTURED. One-shot per hide. */
export const CAPTURE_XP = 100

export function captureXpKey(npcId: string): string {
  return `bobr_capture_xp_${npcId}`
}

export function grantCaptureXp(
  npcId: string,
  addExperience: (amount: number) => void,
  storage?: { getItem(key: string): string | null; setItem(key: string, value: string): void } | null,
): number {
  if (!npcId) return 0
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  if (!s) return 0
  const key = captureXpKey(npcId)
  if (s.getItem(key)) return CAPTURE_XP
  addExperience(CAPTURE_XP)
  try { s.setItem(key, String(CAPTURE_XP)) } catch { /* ignore */ }
  return CAPTURE_XP
}
