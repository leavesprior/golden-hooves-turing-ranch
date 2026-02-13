'use client'

import React from 'react'
import Link from 'next/link'

export default function ConvergencePlayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-red-950 to-black flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-4">{'\uD83C\uDFDB\uFE0F'}</div>
        <h2 className="font-pixel text-amber-200 text-lg mb-3">Convergence Gameplay</h2>
        <p className="text-amber-400 text-xs mb-6">
          The convergence gameplay will synthesize evidence from all completed character
          paths into a final confrontation with the Cortez myth.
        </p>
        <Link
          href="/prologue/convergence"
          className="font-pixel text-[10px] text-amber-300 border border-amber-600 px-4 py-2 hover:text-amber-100"
        >
          {'\u2190'} Back
        </Link>
      </div>
    </div>
  )
}
