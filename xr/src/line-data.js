// The line of time at one place. Each layer only ADDS what differs from the
// real street (passthrough is always the background). `conf` feeds the Honest
// Record caption: 1 documented, 0 described from a source, -1 imagined.
// Design: ~/Documents/BOBR/game_enhancements/OUT_OF_TIME_AR_REDESIGN_20260927.md
export const PLACE = 'Main Street, Volcano, California';

export const LINE = [
  {
    id: 'now',
    label: 'Now',
    conf: 1,
    record: 'What you see is the street as it is. Touch the Golden Frog to step along the line.',
  },
  {
    id: 'c1867',
    label: 'About 1867',
    conf: 0,
    record:
      'Shed-roof porches on posts and board walks along Main Street, as described from a Lawrence & Houseworth view taken from the St. George Hotel (built 1867). Shapes are simplified; details imagined.',
  },
  {
    id: 'slip1',
    label: 'Sideways',
    conf: -1,
    record:
      'A slip down the line of probability: the Frog’s side of things. Nothing here is history. The cat was here a moment ago. Or was not.',
  },
];

// Figures who walk the line. Fictional composites only: never a real person's
// name, face or costume (law 4). Each carries era + source + ternary conf (law 5).
export const CAST = [
  {
    id: 'hattie',
    name: 'Hattie',
    kind: 'story',
    fictional: true,
    era: 'c1867',
    role: 'hotel cook',
    source: 'Composite of period working dress (long skirt, apron, shawl, kerchief); no real person.',
    conf: -1,
  },
];
