/** Joseph Ware, 1849: about 180 lb flour per person. Four souls → 720 lb.
 * This load is a little over that, still inside the 400-taco starting purse.
 * It does not win the trail by itself. The inn does. */

export type WagonLoad = {
  food: number
  ammo: number
  parts: number
  medicine: number
  oxen: number
}

export const WARE_WAGON: WagonLoad = {
  food: 800,
  ammo: 20,
  parts: 2,
  medicine: 2,
  oxen: 4,
}

export const WARE_WAGON_PRICES = {
  food: 0.2,
  ammo: 2,
  parts: 10,
  medicine: 5,
  oxen: 40,
} as const

export const WARE_WAGON_COST = Math.ceil(
  WARE_WAGON.food * WARE_WAGON_PRICES.food +
  WARE_WAGON.ammo * WARE_WAGON_PRICES.ammo +
  WARE_WAGON.parts * WARE_WAGON_PRICES.parts +
  WARE_WAGON.medicine * WARE_WAGON_PRICES.medicine +
  WARE_WAGON.oxen * WARE_WAGON_PRICES.oxen,
)

export const STARTING_NEUTRAL_FOR_WARE = 400

/** First-camp copy: the purse is issued, not earned on the trail. */
export const OUTFIT_PURSE_LINE =
  `A new wagon is issued ${STARTING_NEUTRAL_FOR_WARE} tacos — the expedition stake. Neutral karma, not a prize. Matt's store takes it for oxen, flour, powder, an axle, and a medicine chest. Ware's load is ${WARE_WAGON_COST}; what is left buys a first night at the inn.`
