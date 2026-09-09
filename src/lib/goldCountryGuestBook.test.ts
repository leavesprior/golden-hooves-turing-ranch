/**
 * node_modules/.bin/tsx src/lib/goldCountryGuestBook.test.ts
 */
import {
  GUEST_BOOK_AREA_ID,
  GUEST_BOOK_CANON,
  GUEST_BOOK_HOST,
  guestBookPages,
  signGuestBook,
  writeGuestBookPlayerLines,
} from './goldCountryGuestBook'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

ok(GUEST_BOOK_AREA_ID === 'cabin_guest_book', 'book is the L2 search pin')
ok(GUEST_BOOK_HOST.note.includes('yours to enjoy'), 'host line is the visiting-house copy')
ok(GUEST_BOOK_CANON.some((l) => l.id === 'host_greg' && /fence post/.test(l.note)), 'Greg’s cash-built ridge is in the book')
ok(GUEST_BOOK_CANON.some((l) => /last lamp/.test(l.note)), 'quiet hours are in house voice')
ok(GUEST_BOOK_CANON.some((l) => /inner latch/.test(l.note)), 'do-not-lock is in house voice')
ok(GUEST_BOOK_CANON.some((l) => /dog on the porch/.test(l.note)), 'pets are welcome in house voice')
ok(GUEST_BOOK_CANON.some((l) => /Smith/.test(l.name)), 'a false name is already in the book')
ok(
  !GUEST_BOOK_CANON.some((l) => /airbnb|booking|wifi|yale|landmark 268/i.test(l.note + l.name)),
  'canon lines stay off the listing brands',
)

const store = {
  m: new Map<string, string>(),
  getItem(k: string) { return this.m.get(k) ?? null },
  setItem(k: string, v: string) { this.m.set(k, v) },
}
ok(guestBookPages(store).length === GUEST_BOOK_CANON.length, 'unsigned book is canon only')
ok(signGuestBook('', 'hello', store) === null, 'blank name will not sign')
ok(signGuestBook('Leif', '', store) === null, 'blank note will not sign')
const signed = signGuestBook('Leif', 'Stopped for water on the ridge.', store)
ok(!!signed && signed.player === true, 'a visitor can sign')
ok(guestBookPages(store).some((l) => l.name === 'Leif' && /water/.test(l.note)), 'the new line is in the book')
writeGuestBookPlayerLines([], store)
ok(guestBookPages(store).every((l) => !l.player), 'player lines can be cleared')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`goldCountryGuestBook tests passed (${passed})`)
