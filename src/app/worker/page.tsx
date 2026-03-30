'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Config ─────────────────────────────────────────────────────────────────

const MONTHS_CONFIG = [
  { key: '2025-12', label: 'December 2025', dueDate: '2025-12-01', initiallyPaid: true },
  { key: '2026-01', label: 'January 2026',  dueDate: '2026-01-01', initiallyPaid: true },
  { key: '2026-02', label: 'February 2026', dueDate: '2026-02-01', initiallyPaid: false },
  { key: '2026-03', label: 'March 2026',    dueDate: '2026-03-01', initiallyPaid: false },
  { key: '2026-04', label: 'April 2026',    dueDate: '2026-04-04', initiallyPaid: false },
];

const RENT_AMOUNT     = 500;
const STD_RENT_RATE   = 25;   // $25/hr toward rent (20 hrs = $500)
const BONUS_RENT_RATE = 30;   // $30/hr snow/summer → upcoming month when caught up
const CASH_RATE       = 20;   // $20/hr cash when fully caught up
const CASH_BONUS_RATE = 30;   // $30/hr snow/summer cash

interface Entry {
  id: string;
  date: string;
  hours: number;
  description: string;
  condition: string;
  applies_to: string;
  rate: number;
  rent_value: number;
  cash_value: number;
  worker_name: string;
  created_at: string;
}

// ─── Calculation helpers ─────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function todayDate() {
  const d = new Date(); d.setHours(0,0,0,0); return d;
}

function monthRentValue(entries: Entry[], key: string): number {
  const cfg = MONTHS_CONFIG.find(m => m.key === key);
  if (cfg?.initiallyPaid) return RENT_AMOUNT;
  return entries.filter(e => e.applies_to === key).reduce((s, e) => s + e.rent_value, 0);
}

function isMonthPaid(entries: Entry[], key: string): boolean {
  return monthRentValue(entries, key) >= RENT_AMOUNT;
}

function overdueMonths(entries: Entry[]) {
  const today = todayDate();
  return MONTHS_CONFIG.filter(m => {
    if (m.initiallyPaid || isMonthPaid(entries, m.key)) return false;
    return new Date(m.dueDate + 'T00:00:00') <= today;
  });
}

function caughtUp(entries: Entry[]) {
  return overdueMonths(entries).length === 0;
}

function upcomingMonth(entries: Entry[]) {
  const today = todayDate();
  return MONTHS_CONFIG.find(m => {
    if (m.initiallyPaid || isMonthPaid(entries, m.key)) return false;
    return new Date(m.dueDate + 'T00:00:00') > today;
  });
}

function upcomingPaid(entries: Entry[]) {
  const um = upcomingMonth(entries);
  if (!um) return true;
  return isMonthPaid(entries, um.key);
}

function canLogCash(entries: Entry[]) {
  return caughtUp(entries) && upcomingPaid(entries);
}

function isBonusEligible(entries: Entry[], applyTo: string, condition: string) {
  if (condition === 'regular') return false;
  if (!caughtUp(entries)) return false;
  const um = upcomingMonth(entries);
  return !!um && applyTo === um.key;
}

function effectiveRate(entries: Entry[], applyTo: string, condition: string): number | null {
  if (applyTo === 'cash') {
    if (!canLogCash(entries)) return null;
    return (condition === 'snow' || condition === 'summer') ? CASH_BONUS_RATE : CASH_RATE;
  }
  if (isBonusEligible(entries, applyTo, condition)) return BONUS_RENT_RATE;
  return STD_RENT_RATE;
}

function overallStatus(entries: Entry[]): 'green' | 'yellow' | 'red' {
  const n = overdueMonths(entries).length;
  if (n === 0) return 'green';
  if (n === 1) return 'yellow';
  return 'red';
}

function fmtDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Styles (inline — no dependency on site theme) ───────────────────────────

