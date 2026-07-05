import { describe, it, expect, vi, beforeEach } from 'vitest'
import { API_ERROR_CODE, MEDIA_COLLECTIONS, MEDIABLE_TYPES } from '@/shared/constants'

const { findOne, requireOpenAiKey, generateImage, upload } = vi.hoisted(() => ({
  findOne: vi.fn(),
  requireOpenAiKey: vi.fn(),
  generateImage: vi.fn(),
  upload: vi.fn(),
}))

vi.mock('@/services/posts.service', () => ({
  postsService: { findOne },
}))

vi.mock('@/services/author-secrets.service', () => ({
  authorSecretsService: { requireOpenAiKey },
  OpenAiNotConfiguredError: class OpenAiNotConfiguredError extends Error {
    code = API_ERROR_CODE.OPENAI_NOT_CONFIGURED
    constructor() {
      super('OpenAI API key is not configured')
    }
  },
}))

vi.mock('@/services/openai-images.service', () => ({
  openaiImagesService: { generateImage },
}))

vi.mock('@/services/media.service', () => ({
  mediaService: { upload },
}))

import { coverGenerationService } from '@/services/cover-generation.service'

describe('coverGenerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireOpenAiKey.mockResolvedValue('sk-test-key-abcdefghijklmnopqrstuvwxyz')
    generateImage.mockResolvedValue(Buffer.from('image'))
    upload.mockResolvedValue([
      { id: 'media1', url: 'https://cdn.example/cover.png', filename: 'cover-generated.png' },
    ])
  })

  it('throws when post is missing', async () => {
    findOne.mockResolvedValue(null)
    await expect(
      coverGenerationService.generateCover('author1', 'post1', { stylePreset: 'editorial' })
    ).rejects.toThrow('Post not found')
  })

  it('throws when openai key is missing', async () => {
    findOne.mockResolvedValue({
      id: 'post1',
      title: 'Title',
      plaintext: 'Enough content here for cover generation to proceed.',
      tags: [],
    })
    const err = new Error('missing')
    Object.assign(err, { code: API_ERROR_CODE.OPENAI_NOT_CONFIGURED })
    requireOpenAiKey.mockRejectedValue(err)
    await expect(
      coverGenerationService.generateCover('author1', 'post1', { stylePreset: 'editorial' })
    ).rejects.toMatchObject({ code: API_ERROR_CODE.OPENAI_NOT_CONFIGURED })
  })

  it('uses draft content over post fields', async () => {
    findOne.mockResolvedValue({
      id: 'post1',
      title: 'Old title',
      plaintext: 'old body',
      tags: [{ tag: { name: 'OldTag' } }],
    })

    await coverGenerationService.generateCover('author1', 'post1', {
      stylePreset: 'minimal',
      draft: {
        title: 'Draft title',
        plaintext: 'Draft body with enough characters for generation.',
        tagNames: ['NewTag'],
      },
    })

    expect(generateImage).toHaveBeenCalledWith(
      'sk-test-key-abcdefghijklmnopqrstuvwxyz',
      expect.stringContaining('Draft title')
    )
    expect(generateImage).toHaveBeenCalledWith(
      'sk-test-key-abcdefghijklmnopqrstuvwxyz',
      expect.stringContaining('NewTag')
    )
  })

  it('passes replaceMediaId to media upload', async () => {
    findOne.mockResolvedValue({
      id: 'post1',
      title: 'Title',
      plaintext: null,
      tags: [],
    })

    await coverGenerationService.generateCover('author1', 'post1', {
      stylePreset: 'editorial',
      replaceMediaId: 'old-media',
    })

    expect(upload).toHaveBeenCalledWith(
      MEDIABLE_TYPES.POST,
      'post1',
      expect.any(Array),
      {
        collection: MEDIA_COLLECTIONS.FEATURED,
        replaceMediaId: 'old-media',
      }
    )
  })

  it('returns uploaded media summary', async () => {
    findOne.mockResolvedValue({
      id: 'post1',
      title: 'Title',
      plaintext: null,
      tags: [],
    })

    await expect(
      coverGenerationService.generateCover('author1', 'post1', { stylePreset: 'abstract' })
    ).resolves.toEqual({
      id: 'media1',
      url: 'https://cdn.example/cover.png',
      filename: 'cover-generated.png',
    })
  })
})
