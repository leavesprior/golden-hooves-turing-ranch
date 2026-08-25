'use client'

import { EXPLORE_QR_PUBLIC_URL } from '@/lib/exploreQrGate'

/**
 * Host print card. Not in public nav. Tape at the ranch house.
 * Scan opens the playable map; GPS NPCs only speak when you are there.
 */
export default function RanchHouseCardPage() {
  return (
    <main className="min-h-screen bg-[#0f0f1b] text-[#e8dcc4] px-6 py-10 print:bg-white print:text-[#1a1208]">
      <article className="mx-auto max-w-md border-4 border-[#e8a027] bg-[#0f0f1b] print:bg-white p-8 text-center">
        <p className="uppercase tracking-[0.22em] text-sm text-[#e8a027]">Back of Beyond Ranch</p>
        <h1 className="mt-3 font-serif text-3xl text-[#f4d76b] print:text-[#1a1208]">
          The playable area is here
        </h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/qr-codes/ranch-house.png"
          alt="Ranch-house QR for the Gold Country playable map"
          className="mx-auto mt-6 w-64 h-64 print:w-72 print:h-72"
        />
        <p className="mt-6 font-serif text-lg leading-relaxed">
          Scan with your phone. Leave GPS on.
          Nearby keepers and witnesses only speak when you are actually there.
        </p>
        <p className="mt-4 font-serif text-base leading-relaxed opacity-90">
          This is not the treasure hunt. This map helps you choose a town.
          Easy clues send you back to the ranch site.
        </p>
        <p className="mt-6 text-sm break-all opacity-70">{EXPLORE_QR_PUBLIC_URL}</p>
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-8 min-h-11 rounded-sm bg-[#e8a027] px-5 py-3 font-serif text-lg text-[#0f0f1b] print:hidden"
        >
          Print this card
        </button>
      </article>
    </main>
  )
}
