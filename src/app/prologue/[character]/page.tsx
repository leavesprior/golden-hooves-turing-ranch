'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { usePrologue, type PrologueCharacterId } from '../prologueContext'

const CHARACTER_INFO: Record<PrologueCharacterId, {
  name: string
  era: string
  icon: string
  acts: { id: string; title: string; setting: string }[]
  mechanic: string
  mechanicDescription: string
  color: string
}> = {
  norseman: {
    name: 'The Norseman',
    era: '~1000 CE',
    icon: '\u2693',
    acts: [
      { id: 'act_i_ep_1', title: 'Episode 1: Vinland\'s Edge', setting: 'L\'Anse aux Meadows' },
      { id: 'act_i_ep_2', title: 'Episode 2: The Maine Passage', setting: 'Wabanaki Coast' },
      { id: 'act_i_ep_3', title: 'Episode 3: The Great Mound', setting: 'Cahokia' },
    ],
    mechanic: 'Fylguir Spirit Tracking',
    mechanicDescription: 'Norse spirit animals appear as environmental clues guiding you south and west. Ravens reveal hidden paths; wolves warn of danger.',
    color: 'from-blue-900 to-blue-950',
  },
  native: {
    name: 'The Native',
    era: '~1000-1100 CE',
    icon: '\uD83C\uDF3F',
    acts: [
      { id: 'act_ii_ep_1', title: 'Episode 1: City of the Sun', setting: 'Cahokia' },
      { id: 'act_ii_ep_2', title: 'Episode 2: The Serpent\'s Eye', setting: 'Serpent Mound' },
      { id: 'act_ii_ep_3', title: 'Episode 3: Roads to Nowhere', setting: 'Chaco Canyon' },
    ],
    mechanic: 'Dream Walking',
    mechanicDescription: 'At sacred sites, enter a mythological dimension with absurdist-but-internally-consistent puzzle logic. Dreams hold real clues.',
    color: 'from-emerald-900 to-emerald-950',
  },
  califia: {
    name: 'Califia',
    era: '~1200 CE',
    icon: '\uD83D\uDDE1\uFE0F',
    acts: [
      { id: 'act_iii_ep_1', title: 'Episode 1: Island of Gold', setting: 'Channel Islands' },
      { id: 'act_iii_ep_2', title: 'Episode 2: Hutash\'s Bridge', setting: 'California Coast' },
      { id: 'act_iii_ep_3', title: 'Episode 3: The Warrior Queen', setting: 'Inland California' },
    ],
    mechanic: 'Warrior Strategy',
    mechanicDescription: 'Tactical decisions commanding warriors affect which areas you can access and what clues become available.',
    color: 'from-amber-900 to-amber-950',
  },
  incan: {
    name: 'The Incan Child',
    era: '~1400 CE',
    icon: '\uD83D\uDD2E',
    acts: [
      { id: 'act_iv_ep_1', title: 'Episode 1: Voice of the Lake', setting: 'Lake Titicaca' },
      { id: 'act_iv_ep_2', title: 'Episode 2: Lines in the Desert', setting: 'Nazca' },
      { id: 'act_iv_ep_3', title: 'Episode 3: The Road North', setting: 'Cusco to Mesoamerica' },
    ],
    mechanic: 'Hieroglyphic Puzzles',
    mechanicDescription: 'Decode quipus, match tocapu patterns, and walk the Nazca Lines to unlock ancient knowledge.',
    color: 'from-purple-900 to-purple-950',
  },
}

export default function CharacterHubPage() {
  const params = useParams()
  const characterId = params.character as PrologueCharacterId
  const { state, startEpisode } = usePrologue()

  const charInfo = CHARACTER_INFO[characterId]
  if (!charInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="font-pixel text-red-400 text-sm">Unknown character</p>
          <Link href="/prologue" className="text-purple-400 text-xs mt-4 block">
            {'\u2190'} Back to character select
          </Link>
        </div>
      </div>
    )
  }

  const actProgress = state.actProgress[characterId]
  const episodes = actProgress?.episodes || []

  return (
    <div className={`min-h-screen bg-gradient-to-b ${charInfo.color}`}>
      {/* Header */}
      <header className="border-b-2 border-purple-700/50 bg-black/30 px-4 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{charInfo.icon}</span>
            <div>
              <h1 className="font-pixel text-purple-200 text-lg">{charInfo.name}</h1>
              <p className="text-purple-400 text-xs">{charInfo.era}</p>
            </div>
          </div>
          <Link
            href="/prologue"
            className="text-purple-400 hover:text-purple-200 text-xs font-pixel"
          >
            {'\u2190'} Characters
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Unique mechanic */}
        <div className="bg-black/30 border-2 border-purple-700/50 rounded-lg p-5 mb-8">
          <h2 className="font-pixel text-purple-300 text-xs mb-2">
            Unique Ability: {charInfo.mechanic}
          </h2>
          <p className="text-purple-200/70 text-xs">{charInfo.mechanicDescription}</p>
        </div>

        {/* Episodes */}
        <h2 className="font-pixel text-purple-200 text-sm mb-4 border-b border-purple-700/30 pb-2">
          Episodes
        </h2>
        <div className="space-y-4">
          {charInfo.acts.map((act, i) => {
            const ep = episodes[i]
            const status = ep?.status || 'locked'
            const isPlayable = status === 'available' || status === 'in_progress'

            return (
              <div
                key={act.id}
                className={`
                  p-5 border-2 rounded-lg transition-all
                  ${isPlayable
                    ? 'border-purple-500 bg-purple-900/20 hover:bg-purple-900/40 cursor-pointer'
                    : status === 'completed'
                      ? 'border-green-700/50 bg-green-900/10'
                      : 'border-gray-700 bg-gray-900/20 opacity-50'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-pixel text-purple-200 text-xs">{act.title}</h3>
                    <p className="text-purple-400 text-[10px] mt-1">{act.setting}</p>
                    {ep && status !== 'locked' && (
                      <div className="flex gap-3 mt-2 text-[9px] text-purple-500">
                        <span>Clues: {ep.cluesFound.length}</span>
                        <span>Puzzles: {ep.puzzlesSolved.length}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    {status === 'completed' && (
                      <span className="text-green-400 text-sm">{'\u2713'}</span>
                    )}
                    {status === 'locked' && (
                      <span className="text-gray-500 text-sm">{'\uD83D\uDD12'}</span>
                    )}
                    {isPlayable && (
                      <Link
                        href={`/prologue/${characterId}/play?episode=${act.id}`}
                        onClick={() => startEpisode(
                          characterId === 'norseman' ? 'act_i' :
                          characterId === 'native' ? 'act_ii' :
                          characterId === 'califia' ? 'act_iii' : 'act_iv',
                          act.id
                        )}
                        className="font-pixel text-[10px] text-purple-200 bg-purple-700 border border-purple-500 px-4 py-2 rounded hover:bg-purple-600"
                      >
                        {status === 'in_progress' ? 'CONTINUE' : 'START'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Act completion status */}
        {actProgress?.completed && (
          <div className="mt-8 p-5 bg-green-900/20 border-2 border-green-600/50 rounded-lg text-center">
            <div className="text-3xl mb-2">{'\u2728'}</div>
            <p className="font-pixel text-green-300 text-xs">Act Complete!</p>
            <p className="text-green-400/70 text-[10px] mt-1">
              Your discoveries will echo through time...
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
