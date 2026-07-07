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
  title: 'Lodging for Grape Stomp & Lumberjack Day 2026 | Back of Beyond Ranch',
  description:
    'Where to stay for Grape Stomp & Lumberjack Day weekend 2026 (Oct 2-3) — West Point Lumberjack Day is right in town, and the Calaveras Grape Stomp plus Lynyrd Skynyrd at Ironstone are close by. A 6-bedroom forest ranch in West Point, CA. Sleeps 12, hot tub, overnight EV charging. Book direct.',
  alternates: { canonical: '/events/october-grape-stomp-lumberjack' },
  openGraph: {
    title: 'Where to Stay for Grape Stomp & Lumberjack Day Weekend 2026',
    description:
      'The one weekend to book a base and not move it — West Point Lumberjack Day is right in town, and the ranch is the easiest yes on the calendar.',
    url: 'https://backofbeyondranch.farm/events/october-grape-stomp-lumberjack',
    siteName: 'Back of Beyond Ranch',
    images: [{ url: '/cabin-photos/cabin-3.jpg', width: 1200, height: 800 }],
  },
}

const weekend: { event: string; date: string; where: string; drive: string }[] = [
  { event: 'Lynyrd Skynyrd', date: 'Fri, Oct 2', where: 'Ironstone Amphitheatre, Murphys', drive: '~50 min' },
  { event: 'Calaveras Grape Stomp', date: '~Sat, Oct 3', where: 'Calaveras County (near Murphys)', drive: '~50 min' },
  { event: 'West Point Lumberjack Day', date: '~Sat, Oct 3', where: 'West Point — in town!', drive: 'Minutes — you’re already here' },
]

export default function GrapeStompLumberjackPage() {
  return (
    <EventShell>
      <EventHero
        eyebrow="Lumberjack Day is in town · Oct 2–3"
        title="Where to Stay for Grape Stomp & Lumberjack Day Weekend 2026"
        subhead="The one weekend to book a base and not move it — West Point Lumberjack Day is right in town, and the ranch is the easiest yes on the calendar. Book direct."
      />

      <div className="mb-10">
        <Prose>
          <p>
            When you were a kid, the tour was the trip and you slept wherever the
            day ended. Now you can do the whole weekend right and still sleep
            well. This one stacks three good reasons to be in Gold Country onto
            two days — so pick a base and stay put.
          </p>
          <p>
            Back of Beyond Ranch is that base, and here&apos;s the best part:
            <span className="text-[var(--pixel-gold-light)]"> West Point Lumberjack Day happens right here in town</span>, a
            short hop from the ranch. No drive, no scramble — just walk into your
            own hometown weekend.
          </p>
        </Prose>
      </div>

      <PixelCard title="🪓 The Weekend (Oct 2–3, 2026)" className="mb-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-[var(--font-pixel)] text-[8px]">
            <thead>
              <tr className="text-[var(--pixel-gold-light)] text-left">
                <th className="border-b-2 border-[var(--pixel-ui-border)] pb-2 pr-3">Event</th>
                <th className="border-b-2 border-[var(--pixel-ui-border)] pb-2 pr-3">Date</th>
                <th className="border-b-2 border-[var(--pixel-ui-border)] pb-2 pr-3">Where</th>
                <th className="border-b-2 border-[var(--pixel-ui-border)] pb-2">Drive</th>
              </tr>
            </thead>
            <tbody>
              {weekend.map((w) => (
                <tr key={w.event} className="align-top text-[var(--pixel-ui-text)]">
                  <td className="border-b border-[var(--pixel-ui-border)]/40 py-2 pr-3 text-[var(--pixel-gold-light)]">{w.event}</td>
                  <td className="border-b border-[var(--pixel-ui-border)]/40 py-2 pr-3">{w.date}</td>
                  <td className="border-b border-[var(--pixel-ui-border)]/40 py-2 pr-3">{w.where}</td>
                  <td className="border-b border-[var(--pixel-ui-border)]/40 py-2">{w.drive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Disclaimer>
          Confirm exact times and any date shifts on each event&apos;s official page before you plan — the in-town Lumberjack Day and Grape Stomp schedules are worth checking locally.
        </Disclaimer>
        <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] leading-relaxed mt-4">
          Stay two nights and do all three without a single late-night mountain drive home.
        </p>
      </PixelCard>

      <div className="mb-10" />
      <WhyStay />

      <div className="mb-10">
        <Prose>
          <p>
            <span className="text-[var(--pixel-gold-light)]">In-town for Lumberjack Day</span> — you&apos;re a local for the
            weekend, steps from the hometown celebration. Two nights, whole ranch,
            three events — book the base and let the weekend come to you.
          </p>
        </Prose>
      </div>

      <GameDeepLink />
      <BookDirectCTA />

      <ClosingSeo>
        Looking for <span className="text-[var(--pixel-gold-light)]">lodging for West Point Lumberjack Day</span>,
        a <span className="text-[var(--pixel-gold-light)]">vacation rental near the Calaveras Grape Stomp</span>, or a
        <span className="text-[var(--pixel-gold-light)]"> place to stay for Lynyrd Skynyrd at Ironstone</span>? Back of
        Beyond Ranch is right in West Point — the whole forest ranch, and you&apos;re
        already in town for the main event.
      </ClosingSeo>
    </EventShell>
  )
}
