'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useMarket } from '../marketContext'
import {
  PAYMENT_SERVICES,
  DONATION_PRESETS,
  getPaymentUrl,
  calculateDonationKarma,
  type DonationRecord,
} from '../data/donationConfig'

/**
 * C4 fix (2026-06-10 UI test): donations must NEVER mint karma client-side.
 * Integrity rule: money only touches NEUTRAL karma, and NOTHING mints on the
 * client. Submitting a transaction ID now only records a local
 * "pending contribution" — karma is credited after the ranch verifies the
 * payment. Client-side queue is capped to stop spam-storage.
 * TODO: server-side signed-grant verification (see docs/vision2/ECON_KARMA_STEWARDSHIP_20260610.md §2)
 */
interface PendingContribution {
  id: string
  amount: number
  timestamp: number
  status: 'pending_verification'
  paymentService: string
  confirmationCode: string
}

const PENDING_CONTRIBUTIONS_KEY = 'bobr_pending_contributions'
const MAX_PENDING_CONTRIBUTIONS = 5

function loadPendingContributions(): PendingContribution[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PENDING_CONTRIBUTIONS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Dynamic import for qrcode to keep it client-only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let QRCodeLib: any = null

async function loadQRCode() {
  if (!QRCodeLib) {
    // @ts-expect-error - qrcode has no type declarations
    QRCodeLib = await import('qrcode')
  }
  return QRCodeLib
}

export function DonationPanel() {
  const { recordDonation } = useMarket()

  const [selectedService, setSelectedService] = useState(PAYMENT_SERVICES[0].id)
  const [selectedAmount, setSelectedAmount] = useState(10)
  const [bonusType, setBonusType] = useState<'good' | 'bad'>('good')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [confirmCode, setConfirmCode] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [donationComplete, setDonationComplete] = useState(false)
  const [pendingContributions, setPendingContributions] = useState<PendingContribution[]>(loadPendingContributions)
  const [queueFullError, setQueueFullError] = useState(false)

  const pendingQueueFull = pendingContributions.length >= MAX_PENDING_CONTRIBUTIONS

  // Karma calculation for current amount
  const karmaReward = calculateDonationKarma(selectedAmount)

  // Generate QR code when service or amount changes
  useEffect(() => {
    const url = getPaymentUrl(selectedService, selectedAmount)
    if (!url) return

    loadQRCode().then(qr => {
      qr.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#78350f',
          light: '#fef3c7',
        },
      }).then((dataUrl: string) => {
        setQrDataUrl(dataUrl)
      }).catch((err: unknown) => {
        console.warn('QR generation failed:', err)
      })
    })
  }, [selectedService, selectedAmount])

  // Handle donation confirmation — records a PENDING contribution only.
  // NO karma is granted here: client-side minting was exploitable (any fake
  // transaction ID = +100 neutral karma, unlimited). Karma is credited after
  // the ranch verifies the payment.
  // TODO: server-side signed-grant verification (see docs/vision2/ECON_KARMA_STEWARDSHIP_20260610.md §2)
  const handleConfirmDonation = useCallback(() => {
    if (!confirmCode.trim()) return

    // Client-side rate limit: stop spam-storage at MAX_PENDING_CONTRIBUTIONS
    if (pendingContributions.length >= MAX_PENDING_CONTRIBUTIONS) {
      setQueueFullError(true)
      setTimeout(() => setQueueFullError(false), 5000)
      return
    }

    const now = Date.now()

    const pendingRecord: PendingContribution = {
      id: `pend_${now}`,
      amount: selectedAmount,
      timestamp: now,
      status: 'pending_verification',
      paymentService: selectedService,
      confirmationCode: confirmCode.trim(),
    }

    const donation: DonationRecord = {
      id: `don_${now}`,
      timestamp: now,
      dollarAmount: selectedAmount,
      paymentService: selectedService,
      confirmationCode: confirmCode.trim(),
      neutralKarmaAwarded: 0, // nothing awarded client-side; set on verification
      bonusKarmaAwarded: 0,
      bonusType,
      verified: false,
    }

    const nextPending = [...pendingContributions, pendingRecord]
    setPendingContributions(nextPending)
    try {
      localStorage.setItem(PENDING_CONTRIBUTIONS_KEY, JSON.stringify(nextPending))
    } catch { /* storage full/unavailable — in-memory record still shown */ }

    recordDonation(donation)
    setDonationComplete(true)
    setShowConfirm(false)
    setConfirmCode('')

    // Reset after 8 seconds
    setTimeout(() => setDonationComplete(false), 8000)
  }, [confirmCode, selectedAmount, selectedService, bonusType, pendingContributions, recordDonation])

  const activeService = PAYMENT_SERVICES.find(s => s.id === selectedService)

  // Doubling cost breakdown for display
  const costBreakdown = (() => {
    const steps: number[] = []
    let cost = 10
    for (let i = 0; i < karmaReward.bonusKarma; i++) {
      steps.push(cost)
      cost *= 2
    }
    return steps
  })()

  return (
    <div className="space-y-4">
      {/* Service selection */}
      <div className="bg-amber-950/60 border-2 border-amber-700 rounded-lg p-4">
        <h3 className="font-pixel text-amber-200 text-xs mb-3">Choose Payment</h3>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_SERVICES.map(service => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service.id)}
              className={`p-2 rounded border-2 text-center transition-all ${
                selectedService === service.id
                  ? 'border-amber-400 bg-amber-800/60'
                  : 'border-amber-700/50 bg-amber-900/30 hover:border-amber-600'
              }`}
            >
              <div className="text-xl">{service.emoji}</div>
              <div className="text-[9px] text-amber-300 mt-1">{service.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount selection */}
      <div className="bg-amber-950/60 border-2 border-amber-700 rounded-lg p-4">
        <h3 className="font-pixel text-amber-200 text-xs mb-3">Donation Amount</h3>
        <div className="grid grid-cols-5 gap-2">
          {DONATION_PRESETS.map(preset => (
            <button
              key={preset.amount}
              onClick={() => setSelectedAmount(preset.amount)}
              className={`p-2 rounded border-2 text-center transition-all ${
                selectedAmount === preset.amount
                  ? 'border-amber-400 bg-amber-800/60'
                  : 'border-amber-700/50 bg-amber-900/30 hover:border-amber-600'
              }`}
            >
              <div className="font-pixel text-amber-200 text-xs">{preset.label}</div>
              <div className="text-[8px] text-amber-500 mt-0.5">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Bonus karma type selector */}
      <div className="bg-amber-950/60 border-2 border-amber-700 rounded-lg p-4">
        <h3 className="font-pixel text-amber-200 text-xs mb-3">Bonus Karma Type</h3>
        <p className="text-[9px] text-amber-400 mb-3">
          Your donation earns bonus karma. Choose your path:
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setBonusType('good')}
            className={`p-3 rounded border-2 text-center transition-all ${
              bonusType === 'good'
                ? 'border-amber-400 bg-amber-800/50'
                : 'border-amber-700/50 bg-amber-900/30 hover:border-amber-600'
            }`}
          >
            <div className="text-xl">{'\uD83C\uDF6A'}</div>
            <div className="font-pixel text-amber-200 text-[10px] mt-1">Good Karma</div>
            <div className="text-[8px] text-amber-500 mt-0.5">Virtue and light</div>
          </button>
          <button
            onClick={() => setBonusType('bad')}
            className={`p-3 rounded border-2 text-center transition-all ${
              bonusType === 'bad'
                ? 'border-red-500 bg-red-900/30'
                : 'border-amber-700/50 bg-amber-900/30 hover:border-red-700'
            }`}
          >
            <div className="text-xl">{'\uD83E\uDEA8'}</div>
            <div className="font-pixel text-red-300 text-[10px] mt-1">Bad Karma</div>
            <div className="text-[8px] text-red-500 mt-0.5">Power and consequence</div>
          </button>
        </div>
      </div>

      {/* Going rate display */}
      <div className="bg-amber-950/60 border-2 border-amber-700 rounded-lg p-4">
        <div className="text-[9px] text-amber-400 text-center">Current Going Rate</div>
        <div className="font-pixel text-amber-200 text-sm mt-1 text-center">
          ${selectedAmount} = {karmaReward.neutralKarma} neutral + {karmaReward.bonusKarma} {bonusType} karma
        </div>
        {costBreakdown.length > 0 && (
          <div className="text-[8px] text-amber-600 text-center mt-1">
            Bonus cost: {costBreakdown.map((c, i) => `$${c}`).join(' + ')} = ${costBreakdown.reduce((a, b) => a + b, 0)}
            {karmaReward.bonusKarma > 0 && (
              <span className="text-amber-500"> (next: ${costBreakdown[costBreakdown.length - 1] * 2})</span>
            )}
          </div>
        )}
        <div className="text-[8px] text-amber-500 text-center mt-1">
          All donations support ranch animal care
        </div>
        <div className="text-[8px] text-amber-400 text-center mt-1">
          Karma is credited after the ranch verifies your donation
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-amber-950/60 border-2 border-amber-700 rounded-lg p-4">
        <h3 className="font-pixel text-amber-200 text-xs mb-3 text-center">
          Scan to Donate via {activeService?.name}
        </h3>
        <div className="flex justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`${activeService?.name} QR code`}
              className="rounded-lg border-2 border-amber-600"
              width={200}
              height={200}
            />
          ) : (
            <div className="w-[200px] h-[200px] bg-amber-900/30 rounded-lg border-2 border-amber-700 flex items-center justify-center">
              <span className="text-amber-500 text-xs">Generating QR...</span>
            </div>
          )}
        </div>
        <p className="text-[9px] text-amber-500 text-center mt-2">
          {activeService?.instructions}
        </p>

        {/* Confirm donation button */}
        {!showConfirm && !donationComplete && (
          <button
            onClick={() => setShowConfirm(true)}
            className="mt-3 w-full py-2 bg-green-700 hover:bg-green-600 text-green-100 font-pixel text-xs rounded border-2 border-green-500 transition-colors"
          >
            I Made My Donation
          </button>
        )}

        {/* Confirmation code input */}
        {showConfirm && (
          <div className="mt-3 space-y-2">
            <div className="text-[9px] text-amber-400">
              Enter your payment confirmation or transaction ID:
            </div>
            <input
              type="text"
              value={confirmCode}
              onChange={e => setConfirmCode(e.target.value)}
              placeholder="e.g., Venmo transaction ID"
              className="w-full px-3 py-2 bg-amber-900/60 border-2 border-amber-600 rounded text-amber-200 text-xs placeholder-amber-600 focus:border-amber-400 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDonation}
                disabled={!confirmCode.trim()}
                className="flex-1 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-green-100 font-pixel text-xs rounded border-2 border-green-500 disabled:border-gray-600 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => { setShowConfirm(false); setConfirmCode('') }}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-300 text-xs rounded border-2 border-amber-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Queue-full message */}
        {queueFullError && (
          <div className="mt-3 p-3 bg-red-900/40 border-2 border-red-600 rounded text-center">
            <div className="text-red-300 font-pixel text-xs">Pending Queue Full</div>
            <div className="text-red-400 text-[9px] mt-1">
              You already have {MAX_PENDING_CONTRIBUTIONS} contributions awaiting verification.
              Please wait for the ranch to verify them before submitting more.
            </div>
          </div>
        )}

        {/* Donation submitted message — honest: nothing credited yet */}
        {donationComplete && (
          <div className="mt-3 p-3 bg-green-900/40 border-2 border-green-600 rounded text-center">
            <div className="text-green-300 font-pixel text-sm">Thank You!</div>
            <div className="text-green-400 text-xs mt-1">
              Your contribution is recorded as pending verification.
            </div>
            <div className="text-green-500 text-[9px] mt-1">
              Karma will be credited after the ranch verifies your donation.
            </div>
          </div>
        )}
      </div>

      {/* Pending contributions */}
      {pendingContributions.length > 0 && (
        <div className="bg-amber-950/60 border-2 border-amber-700 rounded-lg p-4">
          <h3 className="font-pixel text-amber-200 text-xs mb-3">
            Pending Contributions ({pendingContributions.length}/{MAX_PENDING_CONTRIBUTIONS})
          </h3>
          <div className="space-y-2">
            {pendingContributions.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 bg-amber-900/30 border border-amber-700/50 rounded"
              >
                <div>
                  <div className="text-amber-200 text-xs font-pixel">${p.amount}</div>
                  <div className="text-amber-500 text-[8px]">
                    {new Date(p.timestamp).toLocaleString()}
                  </div>
                </div>
                <span className="text-[8px] text-amber-400 border border-amber-600 rounded px-2 py-1">
                  ⏳ pending verification
                </span>
              </div>
            ))}
          </div>
          {pendingQueueFull && (
            <p className="text-[8px] text-amber-500 mt-2 text-center">
              Queue full — new submissions are paused until the ranch verifies these.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
