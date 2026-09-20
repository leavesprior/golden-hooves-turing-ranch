/**
 * look-absence-browser-check.mjs — does the 1849 Look face actually show the
 * absence chips and the painted rooms, in a browser?
 *
 * The node tests prove the pure parts: where a chip lands, what it says, which
 * glyph takes which colour. None of them can tell you whether React draws the
 * chip, whether clicking it enters a building anyway, or whether the room a
 * guest sees is painted or is still a postage-stamp DOS screen. This drives
 * real Chrome through Explore -> Volcano and asserts on what the page shows.
 *
 *   BOBR_URL=http://127.0.0.1:3107 node scripts/look-absence-browser-check.mjs
 *
 * Screenshots land in test-reports/look-absence/. Exit 0 = measured clean,
 * 1 = measured with findings, 2 = UNMEASURED (could not look — never a pass).
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const baseUrl = process.env.BOBR_URL || 'http://127.0.0.1:3107'
const outDir = process.env.BOBR_ARTIFACT_DIR || fileURLToPath(new URL('../test-reports/look-absence/', import.meta.url))

const findings = []
const note = (ok, what) => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${what}`)
  if (!ok) findings.push(what)
}

const LATER = ['vol_st_george', 'vol_theatre', 'vol_observatory', 'vol_cannon']

let browser
try {
  await mkdir(outDir, { recursive: true })
  browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
} catch (err) {
  console.error(`UNMEASURED: could not launch Chrome — ${err.message}`)
  process.exit(2)
}

const evidence = {}
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

  await page.goto(`${baseUrl}/explore?qr=ranch-house&town=volcano`, { waitUntil: 'networkidle0', timeout: 60000 })
  await page.waitForSelector('[data-testid="explore-town-face"]', { timeout: 20000 })
  const townId = await page.$eval('[data-testid="explore-town-face"]', (n) => n.getAttribute('data-town'))
  note(townId === 'volcano', `town face is volcano (got ${townId})`)

  // ---- the chips are on the painting --------------------------------------
  const chips = await page.evaluate((ids) => ids.map((id) => {
    const n = document.querySelector(`[data-testid="explore-later-${id}"]`)
    if (!n) return { id, present: false }
    const r = n.getBoundingClientRect()
    return { id, present: true, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), text: n.textContent?.trim() }
  }), LATER)
  evidence.chips = chips
  note(chips.every((c) => c.present), `all four later chips are drawn (${chips.filter((c) => c.present).length}/4)`)

  const tent = await page.evaluate(() => {
    const n = document.querySelector('[data-testid="explore-spot-vol_canvas_flat"]')
    if (!n) return null
    const r = n.getBoundingClientRect()
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }
  })
  evidence.tent = tent
  note(!!tent, 'the canvas tent pin is still on the face')
  const theatre = chips.find((c) => c.id === 'vol_theatre')
  const gap = tent && theatre?.present ? Math.hypot(theatre.x - tent.x, theatre.y - tent.y) : 0
  evidence.theatre_tent_px = Math.round(gap)
  note(gap > 40, `the theatre chip is off the tent on screen (${Math.round(gap)}px apart)`)

  // Percent clearance is centre-to-centre; a label is wide. Two chips whose
  // BOXES overlap are two labels a guest reads as one, so measure the rects.
  const overlaps = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[data-testid^="explore-later-"], [data-testid^="explore-spot-"]')]
      .filter((n) => n.getAttribute('data-testid') !== 'explore-later-reading')
      .map((n) => ({ id: n.getAttribute('data-testid'), r: n.getBoundingClientRect() }))
    const hits = []
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i].r, b = nodes[j].r
        const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left)
        const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
        if (dx > 0 && dy > 0) hits.push({ a: nodes[i].id, b: nodes[j].id, overlap: [Math.round(dx), Math.round(dy)] })
      }
    }
    return hits
  })
  evidence.overlaps = overlaps
  note(overlaps.length === 0, overlaps.length ? `chip labels overlap on screen: ${JSON.stringify(overlaps)}` : 'no chip label overlaps any other pin on screen')

  // The picture is still the picture: a chip must not replace the painting.
  const paintingBefore = await page.$eval('[data-testid="place-scene-historical"] img, [data-testid="explore-town-face"] img', (n) => n.getAttribute('src')).catch(() => null)
  note(!!paintingBefore, `the 1849 painting is on screen (${paintingBefore ?? 'none'})`)

  // ---- clicking absence reads, it does not enter --------------------------
  const before = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => /explor|karma/i.test(k))))
  await page.click('[data-testid="explore-later-vol_theatre"]')
  await new Promise((r) => setTimeout(r, 300))

  const reading = await page.evaluate(() => {
    const n = document.querySelector('[data-testid="explore-later-reading"]')
    return n ? n.textContent : null
  })
  evidence.reading = reading
  note(!!reading, 'clicking the theatre chip shows a reading')
  note(/1856/.test(reading || '') && /1974/.test(reading || ''), 'the reading is the year-line (1856 cigar shop, 1974 company)')
  note(!/ticket|book|showtime|Jekyll/i.test(reading || ''), 'no weekend box office on the 1849 face')

  const roomAfterChip = await page.$('[data-testid="explore-canvas-interior"]')
  note(!roomAfterChip, 'the chip did not open a glyph room in place of the painting')
  const paintingAfter = await page.$eval('[data-testid="place-scene-historical"] img, [data-testid="explore-town-face"] img', (n) => n.getAttribute('src')).catch(() => null)
  note(paintingAfter === paintingBefore, 'the painting is still the painting after the click')

  const after = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => /explor|karma/i.test(k))))
  note(before === after, 'clicking absence wrote nothing: no visit, no karma')

  await page.screenshot({ path: `${outDir}/look-chips.png` })

  // ---- the rooms are painted, and still readable --------------------------
  await page.click('[data-testid="explore-spot-vol_canvas_flat"]')
  await page.waitForSelector('[data-testid="explore-canvas-interior"]', { timeout: 20000 })
  const room = await page.evaluate(() => {
    const n = document.querySelector('[data-testid="explore-canvas-interior"]')
    const r = n.getBoundingClientRect()
    const cells = [...n.querySelectorAll(':scope > span > span > span')]
    const colors = new Set(cells.map((c) => getComputedStyle(c).backgroundColor).filter((c) => c && c !== 'rgba(0, 0, 0, 0)'))
    return {
      text: n.innerText,
      rows: n.innerText.split('\n').length,
      cols: Number(n.getAttribute('data-cols')),
      box: { w: Math.round(r.width), h: Math.round(r.height) },
      cells: cells.length,
      colors: [...colors],
      ink: cells.length ? getComputedStyle(cells[0]).color : null,
    }
  })
  evidence.room = { ...room, text: undefined }
  note(room.rows === 22, `the authored 22-row reading is still on the page (got ${room.rows})`)
  note(room.cols === 40, `the grid is still 40 wide (got ${room.cols})`)
  note(/#{20}/.test(room.text), 'the glyph rows are unchanged text')
  note(room.cells === 880, `every cell is painted individually (${room.cells} of 880)`)
  note(room.colors.length >= 4, `the room shows ${room.colors.length} colours, not one flat field`)
  note(room.ink === 'rgba(0, 0, 0, 0)', `the letters are transparent, so it reads as pixels (ink ${room.ink})`)
  note(room.box.w > 300 && room.box.h > 100, `the room fills the frame (${room.box.w}x${room.box.h})`)
  await page.screenshot({ path: `${outDir}/room-canvas-saloon.png` })

  // A painted room whose picture is one colour is the failure this guards.
  const shotColors = await page.evaluate(() => {
    const n = document.querySelector('[data-testid="explore-canvas-interior"]')
    const cells = [...n.querySelectorAll(':scope > span > span > span')]
    const mid = cells.slice(Math.floor(cells.length / 2), Math.floor(cells.length / 2) + 40)
    return [...new Set(mid.map((c) => getComputedStyle(c).backgroundColor))]
  })
  note(shotColors.length >= 2, `one row alone carries ${shotColors.length} colours`)

  // ---- the walk is untouched ---------------------------------------------
  await page.click('[data-testid="town-walk-start"]')
  await page.waitForSelector('[data-testid="town-walk-scene"]', { timeout: 20000 })
  const rung = await page.evaluate(() => ({
    pixel: !!document.querySelector('[data-testid="town-walk-scene"]'),
    ascii: !!document.querySelector('[data-testid="ascii2-view"]'),
  }))
  evidence.walk = rung
  note(rung.pixel && !rung.ascii, 'Walk the camp still opens the 32-bit map by default')
  const chipsWhileWalking = await page.$$('[data-testid^="explore-later-"]')
  note(chipsWhileWalking.length === 0, `no absence chips over the walk (found ${chipsWhileWalking.length})`)
  await page.screenshot({ path: `${outDir}/walk-default.png` })

  evidence.consoleErrors = consoleErrors
  note(consoleErrors.length === 0, `no console errors (${consoleErrors.length})`)

  await writeFile(`${outDir}/evidence.json`, JSON.stringify({ baseUrl, findings, evidence }, null, 2))
} catch (err) {
  console.error(`UNMEASURED: the check could not finish — ${err.message}`)
  await browser.close()
  process.exit(2)
}

await browser.close()
if (findings.length) {
  console.error(`${findings.length} finding(s)`)
  process.exit(1)
}
console.log(JSON.stringify({ ok: true, baseUrl, chips: LATER.length, artifacts: outDir }))
