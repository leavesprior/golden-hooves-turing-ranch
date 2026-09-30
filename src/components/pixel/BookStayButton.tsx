'use client'

import { useCallback, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import PixelButton, { type PixelButtonProps } from './PixelButton'
import { arcadeBookHref, readArcadeAccess } from '@/lib/arcadeFirstLevel'
import { airbnbBookingLink } from '@/lib/airbnbLink'
import BookingPicker from '@/components/rentals/BookingPicker'

type Props = Omit<PixelButtonProps, 'href' | 'onClick' | 'children'> & {
  children?: ReactNode
  /** false = plain Airbnb link (e.g. "Message on Airbnb"), no date picker. */
  picker?: boolean
}

const SERVER_BOOK_HREF = airbnbBookingLink('arcade-book', 'site')

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}

function getBookHref() {
  return arcadeBookHref(readArcadeAccess({
    search: window.location.search,
    referrer: document.referrer,
  }))
}

/**
 * Goda primary path: Book is always Airbnb.
 * EV/overnight and trail-win only change the UTM, not the door.
 *
 * A plain left click opens the date picker (BookingPicker); the href stays a
 * real Airbnb link for crawlers, no-JS, and modifier/middle clicks.
 */
export default function BookStayButton({
  children = 'Book Your Stay',
  variant = 'gold',
  size = 'md',
  picker = true,
  ...rest
}: Props) {
  const href = useSyncExternalStore(subscribe, getBookHref, () => SERVER_BOOK_HREF)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  const button = (
    <PixelButton href={href} variant={variant} size={size} {...rest}>
      {children}
    </PixelButton>
  )
  if (!picker) return button

  function onClickCapture(e: MouseEvent) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    setOpen(true)
  }

  return (
    <>
      <span onClickCapture={onClickCapture} style={{ display: 'contents' }}>
        {button}
      </span>
      {/* Portal: escape any transformed/stacked ancestor so the overlay covers the page. */}
      {open && createPortal(<BookingPicker onClose={close} />, document.body)}
    </>
  )
}
