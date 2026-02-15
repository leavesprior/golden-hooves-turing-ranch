import { KarmaWalletProvider } from '@/app/oregon-trail/karmaWalletContext'
import { MarketProvider } from './marketContext'

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
