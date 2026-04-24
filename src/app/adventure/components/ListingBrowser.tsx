'use client'

/**
 * ListingBrowser — in-game "guestbook" modal rendering canonical Back of
 * Beyond Ranch listing facts so players never have to alt-tab to Airbnb
 * mid-quest.
 *
 * Closes the 3rd RED from the original playtest audit (Phases 0-6 left it
 * open): some DiscoveryClue entries in chapterLocations.ts are literal
 * Airbnb-listing questions (bedrooms=6, sleeps=12, etc.). Without an
 * in-game reference, the player has to break immersion to answer them.
 *
 * Canonical data source: the VacationRental schema.org block in
 * src/app/layout.tsx. Mirrored here as typed constants to keep the
 * field-notes hand-crafted rather than a raw iframe of the real listing.
 *
 * Difficulty behavior is owned by the caller (LocationView); this
 * component is a pure presenter driven by the `open`, `focus`, and
 * `answerReveal` props.
 */

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'

export type ListingBrowserSection =
  | 'bedrooms'
  | 'amenities'
  | 'location'
  | 'photos'

export interface ListingBrowserProps {
  open: boolean
  onClose: () => void
  /** Which section to scroll to / highlight when the modal opens. */
  focus?: ListingBrowserSection
  /**
   * Story-mode helper: when present, renders an inline "The answer is X"
   * banner at the top of the modal. Leave undefined for Explorer; the
   * Challenger tier should not render this modal at all (suppress the [?]
   * button at the call-site instead).
   */
  answerReveal?: {
    question: string
    answer: string
  }
}

// ---------------------------------------------------------------------------
// Canonical listing facts — mirrored from src/app/layout.tsx VacationRental
// schema. Changing either side should trip the other in playtest; keep the
// two in sync until we centralize (out of scope for Phase 4).
// ---------------------------------------------------------------------------

const LISTING = {
  name: 'Back of Beyond Ranch',
  bedrooms: 6,
  bathrooms: 3,
  sleeps: 12,
  acres: 60, // site-wide fix landed pre-Phase 4 (10 -> 60)
  town: 'West Point',
  region: 'California',
  county: 'Calaveras County',
  nearby: [
    { name: 'Kirkwood Mountain Resort', miles: 48 },
    { name: 'Bear Valley Mountain Resort', miles: 57 },
    { name: 'Sierra-at-Tahoe', miles: 75 },
  ],
  amenities: [
    'Solar-powered Level 2 EV charger (220V)',
    'Hot tub',
    'Game room with pool table',
    'Fishing lakes',
    'Mountain bikes',
    'Fire pit',
    'BBQ grill',
    'Canoe',
    'Hiking trails',
    'Ranch animals (horses, emus, sheep, chickens)',
    'Wi-Fi',
    'On-site parking',
    'Dishwasher',
    'Pet friendly',
  ],
} as const

// Photos we know ship at /cabin-photos/. cabin-6 is a .png; the rest .jpg.
const PHOTOS: Array<{ src: string; alt: string }> = [
  { src: '/cabin-photos/cabin-1.jpg', alt: 'Ranch cabin exterior at dusk' },
  { src: '/cabin-photos/cabin-2.jpg', alt: 'Living room with mountain views' },
  { src: '/cabin-photos/cabin-3.jpg', alt: 'Game room with pool table' },
  { src: '/cabin-photos/cabin-4.jpg', alt: 'Hot tub deck and fire pit' },
]

// ---------------------------------------------------------------------------

function IconBedroom() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="1" y="6" width="12" height="5" fill="var(--pixel-gold-mid)" />
      <rect x="1" y="9" width="12" height="2" fill="var(--pixel-gold-dark)" />
      <rect x="2" y="4" width="3" height="2" fill="var(--pixel-ui-text)" />
      <rect x="1" y="10" width="1" height="2" fill="var(--pixel-gold-dark)" />
      <rect x="12" y="10" width="1" height="2" fill="var(--pixel-gold-dark)" />
    </svg>
  )
}

