import { PrologueProvider } from './prologueContext'
import { CharacterProvider } from '@/app/oregon-trail/characterContext'
import { KarmaWalletProvider } from '@/app/oregon-trail/karmaWalletContext'

export default function PrologueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <KarmaWalletProvider>
      <CharacterProvider>
        <PrologueProvider>
          {children}
        </PrologueProvider>
      </CharacterProvider>
    </KarmaWalletProvider>
  )
}
