#!/usr/bin/env node

const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

// Base URL for the website
const BASE_URL = 'https://backofbeyondranch.farm'

// All 14 QR locations
const locations = [
  { id: 1, slug: 'welcome', name: 'The Welcome Gate' },
  { id: 2, slug: 'hot-tub', name: 'The Bubbling Springs' },
  { id: 3, slug: 'game-room', name: "The Gambler's Den" },
  { id: 4, slug: 'piano', name: 'The Silent Keys' },
  { id: 5, slug: 'fireplace', name: "The Miner's Hearth" },
  { id: 6, slug: 'lake', name: 'The Hidden Cove' },
  { id: 7, slug: 'master-bedroom', name: "Tobias's Chamber" },
  { id: 8, slug: 'kitchen', name: 'The Recipe Vault' },
  { id: 9, slug: 'deck', name: 'The Lookout' },
  { id: 10, slug: 'ev-charger', name: 'The Lightning Post' },
  { id: 11, slug: 'trail', name: 'The Forgotten Path' },
  { id: 12, slug: 'history-corner', name: 'The Chronicle Wall' },
  { id: 13, slug: 'stargazing', name: 'The Star Map' },
  { id: 14, slug: 'pet-area', name: 'The Guardian Grove' },
]

// Gold Country color scheme
const qrOptions = {
  errorCorrectionLevel: 'H',
  type: 'png',
  width: 1200,
  margin: 2,
  color: {
    dark: '#1a1c2c', // pixel-bg-dark
    light: '#f4d76b', // pixel-gold-light
  },
}

const svgOptions = {
  errorCorrectionLevel: 'H',
  type: 'svg',
  width: 1200,
  margin: 2,
  color: {
    dark: '#1a1c2c',
    light: '#f4d76b',
  },
}

async function generateQRCodes() {
  const outputDir = path.join(__dirname, '..', 'public', 'qr-codes')

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log('Generating QR codes for Golden Hooves Legacy...\n')

  for (const location of locations) {
    const url = `${BASE_URL}/clue/${location.slug}`
    const pngPath = path.join(outputDir, `${location.slug}.png`)
    const svgPath = path.join(outputDir, `${location.slug}.svg`)

    try {
      // Generate PNG
      await QRCode.toFile(pngPath, url, qrOptions)

      // Generate SVG
      const svgString = await QRCode.toString(url, { ...svgOptions, type: 'svg' })
      fs.writeFileSync(svgPath, svgString)

      console.log(`✓ ${location.id.toString().padStart(2, '0')}. ${location.name}`)
      console.log(`   PNG: ${pngPath}`)
      console.log(`   SVG: ${svgPath}`)
      console.log(`   URL: ${url}\n`)
    } catch (err) {
      console.error(`✗ Failed to generate QR for ${location.name}:`, err.message)
    }
  }

  // Generate master index file
  const indexContent = `# Golden Hooves Legacy - QR Code Index

Generated: ${new Date().toISOString()}
Base URL: ${BASE_URL}

## Locations

${locations.map(loc => `
### ${loc.id}. ${loc.name}
- Slug: ${loc.slug}
- URL: ${BASE_URL}/clue/${loc.slug}
- PNG: qr-codes/${loc.slug}.png
- SVG: qr-codes/${loc.slug}.svg
`).join('')}

## Printing Recommendations

| Location Type | Material | Size |
|--------------|----------|------|
| Outdoor (hot tub, deck, trail) | Waterproof laminated | 4" x 4" |
| Indoor (piano, fireplace, kitchen) | Framed with gold border | 3" x 3" |
| High traffic (welcome, game room) | Metal plaque | 5" x 5" |

## Color Scheme

- QR Dark: #1a1c2c (Deep navy)
- QR Light: #f4d76b (Gold)
- Border suggestion: #e8a027 (Amber)
`

  fs.writeFileSync(path.join(outputDir, 'INDEX.md'), indexContent)
  console.log('✓ Generated INDEX.md with printing guide\n')
  console.log(`Done! Generated ${locations.length} QR codes in ${outputDir}`)
}

generateQRCodes().catch(console.error)
