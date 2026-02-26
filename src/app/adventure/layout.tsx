import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gold Country Adventure | Back of Beyond Ranch',
  description: 'Embark on the Golden Frog Trail adventure at Back of Beyond Ranch. Explore Gold Rush stories, earn karma, and unlock real rewards during your California mountain getaway.',
  openGraph: {
    title: 'Gold Country Adventure | Back of Beyond Ranch',
    description: 'Embark on the Golden Frog Trail adventure at Back of Beyond Ranch. Explore Gold Rush stories, earn karma, and unlock real rewards during your California mountain getaway.',
    type: 'website',
  },
}

export default function AdventureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
