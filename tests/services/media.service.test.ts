import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MEDIA_FILTER_TYPES } from '@/shared/constants'

const { findMany, count, aggregate, postFindUnique } = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  postFindUnique: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    media: {
      findMany,
      count,
      aggregate,
    },
    post: {
      findUnique: postFindUnique,
    },
  },
}))

vi.mock('@/services/storage.service', () => ({
  storageService: {
    getFileUrl: vi.fn(async (key: string) => `https://cdn.example/${key}`),
  },
}))

import { mediaService } from '@/services/media.service'

describe('mediaService.getLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findMany.mockResolvedValue([])
    count.mockResolvedValue(0)
    aggregate.mockResolvedValue({ _sum: { size: 0, conversionSize: 0 } })
  })

  it('filters images when type is image', async () => {
    await mediaService.getLibrary({ page: 1, perPage: 40, type: MEDIA_FILTER_TYPES.IMAGE })
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          mimeType: { startsWith: 'image/' },
        }),
      })
    )
  })

  it('returns empty library with totals', async () => {
    const result = await mediaService.getLibrary({
      page: 1,
      perPage: 40,
      type: MEDIA_FILTER_TYPES.ALL,
    })
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.hasMore).toBe(false)
    expect(result.totalStored).toBe(0)
  })
})
