import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Play | Back of Beyond Ranch',
  description: 'Golden Frog Trail — an 1849 expedition. The towns are real. Play first; the rest of the land waits behind it.',
  openGraph: {
    title: 'Play | Back of Beyond Ranch',
    description: 'Golden Frog Trail — an 1849 expedition. The towns are real. Play first; the rest of the land waits behind it.',
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
