import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Prospector's Tale - Oregon Trail Game | Back of Beyond Ranch",
  description: "Play Prospector's Tale, a Gold Rush-era Oregon Trail adventure. Make moral choices, build karma, and survive the journey to California. Based at Back of Beyond Ranch.",
  openGraph: {
    title: "Prospector's Tale - Oregon Trail Game | Back of Beyond Ranch",
    description: "Play Prospector's Tale, a Gold Rush-era Oregon Trail adventure. Make moral choices, build karma, and survive the journey to California. Based at Back of Beyond Ranch.",
    type: 'website',
  },
}

export default function OregonTrailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
