import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MEDIA_FILTER_TYPES } from '@/shared/constants'
import { invalidateUsedMediaIdsCache } from '@/lib/media-used-ids-cache'

const {
  findMany,
  findUnique,
  deleteMany,
  count,
  aggregate,
  postFindMany,
  postFindUnique,
  mediaUpdateMany,
  deleteFilesByPrefix,
} = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  postFindMany: vi.fn(),
  postFindUnique: vi.fn(),
  mediaUpdateMany: vi.fn(),
  deleteFilesByPrefix: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    media: {
      findMany,
      findUnique,
      deleteMany,
      count,
      aggregate,
      updateMany: mediaUpdateMany,
    },
    post: {
      findMany: postFindMany,
      findUnique: postFindUnique,
    },
  },
}))

vi.mock('@/services/storage.service', () => ({
  storageService: {
    getFileUrl: vi.fn(async (key: string) => `https://cdn.example/${key}`),
    deleteFilesByPrefix,
  },
}))

import { mediaService } from '@/services/media.service'

describe('mediaService.getLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invalidateUsedMediaIdsCache()
    findMany.mockResolvedValue([])
    count.mockResolvedValue(0)
    aggregate.mockResolvedValue({ _sum: { size: 0, conversionSize: 0 } })
    postFindMany.mockResolvedValue([])
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

  it('filters unused media not referenced by posts', async () => {
    postFindMany.mockResolvedValue([
      { featuredMediaId: 'used-cover', lexical: null },
      { featuredMediaId: null, lexical: '{"root":{}}' },
    ])

    await mediaService.getLibrary({ page: 1, perPage: 40, type: MEDIA_FILTER_TYPES.UNUSED })

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { notIn: ['used-cover'] },
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

describe('mediaService.purgeStaleFeaturedCovers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mediaUpdateMany.mockResolvedValue({ count: 1 })
  })

  it('soft-deletes stale featured covers on the same post', async () => {
    await mediaService.purgeStaleFeaturedCovers('post1', 'cover-active')
    expect(mediaUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          mediableId: 'post1',
          collection: 'featured',
          id: { not: 'cover-active' },
        }),
        data: { deletedAt: expect.any(Date) },
      })
    )
  })
})

describe('mediaService.bulkHardDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invalidateUsedMediaIdsCache()
    postFindMany.mockResolvedValue([{ featuredMediaId: 'used1', lexical: null }])
    findMany.mockImplementation(async ({ where }: { where?: { id?: { in?: string[] } } }) => {
      const ids = where?.id?.in ?? []
      return ids
        .filter((id) => id === 'used1' || id === 'orphan1')
        .map((id) => ({ id, mediableType: 'post', deletedAt: null }))
    })
    findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === 'orphan1') return { id: 'orphan1', mediableType: 'post', deletedAt: null }
      return null
    })
    deleteMany.mockResolvedValue({ count: 1 })
    deleteFilesByPrefix.mockResolvedValue(undefined)
  })

  it('deletes unused media and blocks in-use media', async () => {
    const result = await mediaService.bulkHardDelete(['used1', 'orphan1', 'missing1'])
    expect(result.deleted).toEqual(['orphan1'])
    expect(result.blocked).toEqual(
      expect.arrayContaining([
        { id: 'used1', reason: 'Media is in use' },
        { id: 'missing1', reason: 'Not found' },
      ])
    )
    expect(deleteFilesByPrefix).toHaveBeenCalledWith('post/orphan1/')
  })
})
