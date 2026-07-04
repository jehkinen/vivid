import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEditor,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  $createRangeSelection,
  $isElementNode,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical'
import { $isLinkNode, $createAutoLinkNode, $isAutoLinkNode, LinkNode } from '@lexical/link'
import { EDITOR_NODES } from '@/components/editor/editor-nodes'
import {
  $commitLinkEdit,
  $removeLinksInSelection,
  $restoreLinkSelection,
  $saveLinkSelection,
  $savedSelectionFromRange,
  type SavedLinkSelection,
} from './link-utils'

const URL = 'https://example.com/page'

function createTestEditor(): LexicalEditor {
  return createEditor({
    namespace: 'link-test',
    nodes: EDITOR_NODES,
    onError: (error) => {
      throw error
    },
  })
}

function updateEditor(editor: LexicalEditor, fn: () => void) {
  editor.update(fn, { discrete: true })
}

function selectText(textNode: ReturnType<typeof $createTextNode>, start: number, end: number) {
  const selection = $createRangeSelection()
  selection.anchor.set(textNode.getKey(), start, 'text')
  selection.focus.set(textNode.getKey(), end, 'text')
  $setSelection(selection)
}

function editorHasLink(editor: LexicalEditor): boolean {
  let found = false
  editor.getEditorState().read(() => {
    const stack: LexicalNode[] = [...$getRoot().getChildren()]
    while (stack.length > 0) {
      const node = stack.shift()!
      if ($isLinkNode(node)) {
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

describe('$commitLinkEdit', () => {
  let editor: LexicalEditor
  let saved: SavedLinkSelection | null

  beforeEach(() => {
    editor = createTestEditor()
    saved = null

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const text = $createTextNode(URL)
      paragraph.append(text)
      $getRoot().append(paragraph)
      selectText(text, 0, URL.length)
      saved = $saveLinkSelection()
    })
  })

  it('creates a link from saved selection', () => {
    updateEditor(editor, () => {
      $setSelection(null)
    })

    $commitLinkEdit(editor, {
      url: URL,
      displayText: URL,
      savedSelection: saved,
      editingLinkKey: null,
    })

    expect(editorHasLink(editor)).toBe(true)
  })

  it('creates a link from code-formatted text', () => {
    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const text = $createTextNode(URL)
      text.toggleFormat('code')
      paragraph.append(text)
      $getRoot().clear()
      $getRoot().append(paragraph)
      selectText(text, 0, URL.length)
      saved = $saveLinkSelection()
      $setSelection(null)
    })

    $commitLinkEdit(editor, {
      url: URL,
      displayText: URL,
      savedSelection: saved,
      editingLinkKey: null,
    })

    expect(editorHasLink(editor)).toBe(true)
  })

  it('updates an existing link', () => {
    $commitLinkEdit(editor, {
      url: URL,
      displayText: URL,
      savedSelection: saved,
      editingLinkKey: null,
    })

    let linkKey: string | null = null
    editor.getEditorState().read(() => {
      const stack: LexicalNode[] = [...$getRoot().getChildren()]
      while (stack.length) {
        const node = stack.shift()!
        if ($isLinkNode(node)) {
          linkKey = node.getKey()
          return
        }
        if ($isElementNode(node)) {
          stack.push(...node.getChildren())
        }
      }
    })

    expect(linkKey).not.toBeNull()

    $commitLinkEdit(editor, {
      url: 'https://updated.example',
      displayText: 'Updated',
      savedSelection: saved,
      editingLinkKey: linkKey,
    })

    editor.getEditorState().read(() => {
      const paragraph = $getRoot().getFirstChild()
      if (!paragraph || !$isElementNode(paragraph)) return
      const link = paragraph.getChildren().find($isLinkNode)
      expect(link?.getURL()).toBe('https://updated.example')
      expect(link?.getTextContent()).toBe('Updated')
    })
  })

  it('preserves inline style when changing display text', () => {
    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const text = $createTextNode(URL)
      text.setStyle('color: rgb(255, 0, 0);')
      paragraph.append(text)
      $getRoot().clear()
      $getRoot().append(paragraph)
      selectText(text, 0, URL.length)
      saved = $saveLinkSelection()
    })

    updateEditor(editor, () => {
      $setSelection(null)
    })

    $commitLinkEdit(editor, {
      url: URL,
      displayText: 'Custom label',
      savedSelection: saved,
      editingLinkKey: null,
    })

    editor.getEditorState().read(() => {
      const paragraph = $getRoot().getFirstChild()
      if (!paragraph || !$isElementNode(paragraph)) return
      const link = paragraph.getChildren().find($isLinkNode)
      const child = link?.getFirstChild()
      expect(link?.getTextContent()).toBe('Custom label')
      expect(child?.getStyle()).toContain('color')
    })
  })

  it('preserves inline style when display text is unchanged', () => {
    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const text = $createTextNode(URL)
      text.setStyle('color: rgb(255, 0, 0);')
      paragraph.append(text)
      $getRoot().clear()
      $getRoot().append(paragraph)
      selectText(text, 0, URL.length)
      saved = $saveLinkSelection()
    })

    updateEditor(editor, () => {
      $setSelection(null)
    })

    $commitLinkEdit(editor, {
      url: URL,
      displayText: URL,
      savedSelection: saved,
      editingLinkKey: null,
    })

    editor.getEditorState().read(() => {
      const paragraph = $getRoot().getFirstChild()
      if (!paragraph || !$isElementNode(paragraph)) return
      const link = paragraph.getChildren().find($isLinkNode)
      const child = link?.getFirstChild()
      expect(child?.getStyle()).toContain('color')
    })
  })
})

