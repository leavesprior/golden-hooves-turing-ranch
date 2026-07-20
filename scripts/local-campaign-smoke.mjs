import puppeteer from 'puppeteer-core'

const baseUrl = process.env.BOBR_TEST_URL || 'http://127.0.0.1:3000'
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome-stable',
  args: ['--no-sandbox', '--disable-gpu'],
})

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function clickText(page, text) {
  const clicked = await page.evaluate((needle) => {
    const candidates = [...document.querySelectorAll('button, a')]
    const element = candidates.find((item) => (item.textContent || '').trim().includes(needle))
    if (!element) return false
    element.click()
    return true
  }, text)
  assert(clicked, 'Could not find control containing: ' + text)
  await new Promise((resolve) => setTimeout(resolve, 80))
}

async function pageText(page) {
  return page.evaluate(() => document.body.innerText)
}

async function waitText(page, text) {
  await page.waitForFunction((needle) => document.body.innerText.toLowerCase().includes(needle.toLowerCase()), { timeout: 5000 }, text)
}

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 1000 })
  await page.goto(baseUrl + '/playtest', { waitUntil: 'networkidle0' })
  await page.evaluate(() => localStorage.removeItem('bobr_local_campaign_v1'))
  await page.reload({ waitUntil: 'networkidle0' })

  const nameInput = await page.$('input')
  assert(nameInput, 'Player name input did not render')
  await nameInput.click({ clickCount: 3 })
  await nameInput.type('Ada Lovelace')
  await clickText(page, 'Frontier Doctor')
  await clickText(page, 'UNDER 18')
  await page.select('select', 'woman')
  await clickText(page, 'BEGIN THE LOCAL CAMPAIGN')
  await waitText(page, "Vane's escape")

  await clickText(page, 'TRACE THE TARE')
  await waitText(page, '1849: the road remembers')
  await clickText(page, 'MAKE A FAIR AGREEMENT')
  await waitText(page, 'Level 2 gateway')
  let text = await pageText(page)
  assert(text.toLowerCase().includes('level 2 gateway'), 'Gold Country did not become the Level 2 gateway')
  await clickText(page, 'OPEN THE REGIONAL MAP')
  await waitText(page, 'Choose how the party reaches Volcano')
  await clickText(page, 'HORSE')
  await waitText(page, 'Volcano, 1879')
  text = await pageText(page)
  assert(text.toLowerCase().includes('volcano, 1879'), 'Volcano encounter did not load')
  assert(text.includes('TREAT THE FRIGHTENED UNDERSTUDY'), 'Doctor-specific choice was not available')
  assert(!text.includes('TEST THE ASSAY TICKET AGAINST REAL MILL PRACTICE'), 'Miner-only choice leaked into doctor play')
  await clickText(page, 'ASK THADDEUS VALE')
  await waitText(page, 'IMPROVISED VOICE ONLY')
  text = await pageText(page)
  assert(!/you (gain|receive|earn|unlock)/i.test(text), 'NPC dialogue attempted to grant game state')
  await clickText(page, 'TREAT THE FRIGHTENED UNDERSTUDY')
  await waitText(page, 'Case consequence')
  await clickText(page, 'FOLLOW THIS VERIFIED ACTION')
  await waitText(page, 'Future witness')

  await clickText(page, 'Casebook')
  await waitText(page, 'PERSISTENT CASEBOOK')
  text = await pageText(page)
  assert(text.includes('A future player reads this visit'), 'Future-witness evidence was not recorded')
  assert(text.includes('The road remembers'), 'Trail consequence did not survive into the Casebook')

  await clickText(page, 'World')
  await waitText(page, 'Regional simulation')
  text = await pageText(page)
  assert(text.includes('Cold sarsaparilla'), 'Under-18 saloon did not offer sarsaparilla')
  assert(!text.includes('Beer, whisky, or sarsaparilla'), 'Adult drink offer leaked into under-18 mode')
  assert(text.includes('Fair passage and shared route knowledge improved supply.'), 'Fair-trade economy explanation did not propagate')

  await page.reload({ waitUntil: 'networkidle0' })
  text = await pageText(page)
  assert(text.includes('Ada Lovelace'), 'Player identity did not persist across reload')
  assert(text.includes('FUTURE'), 'Campaign chapter did not persist across reload')

  const desktop = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.body.scrollWidth,
    brokenImages: [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.getAttribute('src')),
  }))
  assert(desktop.scrollWidth <= desktop.width, 'Desktop page has horizontal overflow')
  assert(desktop.brokenImages.length === 0, 'Desktop page has broken images: ' + desktop.brokenImages.join(', '))

  await page.setViewport({ width: 390, height: 844 })
  await page.reload({ waitUntil: 'networkidle0' })
  const mobile = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.body.scrollWidth,
    brokenImages: [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.getAttribute('src')),
  }))
  assert(mobile.scrollWidth <= mobile.width, 'Mobile page has horizontal overflow')
  assert(mobile.brokenImages.length === 0, 'Mobile page has broken images: ' + mobile.brokenImages.join(', '))

  console.log(JSON.stringify({
    passed: true,
    route: baseUrl + '/playtest',
    journey: 'under18 doctor -> fair trade -> horse -> Volcano care -> future witness',
    persistence: true,
    desktop,
    mobile,
  }, null, 2))
} finally {
  await browser.close()
}
