#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const srcDir = path.join(root, 'src')
const sourceFilePattern = /\.(?:ts|tsx)$/
const randomPattern = /Math\s*\.\s*random\s*\(\s*\)/
const safeMintPattern = /\/\/\s*safe-mint:/
const monetaryTokenPattern = /\b(?:discount|reward|coupon|code)\b|BOBR|TOBIAS|EARLY_DISCOUNT/i
const contextRadius = 8

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(fullPath))
    } else if (sourceFilePattern.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

function stripComments(lines) {
  let inBlockComment = false

  return lines.map((line) => {
    let out = ''
    let i = 0

    while (i < line.length) {
      if (inBlockComment) {
        const blockEnd = line.indexOf('*/', i)
        if (blockEnd === -1) break
        inBlockComment = false
        i = blockEnd + 2
        continue
      }

      if (line.startsWith('/*', i)) {
        inBlockComment = true
        i += 2
        continue
      }

      if (line.startsWith('//', i)) break

      out += line[i]
      i += 1
    }

    return out
  })
}

const findings = []

for (const file of walk(srcDir)) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)
  const searchableLines = stripComments(lines)

  searchableLines.forEach((line, index) => {
    if (!randomPattern.test(line)) return
    if (safeMintPattern.test(lines[index])) return

    const start = Math.max(0, index - contextRadius)
    const end = Math.min(searchableLines.length, index + contextRadius + 1)
    const context = searchableLines.slice(start, end).join('\n')

    if (monetaryTokenPattern.test(context)) {
      findings.push({
        file: path.relative(root, file),
        line: index + 1,
        source: lines[index].trim(),
      })
    }
  })
}

if (findings.length > 0) {
  console.error('Valuable client mint guard failed.')
  console.error(
    `Math.random() appears within ${contextRadius} lines of monetary reward/code tokens: discount, reward, coupon, BOBR, TOBIAS, EARLY_DISCOUNT, code.`,
  )
  console.error('Move minting server-side, or add // safe-mint: <reason> on the Math.random() line for non-monetary randomness.')
  console.error('')

  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line}`)
    console.error(`  ${finding.source}`)
  }

  process.exit(1)
}

console.log('Reward mint guard passed: no valuable client-side Math.random() minting found.')
