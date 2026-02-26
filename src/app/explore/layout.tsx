import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore Gold Country Towns | Back of Beyond Ranch',
  description: 'Discover charming Gold Country towns near Back of Beyond Ranch. Find local dining, historic sites, wineries, and hidden gems in Calaveras County, California.',
  openGraph: {
    title: 'Explore Gold Country Towns | Back of Beyond Ranch',
    description: 'Discover charming Gold Country towns near Back of Beyond Ranch. Find local dining, historic sites, wineries, and hidden gems in Calaveras County, California.',
    type: 'website',
  },
}

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
