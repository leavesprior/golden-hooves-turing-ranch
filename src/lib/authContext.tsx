'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

/**
 * Golden Frog Trail - User Authentication Context
 *
 * Supports two authentication methods:
 * 1. Device Fingerprint - Automatic login based on browser characteristics
 * 2. Email/Password - Traditional login for cross-device sync
 */

export type AuthMethod = 'device' | 'email'

export interface User {
  id: string
  method: AuthMethod
  email?: string
  displayName?: string
  createdAt: string
  lastLoginAt: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  method: AuthMethod | null
}

interface AuthContextType extends AuthState {
  // Authentication methods
  loginWithDevice: () => Promise<boolean>
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void

  // User profile
  updateDisplayName: (name: string) => void

  // Device fingerprint
  getDeviceFingerprint: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'golden_frog_auth'
const USERS_STORAGE_KEY = 'golden_frog_users'

/**
 * Generate a device fingerprint using browser characteristics
 * Note: This is privacy-friendly and doesn't track personal info
 */
function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'ssr'

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    // Canvas fingerprint (basic)
    (() => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.textBaseline = 'top'
          ctx.font = '14px Arial'
          ctx.fillText('GoldenFrog', 2, 2)
          return canvas.toDataURL().slice(-50)
        }
      } catch {
        return 'canvas-blocked'
      }
      return 'no-canvas'
    })(),
  ]

  // Simple hash function
  const str = components.join('|')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return 'device_' + Math.abs(hash).toString(36)
}

/**
 * Simple password hashing (for localStorage - not production security!)
 */
function hashPassword(password: string): string {
  let hash = 0
  const salt = 'golden_frog_salt_2025'
  const str = password + salt
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

interface StoredUser {
  id: string
  email?: string
  passwordHash?: string
  displayName?: string
  method: AuthMethod
  createdAt: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    method: null,
  })

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY)
        if (stored) {
          const user = JSON.parse(stored) as User
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            method: user.method,
          })
        } else {
          setState(prev => ({ ...prev, isLoading: false }))
        }
      } catch (e) {
        console.error('Failed to load auth state:', e)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    loadUser()
  }, [])

  const getDeviceFingerprint = useCallback(() => {
    return generateDeviceFingerprint()
  }, [])

  // Login with device fingerprint
  const loginWithDevice = useCallback(async (): Promise<boolean> => {
    const fingerprint = generateDeviceFingerprint()

    // Check if device user exists
    const usersStr = localStorage.getItem(USERS_STORAGE_KEY)
    const users: StoredUser[] = usersStr ? JSON.parse(usersStr) : []

    let user = users.find(u => u.id === fingerprint && u.method === 'device')

    if (!user) {
      // Create new device user
      user = {
        id: fingerprint,
        method: 'device',
        createdAt: new Date().toISOString(),
      }
      users.push(user)
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    }

    const authUser: User = {
      id: user.id,
      method: 'device',
      displayName: user.displayName || 'Pioneer',
      createdAt: user.createdAt,
      lastLoginAt: new Date().toISOString(),
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser))

    setState({
      user: authUser,
      isAuthenticated: true,
      isLoading: false,
      method: 'device',
    })

    return true
  }, [])

  // Login with email/password
  const loginWithEmail = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.toLowerCase().trim()

    const usersStr = localStorage.getItem(USERS_STORAGE_KEY)
    const users: StoredUser[] = usersStr ? JSON.parse(usersStr) : []

    const user = users.find(
      u => u.email === normalizedEmail &&
           u.method === 'email' &&
           u.passwordHash === hashPassword(password)
    )

    if (!user) {
      return { success: false, error: 'Invalid email or password' }
    }

    const authUser: User = {
      id: user.id,
      method: 'email',
      email: user.email,
      displayName: user.displayName || normalizedEmail.split('@')[0],
      createdAt: user.createdAt,
      lastLoginAt: new Date().toISOString(),
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser))

    setState({
      user: authUser,
      isAuthenticated: true,
      isLoading: false,
      method: 'email',
    })

    return { success: true }
  }, [])

  // Register new email user
  const register = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.toLowerCase().trim()

    if (!normalizedEmail.includes('@')) {
      return { success: false, error: 'Invalid email format' }
    }

    if (password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters' }
    }

    const usersStr = localStorage.getItem(USERS_STORAGE_KEY)
    const users: StoredUser[] = usersStr ? JSON.parse(usersStr) : []

    // Check if email already exists
    if (users.find(u => u.email === normalizedEmail)) {
      return { success: false, error: 'Email already registered' }
    }

    // Create new user
    const newUser: StoredUser = {
      id: 'email_' + Date.now().toString(36) + Math.random().toString(36).slice(2),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      displayName: displayName || normalizedEmail.split('@')[0],
      method: 'email',
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))

    // Auto-login after registration
    const authUser: User = {
      id: newUser.id,
      method: 'email',
      email: newUser.email,
      displayName: newUser.displayName,
      createdAt: newUser.createdAt,
      lastLoginAt: new Date().toISOString(),
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser))

    setState({
      user: authUser,
      isAuthenticated: true,
      isLoading: false,
      method: 'email',
    })

    return { success: true }
  }, [])

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      method: null,
    })
  }, [])

  // Update display name
  const updateDisplayName = useCallback((name: string) => {
    if (!state.user) return

    const updatedUser = { ...state.user, displayName: name }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser))

    // Also update in users list
    const usersStr = localStorage.getItem(USERS_STORAGE_KEY)
    const users: StoredUser[] = usersStr ? JSON.parse(usersStr) : []
    const userIndex = users.findIndex(u => u.id === state.user?.id)
    if (userIndex >= 0) {
      users[userIndex].displayName = name
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    }

    setState(prev => ({ ...prev, user: updatedUser }))
  }, [state.user])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginWithDevice,
        loginWithEmail,
        register,
        logout,
        updateDisplayName,
        getDeviceFingerprint,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
