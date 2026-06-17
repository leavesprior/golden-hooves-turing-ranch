'use client';

import { useState, useEffect, useCallback } from 'react';
import { PixelNavigation } from '@/components/pixel';

// ─── Config ─────────────────────────────────────────────────────────────────
// Second worker tracker — kept deliberately simple: a flat hourly log, no rent /
// cash / bonus / month machinery (that all lives on Mike Fisher's /worker page).
// "For now" the rate is a flat $20/hr; bump HOURLY_RATE if that changes.
const WORKER_NAME = "Danna's friend";
const HOURLY_RATE = 20;          // $/hr — flat, for now
const APPLIES_TO  = 'pay';        // simple bucket; satisfies the shared API schema

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

function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmtDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ─── Styles (inline — no dependency on site theme; mirrors /worker) ──────────
const S = {
  page: { minHeight: '100vh', background: '#f3f4f6', paddingBottom: '3rem' } as React.CSSProperties,
  header: { background: '#1e293b', color: 'white', padding: '1rem 1.25rem' } as React.CSSProperties,
  h1: { fontSize: '1.25rem', fontWeight: 800, margin: 0 } as React.CSSProperties,
  sub: { fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 } as React.CSSProperties,
  banner: { background: '#16a34a', color: 'white', padding: '0.75rem 1.25rem', fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.4 } as React.CSSProperties,
  main: { maxWidth: 560, margin: '0 auto', padding: '1rem' } as React.CSSProperties,
  card: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' } as React.CSSProperties,
  cardTitle: { fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#6b7280', marginBottom: '0.9rem', paddingBottom: '0.6rem', borderBottom: '1px solid #e5e7eb' } as React.CSSProperties,
  label: { display: 'block', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#6b7280', marginBottom: 4 } as React.CSSProperties,
  input: { width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white' } as React.CSSProperties,
  textarea: { width: '100%', padding: '0.65rem 0.85rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white', resize: 'vertical' as const, minHeight: 80 } as React.CSSProperties,
  rateBox: { padding: '0.65rem 0.85rem', borderRadius: 8, fontSize: '0.92rem', fontWeight: 700, border: '2px solid #e5e7eb', background: '#f8fafc', color: '#111827', minHeight: 43, display: 'flex', alignItems: 'center' } as React.CSSProperties,
  btn: { width: '100%', padding: '0.85rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: 4 } as React.CSSProperties,
  delBtn: { background: 'none', border: '1.5px solid #fecaca', color: '#dc2626', borderRadius: 5, padding: '0.2rem 0.45rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, flexShrink: 0 } as React.CSSProperties,
  histRow: { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.6rem 0', borderBottom: '1px solid #f3f4f6' } as React.CSSProperties,
};

export default function DannaWorkerPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const [fDate, setFDate] = useState(todayStr());
  const [fHours, setFHours] = useState('');
  const [fDesc, setFDesc] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/worker/entries?worker=${encodeURIComponent(WORKER_NAME)}`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      showToast('Could not load entries — check connection');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const hours = parseFloat(fHours) || 0;
  const value = hours * HOURLY_RATE;
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const totalEarned = entries.reduce((s, e) => s + (e.cash_value || e.hours * e.rate), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hrs = parseFloat(fHours);
    if (!hrs || hrs <= 0 || hrs > 24) return showToast('Enter hours between 0.25 and 24');
    if (!fDesc.trim()) return showToast('Please describe the work done');

    const val = hrs * HOURLY_RATE;
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
          condition: 'regular',
          applies_to: APPLIES_TO,
          rate: HOURLY_RATE,
          rent_value: 0,
          cash_value: val,
          worker_name: WORKER_NAME,
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
      showToast(`Logged ${hrs}h — $${val.toFixed(2)} earned`);
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
      <PixelNavigation />
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: 'white', padding: '0.65rem 1.25rem', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', zIndex: 9999, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <div style={S.header}>
        <h1 style={S.h1}>Back of Beyond Ranch</h1>
        <p style={S.sub}>{WORKER_NAME} — Work Hours</p>
      </div>

      <div style={S.banner}>🟢 ${HOURLY_RATE}/hr — log your hours below. Paid weekly.</div>

      <div style={S.main}>

        {/* Totals */}
        <div style={S.card}>
          <div style={S.cardTitle}>Totals</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>{totalHours.toFixed(2)} hours logged</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>${totalEarned.toFixed(2)}</span>
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
              <textarea style={S.textarea} placeholder="Describe the work (e.g. split firewood, fixed fence, cleared brush)..."
                value={fDesc} onChange={e => setFDesc(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={S.label}>Rate</label>
                <div style={S.rateBox}>${HOURLY_RATE}/hr</div>
              </div>
              <div>
                <label style={S.label}>Session Value</label>
                <div style={S.rateBox}>${value.toFixed(2)}</div>
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
              No work logged yet. Use the form above to add the first entry.
            </div>
          ) : (
            entries.map(e => (
              <div key={e.id} style={S.histRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{e.hours}h</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>${(e.cash_value || e.hours * e.rate).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: '#374151', lineHeight: 1.3 }}>{e.description}</div>
                </div>
                <button style={S.delBtn} onClick={() => handleDelete(e.id)} title="Delete">✕</button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
