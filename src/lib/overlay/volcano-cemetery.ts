/** Pioneer ground, 1849 — wood markers, not later stone. */

export const GRID_W = 40
export const GRID_H = 22

export const VOLCANO_CEMETERY = {
  id: 'volcano_cemetery_1849',
  locationId: 'volcano',
  era: { year: 1849 },
  note: 'Fence (#), grass (,), wooden markers (+). No hotel. No ghosts invented.',
}

function cell(x: number, y: number): string {
  const W = GRID_W, H = GRID_H
  if (x === 0 || y === 0 || x === W - 1 || y === H - 1) return '#'
  if (y === 1 && x >= 18 && x <= 21) return '+'
  if (y >= 5 && y <= 16 && (x - 4) % 6 === 0 && y % 3 === 2) return '+'
  return ','
}

export function volcanoCemeteryRows(): string[] {
  const rows: string[] = []
  for (let y = 0; y < GRID_H; y++) {
    let row = ''
    for (let x = 0; x < GRID_W; x++) row += cell(x, y)
    rows.push(row)
  }
  return rows
}

export const VOLCANO_CEMETERY_INSPECT = {
  carmen: {
    trailWord: 'wood markers on a hill of grass, names not yet famous',
    pointsTo: 'volcano',
    obscurity: 1,
    witness: 'the fence',
  },
  finding:
    '1849 buries in wood. The cut-stone later. Unknown boards from the first winter. No one here is a tourist ghost.',
}
