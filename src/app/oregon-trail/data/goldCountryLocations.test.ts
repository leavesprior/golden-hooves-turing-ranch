/**
 * node_modules/.bin/tsx src/app/oregon-trail/data/goldCountryLocations.test.ts
 *
 * Guard against the tourjackson.com / visitjackson.com / Wilder Ranch
 * class of wrong-place URLs, and require named individual sites per place.
 */
import {
  GOLD_COUNTRY_LOCATIONS,
  getGoldCountryLocation,
  getLocationSites,
} from './goldCountryLocations'
import { EDUCATIONAL_CLUES } from './educationalClues'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) {
    passed += 1
  } else {
    failed += 1
    console.error('FAIL', name)
  }
}

const jackson = getGoldCountryLocation('jackson')
const angels = getGoldCountryLocation('angels_camp')
const bridges = getGoldCountryLocation('natural_bridges')
const allUrls = [
  ...GOLD_COUNTRY_LOCATIONS.flatMap((loc) => [
    loc.externalLink,
    ...getLocationSites(loc).map((s) => s.url),
  ]),
  ...EDUCATIONAL_CLUES.map((c) => c.hintLink),
]

ok(!!jackson, 'jackson exists')
ok(
  (jackson?.externalLink || '').includes('ci.jackson.ca.us'),
  'jackson hub is City of Jackson, CA (ci.jackson.ca.us)',
)
ok(
  allUrls.every((u) => !/tourjackson\.com/i.test(u)),
  'no tourjackson.com (wrong city / spam domain)',
)
ok(
  allUrls.every((u) => !/visitjackson\.com/i.test(u)),
  'no visitjackson.com (Jackson, Mississippi)',
)
ok(
  (jackson?.sites || []).some((s) => /kennedygoldmine\.com/i.test(s.url)),
  'jackson lists the Kennedy Mine operator',
)
ok(
  (jackson?.sites || []).some((s) => /kennedytailingwheelspark\.php/i.test(s.url)),
  'jackson lists Kennedy Tailing Wheels Park',
)
ok(
  (jackson?.sites || []).some((s) => /stsavajackson\.org/i.test(s.url)),
  'jackson lists Saint Sava',
)

const ridge = getGoldCountryLocation('kennedy_mine')
ok(!!ridge && /ridge/i.test(ridge.name), 'kennedy location is the ridge above Jackson')
ok(
  (ridge?.sites || []).some((s) => /Kennedy\+Flat|Swingle/i.test(s.name + s.url)),
  'ridge lists the Kennedy Flat butcher (Swingle, 1945 Now)',
)

ok(
  (angels?.externalLink || '').includes('angelscamp.gov'),
  'angels camp hub is the city visitor page, not the body-shop slug',
)
ok(
  allUrls.every((u) => !/gocalaveras\.com\/angels-camp\/?$/i.test(u)),
  'no gocalaveras.com/angels-camp/ (redirects to Angels Camp Body Shop)',
)

ok(
  allUrls.every((u) => !/page_id=549/.test(u)),
  'no parks.ca.gov page_id=549 (Wilder Ranch SP, Santa Cruz)',
)
ok(
  (bridges?.externalLink || '').includes('natural-bridges'),
  'natural bridges hub is the Coyote Creek / New Melones trail page',
)

ok(
  GOLD_COUNTRY_LOCATIONS.every((loc) => getLocationSites(loc).length >= 2),
  'every place has at least two named real-world sites',
)
ok(
  GOLD_COUNTRY_LOCATIONS.every((loc) =>
    getLocationSites(loc).every((s) => s.name.trim().length > 0 && s.url.startsWith('https://')),
  ),
  'every site has a name and https URL',
)
ok(
  GOLD_COUNTRY_LOCATIONS.every((loc) =>
    getLocationSites(loc).some((s) => s.url === loc.externalLink),
  ),
  'externalLink is one of the named sites',
)
ok(
  new Set(getLocationSites(jackson!).map((s) => s.url)).size === getLocationSites(jackson!).length,
  'jackson site urls are unique',
)
ok(
  EDUCATIONAL_CLUES.filter((c) => c.locationId === 'jackson').every((c) =>
    /ci\.jackson\.ca\.us/i.test(c.hintLink),
  ),
  'jackson educational clues point at City of Jackson CA',
)
ok(
  EDUCATIONAL_CLUES.filter((c) => c.locationId === 'natural_bridges').every((c) =>
    c.hintLink.includes('natural-bridges'),
  ),
  'natural bridges clues point at Coyote Creek, not Wilder Ranch',
)

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`goldCountryLocations tests passed (${passed})`)
