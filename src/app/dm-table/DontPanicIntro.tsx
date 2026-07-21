'use client'

/**
 * DON'T PANIC — the fluorescent-sign-in-the-dark intro (dp-dmtable-intro).
 *
 * Shown AFTER a Bridge success and BEFORE the DM Table. Neon HHGTTG signage
 * glowing in a dark room, luring in the bathrobe-wearing hitchhiker who knows
 * where their towel is: DON'T PANIC · "do you know where your towel is?" · 42.
 * Pure presentation — no secrets, no network, just glow.
 */

import React from 'react'

export function DontPanicIntro({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* faint scanline / haze so the signs read as glowing in the dark */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(0,255,170,0.08) 0%, rgba(0,0,0,0) 60%)',
        }}
      />

      {/* THE BIG SIGN */}
      <h1
        className="relative text-center font-pixel text-4xl sm:text-6xl md:text-7xl font-black tracking-widest animate-pulse"
        style={{
          color: '#39ff14',
          textShadow:
            '0 0 6px #39ff14, 0 0 14px #39ff14, 0 0 30px #1aff8c, 0 0 60px #0f9d58',
        }}
      >
        DON&apos;T PANIC
      </h1>

      {/* the towel question — a second, cooler neon */}
      <p
        className="relative mt-10 text-center text-lg sm:text-2xl"
        style={{
          color: '#22d3ee',
          textShadow: '0 0 5px #22d3ee, 0 0 16px #06b6d4, 0 0 34px #0891b2',
        }}
      >
        do you know where your towel is?
      </p>

      {/* the 42 — a slow flicker in a warmer tube */}
      <div
        className="relative mt-8 font-pixel text-5xl sm:text-6xl"
        style={{
          color: '#ffd166',
          textShadow: '0 0 6px #ffd166, 0 0 18px #f59e0b, 0 0 40px #b45309',
          animation: 'dpFlicker 3.2s infinite',
        }}
      >
        4 2
      </div>

      <p className="relative mt-10 max-w-md px-6 text-center text-xs sm:text-sm text-emerald-200/70 leading-relaxed">
        A door you were not looking for has opened. Beyond it, the Dungeon Master&apos;s
        table waits in the dark. Bring your towel. Bring your questions. The mountain
        is listening.
      </p>

      <button
        onClick={onEnter}
        className="relative mt-10 px-8 py-3 font-pixel text-sm rounded border-2 transition-all"
        style={{
          color: '#39ff14',
          borderColor: '#39ff14',
          boxShadow: '0 0 8px #39ff14, inset 0 0 8px rgba(57,255,20,0.25)',
        }}
      >
        I know where my towel is &rarr;
      </button>

      {/* Local keyframes — scoped, no global CSS needed */}
      <style>{`
        @keyframes dpFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
          20%, 22%, 24%, 55% { opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}

export default DontPanicIntro
