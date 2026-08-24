#!/usr/bin/env node
/**
 * Physical key for the playable area — tape this at the ranch house.
 * Distinct from the 14 /clue/* treasure-hunt codes.
 */
import QRCode from 'qrcode'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public', 'qr-codes')
const url = 'https://backofbeyondranch.farm/explore?qr=ranch-house'

const qrOptions = {
  errorCorrectionLevel: 'H',
  margin: 2,
  width: 1200,
  color: {
    dark: '#1a1c2c',
    light: '#f4d76b',
  },
}

fs.mkdirSync(outDir, { recursive: true })
const pngPath = path.join(outDir, 'ranch-house.png')
const svgPath = path.join(outDir, 'ranch-house.svg')
await QRCode.toFile(pngPath, url, { ...qrOptions, type: 'png' })
fs.writeFileSync(svgPath, await QRCode.toString(url, { ...qrOptions, type: 'svg', width: 1200 }))
const indexPath = path.join(outDir, 'RANCH-HOUSE.md')
fs.writeFileSync(indexPath, `# Ranch-house playable-area QR

URL: ${url}
PNG: qr-codes/ranch-house.png
SVG: qr-codes/ranch-house.svg

This is NOT a treasure-hunt clue. It opens the Gold Country map
from the porch. Leave GPS on. Print via /host/ranch-house-card
(local :3099; not in the public nav).
`)
console.log(JSON.stringify({ ok: true, url, png: pngPath, svg: svgPath }))
