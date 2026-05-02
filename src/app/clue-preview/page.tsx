'use client'

import Link from 'next/link'
import { PixelNavigation, PixelButton } from '@/components/pixel'
import { ClueSceneV2 } from '@/components/clue/ClueSceneV2'

// Standalone preview of the Option 3 visual upgrade — does NOT touch the live
// /clue/[slug] flow. Granny visits /clue-preview to compare looks before we
// commit to migrating all 14 markers. Once approved, this becomes the
// template applied to /clue/[slug]/page.tsx.

const samples = [
  {
    slug: 'welcome',
    locationTitle: 'THE WELCOME GATE',
    locationNumber: 1,
    backdropSrc: '/cabin-photos/cabin-1.jpg',
    backdropAlt: 'Back of Beyond Ranch entrance — Sierra foothills',
    spriteSrc: '/sprites/tobias-portrait.png',
    dialogueText:
      "In 1852, a prospector named Tobias Goldsworth built the first cabin on this very land. He called it 'Back of Beyond' because it was so far from civilization that even the coyotes needed a map. They say he hid clues throughout the property leading to his greatest discovery...",
    pointsEarned: 200,
  },
  {
    slug: 'hot-tub',
    locationTitle: 'THE BUBBLING SPRINGS',
    locationNumber: 2,
    backdropSrc: '/cabin-photos/cabin-3.jpg',
    backdropAlt: 'Hot tub at the ranch with mountain backdrop',
    spriteSrc: '/sprites/tobias-portrait.png',
    dialogueText:
      'Tobias discovered his first gold nugget while bathing in natural hot springs nearby. "The earth herself showed me her treasure," he wrote in his journal. "Water and gold — both precious, both hidden in plain sight."',
    pointsEarned: 200,
  },
  {
    slug: 'game-room',
    locationTitle: "THE PROSPECTOR'S PARLOR",
    locationNumber: 3,
    backdropSrc: '/cabin-photos/cabin-4.jpg',
    backdropAlt: 'Game room with billiard table and antique baby grand',
    spriteSrc: '/sprites/tobias-portrait.png',
    dialogueText:
      'On long winter evenings the saloon would fill with prospectors trading rumors over a green felt table. Tobias was said to be a careful player — his only known vice was an antique baby grand piano he\'d had hauled by mule from Sacramento.',
    pointsEarned: 180,
  },
]

export default function CluePreviewPage() {
  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <header>
          <h1 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-lg mb-2">
            ClueScene v2 — Visual Upgrade Preview
          </h1>
          <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
            Option 3 hybrid: real-photo backdrops + 32-bit JRPG sprite + 16-bit dialogue UI.
            <br />
            Sprite is a placeholder until Grok-generated transparent-bg sprite lands at <code>/sprites/tobias.png</code>.
            Backdrops use existing /cabin-photos/* — to be replaced with location-specific shots.
          </p>
        </header>

        {samples.map((s) => (
          <section key={s.slug} className="space-y-3">
            <h2 className="font-[var(--font-pixel)] text-sm text-[var(--pixel-gold-mid)] uppercase tracking-wider">
              {s.locationTitle}
            </h2>
            <ClueSceneV2
              backdropSrc={s.backdropSrc}
              backdropAlt={s.backdropAlt}
              spriteSrc={s.spriteSrc}
              locationTitle={s.locationTitle}
              locationNumber={s.locationNumber}
              dialogueText={s.dialogueText}
              pointsEarned={s.pointsEarned}
            />
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-60">
              live on production: <Link href={`/clue/${s.slug}`} className="text-[var(--pixel-gold-light)] underline">/clue/{s.slug}</Link>{' '}
              (current 8-bit version)
            </p>
          </section>
        ))}

        <div className="pt-8 border-t-4 border-[var(--pixel-ui-border)]">
          <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] mb-4">
            If this look gets approved, /clue/[slug]/page.tsx swaps to use ClueSceneV2 for all 14 markers.
            Each marker gets a location-specific backdrop and (eventually) a pose-specific sprite.
          </p>
          <PixelButton href="/game" variant="gold" size="md">
            Back to Quest Map
          </PixelButton>
        </div>
      </div>
    </div>
  )
}
