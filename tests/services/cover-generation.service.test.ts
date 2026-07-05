import { describe, it, expect, vi, beforeEach } from 'vitest'
import { API_ERROR_CODE, MEDIA_COLLECTIONS, MEDIABLE_TYPES } from '@/shared/constants'

const { findOne, requireOpenAiKey, extractVisualBrief, generateImage, upload } = vi.hoisted(() => ({
  findOne: vi.fn(),
  requireOpenAiKey: vi.fn(),
  extractVisualBrief: vi.fn(),
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

vi.mock('@/services/openai-cover-concept.service', () => ({
  openaiCoverConceptService: { extractVisualBrief },
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
    extractVisualBrief.mockResolvedValue({
      coreMoment: 'Two people reunite in a tender embrace after a long separation.',
      scene:
        'Two silhouettes in a tender embrace, golden spring sunlight on closed eyes after a long winter, dreamlike warmth.',
    })
    generateImage.mockResolvedValue(Buffer.from('image'))
    upload.mockResolvedValue([
      { id: 'media1', url: 'https://cdn.example/cover.png', filename: 'cover-generated.jpg' },
    ])
  })

  it('throws when post is missing', async () => {
    findOne.mockResolvedValue(null)
    await expect(
      coverGenerationService.generateCover('author1', 'post1', { stylePreset: 'editorial' })
    ).rejects.toThrow('Post not found')
  })

  it('returns preview base64 without uploading to storage', async () => {
    findOne.mockResolvedValue({
      id: 'post1',
      title: 'Warm reunion',
      plaintext: 'Long emotional post text '.repeat(20),
      tags: [{ tag: { name: 'dreams' } }],
    })

    const result = await coverGenerationService.generateCover('author1', 'post1', {
      stylePreset: 'editorial',
    })

    expect(upload).not.toHaveBeenCalled()
    expect(result.previewBase64).toBe(Buffer.from('image').toString('base64'))
    expect(result.mimeType).toBe('image/jpeg')
  })

  it('builds image prompt from LLM concept without title duplication', async () => {
    findOne.mockResolvedValue({
      id: 'post1',
      title: 'Warm reunion',
      plaintext: 'Long emotional post text '.repeat(20),
      tags: [{ tag: { name: 'dreams' } }],
    })

    const result = await coverGenerationService.generateCover('author1', 'post1', {
      stylePreset: 'editorial',
    })

    expect(extractVisualBrief).toHaveBeenCalled()
    expect(generateImage).toHaveBeenCalledWith(
      'sk-test-key-abcdefghijklmnopqrstuvwxyz',
      expect.stringContaining('Two silhouettes in a tender embrace')
    )
    expect(generateImage).toHaveBeenCalledWith(
      'sk-test-key-abcdefghijklmnopqrstuvwxyz',
      expect.not.stringContaining('Topic:')
    )
    expect(result.prompt).toContain('Editorial magazine cover style')
  })

  it('ignores legacy placeholder override and uses LLM concept', async () => {
    findOne.mockResolvedValue({
      id: 'post1',
      title: 'Warm reunion',
      plaintext: 'Long emotional post text '.repeat(20),
      tags: [],
    })

    await coverGenerationService.generateCover('author1', 'post1', {
      stylePreset: 'editorial',
      promptOverride:
        'Wide landscape blog cover image will be composed on Generate. Post essence (preview): hello.',
    })

    expect(extractVisualBrief).toHaveBeenCalled()
    expect(generateImage).toHaveBeenCalledWith(
      'sk-test-key-abcdefghijklmnopqrstuvwxyz',
      expect.stringContaining('Two silhouettes in a tender embrace')
    )
    expect(upload).not.toHaveBeenCalled()
  })

  it('skips concept extraction when prompt override is set', async () => {
    findOne.mockResolvedValue({
      id: 'post1',
      title: 'Title',
      plaintext: null,
      tags: [],
    })

    await coverGenerationService.generateCover('author1', 'post1', {
      stylePreset: 'editorial',
      promptOverride: 'Custom visual prompt',
    })

    expect(extractVisualBrief).not.toHaveBeenCalled()
    expect(generateImage).toHaveBeenCalledWith(
      'sk-test-key-abcdefghijklmnopqrstuvwxyz',
      expect.stringContaining('Custom visual prompt')
    )
    expect(generateImage).toHaveBeenCalledWith(
      'sk-test-key-abcdefghijklmnopqrstuvwxyz',
      expect.stringContaining('Editorial magazine cover style')
    )
  })

  it('uploads to storage only when cover is accepted', async () => {
    findOne.mockResolvedValue({
      id: 'post1',
      title: 'Title',
      plaintext: 'Body',
      tags: [],
    })

    const previewBase64 = Buffer.from('image').toString('base64')
    const media = await coverGenerationService.acceptGeneratedCover('post1', {
      previewBase64,
      replaceMediaId: 'old-cover',
    })

    expect(upload).toHaveBeenCalledWith(
      MEDIABLE_TYPES.POST,
      'post1',
      [
        expect.objectContaining({
          filename: 'cover-generated.jpg',
          mimeType: 'image/jpeg',
        }),
      ],
      {
        collection: MEDIA_COLLECTIONS.FEATURED,
        replaceMediaId: 'old-cover',
      }
    )
    expect(media.id).toBe('media1')
  })
})
