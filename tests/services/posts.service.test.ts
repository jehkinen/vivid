import { describe, it, expect, vi, beforeEach } from 'vitest'

const { postFindMany } = vi.hoisted(() => ({
  postFindMany: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findMany: postFindMany,
    },
  },
}))

vi.mock('@/services/media.service', () => ({
  mediaService: {
    findManyByIds: vi.fn().mockResolvedValue([]),
    getConversionUrl: vi.fn(),
  },
}))

import { postsService } from '@/services/posts.service'

describe('postsService.findMany', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    postFindMany.mockResolvedValue([])
  })

  it('does not select lexical in list queries', async () => {
    await postsService.findMany({ limit: 10 })
    const call = postFindMany.mock.calls[0][0]
    expect(call.select).toBeDefined()
    expect(call.select.lexical).toBeUndefined()
  })

  it('omits authors unless includeAuthors is true', async () => {
    await postsService.findMany({ limit: 10 })
    expect(postFindMany.mock.calls[0][0].select.authors).toBeUndefined()

    await postsService.findMany({ limit: 10, includeAuthors: true })
    expect(postFindMany.mock.calls[1][0].select.authors).toBeDefined()
  })
})
