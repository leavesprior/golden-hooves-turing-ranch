'use client'

// Registers the service worker and offers a lightweight "install" affordance
// (2026-06-18). Additive + safe: if SW/install aren't supported it renders nothing.
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const DISMISSED_KEY = 'bobr_install_dismissed'

/**
 * Playtest 2026-09-23: the fixed bottom-left chip (z-[9999]) sat on top of the
 * trail's title Play button (780x431: the game could not start) and the
 * fixed bottom-left "Pioneer" save chip on every trail screen. The game owns
 * that corner, so never offer the install chip on /oregon-trail, and a dismissal
 * sticks across visits instead of only this tab session.
 */
export function shouldShowInstallBanner(pathname: string | null, dismissed: boolean): boolean {
  if (dismissed) return false
  return !(pathname === '/oregon-trail' || pathname?.startsWith('/oregon-trail/'))
}

function readDismissed(): boolean {
  try { return localStorage.getItem(DISMISSED_KEY) === '1' } catch { return false }
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function RegisterSW() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!show || !deferred || !shouldShowInstallBanner(pathname, readDismissed())) return null

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
        onClick={() => { setShow(false); try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* ignore */ } }}
        aria-label="Dismiss"
        className="read-body text-[16px] text-[var(--read-ink)]/70 hover:text-[var(--read-ink)]"
      >
        ✕
      </button>
    </div>
  )
}
