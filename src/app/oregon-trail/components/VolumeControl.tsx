'use client'

/**
 * Volume Control Component
 *
 * Floating audio controls with mute toggle and volume slider.
 * Remembers settings in localStorage.
 */

import React, { useState, useEffect, useCallback } from 'react'
import * as AudioManager from '../lib/audioManager'

interface VolumeState {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  isMuted: boolean
  soundtrackMode: 'synth' | 'fallout'
}

const STORAGE_KEY = 'golden-hooves-audio-settings'

const defaultState: VolumeState = {
  masterVolume: 1.0,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  isMuted: false,
  soundtrackMode: 'synth',
}

export function VolumeControl() {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<VolumeState>(defaultState)
  const [prevMasterVolume, setPrevMasterVolume] = useState(1.0)

  // Load saved settings on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as VolumeState
        setState(parsed)
        // Apply saved volumes
        if (!parsed.isMuted) {
          AudioManager.setVolume('master', parsed.masterVolume)
          AudioManager.setVolume('music', parsed.musicVolume)
          AudioManager.setVolume('sfx', parsed.sfxVolume)
        } else {
          AudioManager.setVolume('master', 0)
        }
        setPrevMasterVolume(parsed.masterVolume)
      }
      // Load soundtrack mode preference
      const savedMode = AudioManager.loadSoundtrackPreference()
      setState(prev => ({ ...prev, soundtrackMode: savedMode }))
    } catch {
      // Use defaults
    }
  }, [])

  // Save settings when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage not available
    }
  }, [state])

  const handleMuteToggle = useCallback(() => {
    setState(prev => {
      const newMuted = !prev.isMuted
      if (newMuted) {
        setPrevMasterVolume(prev.masterVolume)
        AudioManager.setVolume('master', 0)
      } else {
        AudioManager.setVolume('master', prevMasterVolume)
      }
      return { ...prev, isMuted: newMuted }
    })
  }, [prevMasterVolume])

  const handleSoundtrackToggle = useCallback(() => {
    setState(prev => {
      const newMode = prev.soundtrackMode === 'synth' ? 'fallout' : 'synth'
      AudioManager.setSoundtrackMode(newMode)
      return { ...prev, soundtrackMode: newMode }
    })
  }, [])

  const handleVolumeChange = useCallback((type: 'master' | 'music' | 'sfx', value: number) => {
    setState(prev => {
      const newState = { ...prev, [`${type}Volume`]: value }
      if (!prev.isMuted) {
        AudioManager.setVolume(type, value)
      }
      if (type === 'master') {
        setPrevMasterVolume(value)
      }
      return newState
    })
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed: just speaker icon */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-amber-800/90 hover:bg-amber-700 rounded-full border-2 border-amber-500/50 flex items-center justify-center text-2xl shadow-lg transition-all hover:scale-110"
          title="Audio Settings"
        >
          {state.isMuted ? '🔇' : '🔊'}
        </button>
      )}

      {/* Expanded: full control panel */}
      {isOpen && (
        <div className="bg-stone-900/95 border-2 border-amber-600/50 rounded-lg p-4 shadow-2xl w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-amber-400 font-pixel text-sm">Audio Settings</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-amber-500 hover:text-amber-300 text-lg"
            >
              ✕
            </button>
          </div>

          {/* Soundtrack mode toggle */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => state.soundtrackMode !== 'synth' && handleSoundtrackToggle()}
              className={`flex-1 py-1.5 px-2 rounded text-xs font-pixel transition-colors ${
                state.soundtrackMode === 'synth'
                  ? 'bg-amber-700/60 border border-amber-500/50 text-amber-200'
                  : 'bg-stone-800/60 border border-stone-600/30 text-stone-400 hover:bg-stone-700/60'
              }`}
            >
              Electro Swing
            </button>
            <button
              onClick={() => state.soundtrackMode !== 'fallout' && handleSoundtrackToggle()}
              className={`flex-1 py-1.5 px-2 rounded text-xs font-pixel transition-colors ${
                state.soundtrackMode === 'fallout'
                  ? 'bg-green-800/60 border border-green-500/50 text-green-200'
                  : 'bg-stone-800/60 border border-stone-600/30 text-stone-400 hover:bg-stone-700/60'
              }`}
            >
              Fallout 2 OST
            </button>
          </div>

          {/* Mute toggle */}
          <button
            onClick={handleMuteToggle}
            className={`w-full py-2 px-4 rounded mb-4 font-pixel text-sm transition-colors ${
              state.isMuted
                ? 'bg-red-900/50 border border-red-500/50 text-red-300'
                : 'bg-green-900/50 border border-green-500/50 text-green-300'
            }`}
          >
            {state.isMuted ? '🔇 Muted' : '🔊 Sound On'}
          </button>

          {/* Volume sliders */}
          <div className="space-y-3">
            <VolumeSlider
              label="Master"
              value={state.masterVolume}
              onChange={(v) => handleVolumeChange('master', v)}
              disabled={state.isMuted}
            />
            <VolumeSlider
              label="Music"
              value={state.musicVolume}
              onChange={(v) => handleVolumeChange('music', v)}
              disabled={state.isMuted}
              icon="🎵"
            />
            <VolumeSlider
              label="SFX"
              value={state.sfxVolume}
              onChange={(v) => handleVolumeChange('sfx', v)}
              disabled={state.isMuted}
              icon="💥"
            />
          </div>

          {/* Current track info */}
          <div className="mt-4 pt-3 border-t border-amber-800/50">
            {state.soundtrackMode === 'fallout' ? (
              <NowPlayingFallout />
            ) : (
              <p className="text-amber-600/70 text-xs font-pixel">
                Now Playing: {formatTrackName(AudioManager.getCurrentStyle())}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NowPlayingFallout() {
  const [track, setTrack] = useState<{ title: string } | null>(null)

  useEffect(() => {
    // Poll for current track since there's no event system
    const update = () => {
      const current = AudioManager.getCurrentFalloutTrack()
      setTrack(current ? { title: current.title } : null)
    }
    update()
    const interval = setInterval(update, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-xs font-pixel">
      <p className="text-green-500/70">
        {track ? `Now Playing: ${track.title}` : 'Fallout 2 OST - Loading...'}
      </p>
      <p className="text-stone-500/50 mt-0.5">
        Fallout 2 Original Soundtrack
      </p>
    </div>
  )
}

interface VolumeSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  icon?: string
}

function VolumeSlider({ label, value, onChange, disabled, icon }: VolumeSliderProps) {
  return (
    <div className={`${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-amber-300/80 text-xs font-pixel">
          {icon && `${icon} `}{label}
        </span>
        <span className="text-amber-500/60 text-xs">
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(value * 100)}
        onChange={(e) => onChange(parseInt(e.target.value) / 100)}
        disabled={disabled}
        className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:bg-amber-500
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:hover:bg-amber-400
          disabled:cursor-not-allowed"
      />
    </div>
  )
}

function formatTrackName(style: string): string {
  if (style === 'silent') return 'Nothing'
  return style
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
