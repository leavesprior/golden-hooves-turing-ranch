import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'West Point ranch stay | Back of Beyond Ranch',
  description:
    'Stay at Back of Beyond Ranch in West Point, Gold Country. 6 bedrooms, sleeps 12, solar Level 2 overnight EV charging, hot tub, 60 acres near Kirkwood.',
  alternates: { canonical: '/rentals' },
  openGraph: {
    title: 'West Point ranch stay | Back of Beyond Ranch',
    description:
      '60-acre house in Gold Country with overnight Level 2 EV charging. Kirkwood about 45 minutes.',
    type: 'website',
  },
}

export default function RentalsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
