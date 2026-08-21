import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Overnight EV charging in West Point | Back of Beyond Ranch',
  description:
    'Solar Level 2 (220V) J1772 overnight charging in West Point, Calaveras County. Tesla adapter on site. Not a Supercharger — a bed and a full battery by morning, 45 minutes from Kirkwood.',
  keywords: [
    'EV charger cabin West Point',
    'Tesla overnight charging Gold Country',
    'last minute stay Kirkwood EV',
    'Level 2 charger Calaveras',
  ],
  openGraph: {
    title: 'Overnight EV charging in West Point',
    description: 'Solar Level 2 overnight charge plus a bed in Gold Country. Not a Supercharger.',
    url: 'https://backofbeyondranch.farm/stay',
  },
}

export default function StayLayout({ children }: { children: React.ReactNode }) {
  return children
}
