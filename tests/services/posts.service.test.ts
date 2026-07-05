import { describe, it, expect, vi, beforeEach } from 'vitest'

const { postFindMany, postCreate, postUpdate, transaction, syncFromLexical } = vi.hoisted(() => ({
  postFindMany: vi.fn(),
  postCreate: vi.fn(),
  postUpdate: vi.fn(),
  transaction: vi.fn(),
  syncFromLexical: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findMany: postFindMany,
      create: postCreate,
      update: postUpdate,
      findUnique: vi.fn(),
    },
    $transaction: transaction,
  },
}))

vi.mock('@/services/post-references.service', () => ({
  postReferencesService: {
    syncFromLexical,
  },
}))

vi.mock('@/services/media.service', () => ({
  mediaService: {
    findManyByIds: vi.fn().mockResolvedValue([]),
    getConversionUrl: vi.fn(),
  },
}))

import { postsService } from '@/services/posts.service'
import { POST_STATUS, LEXICAL_NODE_TYPE } from '@/shared/constants'
import { buildPostLinkRel } from '@/lib/editor/post-link-helpers'

describe('postsService.findMany', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    postFindMany.mockResolvedValue([])
    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({}))
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

describe('postsService reference sync', () => {
  const lexical = JSON.stringify({
    root: {
      children: [
        {
          type: LEXICAL_NODE_TYPE.PARAGRAPH,
          children: [
            {
              type: LEXICAL_NODE_TYPE.LINK,
              rel: buildPostLinkRel('target1'),
              children: [{ type: LEXICAL_NODE_TYPE.TEXT, text: 'link' }],
            },
          ],
        },
      ],
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    syncFromLexical.mockResolvedValue(undefined)
    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({ post: {} }))
  })

  it('syncs references on create when lexical is provided', async () => {
    const created = { id: 'new-post', tags: [] }
    postCreate.mockResolvedValue(created)
    transaction.mockImplementation(async (fn: (tx: { post: { create: typeof postCreate } }) => Promise<unknown>) =>
      fn({ post: { create: postCreate } })
    )

    await postsService.create({
      slug: 'test',
      status: POST_STATUS.DRAFT,
      lexical,
    })

    expect(syncFromLexical).toHaveBeenCalledWith('new-post', lexical)
  })

  it('syncs references on update when lexical changes', async () => {
    const updated = { id: 'post-1', tags: [] }
    postUpdate.mockResolvedValue(updated)
    transaction.mockImplementation(async (fn: (tx: { post: { update: typeof postUpdate } }) => Promise<unknown>) =>
      fn({ post: { update: postUpdate } })
    )

    await postsService.update('post-1', { lexical })

    expect(syncFromLexical).toHaveBeenCalledWith('post-1', lexical)
  })
})
