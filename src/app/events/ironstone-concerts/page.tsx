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
  title: 'Lodging Near Ironstone Amphitheatre 2026 | Back of Beyond Ranch',
  description:
    'Where to stay for Ironstone Amphitheatre concerts in 2026 — a 6-bedroom forest ranch in West Point, CA, about 50 minutes from Murphys. Sleeps 12, hot tub, overnight EV charging. Book direct, no platform fees.',
  alternates: { canonical: '/events/ironstone-concerts' },
  openGraph: {
    title: 'Where to Stay for Ironstone Amphitheatre Concerts 2026',
    description:
      'A private 6-bedroom ranch in the Sierra forest, about 50 minutes from the amphitheatre — book direct and skip the late drive home.',
    url: 'https://backofbeyondranch.farm/events/ironstone-concerts',
    siteName: 'Back of Beyond Ranch',
    images: [{ url: '/cabin-photos/cabin-3.jpg', width: 1200, height: 800 }],
  },
}

const shows: { show: string; date: string; venue: string }[] = [
  { show: 'Willie Nelson & Family', date: 'Sun, Jul 19, 2026', venue: 'Ironstone Amphitheatre, Murphys' },
  { show: 'Air Supply / Little River Band', date: 'Fri, Aug 7, 2026', venue: 'Ironstone Amphitheatre, Murphys' },
  { show: 'Kane Brown', date: 'Sun, Aug 16, 2026', venue: 'Ironstone Amphitheatre, Murphys' },
  { show: 'Alison Krauss', date: 'Fri, Aug 28, 2026', venue: 'Ironstone Amphitheatre, Murphys' },
  { show: 'Lynyrd Skynyrd', date: 'Fri, Oct 2, 2026', venue: 'Ironstone Amphitheatre, Murphys' },
]

export default function IronstoneConcertsPage() {
  return (
    <EventShell>
      <EventHero
        eyebrow="~50 min from Murphys"
        title="Where to Stay for Ironstone Amphitheatre Concerts 2026"
        subhead="A private 6-bedroom ranch in the Sierra forest, about 50 minutes from the amphitheatre — book direct and skip the late drive home."
      />

      <div className="mb-10">
        <Prose>
          <p>
            When you were a kid, the tour <span className="text-[var(--pixel-gold-light)]">was</span> the trip.
            You lived in the van, roughed it on the road, slept wherever the band
            slept. Beautiful chaos. These days, after the encore, you want
            somewhere quiet to rest your head — and you&apos;ve earned it.
          </p>
          <p>
            That&apos;s what Back of Beyond Ranch is for. It sits about 50 minutes up
            in the pines above Gold Country, an honest half-hour-and-change from
            the Ironstone gates in Murphys — close enough to catch every show,
            far enough that the night after is nothing but forest quiet.
          </p>
        </Prose>
      </div>

      <PixelCard title="🎸 Ironstone Amphitheatre 2026 Shows" className="mb-2">
        <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] leading-relaxed mb-4">
          Ironstone Amphitheatre is in <span className="text-[var(--pixel-gold-light)]">Murphys, California — about a 50-minute drive from the ranch.</span> Here&apos;s the 2026 lineup we host guests for:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-[var(--font-pixel)] text-[8px]">
            <thead>
              <tr className="text-[var(--pixel-gold-light)] text-left">
                <th className="border-b-2 border-[var(--pixel-ui-border)] pb-2 pr-3">Show</th>
                <th className="border-b-2 border-[var(--pixel-ui-border)] pb-2 pr-3">Date</th>
                <th className="border-b-2 border-[var(--pixel-ui-border)] pb-2">Venue</th>
              </tr>
            </thead>
            <tbody>
              {shows.map((s) => (
                <tr key={s.show} className="align-top text-[var(--pixel-ui-text)]">
                  <td className="border-b border-[var(--pixel-ui-border)]/40 py-2 pr-3 text-[var(--pixel-gold-light)]">{s.show}</td>
                  <td className="border-b border-[var(--pixel-ui-border)]/40 py-2 pr-3">{s.date}</td>
                  <td className="border-b border-[var(--pixel-ui-border)]/40 py-2">{s.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Disclaimer>
          Please double-check show times and any lineup changes on the venue&apos;s official calendar before you book travel.
        </Disclaimer>
      </PixelCard>

      <div className="mb-10" />
      <WhyStay />

      <div className="mb-10">
        <Prose>
          <p>
            Book the whole ranch and make a weekend of it. Outlaw country, soft
            rock, bluegrass, Southern rock — whatever&apos;s on the bill, the base
            stays the same.
          </p>
        </Prose>
      </div>

      <GameDeepLink />
      <BookDirectCTA />

      <ClosingSeo>
        Searching for <span className="text-[var(--pixel-gold-light)]">lodging near Ironstone Amphitheatre</span>,
        a <span className="text-[var(--pixel-gold-light)]">vacation rental near Murphys, CA</span>, or a
        <span className="text-[var(--pixel-gold-light)]"> place to stay for Willie Nelson / Kane Brown / Alison Krauss at Ironstone</span>?
        Back of Beyond Ranch in West Point is built for exactly that — the whole
        forest ranch, yours for the weekend.
      </ClosingSeo>
    </EventShell>
  )
}
