import { describe, it, expect } from 'vitest'
import { POST_LINK_FIELD, POST_LINK_REL_PREFIX, LEXICAL_NODE_TYPE } from '@/shared/constants'
import {
  extractPostReferenceTargetIds,
  extractPostReferenceTargetIdsForSource,
} from '@/lib/editor/lexical/extract-post-references'

function lexicalWithLink(postId: string) {
  return JSON.stringify({
    root: {
      children: [
        {
          type: LEXICAL_NODE_TYPE.PARAGRAPH,
          children: [
            {
              type: LEXICAL_NODE_TYPE.LINK,
              url: '/test',
              [POST_LINK_FIELD]: postId,
              children: [{ type: LEXICAL_NODE_TYPE.TEXT, text: 'link' }],
            },
          ],
        },
      ],
    },
  })
}

describe('extractPostReferenceTargetIds', () => {
  it('extracts postId from link rel', () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            type: LEXICAL_NODE_TYPE.PARAGRAPH,
            children: [
              {
                type: LEXICAL_NODE_TYPE.LINK,
                url: '/test',
                rel: `${POST_LINK_REL_PREFIX}rel123`,
                children: [{ type: LEXICAL_NODE_TYPE.TEXT, text: 'link' }],
              },
            ],
          },
        ],
      },
    })
    expect(extractPostReferenceTargetIds(json)).toEqual(['rel123'])
  })

  it('extracts postId from link postId field', () => {
    expect(extractPostReferenceTargetIds(lexicalWithLink('abc123'))).toEqual(['abc123'])
  })

  it('extracts postId from post-card nodes', () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            type: LEXICAL_NODE_TYPE.POST_CARD,
            postId: 'card1',
            slug: 's',
            title: 'T',
          },
        ],
      },
    })
    expect(extractPostReferenceTargetIds(json)).toEqual(['card1'])
  })

  it('dedupes duplicate targets', () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            type: LEXICAL_NODE_TYPE.PARAGRAPH,
            children: [
              {
                type: LEXICAL_NODE_TYPE.LINK,
                [POST_LINK_FIELD]: 'x',
                children: [{ type: LEXICAL_NODE_TYPE.TEXT, text: 'a' }],
              },
              {
                type: LEXICAL_NODE_TYPE.LINK,
                [POST_LINK_FIELD]: 'x',
                children: [{ type: LEXICAL_NODE_TYPE.TEXT, text: 'b' }],
              },
            ],
          },
        ],
      },
    })
    expect(extractPostReferenceTargetIds(json)).toEqual(['x'])
  })

  it('ignores links without postId', () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            type: LEXICAL_NODE_TYPE.PARAGRAPH,
            children: [
              {
                type: LEXICAL_NODE_TYPE.LINK,
                url: 'https://example.com',
                children: [{ type: LEXICAL_NODE_TYPE.TEXT, text: 'ext' }],
              },
            ],
          },
        ],
      },
    })
    expect(extractPostReferenceTargetIds(json)).toEqual([])
  })

  it('excludes self from source extraction', () => {
    expect(extractPostReferenceTargetIdsForSource('self', lexicalWithLink('self'))).toEqual([])
    expect(extractPostReferenceTargetIdsForSource('self', lexicalWithLink('other'))).toEqual(['other'])
  })
})
