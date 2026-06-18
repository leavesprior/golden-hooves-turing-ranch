# BOBR Farm Ecology — design + build log (2026-06-17)

Leif's vision: turn the ranch/farm into a system of **little factors and tricks** where knowledge and good husbandry turn a hard game easy — animals that eat *and* improve the soil, real farmer tricks, land expansion, and (gated) livestock-on-chain investment. "Done without knowledge it can make it an issue" — i.e. depth that rewards learning.

## Built this session (additive, dev branch, tsc-clean, verified)

### New livestock (each with an ecological role) — `data/ranchConfig.ts`
Auto-appear in the existing Livestock buy/sell panel (it iterates `LIVESTOCK_TYPES`).
- 🫏 **Donkeys** — `role: predator_guard`. Each donkey adds to the herd's effective predator resistance in `advanceDay` (caps at +0.55), sharply cutting coyote/dog losses. Slow breeders, cheap-ish, light soil benefit.
- 🐷 **Pigs** — `role: tiller`, `soilEffect 1.2` (strongest). The potato-trick partner; produce pork; breed fast/large.
- 🪶 **Emus** — `role: nitrogen`, `soilEffect 1.0`. High-value eggs (8 karma each ≈ a dozen hen eggs); fast nitrogen to soil.
- 🐑 **Sheep** — `role: firebreak`. Graze grass low (knock down fine fuel), wool + sheep milk, soil benefit.
- 🐐 **Goats** (existing) — now `role: firebreak` too (browse brush/saplings).
- Existing cattle/chickens/horses gained a `soilEffect` so **every animal eats and improves the soil**.

### Soil quality system — `data/seasonalMarket.ts` + `ranchContext.tsx`
- Each parcel has a `baseSoil` (creek bottom 80 = rich, dry slope 40 = poor). Per-parcel `soilMetrics` 0–100 in `RanchState`.
- **Daily ecology in `advanceDay`**: a field's soil rises or falls by its use that day —
  - **grazing** → manured up (scaled by the herd's total `soilEffect`, capped),
  - **fallow** → rested up (+0.3/day),
  - **row crop** → mined down (`CROPS[].soilPerDay`, e.g. potatoes −0.15, wheat/corn deplete),
  - **forage legume** → built up (+0.5/day).
- Surfaced in the **Fields tab** as a per-field soil bar (rich/good/fair/tired/spent + %).

### The signature trick — `releasePigsOnParcel()` + "🐷 Loose the pigs" button
On a **potato** field with pigs owned: pigs eat the crop, **till + manure** it (big soil boost, scales with pig count, up to +35), you gain **pork + feed**, and the field is left **fallow, richer than before.** The classic plant-potatoes-then-loose-the-pigs trick, mechanized.

### Superfood forage crop — 🌱 **Sainfoin Forage**
A real deep-rooted nitrogen-fixing forage legume: `grazeable`, highest `feedConversion` (14), and **builds** soil (+0.5/day) instead of spending it. Plant it to feed the herd *and* heal the ground.

### Fire mitigation — goats + sheep firebreak
When goats or sheep are present, livestock-loss events land softer (×0.6) in `advanceDay` — the cleared fine fuel that carries a grass fire into the trees. (Ties the goat/sheep "firebreak" role to real losses.)

### Land expansion — `PURCHASABLE_PARCELS` + `buyParcel()`
Three nearby parcels to buy (Pine Bench, Lower Pasture, Ridge Parcel) with neutral karma; once owned they join the Fields list with their own starting soil. UI: "Buy Nearby Parcels" section in the Fields tab.

### Bulk feed
The Buy-Feed amount selector now includes **500 and 1000** (feed in quantity), per request.

## Files touched
- `data/ranchConfig.ts` — LivestockType union + `soilEffect`/`role` on `LivestockConfig`; 4 new animals; soilEffect on existing.
- `data/seasonalMarket.ts` — `forage` CropType + `soilPerDay`/`grazeable`; `baseSoil` on Parcel; `PURCHASABLE_PARCELS`.
- `ranchContext.tsx` — `soilMetrics` + `ownedParcels` state; daily soil ecology + donkey-guard + firebreak in `advanceDay`; `getSoilMetrics`/`buyParcel`/`releasePigsOnParcel`; `getParcels` includes owned.
- `components/RanchManagement.tsx` — Fields tab soil bars, pig-trick button, buy-parcel section; bulk feed amounts.

## ⚠️ GATED — Livestock-on-blockchain investment ("people invest and pay me per head")
This is **real-money / regulated territory** (fractional livestock investment ≈ a security; people paying Leif for each head). It is **NOT built** here. Path:
1. **In-game first (safe, future):** model "investors" and per-head shares in `CrossGameStorage` as an in-game ledger — fun, no real money. Reuses the karma/ledger integrity rules (money only touches NEUTRAL; server-mint never client-mint; signed attestations).
2. **Real-money = blocked pending:** (a) the **Wheelwright blockchain node network gate** (currently OFF — F1/F2 unsigned-consensus fixes required, see `project-wheelwright-blockchain-node-network-QUEUED`), (b) **Grok-before** (friendship bundle — guest-facing economy), and (c) **legal review** (securities/livestock-investment). Do not wire real payments without all three.

## Future work (designed, not built)
- Per-parcel animal assignment (which herd grazes which field) for precise grazing soil math (today it's herd-wide).
- Soil affects crop yield (richer soil → higher `harvestValue`); crops gated by `minSoilQuality`.
- Soil amendments shop (compost/lime). Disease/parasite pressure eased by rotation (the deeper "knowledge" layer).
- Emu-egg / wool / pork as distinct sellable products in the Market tab (they accrue in `products` now).
- Wire a dedicated grass-fire event so the goat/sheep firebreak reads explicitly as fire defense.

## Governance
Guest-facing → **Grok-before** gates the production (Railway) deploy, same as the map-unification + town-depth work. Built on the dev branch; nothing deployed. Family canon stays per-item.
