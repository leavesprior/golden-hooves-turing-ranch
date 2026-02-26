import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book Your Stay | Back of Beyond Ranch',
  description: 'Book Back of Beyond Ranch in Gold Country, California. 6 bedrooms, sleeps 12, solar EV charging, hot tub, and ranch animals on 10 private acres near Kirkwood ski resort.',
  openGraph: {
    title: 'Book Your Stay | Back of Beyond Ranch',
    description: 'Book Back of Beyond Ranch in Gold Country, California. 6 bedrooms, sleeps 12, solar EV charging, hot tub, and ranch animals on 10 private acres near Kirkwood ski resort.',
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
