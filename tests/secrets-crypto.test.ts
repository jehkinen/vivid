import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { decryptSecret, encryptSecret } from '@/lib/secrets-crypto'

const VALID_KEY = Buffer.alloc(32, 7).toString('base64')

describe('secrets-crypto', () => {
  beforeEach(() => {
    process.env.SECRETS_ENCRYPTION_KEY = VALID_KEY
  })

  afterEach(() => {
    delete process.env.SECRETS_ENCRYPTION_KEY
  })

  it('round-trips encrypt and decrypt', () => {
    const plain = 'sk-test-key-abcdefghijklmnopqrstuvwxyz'
    const blob = encryptSecret(plain)
    expect(decryptSecret(blob)).toBe(plain)
  })

  it('throws when env key is missing', () => {
    delete process.env.SECRETS_ENCRYPTION_KEY
    expect(() => encryptSecret('test')).toThrow('SECRETS_ENCRYPTION_KEY is not set')
  })

  it('throws when env key has wrong length', () => {
    process.env.SECRETS_ENCRYPTION_KEY = Buffer.alloc(16).toString('base64')
    expect(() => encryptSecret('test')).toThrow('32 bytes')
  })

  it('throws on tampered blob', () => {
    const blob = encryptSecret('sk-test-key-abcdefghijklmnopqrstuvwxyz')
    const tampered = `${blob.slice(0, -2)}xx`
    expect(() => decryptSecret(tampered)).toThrow()
  })
})
