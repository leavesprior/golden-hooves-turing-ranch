'use client'

/** Isolated ranch-home editorial still. Does not change booking or quest hrefs. */
export function HomeHeroStill() {
  return (
    <div className="absolute inset-0 z-[22] pointer-events-none">
      <img
        src="/place-art/ot_home_ranch_editorial.jpg"
        alt=""
        className="h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/60" />
    </div>
  )
}
