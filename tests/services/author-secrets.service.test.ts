import { describe, it, expect, vi, beforeEach } from 'vitest'
import { API_ERROR_CODE } from '@/shared/constants'

const { findUnique, update } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    author: {
      findUnique,
      update,
    },
  },
}))

vi.mock('@/lib/secrets-crypto', () => ({
  encryptSecret: vi.fn((value: string) => `enc:${value}`),
  decryptSecret: vi.fn((value: string) => value.replace(/^enc:/, '')),
}))

import { authorSecretsService } from '@/services/author-secrets.service'

describe('authorSecretsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns not configured when no encrypted key', async () => {
    findUnique.mockResolvedValue({ openAiKeyEncrypted: null, openAiKeyHint: null })
    await expect(authorSecretsService.getOpenAiStatus('author1')).resolves.toEqual({
      configured: false,
    })
  })

  it('returns configured status with hint', async () => {
    findUnique.mockResolvedValue({
      openAiKeyEncrypted: 'blob',
      openAiKeyHint: 'sk-…abcd',
    })
    await expect(authorSecretsService.getOpenAiStatus('author1')).resolves.toEqual({
      configured: true,
      hint: 'sk-…abcd',
    })
  })

  it('validates key format on save', async () => {
    await expect(authorSecretsService.saveOpenAiKey('author1', 'bad-key')).rejects.toThrow(
      'Invalid OpenAI API key format'
    )
  })

  it('encrypts and stores key on save', async () => {
    update.mockResolvedValue({})
    findUnique.mockResolvedValue({
      openAiKeyEncrypted: 'enc:stored',
      openAiKeyHint: 'sk-…wxyz',
    })
    const key = 'sk-test-key-abcdefghijklmnopqrstuvwxyz'
    await authorSecretsService.saveOpenAiKey('author1', key)
    expect(update).toHaveBeenCalledWith({
      where: { id: 'author1' },
      data: {
        openAiKeyEncrypted: `enc:${key}`,
        openAiKeyHint: 'sk-…wxyz',
      },
    })
  })

  it('clears key on delete', async () => {
    update.mockResolvedValue({})
    await authorSecretsService.deleteOpenAiKey('author1')
    expect(update).toHaveBeenCalledWith({
      where: { id: 'author1' },
      data: {
        openAiKeyEncrypted: null,
        openAiKeyHint: null,
      },
    })
  })

  it('throws OPENAI_NOT_CONFIGURED when key missing', async () => {
    findUnique.mockResolvedValue({ openAiKeyEncrypted: null })
    await expect(authorSecretsService.requireOpenAiKey('author1')).rejects.toMatchObject({
      code: API_ERROR_CODE.OPENAI_NOT_CONFIGURED,
    })
  })

  it('returns decrypted key when configured', async () => {
    findUnique.mockResolvedValue({ openAiKeyEncrypted: 'enc:secret-key-value-here' })
    await expect(authorSecretsService.requireOpenAiKey('author1')).resolves.toBe(
      'secret-key-value-here'
    )
  })
})
