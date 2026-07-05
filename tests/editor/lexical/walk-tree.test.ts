import { describe, it, expect } from 'vitest'
import { walkLexicalTree, parseLexicalJson } from '@/lib/editor/lexical/walk-tree'

describe('parseLexicalJson', () => {
  it('returns null for empty input', () => {
    expect(parseLexicalJson(null)).toBeNull()
    expect(parseLexicalJson('')).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseLexicalJson('not json')).toBeNull()
  })

  it('parses valid lexical JSON', () => {
    const json = JSON.stringify({ root: { children: [{ type: 'paragraph' }] } })
    expect(parseLexicalJson(json)?.root?.children).toHaveLength(1)
  })
})

describe('walkLexicalTree', () => {
  it('visits nodes depth-first', () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'hello' }],
          },
        ],
      },
    })
    const types: string[] = []
    walkLexicalTree(json, {
      onNode(node) {
        types.push(String(node.type))
      },
    })
    expect(types).toEqual(['paragraph', 'text'])
  })

  it('supports skip-children', () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'skip me' }],
          },
        ],
      },
    })
    const types: string[] = []
    walkLexicalTree(json, {
      onNode(node) {
        types.push(String(node.type))
        if (node.type === 'paragraph') return 'skip-children'
      },
    })
    expect(types).toEqual(['paragraph'])
  })
})
