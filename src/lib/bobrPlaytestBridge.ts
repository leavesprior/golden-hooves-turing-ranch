import { CrossGameStorage } from '@/lib/crossGameProgression'
import type { LocalCampaignState } from '@/lib/bobrLocalCampaign'

export const PLAYTEST_SYNC_ENABLED =
  process.env.NEXT_PUBLIC_BOBR_PLAYTEST_SYNC === '1' ||
  process.env.NEXT_PUBLIC_BOBR_PLAYTEST_SYNC === 'true'

export function syncPlaytestOutcome(previous: LocalCampaignState, next: LocalCampaignState): boolean {
  if (!PLAYTEST_SYNC_ENABLED || previous.chapter === next.chapter) return false

  if (next.chapter === 'travel') {
    CrossGameStorage.recordMilestone('reached_west_point', 'prospectors_tale', {
      source: 'visual64-playtest', campaignSeed: next.seed,
    })
    CrossGameStorage.logEvent('prospectors_tale', 'landmark_reached', 'Reached Gold Country through the Honest Trail', {
      locationId: 'west_point', detail: 'A Visual64 playtest journey carried trail consequences into Gold Country.',
    })
    return true
  }

  if (next.chapter === 'resolved') {
    const proof = next.casebook.find((entry) => entry.id === 'volcano-proof')
    CrossGameStorage.recordMilestone('explorer_first_mystery_solved', 'gold_country_explorer', {
      source: 'visual64-playtest', campaignSeed: next.seed, town: 'volcano',
    })
    CrossGameStorage.logEvent('gold_country_explorer', 'mystery_solved', 'Solved the false assay case in Volcano', {
      locationId: 'volcano',
      karmaDelta: next.resources.goodKarma - previous.resources.goodKarma,
      detail: proof?.detail,
    })
    return true
  }

  if (next.chapter === 'future') {
    CrossGameStorage.logEvent('gold_country_explorer', 'time_echo_found', 'Left a trustworthy future witness at the ranch', {
      locationId: 'bobr_ranch', flagSet: 'future_witness_revealed',
      detail: 'A verified local action became evidence another player can discover.',
    })
    return true
  }

  return false
}
