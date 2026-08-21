import assert from 'node:assert/strict'
import {
  defaultStayForShow,
  nightsOverlapShow,
  nextFridayOnOrAfter,
  upcomingShows,
  THEATRE_SEASON_2026,
  airbnbRoomUrl,
} from './volcanoStayShow'

const jekyll = THEATRE_SEASON_2026.find((s) => s.id === 'jekyll-hyde')
assert.ok(jekyll)

assert.equal(nextFridayOnOrAfter('2026-08-20'), '2026-08-21')
assert.equal(nextFridayOnOrAfter('2026-08-28'), '2026-08-28')

const stay = defaultStayForShow(jekyll, '2026-08-20', 2, 2)
assert.equal(stay.checkIn, '2026-08-28', 'opening Friday of Jekyll')
assert.equal(stay.checkOut, '2026-08-30')
assert.equal(nightsOverlapShow(stay, jekyll), true)

const late = defaultStayForShow(jekyll, '2026-09-10', 2, 2)
assert.equal(late.checkIn, '2026-09-11')
assert.equal(nightsOverlapShow(late, jekyll), true)

const past = upcomingShows('2026-08-20')
assert.equal(past.some((s) => s.id === 'catch-me-if-you-can'), false)
assert.equal(past.some((s) => s.id === 'jekyll-hyde'), true)

const url = airbnbRoomUrl(stay)
assert.match(url, /check_in=2026-08-28/)
assert.match(url, /check_out=2026-08-30/)
assert.match(url, /rooms\/30045739/)

console.log('volcanoStayShow tests passed')
