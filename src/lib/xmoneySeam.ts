/**
 * Later settlement rail for hosts, theatres, and other merchants.
 *
 * Researched 2026-08-20:
 *   - xMoney.com (MultiversX group, rebranded 2025) — EU-regulated merchant
 *     gateway: cards + crypto, invoices, API. Docs: https://docs.crypto.xmoney.com/
 *     This is the fit for a small-town box office or an Airbnb host payout.
 *   - X Money (money.x.com) — consumer wallet / X Card. Not a merchant API.
 *
 * In-game karma (alignment + trail wallet) stays the ledger. This module never
 * charges a card or mint a token. When a merchant is ready, set
 * NEXT_PUBLIC_XMONEY_MERCHANT_ID and wire a server route — not a client mint.
 */

export function xmoneySeamStatus(): {
  ready: boolean
  provider: 'xmoney.com'
  reason: string
} {
  const id = process.env.NEXT_PUBLIC_XMONEY_MERCHANT_ID
  if (!id) {
    return {
      ready: false,
      provider: 'xmoney.com',
      reason: 'No merchant id. Karma is the game ledger until a host or the theatre opts in.',
    }
  }
  return {
    ready: false,
    provider: 'xmoney.com',
    reason: 'Merchant id present, live charges still gated. Use the server route, never the client.',
  }
}
