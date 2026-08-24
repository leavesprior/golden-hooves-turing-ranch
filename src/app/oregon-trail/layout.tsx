import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Golden Frog Trail | Back of Beyond Ranch',
  description: 'Play the Golden Frog Trail for the first discount — an 1849 wagon west from Independence. Kansas keeps a Bridge of Death. Book on Airbnb, or play from Back of Beyond Ranch.',
  openGraph: {
    title: 'Golden Frog Trail | Back of Beyond Ranch',
    description: 'Play the Golden Frog Trail for the first discount — an 1849 wagon west from Independence. Kansas keeps a Bridge of Death.',
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
