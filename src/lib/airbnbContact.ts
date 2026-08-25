/**
 * Airbnb host-message link for the ranch listing.
 *
 * Airbnb does not accept a prefilled inquiry body in the URL (contact_host
 * lands on login / the listing thread). We copy the voucher text to the
 * clipboard and open the real contact-host URL as an <a href>.
 *
 * Room 30045739 is Hot Tub Hideaway (canonical in volcanoStayShow).
 * No client-side monetary mint — the host issues the discount after the message.
 */

import { AIRBNB_ROOM_ID } from './volcanoStayShow'

export { AIRBNB_ROOM_ID }

export const AIRBNB_CONTACT_HOST_URL =
  `https://www.airbnb.com/contact_host/${AIRBNB_ROOM_ID}`

export const AIRBNB_LISTING_URL =
  `https://www.airbnb.com/rooms/${AIRBNB_ROOM_ID}`

export type TrailVoucher = {
  playerName: string
  percent: number
  tierName: string
  level: 1 | 2
}

export function voucherLines(v: TrailVoucher): string {
  const levelLabel = v.level === 1 ? 'Golden Frog Trail — first level' : 'Explore the Gold Country — level 2'
  return [
    'Back of Beyond Ranch',
    levelLabel,
    `${v.tierName} · ${v.percent}% off stay`,
    'Host verifies this on Airbnb. Not a self-apply coupon.',
    `Listing ${AIRBNB_ROOM_ID}`,
  ].join('\n')
}

export function airbnbDiscountMessage(v: TrailVoucher): string {
  const levelBit = v.level === 1
    ? 'I finished the Golden Frog Trail (level 1)'
    : 'I finished Level 2: Explore the Gold Country'
  return `Hi! ${levelBit} as ${v.playerName || 'a trail survivor'} (${v.tierName}, ${v.percent}% ). Redeem this on our stay at Hot Tub Hideaway. Sending this message so you can provide the discount.`
}
