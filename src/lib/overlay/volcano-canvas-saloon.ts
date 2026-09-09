/** Josiah Bell's 1849 canvas saloon — 40×22.
 * Not St. George. Not limestone. Rope and plank. */

export const GRID_W = 40
export const GRID_H = 22

export const VOLCANO_SALOON = {
  id: 'volcano_canvas_saloon_1849',
  locationId: 'volcano',
  era: { year: 1849 },
  npcId: 'volcano_saloon_bell',
  spawn: { x: 20, y: 18 },
  note: 'Canvas walls (f), plank floor, one bar. South flap is the door.',
}

function cell(x: number, y: number): string {
  const W = GRID_W, H = GRID_H
  if (x === 0 || y === 0 || x === W - 1 || y === H - 1) {
    if (y === H - 1 && x >= 18 && x <= 21) return '+'
    return '#'
  }
  if (y === 1 || x === 1 || x === W - 2) return 'f'
  if (y === 8 && x >= 8 && x <= 30) return '#'
  if ((x === 6 && y === 5) || (x === 33 && y === 6) || (x === 10 && y === 12)) return 'o'
  if (y >= 3 && y <= 16 && x >= 3 && x <= 36) return '='
  return '.'
}

export function volcanoSaloonRows(): string[] {
  const rows: string[] = []
  for (let y = 0; y < GRID_H; y++) {
    let row = ''
    for (let x = 0; x < GRID_W; x++) row += cell(x, y)
    rows.push(row)
  }
  return rows
}

export const VOLCANO_SALOON_INSPECT = {
  name_of_the_bowl: {
    carmen: {
      trailWord: 'the camp in a bowl of hills that smokes at dawn',
      pointsTo: 'volcano',
      obscurity: 1,
      witness: 'the canvas wall',
    },
    finding:
      'Mist lifts off the limestone floor like a kettle. Men called it a crater. It is a basin. The gold sits in potholes in the rock, richer the deeper they dig.',
  },
}
