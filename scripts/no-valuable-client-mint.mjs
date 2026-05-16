#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const srcDir = path.join(root, 'src')
const sourceFilePattern = /\.(?:ts|tsx)$/
const randomPattern = /Math\s*\.\s*random\s*\(\s*\)/
const safeMintPattern = /\/\/\s*safe-mint:/
const monetaryTokenPattern = /\b(?:discount|reward|coupon|code)\b|BOBR|TOBIAS|EARLY_DISCOUNT/i
const interpolatedMintTemplatePattern = /`(?:BOBR-EARLY-|BOBR-|TOBIAS-|EARLY_DISCOUNT_)[^`]*\$\{[^`]*`/g
const serverOnlyImportPattern = /^\s*import\s+(?:.*\s+from\s+)?['"](?:server-only|(?:node:)?(?:fs|fs\/promises)|better-sqlite3)['"]/m
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

function isClientReachableSource(file, text) {
  const relativePath = path.relative(root, file).split(path.sep).join('/')

  if (relativePath.startsWith('src/app/api/')) return false
  if (relativePath.startsWith('src/app/(api-routes)/api/')) return false
  if (relativePath === 'src/middleware.ts') return false

  return !serverOnlyImportPattern.test(text)
}

const findings = []

for (const file of walk(srcDir)) {
  const text = fs.readFileSync(file, 'utf8')
  if (!isClientReachableSource(file, text)) continue

  const lines = text.split(/\r?\n/)
  const searchableLines = stripComments(lines)
  const searchableText = searchableLines.join('\n')

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
        rule: 'random-proximity',
        source: lines[index].trim(),
      })
    }
  })

  for (const match of searchableText.matchAll(interpolatedMintTemplatePattern)) {
    const line = searchableText.slice(0, match.index).split('\n').length
    if (safeMintPattern.test(lines[line - 1])) continue

    findings.push({
      file: path.relative(root, file),
      line,
      rule: 'interpolated-template',
      source: lines[line - 1].trim(),
    })
  }
}

if (findings.length > 0) {
  console.error('Valuable client mint guard failed.')
  console.error(
    `Math.random() appears within ${contextRadius} lines of monetary reward/code tokens: discount, reward, coupon, BOBR, TOBIAS, EARLY_DISCOUNT, code.`,
  )
  console.error(
    'Interpolated template literals that start with BOBR-EARLY-, BOBR-, TOBIAS-, or EARLY_DISCOUNT_ are also blocked.',
  )
  console.error('Move minting server-side, or add // safe-mint: <reason> on the flagged line for non-monetary randomness.')
  console.error('')

  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} (${finding.rule})`)
    console.error(`  ${finding.source}`)
  }

  process.exit(1)
}

console.log('Reward mint guard passed: no valuable client-side random or interpolated template minting found.')
