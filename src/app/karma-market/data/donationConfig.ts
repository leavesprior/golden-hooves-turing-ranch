/**
 * Donation Configuration for the Karma Marketplace
 *
 * Payment service URLs, QR code data, and donation-to-karma rate tables.
 * MVP uses admin confirmation codes (no webhooks yet).
 */

export interface PaymentService {
  id: string
  name: string
  emoji: string
  urlTemplate: string
  color: string
  instructions: string
}

export const PAYMENT_SERVICES: PaymentService[] = [
  {
    id: 'venmo',
    name: 'Venmo',
    emoji: '\uD83D\uDCB2',
    urlTemplate: 'https://venmo.com/Leif-Pryor?txn=pay&amount={amount}&note=Karma%20Donation',
    color: '#3D95CE',
    instructions: 'Open Venmo and scan the QR code, or tap the link on mobile.',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    emoji: '\uD83C\uDF10',
    urlTemplate: 'https://paypal.me/backofbeyondranch/{amount}',
    color: '#003087',
    instructions: 'Scan to open PayPal. You can send as a friend or use PayPal Giving.',
  },
  {
    id: 'googlepay',
    name: 'Google Pay',
    emoji: '\uD83D\uDCF1',
    urlTemplate: 'https://pay.google.com/gp/p/ui/pay?pa=backofbeyondranch@gmail.com&am={amount}&cu=USD&mc=0',
    color: '#4285F4',
    instructions: 'Scan to open Google Pay. Works with any linked payment method.',
  },
]

/**
 * Generate a payment URL for a given service and amount
 */
export function getPaymentUrl(serviceId: string, amount: number): string {
  const service = PAYMENT_SERVICES.find(s => s.id === serviceId)
  if (!service) return ''
  return service.urlTemplate.replace('{amount}', amount.toFixed(2))
}

/**
 * Donation amount presets
 */
export const DONATION_PRESETS = [
  { amount: 5, label: '$5', description: 'A handful of treats' },
  { amount: 10, label: '$10', description: 'A good day for the animals' },
  { amount: 25, label: '$25', description: 'A week of premium feed' },
  { amount: 50, label: '$50', description: 'Fence repair fund' },
  { amount: 100, label: '$100', description: 'Ranch champion!' },
]

/**
 * Base conversion rate: neutral karma per dollar
 * This is the floor rate; actual rate depends on Mandelbrot pricing
 */
export const BASE_KARMA_PER_DOLLAR = 10

/**
 * Calculate karma earned from a donation.
 *
 * Neutral: 10 per dollar (flat).
 * Bonus (good OR bad, player's choice): doubling cost curve.
 *   - First bonus unit costs $10, second costs $20, third $40, etc.
 *   - $10 → 1 bonus, $30 → 2, $70 → 3, $150 → 4, ...
 */
export function calculateDonationKarma(dollarAmount: number): {
  neutralKarma: number
  bonusKarma: number
} {
  const neutralKarma = Math.floor(dollarAmount * BASE_KARMA_PER_DOLLAR)

  // Doubling cost curve: first bonus = $10, then $20, $40, $80...
  let remaining = dollarAmount
  let bonusKarma = 0
  let nextCost = 10
  while (remaining >= nextCost) {
    remaining -= nextCost
    bonusKarma++
    nextCost *= 2
  }

  return { neutralKarma, bonusKarma }
}

/**
 * Admin confirmation code system for MVP
 * In production, this would be replaced with payment webhooks
 */
export interface DonationRecord {
  id: string
  timestamp: number
  dollarAmount: number
  paymentService: string
  confirmationCode: string
  neutralKarmaAwarded: number
  bonusKarmaAwarded: number
  bonusType: 'good' | 'bad'
  verified: boolean
}

/**
 * Generate a simple confirmation code for MVP
 * Format: BOBR-XXXX (4 random alphanumeric chars)
 */
export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No ambiguous chars
  let code = 'BOBR-'
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