describe('$removeLinksInSelection', () => {
  it('removes a manual link from a collapsed selection', () => {
    const editor = createTestEditor()

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const text = $createTextNode(URL)
      paragraph.append(text)
      $getRoot().append(paragraph)
      selectText(text, 0, URL.length)
    })

    $commitLinkEdit(editor, {
      url: URL,
      displayText: URL,
      savedSelection: null,
      editingLinkKey: null,
    })

    updateEditor(editor, () => {
      const paragraph = $getRoot().getFirstChild()
      if (!paragraph || !$isElementNode(paragraph)) return
      const link = paragraph.getChildren().find($isLinkNode)
      link?.selectEnd()
      $removeLinksInSelection()
    })

    expect(editorHasLink(editor)).toBe(false)
  })

  it('unlinks an autolink from a collapsed selection', () => {
    const editor = createTestEditor()

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const autoLink = $createAutoLinkNode(URL)
      autoLink.append($createTextNode(URL))
      paragraph.append(autoLink)
      $getRoot().append(paragraph)
      autoLink.selectEnd()
    })

    updateEditor(editor, () => {
      $removeLinksInSelection()
    })

    editor.getEditorState().read(() => {
      const paragraph = $getRoot().getFirstChild()
      if (!paragraph || !$isElementNode(paragraph)) return
      const autoLink = paragraph.getChildren().find($isAutoLinkNode)
      expect(autoLink?.getIsUnlinked()).toBe(true)
    })
  })
})

describe('$restoreLinkSelection', () => {
  it('restores a saved range when editor selection is null', () => {
    const editor = createTestEditor()
    let saved: SavedLinkSelection | null = null

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const text = $createTextNode(URL)
      paragraph.append(text)
      $getRoot().append(paragraph)
      selectText(text, 0, URL.length)
      saved = $saveLinkSelection()
    })

    updateEditor(editor, () => {
      $setSelection(null)
      const restored = $restoreLinkSelection(saved!)
      expect(restored).not.toBeNull()
      expect(restored?.getTextContent()).toBe(URL)
    })
  })
})
