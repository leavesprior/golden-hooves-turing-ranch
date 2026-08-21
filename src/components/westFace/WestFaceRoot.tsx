'use client'

import { usePathname } from 'next/navigation'

/** Game routes that wear the Where-in-the-West paper chrome. Rental/marketing pages stay pixel/site. */
const GAME_PREFIXES = [
  '/oregon-trail',
  '/adventure',
  '/clue',
  '/clue-game',
  '/clue-preview',
  '/explore',
  '/prologue',
  '/playtest',
  '/ranch-treasure-hunt',
  '/game',
  '/hub',
  '/town',
  '/karma-market',
  '/dm-table',
  '/pixel-preview',
  '/investigations',
  '/leaderboard',
  '/certificate',
]

function isGamePath(path: string): boolean {
  return GAME_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export function WestFaceRoot({ children }: { children: React.ReactNode }) {
  const path = usePathname() || ''
  if (!isGamePath(path)) return <>{children}</>
  return (
    <div className="west-face-shell visual64-shell" data-west-face="grok-web">
      {children}
    </div>
  )
}
