import { describe, it, expect, vi, beforeEach } from 'vitest'

const { postReferenceDeleteMany, postReferenceCreateMany, postFindMany, mockPrisma } = vi.hoisted(() => {
  const postReferenceDeleteMany = vi.fn()
  const postReferenceCreateMany = vi.fn()
  const postFindMany = vi.fn()
  const mockPrisma = {
    postReference: {
      deleteMany: postReferenceDeleteMany,
      createMany: postReferenceCreateMany,
      findMany: vi.fn(),
    },
    post: {
      findMany: postFindMany,
    },
  }
  return { postReferenceDeleteMany, postReferenceCreateMany, postFindMany, mockPrisma }
})

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
  getPrisma: () => mockPrisma,
}))

import { postReferencesService } from '@/services/post-references.service'
import { buildPostLinkRel } from '@/lib/editor/post-link-helpers'
import { LEXICAL_NODE_TYPE, POST_LINK_FIELD } from '@/shared/constants'

describe('postReferencesService.syncFromLexical', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    postFindMany.mockResolvedValue([{ id: 'target1' }, { id: 'target2' }])
  })

  it('clears outgoing refs when lexical is empty', async () => {
    await postReferencesService.syncFromLexical('source', null)
    expect(postReferenceDeleteMany).toHaveBeenCalledWith({ where: { sourcePostId: 'source' } })
    expect(postReferenceCreateMany).not.toHaveBeenCalled()
  })

  it('syncs valid target ids', async () => {
    const lexical = JSON.stringify({
      root: {
        children: [
          {
            type: LEXICAL_NODE_TYPE.PARAGRAPH,
            children: [
              {
                type: LEXICAL_NODE_TYPE.LINK,
                rel: buildPostLinkRel('target1'),
                children: [{ type: LEXICAL_NODE_TYPE.TEXT, text: 'a' }],
              },
              {
                type: LEXICAL_NODE_TYPE.LINK,
                rel: buildPostLinkRel('target2'),
                children: [{ type: LEXICAL_NODE_TYPE.TEXT, text: 'b' }],
              },
            ],
          },
        ],
      },
    })

    await postReferencesService.syncFromLexical('source', lexical)

    expect(postReferenceDeleteMany).toHaveBeenCalledWith({
      where: {
        sourcePostId: 'source',
        targetPostId: { notIn: ['target1', 'target2'] },
      },
    })
    expect(postReferenceCreateMany).toHaveBeenCalledWith({
      data: [
        { sourcePostId: 'source', targetPostId: 'target1' },
        { sourcePostId: 'source', targetPostId: 'target2' },
      ],
      skipDuplicates: true,
    })
  })

  it('skips self-links', async () => {
    postFindMany.mockResolvedValue([])
    const lexical = JSON.stringify({
      root: {
        children: [
          {
            type: LEXICAL_NODE_TYPE.PARAGRAPH,
            children: [
              {
                type: LEXICAL_NODE_TYPE.LINK,
                rel: buildPostLinkRel('source'),
                children: [{ type: LEXICAL_NODE_TYPE.TEXT, text: 'self' }],
              },
            ],
          },
        ],
      },
    })

    await postReferencesService.syncFromLexical('source', lexical)

    expect(postReferenceCreateMany).not.toHaveBeenCalled()
  })
})
