import type { Metadata } from 'next'
import Link from 'next/link'
import { PixelCard } from '@/components/pixel'
import { EventShell, EventHero, Prose, WhyStay, BookDirectCTA, GameDeepLink } from './_components'

export const metadata: Metadata = {
  title: 'Events Near Back of Beyond Ranch | Gold Country Lodging 2026',
  description:
    "Where to stay for Gold Country's biggest 2026 events — Ironstone Amphitheatre concerts, the Bear Valley Music Festival, the Amador County Fair, and Grape Stomp & Lumberjack Day. Back of Beyond Ranch, a 6-bedroom forest ranch in West Point, CA. Book direct.",
  alternates: { canonical: '/events' },
  openGraph: {
    title: 'Events Near Back of Beyond Ranch | Gold Country Lodging 2026',
    description:
      'Your forest basecamp for Gold Country’s best weekends — book the whole 6-bedroom ranch, direct, and skip the platform fees.',
    url: 'https://backofbeyondranch.farm/events',
    siteName: 'Back of Beyond Ranch',
    images: [{ url: '/cabin-photos/cabin-3.jpg', width: 1200, height: 800 }],
  },
}

const eventPages: {
  href: string
  title: string
  blurb: string
  when: string
}[] = [
  {
    href: '/events/ironstone-concerts',
    title: '🎸 Ironstone Amphitheatre Concerts 2026',
    blurb:
      'Willie Nelson (Jul 19), Air Supply / Little River Band (Aug 7), Kane Brown (Aug 16), Alison Krauss (Aug 28), Lynyrd Skynyrd (Oct 2). About 50 minutes from Murphys.',
    when: 'Jul – Oct 2026',
  },
  {
    href: '/events/bear-valley-music-festival',
    title: '🎼 Bear Valley Music Festival 2026',
    blurb:
      'A spacious basecamp about 2 hours down the mountain — honest about the drive, ideal for a multi-night stay.',
    when: 'Jul 17 – Aug 2, 2026',
  },
  {
    href: '/events/amador-county-fair',
    title: '🎡 Amador County Fair 2026',
    blurb:
      'In Plymouth, about 45–55 minutes away, with room for the whole family to spread out after a long fair day.',
    when: 'Jul 30 – Aug 2, 2026',
  },
  {
    href: '/events/october-grape-stomp-lumberjack',
    title: '🪓 Grape Stomp & Lumberjack Day Weekend 2026',
    blurb:
      'West Point Lumberjack Day is right in town, with the Calaveras Grape Stomp and Lynyrd Skynyrd close by. Pick a base and stay put.',
    when: 'Oct 2–3, 2026',
  },
]

export default function EventsHubPage() {
  return (
    <EventShell>
      <EventHero
        eyebrow="Gold Country · West Point, CA"
        title="Events Near Back of Beyond Ranch"
        subhead="Your forest basecamp for Gold Country's best weekends — book the whole ranch, direct, and skip the platform fees."
      />

      <div className="mb-10">
        <Prose>
          <p>
            When you were a kid, the tour was the trip — you slept wherever the
            day ended. These days you want the show loud and the night after it
            quiet. Back of Beyond Ranch sits up in the Sierra pines above West
            Point, California: <span className="text-[var(--pixel-gold-light)]">6 bedrooms, 7 beds, sleeps 12</span>,
            with a hot tub, a game room, forest quiet, and overnight EV charging
            that fills your car while you sleep.
          </p>
          <p>Here&apos;s where to stay for the season&apos;s biggest events near the ranch:</p>
        </Prose>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        {eventPages.map((e) => (
          <Link key={e.href} href={e.href} className="block group">
            <PixelCard className="h-full transition-colors group-hover:border-[var(--pixel-gold-mid)]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] leading-relaxed group-hover:text-[var(--pixel-gold-mid)]">
                  {e.title}
                </h2>
              </div>
              <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-forest-light)] mb-3">
                {e.when}
              </p>
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] leading-relaxed">
                {e.blurb}
              </p>
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] mt-4">
                Where to stay →
              </p>
            </PixelCard>
          </Link>
        ))}
      </div>

      <GameDeepLink />
      <WhyStay />
      <BookDirectCTA />

      <hr className="border-t-2 border-[var(--pixel-ui-border)] my-8" />
      <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed text-[var(--pixel-ui-text)] italic">
        However you find us — searching <span className="text-[var(--pixel-gold-light)]">lodging near Ironstone Amphitheatre</span>,
        a <span className="text-[var(--pixel-gold-light)]">large vacation rental in Gold Country</span>, or a
        <span className="text-[var(--pixel-gold-light)]"> place to stay for West Point events</span> — it&apos;s the same
        whole forest ranch waiting for you. Book direct at Back of Beyond Ranch.
      </p>
    </EventShell>
  )
}
