import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Host print | Back of Beyond Ranch',
  robots: { index: false, follow: false },
}

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return children
}
