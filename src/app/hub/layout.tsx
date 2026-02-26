import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Game Hub | Back of Beyond Ranch',
  description: 'Your adventure command center at Back of Beyond Ranch. Access the Golden Frog Trail, Oregon Trail game, karma wallet, leaderboard, and all interactive experiences.',
  openGraph: {
    title: 'Game Hub | Back of Beyond Ranch',
    description: 'Your adventure command center at Back of Beyond Ranch. Access the Golden Frog Trail, Oregon Trail game, karma wallet, leaderboard, and all interactive experiences.',
    type: 'website',
  },
}

export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
