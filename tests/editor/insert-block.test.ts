import { describe, it, expect } from 'vitest'
import {
  createEditor,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  ParagraphNode,
  TextNode,
  type LexicalNode,
} from 'lexical'
import {
  insertDecoratorWithTrailingParagraph,
  removeDecoratorNode,
} from '@/lib/editor/insert-block'

describe('insertDecoratorWithTrailingParagraph', () => {
  it('inserts nodes at the current selection', () => {
    const editor = createEditor({ nodes: [ParagraphNode, TextNode] })
    let childCount = 0
    editor.update(() => {
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode('start'))
      $getRoot().clear()
      $getRoot().append(paragraph)
      paragraph.selectEnd()
      insertDecoratorWithTrailingParagraph(() => {
        const block = $createParagraphNode()
        block.append($createTextNode('block'))
        return block
      })
      childCount = $getRoot().getChildrenSize()
    })
    expect(childCount).toBeGreaterThan(1)
  })
})

describe('removeDecoratorNode', () => {
  it('removes node when guard passes', () => {
    const editor = createEditor({ nodes: [ParagraphNode, TextNode] })
    let nodeKey = ''
    let childCount = 0
    editor.update(() => {
      const paragraph = $createParagraphNode()
      $getRoot().append(paragraph)
      nodeKey = paragraph.getKey()
    })
    editor.update(() => {
      removeDecoratorNode(nodeKey, (node): node is LexicalNode => node.getKey() === nodeKey)
      childCount = $getRoot().getChildrenSize()
    })
    expect(childCount).toBe(0)
  })
})
