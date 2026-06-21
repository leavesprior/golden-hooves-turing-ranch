// Offline fallback shown by the service worker when a navigation fails with no
// network. Static so it can be precached.
export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--pixel-bg-dark)] text-[var(--pixel-ui-text)] p-6 text-center">
      <h1 className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)] mb-3">You&apos;re offline</h1>
      <p className="font-[var(--font-pixel)] text-[11px] max-w-sm leading-relaxed text-[var(--pixel-ui-text)]/80">
        No connection right now — your progress is saved on this device. Reconnect and reopen the trail to keep going.
      </p>
    </main>
  )
}
