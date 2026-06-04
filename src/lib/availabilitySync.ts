import { fetchIcal } from './ical';
import {
  dbReplaceSourceBlocks,
  dbGetBlocksInRange,
  dbGetSyncMeta,
  type BlockSource,
} from './availabilityDb';
import { blockedNightsInWindow } from './ical';
import { dbGetAllBlocks } from './availabilityDb';

/**
 * Wires the READ-ONLY iCal feeds (env) into the local availability store.
 *
 * Feed URLs are host-facing exports — set them in .env.local for the build.
 * Absent env ⇒ that source is simply not synced (no error): the site keeps
 * working with whatever (manual) blocks already exist.
 *
 *   AIRBNB_ICAL_URL=https://www.airbnb.com/calendar/ical/<id>.ics?s=<token>
 *   VRBO_ICAL_URL=http://www.vrbo.com/icalendar/<token>.ics
 */

interface FeedConfig {
  source: Exclude<BlockSource, 'manual'>;
  env: string;
}

const FEEDS: FeedConfig[] = [
  { source: 'airbnb', env: 'AIRBNB_ICAL_URL' },
  { source: 'vrbo', env: 'VRBO_ICAL_URL' },
];

export interface SourceSyncResult {
  source: BlockSource;
  ok: boolean;
  block_count: number;
  error?: string;
}

export interface SyncReport {
  ran_at: string;
  results: SourceSyncResult[];
  configured_sources: number;
}

/** Sync every configured feed. One feed failing does not abort the others. */
export async function syncAllFeeds(): Promise<SyncReport> {
  const results: SourceSyncResult[] = [];
  let configured = 0;

  for (const feed of FEEDS) {
    const url = process.env[feed.env];
    if (!url) continue; // unconfigured source — skip silently
    configured++;
    try {
      const events = await fetchIcal(url);
      const count = dbReplaceSourceBlocks(
        feed.source,
        events.map((e) => ({
          uid: e.uid,
          start_date: e.start_date,
          end_date: e.end_date,
          summary: e.summary,
        })),
      );
      results.push({ source: feed.source, ok: true, block_count: count });
    } catch (err) {
      // Leave the prior source rows intact on failure — better a slightly stale
      // calendar than one that falsely shows a reserved date as open.
      results.push({
        source: feed.source,
        ok: false,
        block_count: 0,
        error: (err as Error).message ?? 'unknown error',
      });
    }
  }

  return {
    ran_at: new Date().toISOString(),
    results,
    configured_sources: configured,
  };
}

export interface AvailabilityView {
  range_start: string;
  range_end: string;
  blocked_nights: string[];        // YYYY-MM-DD, sorted unique
  sources: ReturnType<typeof dbGetSyncMeta>;
}

/**
 * Merged availability for the half-open window [rangeStart, rangeEnd),
 * across ALL sources (airbnb + vrbo + manual). The UI renders any date in
 * `blocked_nights` as unavailable; everything else in the window is open.
 */
export function getAvailabilityView(rangeStart: string, rangeEnd: string): AvailabilityView {
  const blocks = dbGetBlocksInRange(rangeStart, rangeEnd);
  const blocked_nights = blockedNightsInWindow(
    blocks.map((b) => ({
      uid: b.uid,
      start_date: b.start_date,
      end_date: b.end_date,
      summary: b.summary,
    })),
    rangeStart,
    rangeEnd,
  );
  return {
    range_start: rangeStart,
    range_end: rangeEnd,
    blocked_nights,
    sources: dbGetSyncMeta(),
  };
}

/** Total stored blocks across all sources — cheap diagnostic for the route. */
export function totalStoredBlocks(): number {
  return dbGetAllBlocks().length;
}
