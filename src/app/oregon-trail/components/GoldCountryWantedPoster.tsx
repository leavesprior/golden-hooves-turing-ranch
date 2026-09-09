'use client'

import type { StreetPoster, TakenWarrant, WarrantApproach } from '@/lib/goldCountryStreet'

export type WantedPosterSize = 'hanging' | 'board' | 'pocket' | 'sheet'

function headline(form?: StreetPoster['form'], compact?: boolean) {
  if (form === 'camp_notice') return compact ? 'NOTICE' : 'CAMP NOTICE'
  if (form === 'claim_notice') return compact ? 'CLAIM' : 'CLAIM NOTICE'
  return 'WANTED'
}

function termsLine(
  form?: StreetPoster['form'],
  approach?: WarrantApproach,
  served?: boolean,
  wall?: boolean,
) {
  if (served) return 'IN CUSTODY'
  if (form === 'camp_notice' && (wall || !approach)) return 'ALIVE TO THE ALCALDE'
  if (form === 'claim_notice' && (wall || !approach)) return 'ALIVE TO THE PARTNERS'
  if (approach === 'alive') {
    if (form === 'camp_notice') return 'ALIVE TO THE ALCALDE'
    if (form === 'claim_notice') return 'ALIVE TO THE PARTNERS'
    return 'ALIVE ONLY'
  }
  return 'DEAD OR ALIVE'
}

function LeanSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={className} aria-hidden>
      <rect x="10" y="8" width="28" height="3" fill="#2a1a10" />
      <rect x="16" y="2" width="16" height="8" fill="#2a1a10" />
      <rect x="18" y="11" width="12" height="14" fill="#3d2818" />
      <rect x="20" y="15" width="2" height="2" fill="#e8d4a8" />
      <rect x="26" y="15" width="2" height="2" fill="#e8d4a8" />
      <rect x="22" y="19" width="4" height="1" fill="#2a1a10" />
      <rect x="14" y="26" width="20" height="22" fill="#2a1a10" />
      <rect x="12" y="28" width="6" height="16" fill="#3d2818" />
      <rect x="30" y="28" width="6" height="16" fill="#3d2818" />
    </svg>
  )
}

export function GoldCountryWantedPoster({
  poster,
  bounty,
  size = 'board',
  served = false,
  approach,
  riders,
  wet = false,
}: {
  poster: StreetPoster
  bounty: number
  size?: WantedPosterSize
  served?: boolean
  approach?: TakenWarrant['approach']
  riders?: number
  wet?: boolean
}) {
  const hanging = size === 'hanging'
  const pocket = size === 'pocket'
  const sheet = size === 'sheet'
  const compact = hanging || pocket
  const wall = !pocket
  const rainCurl = wet && hanging

  return (
    <article
      data-testid={`wanted-poster-${size}`}
      data-wet={rainCurl ? 'true' : 'false'}
      className={`wanted-poster relative text-center select-none ${
        hanging ? 'w-[5.6rem] max-sm:w-[3.2rem] px-1.5 max-sm:px-1 py-2 max-sm:py-1' : pocket ? 'w-[4.4rem] px-1 py-1.5' : sheet ? 'w-full max-w-sm px-5 py-4' : 'w-[11.5rem] px-3 py-3'
      }`}
      style={{
        backgroundColor: rainCurl ? '#c9b07a' : '#e4d2a4',
        backgroundImage: rainCurl
          ? 'linear-gradient(185deg, rgba(40,55,70,0.18), transparent 50%), repeating-linear-gradient(0deg, rgba(90,45,12,0.08) 0 1px, transparent 1px 4px)'
          : 'linear-gradient(185deg, rgba(70,35,10,0.07), transparent 42%), repeating-linear-gradient(0deg, rgba(90,45,12,0.05) 0 1px, transparent 1px 4px)',
        color: '#2a1a10',
        boxShadow: hanging
          ? rainCurl
            ? '2px 3px 0 rgba(20,10,0,0.55), 0 8px 16px rgba(0,0,0,0.35), inset 0 -16px 20px rgba(40,60,80,0.28)'
            : '2px 3px 0 rgba(20,10,0,0.55), 0 8px 16px rgba(0,0,0,0.35)'
          : '3px 4px 0 rgba(20,10,0,0.5), inset 0 0 48px rgba(90,40,10,0.12)',
        border: '1px solid #5a3a1a',
        filter: rainCurl ? 'saturate(0.7)' : undefined,
      }}
    >
      <span className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full bg-[#3a2414] shadow-[inset_0_0_0_1px_#1a1008]" />
      <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#3a2414] shadow-[inset_0_0_0_1px_#1a1008]" />
      {rainCurl && (
        <span
          className="pointer-events-none absolute inset-x-1 top-2 h-7 opacity-50"
          style={{ background: 'linear-gradient(180deg, rgba(70,90,110,0.35), transparent)' }}
          aria-hidden
        />
      )}
      <p
        className={`font-serif font-bold tracking-[0.22em] text-[#7a1c10] ${
          hanging ? 'text-[10px]' : pocket ? 'text-[8px]' : 'text-lg'
        }`}
      >
        {headline(poster.form, compact)}
      </p>
      <p className={`font-serif tracking-widest ${compact ? 'text-[7px]' : 'text-[10px]'} text-[#5c3317]`}>
        {termsLine(poster.form, approach, served, wall)}
      </p>
      <div
        className={`mx-auto my-1 overflow-hidden border border-[#3d2818] bg-[#d8c392] ${
          hanging ? 'h-10 w-10' : pocket ? 'h-8 w-8' : 'h-20 w-20 my-2'
        }`}
      >
        <LeanSilhouette className="h-full w-full" />
      </div>
      <p className={`font-serif leading-tight ${compact ? 'text-[8px]' : 'text-sm'}`}>{poster.alias}</p>
      {!compact && (
        <>
          <p className="mt-2 font-serif text-[11px] leading-snug text-[#3d2818]">{poster.look}</p>
          <p className="mt-2 font-serif text-[11px] leading-snug italic">{poster.crime}</p>
          <p className="mt-1 font-serif text-[11px] leading-snug">Last seen: {poster.lastSeen}</p>
        </>
      )}
      <p className={`mt-1 font-serif font-bold text-[#7a1c10] ${compact ? 'text-[9px]' : 'text-sm'}`}>
        {served ? 'SERVED' : `REWARD ${bounty}🌮`}
      </p>
      {!compact && typeof riders === 'number' && riders > 0 && !served && (
        <p className="mt-1 font-serif text-[10px] leading-snug text-[#5c3317]">
          {riders} {riders === 1 ? 'rider has' : 'riders have'} copied this paper without success. The purse is thinner.
        </p>
      )}
    </article>
  )
}
