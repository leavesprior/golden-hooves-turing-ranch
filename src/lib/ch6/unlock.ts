/**
 * Chapter 6 unlock. The flag is written when the chapter-5 ranch finale shows
 * ClueGameUnlock (Cynthia → QR hunt → discount). Chapter 6 comes AFTER that
 * guest path and never replaces or delays it.
 */
export const CH6_UNLOCK_FLAG = 'ch6_unlocked'

/** The flag list with the Chapter 6 flag added once. Never mutates its input. */
export function withCh6Unlocked(flags: readonly string[] | undefined): string[] {
  const list = [...(flags ?? [])]
  return list.includes(CH6_UNLOCK_FLAG) ? list : [...list, CH6_UNLOCK_FLAG]
}
