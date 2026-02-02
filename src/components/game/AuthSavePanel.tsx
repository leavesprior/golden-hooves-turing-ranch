'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/authContext'
import { useSaveLoad, type SaveSlot } from '@/lib/saveLoadContext'

/**
 * Golden Frog Trail - Authentication & Save/Load Panel
 *
 * Floating panel that provides:
 * - Quick device login
 * - Email/password login
 * - Save/Load buttons
 * - Save slot management
 */

type PanelView = 'collapsed' | 'login' | 'saves' | 'profile'

export function AuthSavePanel() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    loginWithDevice,
    loginWithEmail,
    register,
    logout,
    updateDisplayName,
  } = useAuth()

  const {
    saves,
    currentSlotId,
    saveGame,
    loadGame,
    deleteSave,
    isSaving,
    isLoading: saveLoading,
    lastSaveTime,
    enableAutoSave,
    setEnableAutoSave,
  } = useSaveLoad()

  const [view, setView] = useState<PanelView>('collapsed')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const [saveName, setSaveName] = useState('')

  if (authLoading) {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-amber-900/90 border-2 border-amber-600 rounded-lg px-4 py-2">
        <span className="text-amber-300 text-sm font-pixel animate-pulse">Loading...</span>
      </div>
    )
  }

  // Collapsed button view
  if (view === 'collapsed') {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex gap-2">
        {isAuthenticated ? (
          <>
            <button
              onClick={() => setView('saves')}
              className="bg-amber-900/90 border-2 border-amber-600 rounded-lg px-4 py-2 text-amber-200 hover:bg-amber-800 transition-colors font-pixel text-sm flex items-center gap-2"
            >
              <span>💾</span>
              <span>Save/Load</span>
            </button>
            <button
              onClick={() => setView('profile')}
              className="bg-green-900/90 border-2 border-green-600 rounded-lg px-4 py-2 text-green-200 hover:bg-green-800 transition-colors font-pixel text-sm flex items-center gap-2"
            >
              <span>👤</span>
              <span>{user?.displayName?.slice(0, 8) || 'Profile'}</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setView('login')}
            className="bg-blue-900/90 border-2 border-blue-600 rounded-lg px-4 py-2 text-blue-200 hover:bg-blue-800 transition-colors font-pixel text-sm flex items-center gap-2"
          >
            <span>🔐</span>
            <span>Login to Save</span>
          </button>
        )}
      </div>
    )
  }

  // Panel wrapper
  const panelClasses = "fixed bottom-4 left-4 z-50 bg-gradient-to-b from-gray-900 to-gray-950 border-4 border-amber-600 rounded-lg shadow-2xl w-80 max-h-[80vh] overflow-y-auto"

  // Login view
  if (view === 'login') {
    return (
      <div className={panelClasses}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-pixel text-amber-200 text-sm">
              {isRegistering ? '📝 Create Account' : '🔐 Login'}
            </h3>
            <button
              onClick={() => setView('collapsed')}
              className="text-amber-400 hover:text-amber-200"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded p-2 mb-4 text-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Quick Device Login */}
          {!isRegistering && (
            <div className="mb-4">
              <button
                onClick={async () => {
                  setError('')
                  const success = await loginWithDevice()
                  if (success) {
                    setView('collapsed')
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-green-700 to-green-600 border-2 border-green-500 rounded text-green-100 font-pixel text-sm hover:from-green-600 hover:to-green-500 transition-colors"
              >
                🖥️ Quick Login (This Device)
              </button>
              <p className="text-gray-400 text-[10px] mt-1 text-center">
                Auto-login using this browser/device
              </p>
            </div>
          )}

          <div className="border-t border-gray-700 my-4 pt-4">
            <p className="text-gray-400 text-xs mb-3 text-center">
              {isRegistering ? 'Create account for cross-device sync' : 'Or login with email'}
            </p>

            {/* Email/Password Form */}
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2 bg-gray-800 border-2 border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 bg-gray-800 border-2 border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />

              {isRegistering && (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display Name (optional)"
                  className="w-full px-3 py-2 bg-gray-800 border-2 border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              )}

              <button
                onClick={async () => {
                  setError('')
                  if (isRegistering) {
                    const result = await register(email, password, displayName || undefined)
                    if (result.success) {
                      setView('collapsed')
                    } else {
                      setError(result.error || 'Registration failed')
                    }
                  } else {
                    const result = await loginWithEmail(email, password)
                    if (result.success) {
                      setView('collapsed')
                    } else {
                      setError(result.error || 'Login failed')
                    }
                  }
                }}
                className="w-full py-2 bg-amber-700 border-2 border-amber-500 rounded text-amber-100 font-pixel text-sm hover:bg-amber-600 transition-colors"
              >
                {isRegistering ? 'Create Account' : 'Login'}
              </button>

              <button
                onClick={() => {
                  setIsRegistering(!isRegistering)
                  setError('')
                }}
                className="w-full py-2 text-gray-400 text-xs hover:text-gray-200"
              >
                {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Saves view
  if (view === 'saves') {
    return (
      <div className={panelClasses}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-pixel text-amber-200 text-sm">💾 Save & Load</h3>
            <button
              onClick={() => setView('collapsed')}
              className="text-amber-400 hover:text-amber-200"
            >
              ✕
            </button>
          </div>

          {/* Quick Save */}
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Save name..."
                className="flex-1 px-3 py-2 bg-gray-800 border-2 border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={async () => {
                  const result = await saveGame(saveName || undefined)
                  if (result.success) {
                    setSaveName('')
                  }
                }}
                disabled={isSaving}
                className={`px-4 py-2 rounded font-pixel text-sm transition-colors ${
                  isSaving
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-700 border-2 border-green-500 text-green-100 hover:bg-green-600'
                }`}
              >
                {isSaving ? '...' : 'Save'}
              </button>
            </div>

            {lastSaveTime && (
              <p className="text-gray-500 text-[10px]">
                Last saved: {new Date(lastSaveTime).toLocaleString()}
              </p>
            )}
          </div>

          {/* Auto-save toggle */}
          <div className="flex items-center justify-between mb-4 py-2 border-y border-gray-700">
            <span className="text-gray-300 text-xs">Auto-save every 5 min</span>
            <button
              onClick={() => setEnableAutoSave(!enableAutoSave)}
              className={`px-3 py-1 rounded text-xs font-pixel ${
                enableAutoSave
                  ? 'bg-green-700 text-green-200'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {enableAutoSave ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Save slots */}
          <div className="space-y-2">
            {saves.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">
                No saves yet. Click "Save" to create one!
              </p>
            ) : (
              saves
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map(save => (
                  <SaveSlotCard
                    key={save.id}
                    save={save}
                    isCurrent={save.id === currentSlotId}
                    onLoad={() => loadGame(save.id)}
                    onDelete={() => deleteSave(save.id)}
                    isLoading={saveLoading}
                  />
                ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Profile view
  if (view === 'profile') {
    return (
      <div className={panelClasses}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-pixel text-amber-200 text-sm">👤 Profile</h3>
            <button
              onClick={() => setView('collapsed')}
              className="text-amber-400 hover:text-amber-200"
            >
              ✕
            </button>
          </div>

          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🤠</div>
            <input
              type="text"
              value={user?.displayName || ''}
              onChange={(e) => updateDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border-2 border-gray-600 rounded text-gray-100 text-center font-pixel text-sm focus:outline-none focus:border-amber-500"
            />
            <p className="text-gray-500 text-[10px] mt-1">
              {user?.method === 'device' ? '🖥️ Device Login' : `📧 ${user?.email}`}
            </p>
          </div>

          <div className="border-t border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Saves:</span>
              <span className="text-amber-200">{saves.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Member since:</span>
              <span className="text-amber-200">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              logout()
              setView('collapsed')
            }}
            className="w-full mt-4 py-2 bg-red-900 border-2 border-red-700 rounded text-red-200 font-pixel text-sm hover:bg-red-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return null
}

// Save slot card component
function SaveSlotCard({
  save,
  isCurrent,
  onLoad,
  onDelete,
  isLoading,
}: {
  save: SaveSlot
  isCurrent: boolean
  onLoad: () => void
  onDelete: () => void
  isLoading: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      className={`p-3 rounded border-2 ${
        isCurrent
          ? 'bg-amber-900/50 border-amber-500'
          : 'bg-gray-800/50 border-gray-600'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-amber-200 text-sm font-pixel">
            {save.id === 'autosave' ? '🔄 ' : ''}{save.name}
          </p>
          <p className="text-gray-500 text-[10px]">
            {new Date(save.timestamp).toLocaleString()}
          </p>
        </div>
        {isCurrent && (
          <span className="text-green-400 text-[10px] font-pixel">CURRENT</span>
        )}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-400 mb-2">
        <span>📅 Day {save.metadata.dayNumber}</span>
        <span>📍 {save.metadata.currentLocation}</span>
        <span>🛤️ {save.metadata.distance} miles</span>
        <span>👥 Party: {save.metadata.partySize}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onLoad}
          disabled={isLoading || isCurrent}
          className={`flex-1 py-1 rounded text-xs font-pixel ${
            isCurrent
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-700 text-blue-100 hover:bg-blue-600'
          }`}
        >
          {isLoading ? '...' : 'Load'}
        </button>

        {confirmDelete ? (
          <>
            <button
              onClick={() => {
                onDelete()
                setConfirmDelete(false)
              }}
              className="px-2 py-1 bg-red-700 text-red-100 rounded text-xs"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
            >
              No
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-2 py-1 bg-gray-700 text-gray-300 hover:bg-red-800 hover:text-red-200 rounded text-xs"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  )
}

export default AuthSavePanel
