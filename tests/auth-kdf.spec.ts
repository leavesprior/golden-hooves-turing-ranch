import assert from 'node:assert/strict'
import test from 'node:test'

import { hashPassword, legacyVerifyV1Hash, verifyPassword } from '../src/lib/authContext'

function legacyHashForTest(password: string): string {
  let hash = 0
  const salt = 'golden_frog_salt_2025'
  const str = password + salt

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  return Math.abs(hash).toString(36)
}

test('argon2id v2 password hashes round trip', async () => {
  const storedHash = await hashPassword('hunter2')
  const parsed = JSON.parse(storedHash) as {
    v: number
    kdf: string
    salt: string
    hash: string
  }

  assert.equal(parsed.v, 2)
  assert.equal(parsed.kdf, 'argon2id')
  assert.equal(Buffer.from(parsed.salt, 'base64').byteLength, 16)
  assert.equal(Buffer.from(parsed.hash, 'base64').byteLength, 32)

  assert.deepEqual(await verifyPassword('hunter2', storedHash), {
    valid: true,
    needsUpgrade: false,
  })
  assert.deepEqual(await verifyPassword('wrong-password', storedHash), {
    valid: false,
    needsUpgrade: false,
  })
})

test('legacy v1 rolling hashes verify and request upgrade', async () => {
  const legacyHash = legacyHashForTest('correct horse battery staple')

  assert.equal(legacyVerifyV1Hash('correct horse battery staple', legacyHash), true)
  assert.deepEqual(await verifyPassword('correct horse battery staple', legacyHash), {
    valid: true,
    needsUpgrade: true,
  })
  assert.deepEqual(await verifyPassword('wrong password', legacyHash), {
    valid: false,
    needsUpgrade: false,
  })
})

test('same password receives random salts and distinct hashes', async () => {
  const first = JSON.parse(await hashPassword('repeatable password')) as { salt: string; hash: string }
  const second = JSON.parse(await hashPassword('repeatable password')) as { salt: string; hash: string }

  assert.notEqual(first.salt, second.salt)
  assert.notEqual(first.hash, second.hash)
})
