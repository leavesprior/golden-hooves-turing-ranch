'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getKarmaSessionId } from '@/lib/karmaServerSync'

// Optional sign-in. Guests keep playing with their browser session id; signing in LINKS
// that session to an account (email + a server-generated >=512-bit key). The key is shown
// ONCE at registration (recovery-key model) — the server stores only a scrypt hash.
//
// Security notes surfaced to the player: the key cannot be recovered; save it. QSD entropy
// is a gated future upgrade (mixed with CSPRNG, never sole) — shown as a status line only.

type Me = { signedIn: boolean; email?: string; entropySource?: string }

export function SignInPanel() {
  const [me, setMe] = useState<Me | null>(null)
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [email, setEmail] = useState('')
  const [credential, setCredential] = useState('')
  const [issuedKey, setIssuedKey] = useState('')          // shown once after register
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const refreshMe = useCallback(async () => {
    try {
      const r = await fetch('/api/account/me', { cache: 'no-store' })
      const d = await r.json()
      setMe({ signedIn: !!d.signedIn, email: d.email, entropySource: d.entropySource })
    } catch {
      setMe({ signedIn: false })
    }
  }, [])

  useEffect(() => { void refreshMe() }, [refreshMe])

  const handleRegister = async () => {
    setBusy(true); setMsg(''); setIssuedKey('')
    try {
      const r = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), sessionId: getKarmaSessionId() }),
      })
      const d = await r.json()
      if (!d.ok) { setMsg(d.reason === 'email_unavailable' ? 'That email is unavailable.' : `Error: ${d.reason}`); return }
      setIssuedKey(d.credential)
      setMsg(`Account created (${d.credentialBits}-bit key, ${d.entropySource}).`)
      // NOTE: do NOT refreshMe() here — that would flip to the signed-in view and hide
      // the unrecoverable key. The key panel calls refreshMe() when the user acknowledges.
    } catch { setMsg('Network error.') } finally { setBusy(false) }
  }

  const handleLogin = async () => {
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), credential: credential.trim(), sessionId: getKarmaSessionId() }),
      })
      const d = await r.json()
      if (!d.ok) { setMsg('Invalid email or key.'); return }
      setMsg(`Signed in as ${d.email}.`)
      setCredential('')
      await refreshMe()
    } catch { setMsg('Network error.') } finally { setBusy(false) }
  }

  // A freshly-issued key MUST stay on screen until the user acknowledges saving it —
  // it is unrecoverable, so this takes priority over the signed-in view.
  if (issuedKey) {
    return (
      <div className="p-3 border-2 border-red-600 bg-red-950/40 rounded font-pixel text-xs text-amber-100 space-y-2">
        <div className="text-red-300">YOUR KEY — save it NOW. Shown once, cannot be recovered:</div>
        <code className="block break-all text-[11px] text-amber-200 select-all bg-black/50 p-2 rounded">{issuedKey}</code>
        <div className="text-amber-400/80">{msg}</div>
        <button
          onClick={() => { navigator.clipboard?.writeText(issuedKey).catch(() => {}) }}
          className="px-2 py-1 rounded border border-amber-500 text-amber-200 hover:bg-amber-800/40 mr-2"
        >Copy key</button>
        <button
          onClick={() => { setIssuedKey(''); void refreshMe() }}
          className="px-2 py-1 rounded border border-green-600 text-green-300 hover:bg-green-900/30"
        >I&apos;ve saved my key</button>
      </div>
    )
  }

  if (me?.signedIn) {
    return (
      <div className="p-3 border-2 border-amber-600 bg-amber-900/20 rounded text-amber-100 font-pixel text-xs">
        <div>Signed in as <span className="text-amber-300">{me.email}</span></div>
        <div className="text-amber-400/70 mt-1">entropy: {me.entropySource ?? 'csprng'}</div>
      </div>
    )
  }

  return (
    <div className="p-3 border-2 border-amber-700 bg-black/40 rounded font-pixel text-xs text-amber-100 space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => { setMode('register'); setMsg(''); setIssuedKey('') }}
          className={`px-2 py-1 rounded border ${mode === 'register' ? 'border-amber-400 text-amber-200' : 'border-gray-700 text-gray-500'}`}
        >Create</button>
        <button
          onClick={() => { setMode('login'); setMsg(''); setIssuedKey('') }}
          className={`px-2 py-1 rounded border ${mode === 'login' ? 'border-amber-400 text-amber-200' : 'border-gray-700 text-gray-500'}`}
        >Sign in</button>
      </div>

      <input
        type="email" placeholder="email" value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-amber-100"
      />

      {mode === 'login' && (
        <input
          type="password" placeholder="your 512-bit key" value={credential}
          onChange={e => setCredential(e.target.value)}
          className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-amber-100"
        />
      )}

      <button
        onClick={mode === 'register' ? handleRegister : handleLogin}
        disabled={busy || !email.trim() || (mode === 'login' && !credential.trim())}
        className="w-full py-2 rounded border-2 border-amber-500 bg-amber-800/40 text-amber-200 hover:bg-amber-800/60 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        {busy ? '...' : mode === 'register' ? 'Create account + generate key' : 'Sign in'}
      </button>

      {msg && <div className="text-amber-300/90">{msg}</div>}
    </div>
  )
}

export default SignInPanel
