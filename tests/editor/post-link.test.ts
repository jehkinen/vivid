import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEditor,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical'
import { $isLinkNode } from '@lexical/link'
import { EDITOR_NODES } from '@/components/editor/editor-nodes'
import { $insertPostLink } from '@/lib/editor/post-link'
import { getPostIdFromLinkNode } from '@/lib/editor/post-link-helpers'

function createTestEditor(): LexicalEditor {
  return createEditor({
    namespace: 'post-link-test',
    nodes: EDITOR_NODES,
    onError: (error) => {
      throw error
    },
  })
}

function updateEditor(editor: LexicalEditor, fn: () => void) {
  editor.update(fn, { discrete: true })
}

function editorHasPostLink(editor: LexicalEditor): boolean {
  let found = false
  editor.getEditorState().read(() => {
    const stack: LexicalNode[] = [...$getRoot().getChildren()]
    while (stack.length > 0) {
      const node = stack.shift()!
      if ($isLinkNode(node) && getPostIdFromLinkNode(node)) {
        found = true
        return
      }
      if ($isElementNode(node)) {
        stack.push(...node.getChildren())
      }
    }
  })
  return found
}

describe('$insertPostLink', () => {
  let editor: LexicalEditor

  beforeEach(() => {
    editor = createTestEditor()
    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode(''))
      $getRoot().append(paragraph)
      paragraph.selectEnd()
    })
  })

  it('inserts link with rel, url, and title label', () => {
    updateEditor(editor, () => {
      $insertPostLink({ postId: 'pid1', slug: 'my-post', title: 'My Post' })
    })

    expect(editorHasPostLink(editor)).toBe(true)
    editor.getEditorState().read(() => {
      const stack: LexicalNode[] = [...$getRoot().getChildren()]
      let link: LexicalNode | null = null
      while (stack.length > 0) {
        const node = stack.shift()!
        if ($isLinkNode(node)) {
          link = node
          break
        }
        if ($isElementNode(node)) stack.push(...node.getChildren())
      }
      expect($isLinkNode(link)).toBe(true)
      if ($isLinkNode(link)) {
        expect(link.getURL()).toBe('/my-post')
        expect(getPostIdFromLinkNode(link)).toBe('pid1')
        expect(link.getTextContent()).toBe('My Post')
      }
    })
  })

  it('uses slug when title is empty', () => {
    updateEditor(editor, () => {
      $insertPostLink({ postId: 'pid2', slug: 'fallback-slug', title: null })
    })

    expect(editorHasPostLink(editor)).toBe(true)
    editor.getEditorState().read(() => {
      const stack: LexicalNode[] = [...$getRoot().getChildren()]
      while (stack.length > 0) {
        const node = stack.shift()!
        if ($isLinkNode(node)) {
          expect(node.getTextContent()).toBe('fallback-slug')
          return
        }
        if ($isElementNode(node)) stack.push(...node.getChildren())
      }
    })
  })
})
