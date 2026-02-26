import type { Metadata } from 'next'
import { KarmaWalletProvider } from '@/app/oregon-trail/karmaWalletContext'
import { MarketProvider } from './marketContext'

export const metadata: Metadata = {
  title: 'Karma Market | Back of Beyond Ranch',
  description: 'Spend your hard-earned karma at the Back of Beyond Ranch Karma Market. Redeem in-game rewards for real booking discounts and exclusive ranch experiences.',
  openGraph: {
    title: 'Karma Market | Back of Beyond Ranch',
    description: 'Spend your hard-earned karma at the Back of Beyond Ranch Karma Market. Redeem in-game rewards for real booking discounts and exclusive ranch experiences.',
    type: 'website',
  },
}

export default function KarmaMarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <KarmaWalletProvider>
      <MarketProvider>
        {children}
      </MarketProvider>
    </KarmaWalletProvider>
  )
}
