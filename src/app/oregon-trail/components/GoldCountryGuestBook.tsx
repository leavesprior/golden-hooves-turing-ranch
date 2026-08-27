'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  guestBookPages,
  signGuestBook,
  type GuestBookLine,
} from '@/lib/goldCountryGuestBook'

export function GoldCountryGuestBook({
  playerName,
  alreadyRead,
  onFirstRead,
  onStreet,
}: {
  playerName: string
  alreadyRead: boolean
  onFirstRead: () => void
  onStreet: () => void
}) {
  const [lines, setLines] = useState<GuestBookLine[]>(() => guestBookPages())
  const [note, setNote] = useState('')
  const [signed, setSigned] = useState(false)

  const host = useMemo(() => lines[0], [lines])

  useEffect(() => {
    if (!alreadyRead) onFirstRead()
    // first open stamps the L2 pin; parent owns alreadyRead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSign = () => {
    const line = signGuestBook(playerName || 'A traveler', note)
    if (!line) return
    setLines(guestBookPages())
    setNote('')
    setSigned(true)
    if (!alreadyRead) onFirstRead()
  }

  return (
    <div className="west-face-shell min-h-screen" data-testid="guest-book">
      <header className="px-4 py-3 border-b border-[var(--west-line)] flex items-start justify-between gap-3">
        <div>
          <p className="west-face-eyebrow">The table · 1849</p>
          <h1 className="west-face-title text-3xl">Guest book</h1>
          <p className="west-face-body mt-1 max-w-xl">
            Names already on the ridge. Sign if you mean to be remembered.
          </p>
        </div>
        <button type="button" className="west-face-pill shrink-0" onClick={onStreet}>
          Porch
        </button>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="west-face-paper">
          <p className="west-face-eyebrow mb-3">Who has passed</p>
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.id} data-testid={`guest-line-${line.id}`}>
                <p className="font-serif text-[#e8dcc4]">{line.name}</p>
                <p className="font-serif text-sm text-[#cbbfa6] italic">&ldquo;{line.note}&rdquo;</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="west-face-paper">
          <p className="west-face-eyebrow mb-2">Sign the book</p>
          <p className="west-face-body text-sm mb-3">
            {host?.note}
          </p>
          <p className="font-serif text-[#e8dcc4] mb-2">{playerName || 'A traveler'}</p>
          <textarea
            data-testid="guest-book-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={180}
            rows={3}
            placeholder="A line for the next traveler…"
            className="w-full rounded-lg border border-[var(--west-line)] bg-black/40 p-3 font-serif text-[#e8dcc4] min-h-11"
          />
          <button
            type="button"
            data-testid="guest-book-sign"
            className="west-face-pill west-face-pill-cream w-full justify-center mt-3"
            disabled={!note.trim()}
            onClick={handleSign}
          >
            Sign
          </button>
          {signed && (
            <p className="west-face-body text-sm mt-2" data-testid="guest-book-signed">
              The ink is still wet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
