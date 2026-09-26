/**
 * Trail ID — the name of a player's cloud save slot, short enough to write
 * down and type on another device. It locates a save; the passphrase still
 * protects it. Prefix TRAIL- (the BOBR- namespace belongs to discount codes).
 *   npx tsx src/lib/trailId.test.ts
 */
import { generateTrailId, normalizeTrailId, TRAIL_ID_PATTERN } from './trailId'

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })

const id = generateTrailId()
check('format is TRAIL-XXXX-XXXX-XXXX', /^TRAIL-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(id), id)
check('never uses the BOBR- discount-code namespace', !id.startsWith('BOBR'), id)
check('uses no easily-misread letters (I L O U)', !/[ILOU]/.test(id.slice(6)), id)
check('matches the exported pattern', TRAIL_ID_PATTERN.test(id), id)

const many = new Set(Array.from({ length: 5000 }, () => generateTrailId()))
check('5000 ids are all distinct (60 random bits)', many.size === 5000, many.size)
const chars = new Set([...many].join('').replace(/TRAIL|-/g, ''))
check('draws from the full 32-symbol alphabet', chars.size === 32, chars.size)

check('round-trips itself', normalizeTrailId(id) === id)
const body = id.slice(6).replace(/-/g, '')
check('forgives lowercase, spaces and missing dashes', normalizeTrailId(`trail ${body.toLowerCase()}`) === id, normalizeTrailId(`trail ${body.toLowerCase()}`))
check('the TRAIL prefix is optional', normalizeTrailId(body) === id)
check('O reads as 0, I and L read as 1', normalizeTrailId('TRAIL-OOOO-IIII-LLLL') === 'TRAIL-0000-1111-1111', normalizeTrailId('TRAIL-OOOO-IIII-LLLL'))
check('tolerates copy-paste whitespace and en-dashes', normalizeTrailId('  TRAIL–A1B2–C3D4–E5F6 \n') === 'TRAIL-A1B2-C3D4-E5F6', normalizeTrailId('  TRAIL–A1B2–C3D4–E5F6 \n'))
check('the Unicode minus sign is accepted as a dash', normalizeTrailId('TRAIL−A1B2−C3D4−E5F6') === 'TRAIL-A1B2-C3D4-E5F6', normalizeTrailId('TRAIL−A1B2−C3D4−E5F6'))
const bad = ['', 'TRAIL-123', 'TRAIL-A1B2-C3D4-E5F6-G7H8', 'TRAIL-A1B2-C3D4-E5U6', 'hello world!', 'TRAIL-A1B2-C3D4-E5F*', 'BOBR-EARLY-ABCD']
check('rejects wrong length, U, junk, and discount codes', bad.every((b) => normalizeTrailId(b) === null), bad.map((b) => [b, normalizeTrailId(b)]))

// Ids issued in the short window when Trail IDs used the BOBR- prefix are
// stored on the server under that exact name: they must keep resolving to it.
check('a legacy BOBR- Trail ID keeps its exact name', normalizeTrailId('BOBR-M2VJ-2WG1-A72Q') === 'BOBR-M2VJ-2WG1-A72Q', normalizeTrailId('BOBR-M2VJ-2WG1-A72Q'))
check('a legacy BOBR- Trail ID typed sloppily still resolves', normalizeTrailId('bobr m2vj 2wg1 a72q') === 'BOBR-M2VJ-2WG1-A72Q', normalizeTrailId('bobr m2vj 2wg1 a72q'))
check('keeps a legacy slot_<uuid> id as-is', normalizeTrailId('slot_4f1c2a9e-8b7d-4e21-9c3a-1b2c3d4e5f60') === 'slot_4f1c2a9e-8b7d-4e21-9c3a-1b2c3d4e5f60')
check('a legacy id typed in capitals still works', normalizeTrailId('SLOT_4F1C2A9E-8B7D-4E21-9C3A-1B2C3D4E5F60') === 'slot_4f1c2a9e-8b7d-4e21-9c3a-1b2c3d4e5f60', normalizeTrailId('SLOT_4F1C2A9E-8B7D-4E21-9C3A-1B2C3D4E5F60'))
check('the server id pattern accepts a Trail ID', /^[A-Za-z0-9_-]{8,80}$/.test(id))

const failed = results.filter((r) => !r.pass)
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + String(JSON.stringify(r.detail)).slice(0, 300)}`)
console.log(`trailId: ${results.length - failed.length}/${results.length}`)
process.exit(failed.length ? 1 : 0)