function IconBathroom() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="2" y="7" width="10" height="4" fill="var(--pixel-ui-border)" />
      <rect x="2" y="10" width="10" height="1" fill="var(--pixel-ui-text)" />
      <rect x="2" y="11" width="1" height="2" fill="var(--pixel-ui-border)" />
      <rect x="11" y="11" width="1" height="2" fill="var(--pixel-ui-border)" />
      <rect x="6" y="3" width="2" height="4" fill="var(--pixel-gold-light)" />
    </svg>
  )
}

function IconGuest() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <circle cx="7" cy="4" r="2" fill="var(--pixel-gold-light)" />
      <rect x="3" y="7" width="8" height="5" fill="var(--pixel-gold-mid)" />
      <rect x="3" y="11" width="3" height="1" fill="var(--pixel-gold-dark)" />
      <rect x="8" y="11" width="3" height="1" fill="var(--pixel-gold-dark)" />
    </svg>
  )
}

// ---------------------------------------------------------------------------

export function ListingBrowser({
  open,
  onClose,
  focus,
  answerReveal,
}: ListingBrowserProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  // Escape key to dismiss.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Auto-scroll to focus section on open / focus change.
  useEffect(() => {
    if (!open || !focus) return
    const root = scrollerRef.current
    if (!root) return
    const target = root.querySelector<HTMLElement>(`[data-lb-section="${focus}"]`)
    if (target) {
      // Delay one frame so layout is settled after the modal mounts.
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [open, focus])

  if (!open) return null

  const highlight = (section: ListingBrowserSection): string =>
    focus === section
      ? 'border-[var(--pixel-gold-light)] shadow-[0_0_0_2px_var(--pixel-gold-mid)_inset]'
      : 'border-[var(--pixel-ui-border)]'

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-browser-title"
      onMouseDown={(e) => {
        // Click-outside dismiss. Only fire on the backdrop itself.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-gold-mid)] w-full max-w-2xl max-h-[90vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header (movable-looking, though not actually draggable — matches
            CampScreen/DialogueView convention). */}
        <div className="bg-[var(--pixel-bg-mid)] border-b-4 border-[var(--pixel-ui-border)] p-3 flex items-start justify-between gap-2">
          <div>
            <h2
              id="listing-browser-title"
              className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]"
            >
              BACK OF BEYOND RANCH
            </h2>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-70 mt-1">
              Listing Field Notes  —  Guestbook Reference
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close listing field notes"
            className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] border-2 border-[var(--pixel-ui-border)] px-2 py-1 hover:text-[var(--pixel-gold-light)] hover:border-[var(--pixel-gold-mid)] transition-colors"
          >
            {'✕'}
          </button>
        </div>

        {/* Optional Story-mode answer reveal. */}
        {answerReveal && (
          <div className="bg-[var(--pixel-gold-dark)]/30 border-b-2 border-[var(--pixel-gold-mid)] p-3">
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)]">
              STORY-MODE HINT
            </p>
            <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] mt-1 leading-relaxed">
              The answer is{' '}
              <span className="text-[var(--pixel-gold-light)]">{answerReveal.answer}</span>
              .
            </p>
          </div>
        )}

        {/* Body (scrollable). */}
        <div
          ref={scrollerRef}
          className="overflow-y-auto p-4 space-y-4 font-serif text-[13px] text-[var(--pixel-ui-text)]"
          style={{ lineHeight: 1.5 }}
        >
          {/* Bedrooms / bathrooms / sleeps */}
          <section
            data-lb-section="bedrooms"
            className={`border-2 ${highlight('bedrooms')} bg-[var(--pixel-bg-mid)] p-3 transition-all`}
          >
            <h3 className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] mb-3">
              SLEEPS {LISTING.sleeps}  —  {LISTING.bedrooms} BEDROOMS  —  {LISTING.bathrooms} BATHS
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)] p-2">
                <div className="flex justify-center mb-1">
                  <IconBedroom />
                </div>
                <div className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)]">
                  {LISTING.bedrooms}
                </div>
                <div className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-70 mt-1">
                  BEDROOMS
                </div>
              </div>
              <div className="bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)] p-2">
                <div className="flex justify-center mb-1">
                  <IconBathroom />
                </div>
                <div className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)]">
                  {LISTING.bathrooms}
                </div>
                <div className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-70 mt-1">
                  BATHROOMS
                </div>
              </div>
              <div className="bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)] p-2">
                <div className="flex justify-center mb-1">
                  <IconGuest />
                </div>
                <div className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)]">
                  {LISTING.sleeps}
                </div>
                <div className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-70 mt-1">
                  SLEEPS
                </div>
              </div>
            </div>
            <p className="mt-3 italic opacity-80">
              The ranch accommodates up to {LISTING.sleeps} guests across{' '}
              {LISTING.bedrooms} bedrooms and {LISTING.bathrooms} bathrooms.
            </p>
          </section>

          {/* Amenities */}
          <section
            data-lb-section="amenities"
            className={`border-2 ${highlight('amenities')} bg-[var(--pixel-bg-mid)] p-3 transition-all`}
          >
            <h3 className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] mb-3">
              KEY AMENITIES
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {LISTING.amenities.map((a) => (
                <li key={a} className="flex items-start gap-2">
                  <span
                    className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-mid)] mt-[2px]"
                    aria-hidden
                  >
                    {'◆'}
                  </span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Location */}
          <section
            data-lb-section="location"
            className={`border-2 ${highlight('location')} bg-[var(--pixel-bg-mid)] p-3 transition-all`}
          >
            <h3 className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] mb-3">
              LOCATION
            </h3>
            <p>
              A {LISTING.acres}-acre mountain property in{' '}
              <span className="text-[var(--pixel-gold-light)]">{LISTING.town}</span>
              , {LISTING.region}  —  {LISTING.county}, in the heart of Gold Country.
            </p>
            <p className="mt-2 opacity-80">Within driving range of three ski resorts:</p>
            <ul className="mt-1 space-y-1">
              {LISTING.nearby.map((n) => (
                <li key={n.name} className="flex items-baseline justify-between gap-4">
                  <span>{n.name}</span>
                  <span className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-mid)] opacity-80">
                    {n.miles} mi
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Photos */}
          <section
            data-lb-section="photos"
            className={`border-2 ${highlight('photos')} bg-[var(--pixel-bg-mid)] p-3 transition-all`}
          >
            <h3 className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] mb-3">
              PHOTO STRIP
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PHOTOS.map((p) => (
                <div
                  key={p.src}
                  className="relative aspect-square border-2 border-[var(--pixel-ui-border)] overflow-hidden bg-[var(--pixel-bg-dark)]"
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] opacity-70 italic">
              Field sketches from the ranch. No brochure gloss.
            </p>
          </section>

          <p className="text-center opacity-50 text-[10px] pt-2">
            [ press ESC or click outside to close ]
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Clue-id -> section mapping. Keeps the section focus logic centralized so
// LocationView can just look up a clue id and get the right scroll target.
// ---------------------------------------------------------------------------

export const CLUE_SECTION_MAP: Record<string, ListingBrowserSection> = {
  // bedroom / bathroom / sleeps cluster
  ch1_ind_bedrooms: 'bedrooms',
  ch1_ind_guests: 'bedrooms',
  ch2_cemetery_bathrooms: 'bedrooms',

  // amenities cluster
  ch1_alcove_hottub: 'amenities',
  ch1_blue_animals: 'amenities',
  ch2_stgeorge_wifi: 'amenities',
  ch2_mason_parking: 'amenities',
  ch2_cobble_kitchen: 'amenities',
  ch2_miners_fire: 'amenities',

  // location cluster
  ch1_platte_view: 'location',
  ch1_pawnee_acres: 'location',
  ch2_volcano_town: 'location',
  ch2_volcano_county: 'location',
}

export default ListingBrowser