const S = {
  page: { minHeight: '100vh', background: '#f3f4f6', paddingBottom: '3rem' } as React.CSSProperties,
  header: { background: '#1e293b', color: 'white', padding: '1rem 1.25rem' } as React.CSSProperties,
  h1: { fontSize: '1.25rem', fontWeight: 800, margin: 0 } as React.CSSProperties,
  sub: { fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 } as React.CSSProperties,
  banner: (color: string, textColor = 'white'): React.CSSProperties => ({
    background: color, color: textColor,
    padding: '0.75rem 1.25rem', fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.4,
  }),
  main: { maxWidth: 560, margin: '0 auto', padding: '1rem' } as React.CSSProperties,
  card: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' } as React.CSSProperties,
  cardTitle: { fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#6b7280', marginBottom: '0.9rem', paddingBottom: '0.6rem', borderBottom: '1px solid #e5e7eb' },
  monthRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0', borderBottom: '1px solid #f3f4f6' } as React.CSSProperties,
  pill: (bg: string, color = 'white'): React.CSSProperties => ({
    background: bg, color, fontSize: '0.62rem', fontWeight: 800, padding: '0.15rem 0.45rem',
    borderRadius: 999, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em',
  }),
  track: { flex: 1, height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden', minWidth: 40 } as React.CSSProperties,
  fill: (pct: number, color: string): React.CSSProperties => ({ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.3s' }),
  val: { fontSize: '0.72rem', color: '#6b7280', whiteSpace: 'nowrap', textAlign: 'right', minWidth: 60 } as React.CSSProperties,
  label: { display: 'block', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#6b7280', marginBottom: 4 },
  input: { width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white' },
  select: { width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white' },
  textarea: { width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white', resize: 'vertical' as const, minHeight: 80 },
  rateBox: (variant?: string): React.CSSProperties => ({
    padding: '0.65rem 0.85rem', borderRadius: 8, fontSize: '0.92rem', fontWeight: 700,
    border: '2px solid', borderColor: variant === 'bonus' ? '#fde68a' : variant === 'cash' ? '#bbf7d0' : variant === 'locked' ? '#fecaca' : '#e5e7eb',
    background: variant === 'bonus' ? '#fffbeb' : variant === 'cash' ? '#f0fdf4' : variant === 'locked' ? '#fef2f2' : '#f8fafc',
    color: variant === 'bonus' ? '#92400e' : variant === 'cash' ? '#166534' : variant === 'locked' ? '#991b1b' : '#111827',
    minHeight: 43, display: 'flex', alignItems: 'center',
  }),
  btn: { width: '100%', padding: '0.85rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: 4 } as React.CSSProperties,
  delBtn: { background: 'none', border: '1.5px solid #fecaca', color: '#dc2626', borderRadius: 5, padding: '0.2rem 0.45rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, flexShrink: 0 } as React.CSSProperties,
  histRow: { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.6rem 0', borderBottom: '1px solid #f3f4f6' } as React.CSSProperties,
  tag: (variant: string): React.CSSProperties => ({
    display: 'inline-block', fontSize: '0.62rem', fontWeight: 700, padding: '0.12rem 0.4rem', borderRadius: 4, whiteSpace: 'nowrap' as const,
    background: variant === 'snow' ? '#dbeafe' : variant === 'summer' ? '#fef3c7' : variant === 'cash' ? '#dcfce7' : '#f3f4f6',
    color: variant === 'snow' ? '#1d4ed8' : variant === 'summer' ? '#92400e' : variant === 'cash' ? '#166534' : '#374151',
  }),
  ruleItem: { fontSize: '0.88rem', lineHeight: 1.5, display: 'flex', gap: '0.45rem', marginBottom: '0.4rem' } as React.CSSProperties,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function WorkerPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  // Form state
  const [fDate, setFDate] = useState(todayStr());
  const [fHours, setFHours] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fCondition, setFCondition] = useState('regular');
  const [fAppliesTo, setFAppliesTo] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/worker/entries');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      showToast('Could not load entries — check connection');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // Keep applies-to pointed at a valid option when entries change
  useEffect(() => {
    const opts = getApplyOptions(entries);
    if (!opts.find(o => o.value === fAppliesTo) && opts.length > 0) {
      setFAppliesTo(opts[0].value);
    }
  }, [entries, fAppliesTo]);

  function getApplyOptions(ents: Entry[]) {
    const today = todayDate();
    const opts: { value: string; label: string }[] = [];
    MONTHS_CONFIG.forEach(m => {
      if (m.initiallyPaid || isMonthPaid(ents, m.key)) return;
      const due = new Date(m.dueDate + 'T00:00:00');
      const overdue = due <= today;
      opts.push({ value: m.key, label: m.label + (overdue ? ' (catch-up)' : ' (upcoming)') });
    });
    if (canLogCash(ents)) {
      opts.push({ value: 'cash', label: 'Cash Pay (Paid Weekly)' });
    }
    return opts;
  }

  // Derived rate display
  const hours = parseFloat(fHours) || 0;
  const rate = fAppliesTo ? effectiveRate(entries, fAppliesTo, fCondition) : undefined;
  const value = rate != null ? hours * rate : 0;

  function getRateVariant(): string {
    if (!fAppliesTo || rate == null) return '';
    if (rate === null) return 'locked';
    if (fAppliesTo === 'cash') return 'cash';
    if (isBonusEligible(entries, fAppliesTo, fCondition)) return 'bonus';
    return '';
  }

  function getRateLabel(): string {
    if (!fAppliesTo) return '—';
    if (rate === null) return 'Locked — catch up first';
    if (fAppliesTo === 'cash') return `$${rate}/hr cash`;
    const bonus = isBonusEligible(entries, fAppliesTo, fCondition);
    return `$${rate}/hr toward rent${bonus ? ' ⭐ BONUS' : ''}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fAppliesTo) return showToast('Please choose what these hours apply to');
    if (rate === null) return showToast('Cash work is locked — catch up on back months first');

    const hrs = parseFloat(fHours);
    if (!hrs || hrs <= 0 || hrs > 24) return showToast('Enter hours between 0.25 and 24');
    if (!fDesc.trim()) return showToast('Please describe the work done');

    const isCash = fAppliesTo === 'cash';
    const val = hrs * (rate ?? 0);

    setSubmitting(true);
    try {
      const res = await fetch('/api/worker/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: genId(),
          date: fDate,
          hours: hrs,
          description: fDesc.trim(),
          condition: fCondition,
          applies_to: fAppliesTo,
          rate: rate ?? 0,
          rent_value: isCash ? 0 : val,
          cash_value: isCash ? val : 0,
          worker_name: 'Mike Fisher',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      const data = await res.json();
      setEntries(prev => [data.entry, ...prev]);
      setFHours('');
      setFDesc('');
      setFCondition('regular');
      const msg = isCash
        ? `Logged ${hrs}h — $${val.toFixed(2)} cash earned`
        : `Logged ${hrs}h — $${val.toFixed(2)} toward rent`;
      showToast(msg);
    } catch (err) {
      showToast((err as Error).message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`/api/worker/entries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setEntries(prev => prev.filter(e => e.id !== id));
      showToast('Entry deleted');
    } catch {
      showToast('Could not delete — try again');
    }
  }

  // ─── Render helpers ────────────────────────────────────────────────────────

  const status = overallStatus(entries);
  const overdue = overdueMonths(entries);
  const applyOptions = getApplyOptions(entries);

  const bannerBg = status === 'red' ? '#dc2626' : status === 'yellow' ? '#f59e0b' : '#16a34a';
  const bannerText = status === 'yellow' ? '#1c1917' : 'white';
  const bannerMsg = status === 'red'
    ? `🔴 ${overdue.length} months past due (${overdue.map(m => m.label).join(' + ')}). Catch-up hours at $25/hr — no bonus rates.`
    : status === 'yellow'
    ? `🟡 1 month behind: ${overdue[0]?.label}. Keep working it off at $25/hr.`
    : `🟢 Caught up — great work! Cash pay and bonus rates available.`;

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.header}><h1 style={S.h1}>Back of Beyond Ranch</h1><p style={S.sub}>Loading hours...</p></div>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: 'white', padding: '0.65rem 1.25rem', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', zIndex: 9999, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={S.header}>
        <h1 style={S.h1}>Back of Beyond Ranch</h1>
        <p style={S.sub}>Mike Fisher — Work Hours</p>
      </div>

      {/* Status banner */}
      <div style={S.banner(bannerBg, bannerText)}>{bannerMsg}</div>

      <div style={S.main}>

        {/* Monthly Rent Status */}
        <div style={S.card}>
          <div style={S.cardTitle}>Monthly Rent Status</div>
          {MONTHS_CONFIG.map(m => {
            const paid = isMonthPaid(entries, m.key);
            const rentVal = monthRentValue(entries, m.key);
            const progress = Math.min(100, (rentVal / RENT_AMOUNT) * 100);
            const hrs = m.initiallyPaid ? 20 : entries.filter(e => e.applies_to === m.key).reduce((s,e) => s + e.hours, 0);
            const today = todayDate();
            const due = new Date(m.dueDate + 'T00:00:00');
            const isOverdue = !m.initiallyPaid && !paid && due <= today;
            const isUpcoming = !m.initiallyPaid && !paid && due > today;

            let pillBg = '#16a34a', pillText = 'white', pillLabel = 'PAID';
            let barColor = '#16a34a';
            if (!m.initiallyPaid && !paid) {
              if (isOverdue) {
                pillBg = status === 'yellow' ? '#f59e0b' : '#dc2626';
                pillText = status === 'yellow' ? '#1c1917' : 'white';
                pillLabel = 'OWING';
                barColor = status === 'yellow' ? '#f59e0b' : '#dc2626';
              } else if (isUpcoming) {
                pillBg = '#2563eb'; pillText = 'white';
                const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
                pillLabel = days === 0 ? 'DUE TODAY' : `DUE IN ${days}D`;
                barColor = '#2563eb';
              }
            }

            return (
              <div key={m.key} style={S.monthRow}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', minWidth: 110, lineHeight: 1.2 }}>{m.label}</div>
                <span style={S.pill(pillBg, pillText)}>{pillLabel}</span>
                <div style={S.track}><div style={S.fill(progress, barColor)} /></div>
                <div style={S.val}>${rentVal.toFixed(0)}<br/><span style={{ fontSize: '0.65rem' }}>{hrs.toFixed(1)}h</span></div>
              </div>
            );
          })}

          {/* Total owed */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>Total Past Due:</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: overdue.length > 0 ? '#dc2626' : '#16a34a' }}>
              {overdue.length > 0
                ? `$${overdue.reduce((s, m) => s + (RENT_AMOUNT - monthRentValue(entries, m.key)), 0).toFixed(2)}`
                : '✓ All clear'}
            </span>
          </div>
        </div>

        {/* Log Entry Form */}
        <div style={S.card}>
          <div style={S.cardTitle}>Log Today&apos;s Hours</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={S.label}>Date</label>
                <input style={S.input} type="date" value={fDate} onChange={e => setFDate(e.target.value)} required />
              </div>
              <div>
                <label style={S.label}>Hours</label>
                <input style={S.input} type="number" min="0.25" max="24" step="0.25" placeholder="e.g. 3.5"
                  value={fHours} onChange={e => setFHours(e.target.value)} required />
              </div>
            </div>

            <div>
              <label style={S.label}>What Did You Do?</label>
              <textarea style={S.textarea} placeholder="Describe the work (e.g. cleared snow from driveway, split firewood, fixed fence)..."
                value={fDesc} onChange={e => setFDesc(e.target.value)} required />
            </div>

            <div>
              <label style={S.label}>Conditions</label>
              <select style={S.select} value={fCondition} onChange={e => setFCondition(e.target.value)}>
                <option value="regular">Regular Day</option>
                <option value="snow">❄️ Snow Work</option>
                <option value="summer">☀️ Hot Summer Day</option>
              </select>
            </div>

            <div>
              <label style={S.label}>Applies To</label>
              <select style={S.select} value={fAppliesTo} onChange={e => setFAppliesTo(e.target.value)}>
                {applyOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                {applyOptions.length === 0 && <option value="">All months current</option>}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={S.label}>Rate</label>
                <div style={S.rateBox(getRateVariant())}>{getRateLabel()}</div>
              </div>
              <div>
                <label style={S.label}>Session Value</label>
                <div style={S.rateBox()}>${value.toFixed(2)}</div>
              </div>
            </div>

            <button style={{ ...S.btn, opacity: submitting ? 0.6 : 1 }} type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Log Hours'}
            </button>
          </form>
        </div>

        {/* Work Log History */}
        <div style={S.card}>
          <div style={S.cardTitle}>Work Log History</div>
          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#9ca3af', fontSize: '0.9rem' }}>
              No work logged yet. Use the form above to add your first entry.
            </div>
          ) : (
            entries.map(e => {
              const cfg = MONTHS_CONFIG.find(m => m.key === e.applies_to);
              const applyLabel = e.applies_to === 'cash' ? 'Cash' : (cfg?.label ?? e.applies_to);
              const valLabel = e.applies_to === 'cash'
                ? `$${(e.cash_value).toFixed(2)} cash`
                : `$${(e.rent_value).toFixed(2)} rent`;

              return (
                <div key={e.id} style={S.histRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{e.hours}h</span>
                      <span style={S.tag(e.condition)}>{e.condition === 'snow' ? '❄️' : e.condition === 'summer' ? '☀️' : ''} {e.condition}</span>
                      <span style={S.tag(e.applies_to === 'cash' ? 'cash' : 'default')}>{applyLabel}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: e.applies_to === 'cash' ? '#16a34a' : '#2563eb' }}>{valLabel}</span>
                    </div>
                    <div style={{ fontSize: '0.83rem', color: '#374151', lineHeight: 1.3 }}>{e.description}</div>
                  </div>
                  <button style={S.delBtn} onClick={() => handleDelete(e.id)} title="Delete">✕</button>
                </div>
              );
            })
          )}
        </div>

        {/* Rules */}
        <div style={S.card}>
          <div style={S.cardTitle}>Rules &amp; Rates</div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#374151', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Rent</div>
            {[
              'Monthly rent is $500, due at the start of each month',
              'Rent is worked off by completing 20 hours per month ($25/hr toward the $500)',
              'December 2025 and January 2026 are fully paid',
              'February and March 2026 are still owing — catch-up first',
              'April 2026 rent is due by April 4, 2026',
            ].map((r, i) => <div key={i} style={S.ruleItem}><span style={{ color: '#2563eb', fontWeight: 900 }}>•</span>{r}</div>)}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#374151', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Cash Pay (When Caught Up)</div>
            {[
              'All back months must be fully worked off first',
              'The upcoming month must also be paid before cash work counts',
              'Regular cash rate: $20/hour, paid at end of each week',
            ].map((r, i) => <div key={i} style={S.ruleItem}><span style={{ color: '#2563eb', fontWeight: 900 }}>•</span>{r}</div>)}
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#374151', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Snow &amp; Summer Bonus</div>
            {[
              'Snow work and hot summer days: $30/hr toward rent (only ~16.7 hrs needed to cover the month)',
              'Bonus rate ONLY applies to the upcoming month — not catch-up months',
              'Must be fully caught up to earn the bonus rate',
              'Snow/summer cash work (when caught up) also earns $30/hr',
            ].map((r, i) => <div key={i} style={S.ruleItem}><span style={{ color: '#2563eb', fontWeight: 900 }}>•</span>{r}</div>)}
          </div>
        </div>

      </div>
    </div>
  );
}
