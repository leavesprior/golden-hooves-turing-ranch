'use client'
// MedicineShop — the 1849 general-store shelf where a miner buys medicine.
// Self-contained + presentational: it reads the pure catalog from perilEconomy and
// reports a purchase up via onBuy; the PARENT performs the karma spend
// (handleSpendKarma) and increments the dose counter. No wallet/state logic here, so
// it drops into play/page.tsx behind NEXT_PUBLIC_PERIL without touching its internals.
//
// Styling evokes a gritty CRPG shop panel (Fallout-shelf feel) in period dress —
// lamp-lit dark wood, parchment card faces — not isometric art (that's the larger
// world-render effort; this is the transactional screen).

import React from 'react'
import { MEDICINE_CATALOG, quotePurchase, type MedicineItem, type PriceModifiers } from './perilEconomy'

export interface MedicineShopProps {
  neutralKarma: number
  doses: number
  mods?: PriceModifiers
  storeName?: string
  onBuy: (item: MedicineItem, price: number) => void
  onClose: () => void
}

const C = {
  wood:   '#2a1d12',
  wood2:  '#3a2817',
  lamp:   '#e8b04b',
  parch:  '#efe3c8',
  ink:    '#2c2115',
  faded:  '#8a7a5c',
  ok:     '#6b8e4e',
  broke:  '#7a3b34',
}

export default function MedicineShop({
  neutralKarma, doses, mods = {}, storeName = 'General Store — Anno 1849', onBuy, onClose,
}: MedicineShopProps) {
  return (
    <div role="dialog" aria-label="General store" style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(8,5,2,0.72)', zIndex: 50, padding: '1rem',
    }}>
      <div style={{
        width: 'min(640px, 96vw)', maxHeight: '90vh', overflowY: 'auto',
        background: `linear-gradient(${C.wood2}, ${C.wood})`,
        border: `2px solid ${C.lamp}`, borderRadius: 10,
        boxShadow: `0 0 60px rgba(232,176,75,0.25), inset 0 0 40px rgba(0,0,0,0.5)`,
        color: C.parch, fontFamily: 'Georgia, "Times New Roman", serif',
      }}>
        {/* header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.9rem 1.1rem', borderBottom: `1px solid ${C.lamp}`,
        }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: C.lamp, letterSpacing: '0.02em' }}>🏪 {storeName}</div>
            <div style={{ fontSize: '0.82rem', color: C.faded, fontStyle: 'italic' }}>“Cures, tonics &amp; sundries — cash on the barrel.”</div>
          </div>
          <button onClick={onClose} aria-label="Leave the store" style={{
            background: 'transparent', border: `1px solid ${C.faded}`, color: C.parch,
            borderRadius: 6, padding: '0.35rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit',
          }}>Leave ✕</button>
        </div>

        {/* purse */}
        <div style={{
          display: 'flex', gap: '1.25rem', padding: '0.6rem 1.1rem',
          borderBottom: `1px solid ${C.wood}`, fontSize: '0.95rem',
        }}>
          <span>Purse: <strong style={{ color: C.lamp }}>🌮 {neutralKarma}</strong></span>
          <span>Medicine on hand: <strong style={{ color: C.lamp }}>{doses} dose{doses === 1 ? '' : 's'}</strong></span>
        </div>

        {/* shelf */}
        <div style={{ padding: '0.75rem 1.1rem 1.1rem' }}>
          {MEDICINE_CATALOG.map(item => {
            const q = quotePurchase(item, neutralKarma, mods)
            return (
              <div key={item.id} style={{
                display: 'flex', gap: '0.9rem', alignItems: 'center',
                background: C.parch, color: C.ink, borderRadius: 8, padding: '0.7rem 0.85rem',
                margin: '0.55rem 0', border: '1px solid #cdbb92',
                boxShadow: '0 2px 0 rgba(0,0,0,0.3)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.02rem' }}>
                    {item.label}
                    {item.bestFor && <span style={{ color: C.ok, fontSize: '0.75rem', marginLeft: 8 }}>◆ best for {item.bestFor}</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#5b4a2e' }}>{item.blurb}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b5a3a', marginTop: 2 }}>eases {item.severityReduction} severity{item.severityReduction > 1 ? ' levels' : ''} · revives the dying</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 96 }}>
                  <div style={{ fontWeight: 700, color: C.ink }}>🌮 {q.price}</div>
                  <button
                    disabled={!q.affordable}
                    onClick={() => q.affordable && onBuy(item, q.price)}
                    style={{
                      marginTop: 4, padding: '0.35rem 0.8rem', borderRadius: 6, cursor: q.affordable ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', fontWeight: 700, border: 'none',
                      background: q.affordable ? C.ok : '#b7a888', color: q.affordable ? '#f4f0e2' : '#6b5a3a',
                      opacity: q.affordable ? 1 : 0.8,
                    }}
                    title={q.affordable ? `Buy ${item.label}` : `Need 🌮 ${q.shortfall} more`}
                  >{q.affordable ? 'Buy' : `Short 🌮${q.shortfall}`}</button>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ padding: '0 1.1rem 1rem', fontSize: '0.78rem', color: C.faded, fontStyle: 'italic' }}>
          A dose cures on the spot; out here on the trail, a steady hand (Expertise) can stretch what you carry.
        </div>
      </div>
    </div>
  )
}
