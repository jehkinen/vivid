import { describe, it, expect } from 'vitest'
import { LEXICAL_NODE_TYPE, POST_LINK_FIELD, POST_LINK_REL_PREFIX } from '@/shared/constants'
import { sanitizeLexicalRoot } from '@/lib/editor/sanitize-lexical-state'

describe('sanitizeLexicalRoot post links', () => {
  it('preserves post link rel on link nodes inside paragraphs', () => {
    const parsed = {
      root: {
        children: [
          {
            type: LEXICAL_NODE_TYPE.LINK,
            url: '/x',
            rel: `${POST_LINK_REL_PREFIX}pid123`,
            children: [{ type: LEXICAL_NODE_TYPE.TEXT, text: 'hello' }],
          },
        ],
      },
    }

    sanitizeLexicalRoot(parsed)

    const paragraph = parsed.root.children[0] as {
      type: string
      children: Array<Record<string, unknown>>
    }
    expect(paragraph.type).toBe(LEXICAL_NODE_TYPE.PARAGRAPH)
    expect(paragraph.children[0].rel).toBe(`${POST_LINK_REL_PREFIX}pid123`)
  })

  it('preserves postId field on link nodes inside paragraphs', () => {
    const parsed = {
      root: {
        children: [
          {
            type: LEXICAL_NODE_TYPE.LINK,
            url: '/x',
            [POST_LINK_FIELD]: 'pid123',
            children: [{ type: LEXICAL_NODE_TYPE.TEXT, text: 'hello' }],
          },
        ],
      },
    }

    sanitizeLexicalRoot(parsed)

    const paragraph = parsed.root.children[0] as {
      type: string
      children: Array<Record<string, unknown>>
    }
    expect(paragraph.type).toBe(LEXICAL_NODE_TYPE.PARAGRAPH)
    expect(paragraph.children[0][POST_LINK_FIELD]).toBe('pid123')
  })
})
