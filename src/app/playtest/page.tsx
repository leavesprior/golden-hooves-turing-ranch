import type { Metadata } from 'next'
import { BobrLocalCampaign } from '@/components/playtest/BobrLocalCampaign'

export const metadata: Metadata = {
  title: 'BOBR Local Campaign | Playtest Build',
  description: 'Local end-to-end campaign build for stress testing the BOBR game loop.',
  robots: { index: false, follow: false },
}

export default function PlaytestPage() {
  return <BobrLocalCampaign />
}
