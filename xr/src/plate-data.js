// Caption text copied from the game's out-of-time data
// (src/lib/localPlaces.ts, place 'vol_baked_in_amador'). `then.line` is
// `interpretationLabel` verbatim; `today.line` is `known` verbatim minus its
// last sentence ("County parcel 029-043-010."), dropped for caption length.
// Do not edit here without editing there.
// 2026-09-26: the BAKED. plates await the owners' consent; both plates show the
// framed public-domain stand-in (Ansel Adams, National Archives NAID 519953),
// matching the live game's plateCredit.
const CREDIT = ' Picture on loan while we ask the bakery\u2019s owners: Ansel Adams, Flock in Owens Valley, California, 1941 (National Archives, public domain).';
export const PLACE_LINE = '16154 Main St, Volcano, California';

export const PLATES = {
  today: {
    asset: 'plate-today',
    year: 'Today',
    line:
      'The 2021 sale listing says the building is “fronted with bricks from Stone Jug community of the 1850’s” — Stone Jug Road runs toward Upper Rancheria on the 1866 county map. Volcano had three bakeries in 1853.' + CREDIT,
  },
  then: {
    asset: 'plate-1885',
    year: 'About 1885',
    line:
      'The stones are old; what this building was in the 1880s is not recorded, and its build year is not published.' + CREDIT,
  },
};
