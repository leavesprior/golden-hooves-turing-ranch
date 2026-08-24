import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'At the ranch house | Back of Beyond Ranch',
  description: 'The playable Gold Country map opens from the ranch-house QR. Book a stay or play the Golden Frog Trail from the ranch site.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/explore' },
}

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
