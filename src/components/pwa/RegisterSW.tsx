'use client'

// Registers the service worker and offers a lightweight "install" affordance
// (2026-06-18). Additive + safe: if SW/install aren't supported it renders nothing.
import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function RegisterSW() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      // don't nag if already dismissed this session
      if (sessionStorage.getItem('bobr_install_dismissed') !== '1') setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!show || !deferred) return null

  return (
    <div className="fixed bottom-3 left-3 z-[9999] flex items-center gap-2 rounded border-2 border-[var(--pixel-gold-dark)] bg-[var(--pixel-bg-dark)] px-3 py-2 shadow-lg">
      <button
        onClick={async () => {
          setShow(false)
          try {
            await deferred.prompt()
            await deferred.userChoice
          } catch { /* ignore */ }
          setDeferred(null)
        }}
        className="read-body text-[16px] text-[var(--pixel-gold-light)]"
      >
        Add to Home Screen
      </button>
      <button
        onClick={() => { setShow(false); try { sessionStorage.setItem('bobr_install_dismissed', '1') } catch { /* ignore */ } }}
        aria-label="Dismiss"
        className="read-body text-[16px] text-[var(--read-ink)]/70 hover:text-[var(--read-ink)]"
      >
        ✕
      </button>
    </div>
  )
}
