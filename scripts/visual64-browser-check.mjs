import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

const baseUrl = process.env.BOBR_URL || 'http://127.0.0.1:3102'
const artifactDir = process.env.BOBR_ARTIFACT_DIR || '/home/granny/bobr-visual64/artifacts'

async function clickByText(page, text) {
  const clicked = await page.evaluate((needle) => {
    const button = [...document.querySelectorAll('button')]
      .find((item) => item.textContent?.toLowerCase().includes(needle.toLowerCase()))
    if (!button) return false
    button.click()
    return true
  }, text)
  assert.equal(clicked, true, `button containing "${text}" must exist`)
  await new Promise((resolve) => setTimeout(resolve, 80))
}

async function reachVolcano(page) {
  await page.goto(`${baseUrl}/playtest`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => localStorage.removeItem('bobr_local_campaign_v1'))
  await page.reload({ waitUntil: 'networkidle0' })
  await clickByText(page, 'begin the complete local campaign')
  await clickByText(page, 'trace the tare')
  await clickByText(page, 'stop the thieves')
  await clickByText(page, 'open the regional map')
  await clickByText(page, 'horse')
  await page.waitForFunction(() => document.body.textContent?.includes('Volcano, 1879'))
}

await mkdir(artifactDir, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
})

try {
  for (const spec of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const page = await browser.newPage()
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewport({ width: spec.width, height: spec.height, deviceScaleFactor: 1 })
    await reachVolcano(page)

    const evidence = await page.evaluate(() => {
      const shell = document.querySelector('.visual64-shell')
      const image = document.querySelector('.visual64-scene-image')
      return {
        figureCount: document.querySelectorAll('.visual64-character-sprite').length,
        spriteAtlas: getComputedStyle(document.querySelector('.visual64-character-sprite')).backgroundImage,
        shellFont: shell ? getComputedStyle(shell).fontFamily : '',
        imageRendering: image ? getComputedStyle(image).imageRendering : '',
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        title: image?.closest('section')?.querySelector('h2')?.textContent || '',
      }
    })

    assert.ok(evidence.figureCount >= 6, `${spec.name} must stage the party and Volcano witnesses`)
    assert.match(evidence.spriteAtlas, /visual64-character-atlas/, `${spec.name} must use the raster character atlas`)
    assert.match(evidence.shellFont, /Georgia/i, `${spec.name} must use the Visual64 type system`)
    assert.equal(evidence.imageRendering, 'auto', `${spec.name} scene art must not inherit global pixelation`)
    assert.ok(evidence.overflow <= 1, `${spec.name} must not overflow horizontally`)
    assert.match(evidence.title, /Help first/i, `${spec.name} must reach the Volcano quest`)
    assert.deepEqual(errors, [], `${spec.name} browser console must remain clean`)

    await page.screenshot({ path: `${artifactDir}/visual64-${spec.name}.png`, fullPage: true })
    if (spec.name === 'desktop') {
      await clickByText(page, 'map')
      const mapEvidence = await page.evaluate(() => {
        const position = (id) => {
          const node = document.querySelector(`[data-town-id="${id}"]`)
          return node ? { left: node.offsetLeft, top: node.offsetTop } : null
        }
        return {
          towns: document.querySelectorAll('[data-town-id]').length,
          volcano: position('volcano'),
          jackson: position('jackson'),
          westPoint: position('west_point'),
          mapText: document.querySelector('[data-testid="gold-country-map"]')?.textContent || '',
        }
      })
      assert.equal(mapEvidence.towns, 7)
      assert.ok(mapEvidence.volcano.top < mapEvidence.jackson.top, 'browser map must place Volcano north of Jackson')
      assert.ok(mapEvidence.westPoint.left > mapEvidence.volcano.left, 'browser map must place West Point east of Volcano')
      assert.doesNotMatch(mapEvidence.mapText, /world/i, 'regional map must not present itself as a world map')
      await clickByText(page, 'world')
      const marketEvidence = await page.evaluate(() => ({
        commodities: document.querySelectorAll('[data-commodity]').length,
        hasResolveLater: document.body.textContent?.includes('Verified chain adapter: Resolve Later'),
        hasPulse: Boolean(document.querySelector('[data-testid="market-tick"]')),
      }))
      assert.equal(marketEvidence.commodities, 8)
      assert.equal(marketEvidence.hasResolveLater, true)
      assert.equal(marketEvidence.hasPulse, true)
      await clickByText(page, 'journey')
    }
    await clickByText(page, 'help reset the stage')
    await clickByText(page, 'test the assay ticket')
    await clickByText(page, 'no person here')
    await page.waitForFunction(() => document.body.textContent?.includes('The real evidence holds'))
    await clickByText(page, 'follow this verified action')
    await page.waitForFunction(() => document.body.textContent?.includes('Another player'))

    const finale = await page.evaluate(() => {
      const campaign = JSON.parse(localStorage.getItem('bobr_local_campaign_v1') || '{}')
      const progression = JSON.parse(localStorage.getItem('bobr_cross_game_progression') || '{}')
      const labels = (progression.eventLog || []).map((event) => event.label)
      return {
        chapter: campaign.chapter,
        goodKarma: campaign.resources?.goodKarma,
        casebookEntries: campaign.casebook?.length,
        visual64ProductionEvents: labels.filter((label) => /Honest Trail|false assay case|future witness/i.test(label)).length,
      }
    })
    assert.equal(finale.chapter, 'future', `${spec.name} must complete the local golden path`)
    assert.equal(finale.goodKarma, 5, `${spec.name} must carry trail and Volcano karma forward`)
    assert.ok(finale.casebookEntries >= 6, `${spec.name} must preserve the unified casebook`)
    assert.equal(finale.visual64ProductionEvents, 0, `${spec.name} isolated mode must not write production events`)
    console.log(JSON.stringify({ viewport: spec.name, ...evidence, finale }))
    await page.close()
  }

  const importPage = await browser.newPage()
  const importErrors = []
  importPage.on('console', (message) => {
    if (message.type() === 'error') importErrors.push(message.text())
  })
  importPage.on('pageerror', (error) => importErrors.push(error.message))
  await importPage.setViewport({ width: 1180, height: 900, deviceScaleFactor: 1 })
  await importPage.goto(`${baseUrl}/playtest`, { waitUntil: 'networkidle0' })
  const productionBefore = await importPage.evaluate(() => {
    const current = JSON.parse(localStorage.getItem('bobr_cross_game_progression') || '{}')
    current.milestones = [
      ...(Array.isArray(current.milestones) ? current.milestones.filter((item) => !['time_chase_complete', 'completed_journey_west', 'reached_west_point'].includes(item.id)) : []),
      { id: 'time_chase_complete', source: 'rpg_adventure', timestamp: '2026-07-12T00:00:00.000Z' },
      { id: 'completed_journey_west', source: 'prospectors_tale', timestamp: '2026-07-12T00:00:01.000Z' },
      { id: 'reached_west_point', source: 'prospectors_tale', timestamp: '2026-07-12T00:00:02.000Z' },
    ]
    current.eventLog = [
      { id: 'test-survived', timestamp: 1, mode: 'prospectors_tale', action: 'survived_trail', label: 'The party survived the trail.' },
      { id: 'test-shared', timestamp: 2, mode: 'prospectors_tale', action: 'generous_sharing', label: 'Shared freight after the crossing.' },
    ]
    localStorage.setItem('bobr_cross_game_progression', JSON.stringify(current))
    localStorage.setItem('golden_hooves_save', JSON.stringify({
      version: '2.0.0', gamePhase: 'gold_country', currentChapter: 2, cluesGathered: ['freight manifest'],
    }))
    sessionStorage.setItem('bobr_where_in_time_state', JSON.stringify({
      phase: 'won', state: { traits: [{ label: 'Tare', value: 'shaved brass' }] },
    }))
    localStorage.removeItem('bobr_local_campaign_v1')
    return { milestones: current.milestones, eventLog: current.eventLog }
  })
  await importPage.reload({ waitUntil: 'networkidle0' })
  await importPage.waitForFunction(() => document.body.textContent?.includes('CONTINUE WITH PRODUCTION HISTORY'))
  await clickByText(importPage, 'continue with production history')
  await importPage.waitForFunction(() => document.body.textContent?.includes('Level 2 gateway'))

  const importEvidence = await importPage.evaluate(() => {
    const campaign = JSON.parse(localStorage.getItem('bobr_local_campaign_v1') || '{}')
    const production = JSON.parse(localStorage.getItem('bobr_cross_game_progression') || '{}')
    return {
      chapter: campaign.chapter,
      goodKarma: campaign.resources?.goodKarma,
      neutral: campaign.resources?.neutral,
      imported: campaign.flags?.imported_production_journey,
      casebookIds: (campaign.casebook || []).map((entry) => entry.id),
      production: { milestones: production.milestones, eventLog: production.eventLog },
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    }
  })
  assert.equal(importEvidence.chapter, 'arrival', 'production continuation must resume at the Gold Country gateway')
  assert.equal(importEvidence.goodKarma, 0, 'production continuation must not mint karma')
  assert.equal(importEvidence.neutral, 28, 'production continuation must not copy or spend currency')
  assert.equal(importEvidence.imported, true, 'production continuation must mark provenance')
  assert.ok(importEvidence.casebookIds.includes('production-time-chase'))
  assert.ok(importEvidence.casebookIds.includes('production-trail'))
  assert.deepEqual(importEvidence.production, productionBefore, 'production milestones and events must remain unchanged')
  assert.ok(importEvidence.overflow <= 1, 'production continuation must not overflow horizontally')
  assert.deepEqual(importErrors, [], 'production continuation browser console must remain clean')
  await importPage.screenshot({ path: `${artifactDir}/visual64-production-continuation.png`, fullPage: true })
  console.log(JSON.stringify({ viewport: 'production-continuation', ...importEvidence }))
  await importPage.close()
} finally {
  await browser.close()
}
