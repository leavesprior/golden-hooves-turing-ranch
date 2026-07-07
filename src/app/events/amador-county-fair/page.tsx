import type { Metadata } from 'next'
import { PixelCard } from '@/components/pixel'
import {
  EventShell,
  EventHero,
  Prose,
  WhyStay,
  BookDirectCTA,
  GameDeepLink,
  ClosingSeo,
  Disclaimer,
} from '../_components'

export const metadata: Metadata = {
  title: 'Lodging Near the Amador County Fair 2026 | Back of Beyond Ranch',
  description:
    'Where to stay for the Amador County Fair 2026 (Jul 30 – Aug 2) in Plymouth, CA — a 6-bedroom forest ranch about 45-55 minutes away in West Point. Sleeps 12, hot tub, game room, overnight EV charging. Book direct, no platform fees.',
  alternates: { canonical: '/events/amador-county-fair' },
  openGraph: {
    title: 'Where to Stay for the Amador County Fair 2026',
    description:
      'Room for the whole family to spread out after a long fair day — a 6-bedroom forest ranch about 45–55 minutes from the fairgrounds. Book direct.',
    url: 'https://backofbeyondranch.farm/events/amador-county-fair',
    siteName: 'Back of Beyond Ranch',
    images: [{ url: '/cabin-photos/cabin-3.jpg', width: 1200, height: 800 }],
  },
}

const details: { label: string; value: string }[] = [
  { label: 'Event', value: 'Amador County Fair 2026' },
  { label: 'Dates', value: 'July 30 – August 2, 2026' },
  { label: 'Venue', value: 'Amador County Fairgrounds, Plymouth, California' },
  { label: 'Drive from the ranch', value: '~45–55 minutes' },
]

export default function AmadorCountyFairPage() {
  return (
    <EventShell>
      <EventHero
        eyebrow="~45–55 min from Plymouth"
        title="Where to Stay for the Amador County Fair 2026"
        subhead="Room for the whole family to spread out after a long fair day — a 6-bedroom forest ranch about 45–55 minutes from the fairgrounds. Book direct."
      />

      <div className="mb-10">
        <Prose>
          <p>
            When you were a kid, the fair was the whole world for a weekend — corn
            dogs, carnival lights, the works. Now you&apos;re the one bringing the
            crew, and after a full day of it, everyone needs somewhere real to
            land. Somewhere the kids, the grandparents, and the cousins all get
            their own spot. You&apos;ve earned the calm.
          </p>
          <p>
            Back of Beyond Ranch is that landing spot — about
            <span className="text-[var(--pixel-gold-light)]"> 45 to 55 minutes</span> up in the Sierra forest from the
            fairgrounds in Plymouth. Close enough for a few days of fair, far
            enough to actually rest.
          </p>
        </Prose>
      </div>

      <PixelCard title="🎡 The Fair" className="mb-2">
        <dl className="space-y-3">
          {details.map((d) => (
            <div key={d.label} className="flex flex-col sm:flex-row sm:gap-3">
              <dt className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] sm:w-48 shrink-0">
                {d.label}
              </dt>
              <dd className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] leading-relaxed">
                {d.value}
              </dd>
            </div>
          ))}
        </dl>
        <Disclaimer>
          Check gate times, ticket info, and the daily schedule on the fair&apos;s official site before you go.
        </Disclaimer>
      </PixelCard>

      <div className="mb-10" />
      <WhyStay />

      <div className="mb-10">
        <Prose>
          <p>
            Good with kids: the rubber duck in the hot tub is very popular with
            the little ones. (The Gold Country UFO stories we save for the
            grown-ups.) Book the whole ranch and let it be the family&apos;s peaceful
            home base for the fair weekend.
          </p>
        </Prose>
      </div>

      <GameDeepLink />
      <BookDirectCTA />

      <ClosingSeo>
        Searching for <span className="text-[var(--pixel-gold-light)]">lodging near the Amador County Fair</span>,
        a <span className="text-[var(--pixel-gold-light)]">family vacation rental near Plymouth, CA</span>, or a
        <span className="text-[var(--pixel-gold-light)]"> place to stay near the Amador Fairgrounds</span>? Back of Beyond
        Ranch in West Point is the whole forest ranch — plenty of room for the whole crew.
      </ClosingSeo>
    </EventShell>
  )
}
