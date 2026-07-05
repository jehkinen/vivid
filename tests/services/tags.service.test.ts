import { describe, it, expect, vi, beforeEach } from 'vitest'

const { tagFindMany, tagFindUnique } = vi.hoisted(() => ({
  tagFindMany: vi.fn(),
  tagFindUnique: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tag: {
      findMany: tagFindMany,
      findUnique: tagFindUnique,
    },
  },
}))

import { tagsService } from '@/services/tags.service'

describe('tagsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('findMany sorts by post count descending', async () => {
    tagFindMany.mockResolvedValue([
      { id: '1', name: 'Alpha', slug: 'alpha', _count: { posts: 1 } },
      { id: '2', name: 'Beta', slug: 'beta', _count: { posts: 5 } },
    ])
    const result = await tagsService.findMany()
    expect(result[0].slug).toBe('beta')
    expect(result[1].slug).toBe('alpha')
  })

  it('findOne loads tag by slug', async () => {
    tagFindUnique.mockResolvedValue({ id: '1', slug: 'news', name: 'News' })
    const result = await tagsService.findOne('news')
    expect(tagFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'news' } })
    )
    expect(result?.slug).toBe('news')
  })
})
