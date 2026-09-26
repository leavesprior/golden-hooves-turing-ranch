/**
 * Trail ID — the name of a player's cloud save slot, short enough to write
 * down and type on another device. It locates a save; the passphrase still
 * protects it.
 *   npx tsx src/lib/trailId.test.ts
 */
import { generateTrailId, normalizeTrailId, TRAIL_ID_PATTERN } from './trailId'

const results: { name: string; pass: boolean; detail?: unknown }[] = []
const check = (name: string, pass: boolean, detail?: unknown) => results.push({ name, pass, ...(pass ? {} : { detail }) })

const id = generateTrailId()
check('format is BOBR-XXXX-XXXX-XXXX', /^BOBR-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(id), id)
check('uses no easily-misread letters (I L O U)', !/[ILOU]/.test(id.slice(5)), id)
check('matches the exported pattern', TRAIL_ID_PATTERN.test(id), id)

const many = new Set(Array.from({ length: 5000 }, () => generateTrailId()))
check('5000 ids are all distinct (60 random bits)', many.size === 5000, many.size)
const chars = new Set([...many].join('').replace(/BOBR|-/g, ''))
check('draws from the full 32-symbol alphabet', chars.size === 32, chars.size)

check('round-trips itself', normalizeTrailId(id) === id)
const body = id.slice(5).replace(/-/g, '')
check('forgives lowercase, spaces and missing dashes', normalizeTrailId(`bobr ${body.toLowerCase()}`) === id, normalizeTrailId(`bobr ${body.toLowerCase()}`))
check('the BOBR prefix is optional', normalizeTrailId(body) === id)
check('O reads as 0, I and L read as 1', normalizeTrailId('BOBR-OOOO-IIII-LLLL') === 'BOBR-0000-1111-1111', normalizeTrailId('BOBR-OOOO-IIII-LLLL'))
check('tolerates copy-paste whitespace and en-dashes', normalizeTrailId('  BOBR–A1B2–C3D4–E5F6 \n') === 'BOBR-A1B2-C3D4-E5F6', normalizeTrailId('  BOBR–A1B2–C3D4–E5F6 \n'))
const bad = ['', 'BOBR-123', 'BOBR-A1B2-C3D4-E5F6-G7H8', 'BOBR-A1B2-C3D4-E5U6', 'hello world!', 'BOBR-A1B2-C3D4-E5F*']
check('rejects wrong length, U, and junk', bad.every((b) => normalizeTrailId(b) === null), bad.map((b) => [b, normalizeTrailId(b)]))
check('keeps a legacy slot_<uuid> id as-is (saves made before Trail IDs)', normalizeTrailId('slot_4f1c2a9e-8b7d-4e21-9c3a-1b2c3d4e5f60') === 'slot_4f1c2a9e-8b7d-4e21-9c3a-1b2c3d4e5f60')
check('a legacy id typed in capitals (phone auto-capitalize) still works', normalizeTrailId('SLOT_4F1C2A9E-8B7D-4E21-9C3A-1B2C3D4E5F60') === 'slot_4f1c2a9e-8b7d-4e21-9c3a-1b2c3d4e5f60', normalizeTrailId('SLOT_4F1C2A9E-8B7D-4E21-9C3A-1B2C3D4E5F60'))
check('the Unicode minus sign is accepted as a dash', normalizeTrailId('BOBR\u2212A1B2\u2212C3D4\u2212E5F6') === 'BOBR-A1B2-C3D4-E5F6', normalizeTrailId('BOBR\u2212A1B2\u2212C3D4\u2212E5F6'))
check('the server id pattern accepts a Trail ID', /^[A-Za-z0-9_-]{8,80}$/.test(id))

const failed = results.filter((r) => !r.pass)
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + String(JSON.stringify(r.detail)).slice(0, 300)}`)
console.log(`trailId: ${results.length - failed.length}/${results.length}`)
process.exit(failed.length ? 1 : 0)
