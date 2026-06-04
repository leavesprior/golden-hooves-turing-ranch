/**
 * Minimal, dependency-free iCalendar (RFC 5545) reader for Airbnb / VRBO
 * availability feeds — READ-ONLY.
 *
 * Hosts can export a per-listing .ics feed of busy/blocked dates. Consuming it
 * is a host-facing export, not scraping and not circumvention. We parse only
 * the date ranges; we never write back.
 *
 * What we handle, deliberately and no more:
 *   - line unfolding (RFC 5545 §3.1: CRLF + space/tab continues the prior line)
 *   - VEVENT extraction
 *   - DTSTART / DTEND as all-day (VALUE=DATE, "YYYYMMDD") or datetime
 *     ("YYYYMMDDTHHMMSSZ") — we reduce everything to a YYYY-MM-DD date
 *   - DTEND is EXCLUSIVE (the checkout day). A missing DTEND ⇒ DTSTART + 1 day.
 *   - UID + SUMMARY passthrough
 *
 * Airbnb summaries look like "Reserved", "Airbnb (Not available)", "Blocked".
 * VRBO uses "Reserved" / "Unavailable". We treat every exported VEVENT as a
 * block — exported events ARE the unavailable ranges.
 */

export interface IcalEvent {
  uid: string;
  start_date: string;  // YYYY-MM-DD inclusive
  end_date: string;    // YYYY-MM-DD EXCLUSIVE (checkout)
  summary: string;
}

/** Unfold folded lines: a CRLF (or LF) followed by space/tab continues. */
function unfold(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const out: string[] = [];
  for (const line of normalized.split('\n')) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

/** Split "DTSTART;VALUE=DATE:20260717" → { name:'DTSTART', value:'20260717' }. */
function parseContentLine(line: string): { name: string; value: string } | null {
  const colon = line.indexOf(':');
  if (colon === -1) return null;
  const namePart = line.slice(0, colon);      // may carry ;params
  const value = line.slice(colon + 1);
  const name = namePart.split(';')[0].toUpperCase();
  return { name, value };
}

/** "20260717" or "20260717T140000Z" → "2026-07-17". Returns '' if unrecognized. */
function toIsoDate(value: string): string {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return '';
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** Add `days` to a YYYY-MM-DD date, returning YYYY-MM-DD (UTC math). */
export function addDays(isoDate: string, days: number): string {
  const t = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(t)) return isoDate;
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Parse an .ics document into block events. Malformed events (no UID, no
 * DTSTART, or unparseable dates) are skipped rather than throwing — a feed is
 * external input and one bad event must not sink the whole import.
 */
export function parseIcal(raw: string): IcalEvent[] {
  const lines = unfold(raw);
  const events: IcalEvent[] = [];

  let inEvent = false;
  let cur: Partial<IcalEvent> & { _dtstart?: string; _dtend?: string } = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      cur = {};
      continue;
    }
    if (trimmed === 'END:VEVENT') {
      if (inEvent) finalizeEvent(cur, events);
      inEvent = false;
      cur = {};
      continue;
    }
    if (!inEvent) continue;

    const parsed = parseContentLine(line);
    if (!parsed) continue;
    switch (parsed.name) {
      case 'UID':
        cur.uid = parsed.value.trim();
        break;
      case 'SUMMARY':
        cur.summary = parsed.value.trim();
        break;
      case 'DTSTART':
        cur._dtstart = parsed.value.trim();
        break;
      case 'DTEND':
        cur._dtend = parsed.value.trim();
        break;
    }
  }

  return events;
}

function finalizeEvent(
  cur: Partial<IcalEvent> & { _dtstart?: string; _dtend?: string },
  out: IcalEvent[],
): void {
  if (!cur._dtstart) return;
  const start = toIsoDate(cur._dtstart);
  if (!start) return;

  // DTEND is exclusive; if absent, an all-day event covers a single night.
  let end = cur._dtend ? toIsoDate(cur._dtend) : '';
  if (!end || end <= start) end = addDays(start, 1);

  out.push({
    uid: cur.uid && cur.uid.length > 0 ? cur.uid : `${start}_${end}`,
    start_date: start,
    end_date: end,
    summary: cur.summary && cur.summary.length > 0 ? cur.summary : 'Blocked',
  });
}

/**
 * Fetch + parse a single iCal feed. READ-ONLY GET with a hard timeout. Returns
 * the parsed events; throws on network/HTTP error so the caller can record the
 * failure per source (one bad feed shouldn't claim the listing is wide open).
 */
export async function fetchIcal(url: string, timeoutMs = 12_000): Promise<IcalEvent[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'text/calendar, text/plain, */*' },
      cache: 'no-store',
    });
    if (!resp.ok) {
      throw new Error(`iCal feed returned HTTP ${resp.status}`);
    }
    const text = await resp.text();
    return parseIcal(text);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Expand block events into the set of individually-blocked nights within
 * [windowStart, windowEnd). A night `d` is blocked when some event covers it,
 * i.e. event.start_date <= d < event.end_date. Returns a sorted unique list of
 * YYYY-MM-DD strings — the shape the calendar UI consumes.
 */
export function blockedNightsInWindow(
  events: IcalEvent[],
  windowStart: string,
  windowEnd: string,
): string[] {
  const blocked = new Set<string>();
  for (const ev of events) {
    let d = ev.start_date < windowStart ? windowStart : ev.start_date;
    const stop = ev.end_date < windowEnd ? ev.end_date : windowEnd;
    while (d < stop) {
      blocked.add(d);
      d = addDays(d, 1);
    }
  }
  return Array.from(blocked).sort();
}
