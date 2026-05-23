#!/usr/bin/env node

/**
 * Reward mint guard.
 *
 * Blocks client-reachable value minting patterns:
 * - Math.random() near monetary reward/code tokens
 * - direct BOBR/TOBIAS/EARLY_DISCOUNT interpolated template literals
 * - indirected template prefixes such as `${prefix}${hash}` when prefix is
 *   assigned from a monetary-token-bearing string elsewhere in the file
 *
 * Also blocks crypto.randomUUID() within the same monetary-token proximity
 * window unless the line has a // safe-mint: opt-out or the file is one of the
 * audited non-client exceptions in lib/discountCodesDb.ts or lib/cloudSave.ts.
 */

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const srcDir = path.join(root, 'src')
const sourceFilePattern = /\.(?:ts|tsx)$/
const randomPattern = /Math\s*\.\s*random\s*\(\s*\)/
const cryptoUuidPattern = /crypto\s*\.\s*randomUUID\s*\(\s*\)/
const safeMintPattern = /\/\/\s*safe-mint:/
const monetaryTokenPattern = /\b(?:discount|reward|coupon|code)\b|BOBR|TOBIAS|EARLY_DISCOUNT/i
const monetaryStringAssignmentPattern = /\b(?:discount|reward|coupon|code)\b/i
const monetaryCodeTokenAssignmentPattern = /BOBR|TOBIAS|EARLY_DISCOUNT/
const interpolatedMintTemplatePattern = /`(?:BOBR-EARLY-|BOBR-|TOBIAS-|EARLY_DISCOUNT_)[^`]*\$\{[^`]*`/g
const stringAssignmentPattern = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(["'`])([^"'`]*?)\2/g
const indirectedTemplatePattern = /`[^`]*\$\{\s*([A-Za-z_$][\w$]*)\s*\}[^`]*\$\{\s*([A-Za-z_$][\w$]*)\s*\}[^`]*`/g
const serverOnlyImportPattern = /^\s*import\s+(?:.*\s+from\s+)?['"](?:server-only|(?:node:)?(?:fs|fs\/promises)|better-sqlite3)['"]/m
const cryptoUuidAllowedPathPattern = /^src\/lib\/(?:discountCodesDb|cloudSave)\.ts$/
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

function lineForIndex(text, index) {
  return text.slice(0, index).split('\n').length
}

function hasMonetaryContext(searchableLines, index) {
  const start = Math.max(0, index - contextRadius)
  const end = Math.min(searchableLines.length, index + contextRadius + 1)
  const context = searchableLines.slice(start, end).join('\n')
  return monetaryTokenPattern.test(context)
}

function findMonetaryStringVariables(searchableText) {
  const variables = new Set()

  for (const match of searchableText.matchAll(stringAssignmentPattern)) {
    const [, variable, , value] = match
    if (monetaryStringAssignmentPattern.test(value) || monetaryCodeTokenAssignmentPattern.test(value)) {
      variables.add(variable)
    }
  }

  return variables
}

const findings = []

for (const file of walk(srcDir)) {
  const text = fs.readFileSync(file, 'utf8')
  const relativePath = path.relative(root, file).split(path.sep).join('/')
  const clientReachable = isClientReachableSource(file, text)

  const lines = text.split(/\r?\n/)
  const searchableLines = stripComments(lines)
  const searchableText = searchableLines.join('\n')

  if (clientReachable) {
    searchableLines.forEach((line, index) => {
      if (!randomPattern.test(line)) return
      if (safeMintPattern.test(lines[index])) return

      if (hasMonetaryContext(searchableLines, index)) {
        findings.push({
          file: relativePath,
          line: index + 1,
          rule: 'random-proximity',
          source: lines[index].trim(),
        })
      }
    })

    for (const match of searchableText.matchAll(interpolatedMintTemplatePattern)) {
      const line = lineForIndex(searchableText, match.index)
      if (safeMintPattern.test(lines[line - 1])) continue

      findings.push({
        file: relativePath,
        line,
        rule: 'interpolated-template',
        source: lines[line - 1].trim(),
      })
    }

    const monetaryStringVariables = findMonetaryStringVariables(searchableText)
    for (const match of searchableText.matchAll(indirectedTemplatePattern)) {
      const [, firstVariable, secondVariable] = match
      if (!monetaryStringVariables.has(firstVariable) && !monetaryStringVariables.has(secondVariable)) {
        continue
      }

      const line = lineForIndex(searchableText, match.index)
      if (safeMintPattern.test(lines[line - 1])) continue

      findings.push({
        file: relativePath,
        line,
        rule: 'indirected-template-prefix',
        source: lines[line - 1].trim(),
      })
    }
  }

  if (!cryptoUuidAllowedPathPattern.test(relativePath)) {
    searchableLines.forEach((line, index) => {
      if (!cryptoUuidPattern.test(line)) return
      if (safeMintPattern.test(lines[index])) return

      if (hasMonetaryContext(searchableLines, index)) {
        findings.push({
          file: relativePath,
          line: index + 1,
          rule: 'crypto-randomuuid-proximity',
          source: lines[index].trim(),
        })
      }
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
  console.error(
    'Indirected template prefixes assigned from monetary strings, and crypto.randomUUID() near monetary tokens, are blocked too.',
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
