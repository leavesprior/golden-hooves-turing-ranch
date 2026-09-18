/**
 * ascii2-walk-browser-check.mjs — does the ascii2 rung actually work in a browser?
 *
 * Everything else about this rung is proved by a node test against a pure module.
 * That cannot tell you whether React mounts it, whether the keys reach it, or
 * whether a person can see the thing. This drives real Chrome (headless) through
 * Explore -> Volcano -> Walk the camp -> Text walk, walks with the keyboard, and
 * asserts on what the page actually shows.
 *
 *   BOBR_URL=http://127.0.0.1:3107 node scripts/ascii2-walk-browser-check.mjs
 *
 * Screenshots land in test-reports/ascii2/. Exit 0 = measured clean, 1 = measured
 * with findings, 2 = UNMEASURED (could not look — never read that as a pass).
 */

import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const baseUrl = process.env.BOBR_URL || 'http://127.0.0.1:3107'
const outDir = process.env.BOBR_ARTIFACT_DIR || fileURLToPath(new URL('../test-reports/ascii2/', import.meta.url))

const findings = []
const note = (ok, what) => {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${what}`)
  if (!ok) findings.push(what)
}

async function clickText(page, text, testid) {
  const clicked = await page.evaluate(
    ({ needle, id }) => {
      const list = [...document.querySelectorAll('button')]
      const button = id
        ? list.find((b) => b.getAttribute('data-testid') === id)
        : list.find((b) => b.textContent?.toLowerCase().includes(needle.toLowerCase()))
      if (!button) return false
      button.click()
      return true
    },
    { needle: text, id: testid },
  )
  assert.equal(clicked, true, `button "${testid || text}" must exist`)
  await new Promise((r) => setTimeout(r, 250))
}

const shot = async (page, name) => {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false })
  return `${outDir}/${name}.png`
}

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

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  const consoleErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

  // /explore is gated by the physical ranch-house QR (exploreQrGate). This is the
  // URL that QR opens; `town=volcano` is the peek route the hub already allows.
  // The check goes through the real gate, it does not bypass it.
  await page.goto(`${baseUrl}/explore?qr=ranch-house&town=volcano`, { waitUntil: 'networkidle0', timeout: 60000 })
  note(new URL(page.url()).pathname === '/explore', `loaded /explore through the ranch-house QR gate (${new URL(page.url()).pathname})`)
  const locked = await page.$('[data-testid="explore-qr-lock"]')
  note(!locked, 'QR gate is satisfied (no lock screen)')

  // Into Volcano, if the peek route did not already open it.
  if (!(await page.$('[data-testid="explore-town-face"]'))) {
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button, a, [role="button"]')].find((n) =>
        n.textContent?.trim().toLowerCase().includes('volcano'),
      )
      el?.click()
    })
  }
  await page.waitForSelector('[data-testid="explore-town-face"]', { timeout: 20000 })
  const townId = await page.$eval('[data-testid="explore-town-face"]', (n) => n.getAttribute('data-town'))
  note(townId === 'volcano', `town face is volcano (got ${townId})`)

  const faceTitle = await page.$eval('[data-testid="explore-town-title"]', (n) => n.textContent?.trim())
  note(faceTitle === 'The canvas camp', `1849 face name shown, not the modern one (got "${faceTitle}")`)

  // Walk the camp -> pixel walk, then step DOWN the ladder to ascii2.
  await clickText(page, 'Walk the camp', 'town-walk-start')
  await page.waitForSelector('[data-testid="town-walk-scene"]', { timeout: 20000 })
  const pixelPos = await page.$eval('[data-testid="town-walk-player"]', (n) => [n.dataset.x, n.dataset.y].join(','))
  note(/^\d+,\d+$/.test(pixelPos), `pixel walk mounted, player at ${pixelPos}`)
  await shot(page, '02-pixel-walk')

  await clickText(page, 'Text walk', 'town-walk-ascii2')
  await page.waitForSelector('[data-testid="ascii2-view"]', { timeout: 20000 })
  const asciiPos = await page.$eval('[data-testid="ascii2-view"]', (n) => [n.dataset.x, n.dataset.y].join(','))
  note(asciiPos === pixelPos, `position carried across the toggle (pixel ${pixelPos} -> ascii ${asciiPos})`)
  await shot(page, '03-ascii2-walk')

  // The frame must be drawn, coloured, and 24 rows tall.
  const frame = await page.$eval('[data-testid="ascii2-view"] pre', (pre) => ({
    // Count BOTH ways: the DOM row elements, and the newlines a copy would carry.
    // They must agree — a frame that looks right but copies as one line is a frame
    // whose rows exist only as styling.
    rowEls: pre.children.length,
    rows: pre.textContent?.split('\n').length ?? 0,
    colours: new Set([...pre.querySelectorAll('span[style]')].map((s) => s.style.color)).size,
    text: pre.textContent ?? '',
  }))
  note(frame.rowEls === 24, `frame is 24 row elements in the DOM (got ${frame.rowEls})`)
  note(frame.rows === 24, `frame copies out as 24 real lines (got ${frame.rows})`)
  note(frame.colours >= 3, `frame is drawn in colour (${frame.colours} distinct colours)`)
  note(/facing (north|south|east|west)/.test(frame.text), 'compass line is rendered')

  // FITS ON THE SCREEN. Rung 0 exists for weak devices, so the frame must not push
  // its own controls off the viewport. The first version did exactly that: the lower
  // direction buttons were clipped by the town aside below. A walk you cannot steer
  // is not a walk, and no unit test can see it. Measure EVERY control, and measure
  // at phone size too — that is the device this rung is for.
  const controlsFit = async (label) => {
    const r = await page.evaluate(() => {
      const ids = ['ascii2-forward', 'ascii2-back', 'ascii2-turn-left', 'ascii2-turn-right']
      const vh = window.innerHeight
      const out = []
      for (const id of ids) {
        const n = document.querySelector(`[data-testid="${id}"]`)
        if (!n) { out.push({ id, missing: true }); continue }
        const b = n.getBoundingClientRect()
        // Clipped by an overlaying panel counts as off-screen too: ask what is
        // actually painted at the button's own centre.
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
        out.push({ id, bottom: Math.round(b.bottom), vh, onScreen: b.bottom <= vh && b.top >= 0, reachable: !!hit && (hit === n || n.contains(hit)) })
      }
      return out
    })
    for (const c of r) {
      note(!c.missing, `${label}: control ${c.id} exists`)
      if (c.missing) continue
      note(c.onScreen, `${label}: ${c.id} is within the viewport (bottom ${c.bottom} vs ${c.vh})`)
      note(c.reachable, `${label}: ${c.id} is not covered by another panel`)
    }
  }
  // THE WHOLE FRAME IS SEEN. The controls fitting says nothing about the frame
  // itself: on 2026-09-18 Grok read 03-ascii2-walk.png and found the caption row
  // (the line that names the year) hidden under the instructions, while this
  // script reported 41/41. Ask what is painted at the LAST row, and whether the
  // frame's own box is scrolling rows out of sight.
  const frameFits = async (label) => {
    const r = await page.evaluate(() => {
      const view = document.querySelector('[data-testid="ascii2-view"]')
      const pre = view?.querySelector('pre')
      const last = pre?.lastElementChild
      if (!view || !pre || !last) return { missing: true }
      const range = document.createRange()
      range.selectNodeContents(last)
      const rect = [...range.getClientRects()].find((x) => x.width > 0)
      if (!rect) return { missing: true }
      const hit = document.elementFromPoint(rect.left + Math.min(rect.width / 2, 40), rect.top + rect.height / 2)
      return {
        hiddenPx: Math.max(0, Math.round(view.scrollHeight - view.clientHeight)),
        lastRowPainted: !!hit && pre.contains(hit),
        lastRowOnScreen: rect.bottom <= window.innerHeight && rect.top >= 0,
        lastRowInsideBox: rect.bottom <= view.getBoundingClientRect().bottom + 0.5,
      }
    })
    note(!r.missing, `${label}: frame and its last row exist`)
    if (r.missing) return
    note(r.hiddenPx <= 1, `${label}: no frame rows scrolled out of sight (${r.hiddenPx}px hidden)`)
    note(r.lastRowInsideBox && r.lastRowOnScreen, `${label}: the last frame row sits inside its box and the viewport`)
    note(r.lastRowPainted, `${label}: the last frame row is what is painted there, not another element`)
  }
  await controlsFit('desktop 1280x900')
  await frameFits('desktop 1280x900')
  await page.setViewport({ width: 390, height: 844 })
  await new Promise((r) => setTimeout(r, 300))
  await shot(page, '06-phone')
  await controlsFit('phone 390x844')
  await frameFits('phone 390x844')
  // Legibility, not just fit: a frame that technically fits at 4px is not a walk
  // anyone can read. On a phone the narrow (40-column) frame must be used, and the
  // glyphs must stay above a floor.
  const phoneFrame = await page.evaluate(() => {
    const pre = document.querySelector('[data-testid="ascii2-view"] pre')
    const first = pre?.textContent?.split('\n')[0] ?? ''
    return { cols: Number(pre?.getAttribute('data-cols') || 0), width: first.length, px: parseFloat(getComputedStyle(pre).fontSize) }
  })
  note(phoneFrame.cols === 40, `phone gets the 40-column frame (got ${phoneFrame.cols})`)
  note(phoneFrame.width <= 40, `phone rows are at most 40 glyphs (got ${phoneFrame.width})`)
  note(phoneFrame.px >= 7, `phone glyphs stay legible (${phoneFrame.px}px)`)
  await page.setViewport({ width: 1280, height: 900 })
  await new Promise((r) => setTimeout(r, 300))

  // A later site is named as absence somewhere in the camp. Turn and look.
  const seen = new Set()
  let absenceLine = ''
  for (const key of ['w', 'a', 'w', 'd', 'w', 'd', 'w', 'a', 'w', 's', 'a', 'w']) {
    await page.focus('[data-testid="ascii2-view"]')
    await page.keyboard.press(key === 'w' ? 'w' : key)
    await new Promise((r) => setTimeout(r, 90))
    const state = await page.evaluate(() => ({
      pos: (() => {
        const n = document.querySelector('[data-testid="ascii2-view"]')
        return `${n?.getAttribute('data-x')},${n?.getAttribute('data-y')}`
      })(),
      heading: document.querySelector('[data-testid="ascii2-view"]')?.getAttribute('data-heading'),
      line: document.querySelector('[data-testid="ascii2-feedback"]')?.textContent ?? '',
    }))
    seen.add(state.pos)
    if (!absenceLine && /not built in 1849|1862|1860|not from this year|plaque|no gun/i.test(state.line)) {
      absenceLine = state.line
      // Shoot WHILE the line is showing. Shooting after the loop captured a later
      // step that read "Open ground. Walk on." under a file named absence-line.
      await shot(page, '04-absence-line')
    }
  }
  // The notes say this walk visits 5 tiles; hold it to that, not to "more than one".
  note(seen.size >= 5, `the keyboard actually walks (${seen.size} distinct tiles visited, need 5)`)
  note(!!absenceLine, `a later site announces itself as absence — "${absenceLine.slice(0, 70)}"`)

  // Back up the ladder: the pixel walk must resume on the same tile.
  const beforeBack = await page.$eval('[data-testid="ascii2-view"]', (n) => [n.dataset.x, n.dataset.y].join(','))
  await clickText(page, 'Pixel walk', 'ascii2-to-pixel')
  await page.waitForSelector('[data-testid="town-walk-player"]', { timeout: 20000 })
  const afterBack = await page.$eval('[data-testid="town-walk-player"]', (n) => [n.dataset.x, n.dataset.y].join(','))
  note(afterBack === beforeBack, `position carried BACK across the toggle (${beforeBack} -> ${afterBack})`)
  await shot(page, '05-back-to-pixel')

  // WEST POINT, driven for real. Until 2026-09-18 the second town was proved only
  // by unit tests; Grok's review pointed out no browser had ever walked it.
  await page.goto(`${baseUrl}/explore?qr=ranch-house&town=west_point`, { waitUntil: 'networkidle0', timeout: 60000 })
  await page.waitForSelector('[data-testid="explore-town-face"]', { timeout: 20000 })
  const wpTown = await page.$eval('[data-testid="explore-town-face"]', (n) => n.getAttribute('data-town'))
  note(wpTown === 'west_point', `town face is west_point (got ${wpTown})`)
  await clickText(page, 'Walk the camp', 'town-walk-start')
  await page.waitForSelector('[data-testid="town-walk-player"]', { timeout: 20000 })
  const wpPixel = await page.$eval('[data-testid="town-walk-player"]', (n) => [n.dataset.x, n.dataset.y].join(','))
  await clickText(page, 'Text walk', 'town-walk-ascii2')
  await page.waitForSelector('[data-testid="ascii2-view"]', { timeout: 20000 })
  const wpAscii = await page.$eval('[data-testid="ascii2-view"]', (n) => [n.dataset.x, n.dataset.y].join(','))
  note(/^\d+,\d+$/.test(wpPixel) && wpAscii === wpPixel, `west_point: position carried across the toggle (${wpPixel} -> ${wpAscii})`)
  const wpRows = await page.$eval('[data-testid="ascii2-view"] pre', (pre) => pre.textContent?.split('\n').length ?? 0)
  note(wpRows === 24, `west_point: frame copies out as 24 lines (got ${wpRows})`)
  await frameFits('west_point desktop 1280x900')
  const wpSeen = new Set([wpAscii])
  let wpAbsence = ''
  for (const key of ['w', 'w', 'w', 'a', 'w', 'd', 'd', 'w', 'w', 'd', 'w', 'w']) {
    await page.focus('[data-testid="ascii2-view"]')
    await page.keyboard.press(key)
    await new Promise((r) => setTimeout(r, 90))
    const st = await page.evaluate(() => ({
      pos: ['x', 'y'].map((a) => document.querySelector('[data-testid="ascii2-view"]')?.getAttribute(`data-${a}`)).join(','),
      line: document.querySelector('[data-testid="ascii2-feedback"]')?.textContent ?? '',
    }))
    wpSeen.add(st.pos)
    if (!wpAbsence && /not built in 1849|not from this year|later/i.test(st.line)) {
      wpAbsence = st.line
      await shot(page, '07-west-point-absence')
    }
  }
  note(wpSeen.size >= 3, `west_point: the keyboard walks (${wpSeen.size} distinct tiles)`)
  note(!!wpAbsence, `west_point: a later site announces itself as absence — "${wpAbsence.slice(0, 70)}"`)

  note(consoleErrors.length === 0, `no console errors (${consoleErrors.length}): ${consoleErrors.slice(0, 2).join(' | ')}`)

  await writeFile(
    `${outDir}/result.json`,
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        base_url: baseUrl,
        findings,
        ok: findings.length === 0,
        _conf: findings.length === 0 ? 1 : 0,
        screenshots: ['02-pixel-walk', '03-ascii2-walk', '04-absence-line', '05-back-to-pixel', '06-phone', '07-west-point-absence'],
        absence_line: absenceLine,
        west_point_absence_line: wpAbsence,
        console_errors: consoleErrors,
      },
      null,
      2,
    ) + '\n',
  )
  console.log(findings.length ? `\nFINDINGS: ${findings.length}` : '\nascii2 browser check passed')
  process.exit(findings.length ? 1 : 0)
} catch (err) {
  console.error(`UNMEASURED: the check could not complete — ${err.message}`)
  process.exit(2)
} finally {
  await browser.close()
}
