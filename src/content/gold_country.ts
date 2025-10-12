export type LocID = "angels"|"columbia"|"mokhill"|"jackson"|"chawse";

export interface Loc {
  id: LocID; name: string; x: number; y: number;
  blurb: string; facts: string[]; token?: string;
}

export const LOCS: Loc[] = [
  {
    id: "angels", name: "Angels Camp", x: 220, y: 360,
    blurb: "Gold‑rush town noted for Twain's frog tale and the historic Angels Hotel.",
    facts: [
      "A famous 1865 story linked to Angels Camp made frog‑jumping iconic.",
      "Seasonal frog events honor the tale; the old hotel bar hosted storytellers."
    ],
    token: "Frog Ticket"
  },
  {
    id: "columbia", name: "Columbia SHP", x: 420, y: 300,
    blurb: "Preserved Gold‑Rush town with museums, tours, and period streets.",
    facts: [
      "A state historic park preserves a large set of gold‑rush era structures.",
      "Blacksmith and assay lore hint how tools and ledgers traced stolen goods."
    ],
    token: "Assay Ledger Note"
  },
  {
    id: "mokhill", name: "Mokelumne Hill", x: 360, y: 260,
    blurb: "Key placer‑mining center; the name derives from the nearby Mokelumne River.",
    facts: [
      "Once among Calaveras County's richest placer districts during the 1850s.",
      "Historic offices make this the right place to file your pursuit warrant."
    ],
    token: "Warrant Stamp"
  },
  {
    id: "jackson", name: "Jackson — Kennedy Mine", x: 520, y: 240,
    blurb: "Site of one of the world's deepest gold mines of its era.",
    facts: [
      "Kennedy Mine reached over a mile depth by the early 20th century.",
      "Mine scrip and shift logs can prove where ore moved and when."
    ],
    token: "Mine Scrip"
  },
  {
    id: "chawse", name: "Chaw'se / Indian Grinding Rock SHP", x: 600, y: 180,
    blurb: "Northern Sierra Miwok homeland site with bedrock mortars and a roundhouse museum.",
    facts: [
      "The marbleized limestone outcrop holds the largest known bedrock mortar field.",
      "Petroglyphs and the museum teach Miwok technology, language, and continuity."
    ],
    token: "Petroglyph Rubbing"
  }
];

export const START: LocID = "angels";

// adjacency for travel
export const EDGES: Record<LocID, LocID[]> = {
  angels: ["mokhill","columbia"],
  columbia: ["angels","jackson"],
  mokhill: ["angels","jackson","chawse"],
  jackson: ["columbia","mokhill","chawse"],
  chawse: ["mokhill","jackson"]
};
