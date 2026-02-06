'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { saveGame, type SavedGameState } from '../lib/useGamePersistence'

interface SaveIndicatorProps {
  getState: () => Partial<SavedGameState> | null
  autoSaveInterval?: number
  enabled?: boolean
}

export function SaveIndicator({ getState, autoSaveInterval = 30000, enabled = true }: SaveIndicatorProps) {
  const [showToast, setShowToast] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const doSave = useCallback(() => {
    const state = getState()
    if (!state || !state.gamePhase || state.gamePhase === 'menu' || state.gamePhase === 'title') return false
    const success = saveGame(state)
    if (success) {
      setShowToast(true)
      setSaveError(false)
    } else {
      setSaveError(true)
      setShowToast(true)
    }
    return success
  }, [getState])

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(doSave, autoSaveInterval)
    const handleUnload = () => doSave()
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      clearInterval(id)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [enabled, doSave, autoSaveInterval])

  // Auto-hide toast
  useEffect(() => {
    if (!showToast) return
    const timer = setTimeout(() => setShowToast(false), 2000)
    return () => clearTimeout(timer)
  }, [showToast])

  if (!showToast) return null

  return (
    <div className={`fixed top-4 right-4 z-50 px-3 py-1.5 rounded-lg text-xs font-pixel transition-opacity duration-300 ${
      saveError
        ? 'bg-red-900/80 border border-red-600/50 text-red-300'
        : 'bg-stone-800/80 border border-amber-700/50 text-amber-300'
    }`}>
      {saveError ? 'Save failed' : 'Game saved'}
    </div>
  )
}
