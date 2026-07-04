import { describe, it, expect } from 'vitest'
import { sanitizeLexicalRoot } from '@/lib/editor/sanitize-lexical-state'

describe('sanitizeLexicalRoot', () => {
  it('wraps orphan text nodes in paragraphs', () => {
    const state = {
      root: {
        children: [
          {
            type: 'text',
            text: 'hello',
            version: 1,
          },
        ],
      },
    }

    const result = sanitizeLexicalRoot(state)
    expect(result.root?.children).toHaveLength(1)
    expect(result.root?.children?.[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', text: 'hello' }],
    })
  })

  it('normalizes extended-text alias', () => {
    const state = {
      root: {
        children: [
          {
            type: 'extended-text',
            text: 'legacy',
            version: 1,
          },
        ],
      },
    }

    const result = sanitizeLexicalRoot(state)
    const paragraph = result.root?.children?.[0] as { children?: { type?: string }[] }
    expect(paragraph?.children?.[0]?.type).toBe('text')
  })

  it('normalizes extended-heading to heading', () => {
    const state = {
      root: {
        children: [
          {
            type: 'extended-heading',
            tag: 'h1',
            children: [],
            version: 1,
          },
        ],
      },
    }

    const result = sanitizeLexicalRoot(state)
    expect((result.root?.children?.[0] as { type?: string }).type).toBe('heading')
  })

  it('keeps valid block nodes', () => {
    const heading = {
      type: 'heading',
      tag: 'h2',
      children: [{ type: 'text', text: 'Title', version: 1 }],
      version: 1,
    }
    const state = { root: { children: [heading] } }

    const result = sanitizeLexicalRoot(state)
    expect(result.root?.children?.[0]).toEqual(heading)
  })

  it('returns input when root has no children array', () => {
    const state = { root: {} }
    expect(sanitizeLexicalRoot(state)).toBe(state)
  })
})
