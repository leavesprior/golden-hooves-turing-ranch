'use client'

import { useEffect, useState, type ReactNode } from 'react'

/** Click the place picture; it comes to the front until Close. Does not auto. */
export function PlacePictureFront({
  src,
  open,
  onClose,
}: {
  src: string
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      role="dialog"
      aria-label="Place picture"
      data-testid="place-picture-front"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        data-testid="place-picture-front-img"
        className="max-h-full max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        data-testid="place-picture-close"
        className="west-face-pill absolute right-4 top-4"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        Close
      </button>
    </div>
  )
}

export function PlacePictureLift({
  src,
  children,
  className = '',
}: {
  src?: string | null
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  if (!src) return <>{children}</>
  return (
    <>
      <div className={`relative h-full w-full ${className}`}>
        {children}
        <button
          type="button"
          data-testid="place-picture-open"
          aria-label="Look at this place"
          className="absolute inset-0 z-[8] h-full w-full min-h-11 cursor-zoom-in bg-transparent"
          onClick={() => setOpen(true)}
        >
          <span className="absolute bottom-2 right-2 rounded-sm bg-black/60 px-2 py-0.5 font-serif text-[10px] text-[#e8dcc4]">
            Look
          </span>
        </button>
      </div>
      <PlacePictureFront src={src} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
