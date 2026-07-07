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
  title: 'Lodging for the Bear Valley Music Festival 2026 | Back of Beyond Ranch',
  description:
    'Where to stay for the Bear Valley Music Festival 2026 (Jul 17 – Aug 2) — a spacious 6-bedroom forest ranch basecamp about 2 hours away in West Point, CA. Sleeps 12, hot tub, baby grand, overnight EV charging. Book direct, no platform fees.',
  alternates: { canonical: '/events/bear-valley-music-festival' },
  openGraph: {
    title: 'Where to Stay for the Bear Valley Music Festival 2026',
    description:
      'A spacious 6-bedroom forest basecamp for music lovers doing more than one program — book direct, settle in for a few nights.',
    url: 'https://backofbeyondranch.farm/events/bear-valley-music-festival',
    siteName: 'Back of Beyond Ranch',
    images: [{ url: '/cabin-photos/cabin-3.jpg', width: 1200, height: 800 }],
  },
}

const details: { label: string; value: string }[] = [
  { label: 'Event', value: 'Bear Valley Music Festival 2026' },
  { label: 'Dates', value: 'July 17 – August 2, 2026 (three weekends of programs)' },
  { label: 'Venue', value: 'Bear Valley, California' },
  { label: 'Drive from the ranch', value: '~2 hours (a scenic Sierra drive — plan for it, and make it part of the trip)' },
]

export default function BearValleyPage() {
  return (
    <EventShell>
      <EventHero
        eyebrow="~2 hours away · a multi-night basecamp"
        title="Where to Stay for the Bear Valley Music Festival 2026"
        subhead="A spacious 6-bedroom forest basecamp for music lovers doing more than one program — book direct, settle in for a few nights."
      />

      <div className="mb-10">
        <Prose>
          <p>
            When you were a kid, roughing it near the music was half the point.
            Now, when you&apos;re catching a whole festival across several days, you
            want a real basecamp to come home to — not a cramped room. Somewhere
            the whole group can spread out, cook a proper breakfast, and rest well
            between programs. You&apos;ve earned that.
          </p>
          <p>
            Back of Beyond Ranch is that base. Let&apos;s be honest up front: it&apos;s
            <span className="text-[var(--pixel-gold-light)]"> about two hours down the mountain from Bear Valley</span> — this
            isn&apos;t a quick hop. But that drive is part of the ritual: mountain
            roads out, and a house that&apos;s genuinely quiet when you come back to it.
          </p>
        </Prose>
      </div>

      <PixelCard title="🎼 The Festival" className="mb-2">
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
          Confirm program times and dates on the festival&apos;s official schedule before booking travel.
        </Disclaimer>
      </PixelCard>

      <div className="mb-10" />
      <WhyStay />

      <div className="mb-10">
        <Prose>
          <p>
            Because it&apos;s a longer drive, this one works best as a
            <span className="text-[var(--pixel-gold-light)]"> multi-night stay</span>: pick your programs, settle in, and let
            the ranch be the calm at the center of a full festival weekend. A
            rubber duck keeps watch from the hot tub; the dark Gold Country sky
            handles the stargazing.
          </p>
        </Prose>
      </div>

      <GameDeepLink />
      <BookDirectCTA />

      <ClosingSeo>
        Looking for <span className="text-[var(--pixel-gold-light)]">lodging for the Bear Valley Music Festival</span>,
        a <span className="text-[var(--pixel-gold-light)]">large group vacation rental in the Sierra / Gold Country</span>, or a
        <span className="text-[var(--pixel-gold-light)]"> festival basecamp near Bear Valley, CA</span>? Back of Beyond Ranch
        in West Point gives you the whole forest ranch for a genuinely restful few nights.
      </ClosingSeo>
    </EventShell>
  )
}
