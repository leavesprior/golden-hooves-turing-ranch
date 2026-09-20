/** Soldiers' Gulch, 1849 — gravel and a wash. Not brick Main Street. */

export const GRID_W = 40
export const GRID_H = 22

export const SOLDIERS_GULCH = {
  id: 'volcano_soldiers_gulch_1849',
  locationId: 'volcano',
  era: { year: 1849 },
  note: 'Gravel (.), grass (,), creek (~), potholes (o). No hotel.',
}

function cell(x: number, y: number): string {
  const W = GRID_W, H = GRID_H
  if (x === 0 || x === W - 1) return '#'
  if (y === 0 || y === H - 1) return ','
  if (y === 11 || y === 12) return '~'
  if ((x + y * 3) % 17 === 0) return 'o'
  if (y < 4 || y > 17) return ','
  return '.'
}

export function soldiersGulchRows(): string[] {
  const rows: string[] = []
  for (let y = 0; y < GRID_H; y++) {
    let row = ''
    for (let x = 0; x < GRID_W; x++) row += cell(x, y)
    rows.push(row)
  }
  return rows
}

export const SOLDIERS_GULCH_INSPECT = {
  carmen: {
    trailWord: 'a wash of gravel and morning steam, before anyone hung a plaque',
    pointsTo: 'volcano',
    obscurity: 1,
    witness: 'the gravel',
  },
  finding:
    "Colonel Stevenson's men found gold here in 1848, and the gulch was mined in 1849 (California OHP Landmark 29). Walk the gravel. Brick sits later on washed ground.",
}
