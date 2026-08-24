'use client'
import Link from 'next/link'
import BookStayButton from './BookStayButton'

// Goda: Book always visible. Two paths, never a hamburger of extras.
// Leif: live face is Golden Frog Trail; extra games stay off this bar.
export default function PixelNavigation() {
  return (
    <nav className="bg-[var(--pixel-bg-dark)] border-b-4 border-[var(--pixel-ui-border)] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex justify-between items-center min-h-16 gap-2 py-2">
          <Link href="/" className="font-serif text-[15px] sm:text-lg font-semibold text-[var(--pixel-gold-light)] hover:text-[var(--pixel-gold-mid)] transition-colors inline-flex items-center gap-2 min-h-11 shrink">
            <span aria-hidden>🐸</span>
            <span className="leading-tight">Back of Beyond Ranch</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/oregon-trail"
              className="text-[14px] sm:text-[17px] font-medium text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] transition-colors min-h-11 inline-flex items-center px-1"
            >
              Play
              <span className="hidden sm:inline">&nbsp;Golden Frog Trail</span>
            </Link>
            <BookStayButton size="md" />
          </div>
        </div>
      </div>
    </nav>
  )
}
