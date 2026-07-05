import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('openaiImagesService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns image buffer from b64_json response', async () => {
    const payload = Buffer.from('png-data').toString('base64')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ b64_json: payload }] }),
      })
    )

    const { openaiImagesService } = await import('@/services/openai-images.service')
    const buffer = await openaiImagesService.generateImage('sk-test', 'prompt')
    expect(buffer.toString()).toBe('png-data')
  })

  it('returns image buffer from url response', async () => {
    const imageBytes = Buffer.from('png-from-url')
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [{ url: 'https://example.com/image.png' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => imageBytes,
        })
    )

    const { openaiImagesService } = await import('@/services/openai-images.service')
    const buffer = await openaiImagesService.generateImage('sk-test', 'prompt')
    expect(buffer.toString()).toBe('png-from-url')
  })

  it('maps 401 to invalid key message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      })
    )

    const { openaiImagesService } = await import('@/services/openai-images.service')
    await expect(openaiImagesService.generateImage('sk-test', 'prompt')).rejects.toThrow(
      'Invalid OpenAI API key'
    )
  })

  it('maps 429 to rate limit message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({}),
      })
    )

    const { openaiImagesService } = await import('@/services/openai-images.service')
    await expect(openaiImagesService.generateImage('sk-test', 'prompt')).rejects.toThrow(
      'rate limit'
    )
  })

  it('maps moderation block to helpful message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message:
              'Your request was rejected by the safety system. safety_violations=[sexual].',
          },
        }),
      })
    )

    const { openaiImagesService } = await import('@/services/openai-images.service')
    await expect(openaiImagesService.generateImage('sk-test', 'prompt')).rejects.toThrow(
      'silhouettes from behind'
    )
  })
})
