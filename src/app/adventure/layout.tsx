import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Diggings | Back of Beyond Ranch',
  description: 'Five chapters in Gold Country after the wagon — Volcano, Angels Camp, and Back of Beyond Ranch. The Prospector’s Tale is the road west; The Diggings is the years in the towns.',
  openGraph: {
    title: 'The Diggings | Back of Beyond Ranch',
    description: 'Five chapters in Gold Country after the wagon — Volcano, Angels Camp, and Back of Beyond Ranch.',
    type: 'website',
  },
}

export default function AdventureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
