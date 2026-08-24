'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import PixelButton, { type PixelButtonProps } from './PixelButton'
import { arcadeBookHref, readArcadeAccess } from '@/lib/arcadeFirstLevel'
import { airbnbBookingLink } from '@/lib/airbnbLink'

type Props = Omit<PixelButtonProps, 'href' | 'onClick' | 'children'> & {
  children?: ReactNode
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
 */
export default function BookStayButton({
  children = 'Book Your Stay',
  variant = 'gold',
  size = 'md',
  ...rest
}: Props) {
  const href = useSyncExternalStore(subscribe, getBookHref, () => SERVER_BOOK_HREF)

  return (
    <PixelButton href={href} variant={variant} size={size} {...rest}>
      {children}
    </PixelButton>
  )
}
