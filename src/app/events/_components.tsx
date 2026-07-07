import Image from 'next/image'
import Link from 'next/link'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'
import { airbnbBookingLink, airbnbRetreatLink } from '@/lib/airbnbLink'

/**
 * Shared building blocks for the /events lodging landing pages.
 *
 * These are server components (no client hooks) so each page can keep
 * `export const metadata` for SEO. They import the client pixel primitives
 * (PixelButton/PixelCard/PixelNavigation), which is allowed from a server
 * component.
 *
 * Files prefixed with `_` are not treated as routes by the App Router.
 */

// The whole-ranch amenities block shared by every event page ("why stay").
export const RANCH_AMENITIES: { icon: string; name: string; desc: string }[] = [
  { icon: '🛏️', name: '6 Bedrooms, 7 Beds', desc: 'Sleeps up to 12' },
  { icon: '♨️', name: 'Hot Tub on the Deck', desc: 'Stars + a rubber duck' },
  { icon: '🎮', name: 'Game Room', desc: 'For the in-between' },
  { icon: '🎹', name: 'Baby Grand Piano', desc: 'Yes, really' },
  { icon: '🔌', name: 'Overnight EV Charging', desc: 'Full by morning' },
  { icon: '🏔️', name: '360° Sierra Views', desc: 'Two lakes on the ranch' },
  { icon: '🌲', name: 'Deep Forest Quiet', desc: 'Genuinely silent nights' },
  { icon: '💸', name: 'Book Direct', desc: 'Skip the platform fees' },
]

export function EventShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />
      <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
    </div>
  )
}

/**
 * Page hero. Uses the ranch hot-tub photo as an interim hero image.
 * TODO: add duck-hot-tub hero image to public/ and swap `src` below
 * (per marketing plan: swap hero to the rubber-duck hot-tub photo).
 */
export function EventHero({
  eyebrow,
  title,
  subhead,
}: {
  eyebrow?: string
  title: string
  subhead: string
}) {
  return (
    <div className="mb-10">
      <div className="relative w-full aspect-video border-4 border-[var(--pixel-ui-border)] overflow-hidden mb-6">
        {/* TODO: add duck-hot-tub hero image to public/ and use it here */}
        <Image
          src="/cabin-photos/cabin-3.jpg"
          alt="The hot tub on the deck at Back of Beyond Ranch, under a Sierra forest sky"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 896px) 100vw, 896px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--pixel-bg-dark)] via-transparent to-transparent" />
        {eyebrow && (
          <span className="absolute top-3 left-3 bg-[var(--pixel-bg-dark)]/80 px-2 py-1 font-[var(--font-pixel)] text-[7px] text-[var(--pixel-forest-light)]">
            {eyebrow}
          </span>
        )}
      </div>
      <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-base sm:text-xl leading-relaxed mb-4">
        {title}
      </h1>
      <p className="font-[var(--font-pixel)] text-[9px] sm:text-[10px] text-[var(--pixel-ui-text)] leading-relaxed italic">
        {subhead}
      </p>
    </div>
  )
}

// A block of prose paragraphs in the pixel body style.
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-[var(--font-pixel)] text-[9px] sm:text-[10px] leading-relaxed text-[var(--pixel-ui-text)] space-y-4">
      {children}
    </div>
  )
}

export function WhyStay() {
  return (
    <PixelCard title="🌲 Why Stay at the Ranch" className="mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {RANCH_AMENITIES.map((a) => (
          <div key={a.name} className="text-center">
            <span className="text-2xl">{a.icon}</span>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] mt-1 leading-relaxed">
              {a.name}
            </p>
            <p className="font-[var(--font-pixel)] text-[6px] text-[var(--pixel-ui-text)] mt-1 leading-relaxed">
              {a.desc}
            </p>
          </div>
        ))}
      </div>
    </PixelCard>
  )
}

/**
 * Book Direct CTA. The real OwnerRez availability+booking widget is not yet
 * available, so the interim working CTA links to the live Airbnb listings.
 */
export function BookDirectCTA() {
  return (
    <PixelCard title="📅 Book Direct — No Platform Fees" className="mb-8">
      <div className="space-y-5">
        <p className="font-[var(--font-pixel)] text-[9px] leading-relaxed text-[var(--pixel-ui-text)]">
          Reserve your dates directly and skip the extra platform service fees.
          Questions about the drive, the group size, or which event you&apos;re
          coming for? We&apos;re happy to help.
        </p>

        {/* TODO: replace with OwnerRez availability+booking widget embed */}

        <div className="space-y-3">
          <PixelButton href={airbnbBookingLink('events')} variant="orange" size="lg" className="w-full">
            ♨️ Book the Whole Ranch
          </PixelButton>
          <p className="font-[var(--font-pixel)] text-[7px] text-center text-[var(--pixel-ui-text)]">
            Sleeps 12 · 6 bedrooms · the whole forest ranch
          </p>
          <PixelButton href={airbnbRetreatLink('events')} variant="clear" size="md" className="w-full">
            Smaller group? Book the Retreat
          </PixelButton>
          <p className="font-[var(--font-pixel)] text-[7px] text-center text-[var(--pixel-ui-text)]">
            The Hot Tub Forest Retreat — for parties of 2–6
          </p>
        </div>

        <div className="border-t-2 border-[var(--pixel-ui-border)] pt-4">
          <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)]">
            Questions? <a href="mailto:contact@backofbeyondranch.farm" className="text-[var(--pixel-gold-light)] underline hover:text-[var(--pixel-gold-mid)]">contact@backofbeyondranch.farm</a>
          </p>
        </div>
      </div>
    </PixelCard>
  )
}

// "Enhance your stay" game deep-link card → /adventure.
export function GameDeepLink() {
  return (
    <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-gold-mid)] p-4 mb-8">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <span className="text-3xl">🐸</span>
        <div className="flex-1 text-center sm:text-left">
          <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)] leading-relaxed mb-1">
            Enhance your stay
          </p>
          <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] leading-relaxed">
            Play our free Gold Rush Adventure before you arrive — a Gold Country
            treasure hunt, and a head start on your stay.
          </p>
        </div>
        <PixelButton href="/adventure" variant="green" size="sm">
          Play Free
        </PixelButton>
      </div>
    </div>
  )
}

// Closing SEO paragraph, italic pixel body.
export function ClosingSeo({ children }: { children: React.ReactNode }) {
  return (
    <>
      <hr className="border-t-2 border-[var(--pixel-ui-border)] my-8" />
      <p className="font-[var(--font-pixel)] text-[8px] leading-relaxed text-[var(--pixel-ui-text)] italic mb-8">
        {children}
      </p>
      <div className="text-center">
        <Link
          href="/events"
          className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-forest-light)] hover:text-[var(--pixel-gold-light)] underline"
        >
          ← All events near the ranch
        </Link>
      </div>
    </>
  )
}

// Small disclaimer line ("double-check official calendar").
export function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-forest-light)] leading-relaxed italic mt-3">
      {children}
    </p>
  )
}
