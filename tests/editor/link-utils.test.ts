import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEditor,
  $getRoot,
  $getSelection,
  $createParagraphNode,
  $createTextNode,
  $isRangeSelection,
  $setSelection,
  $createRangeSelection,
  $isElementNode,
  $isTextNode,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical'
import { $isLinkNode, $createAutoLinkNode, $isAutoLinkNode, $createLinkNode } from '@lexical/link'
import { EDITOR_NODES } from '@/components/editor/editor-nodes'
import {
  $commitLinkEdit,
  $removeLinksInSelection,
  $restoreLinkSelection,
  $saveLinkSelection,
  $buildLinkSessionFromKey,
  $updateLinkDisplayTextByKey,
  $isSelectionInLink,
  $isSelectionInManualLink,
  $getLinkDisplayText,
  $savedSelectionFromRange,
  type SavedLinkSelection,
} from '@/lib/editor/link-utils'

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
      url: URL,
      displayText: 'Updated',
      savedSelection: saved,
      editingLinkKey: linkKey,
    })

    editor.getEditorState().read(() => {
      const paragraph = $getRoot().getFirstChild()
      if (!paragraph || !$isElementNode(paragraph)) return
      const link = paragraph.getChildren().find($isLinkNode)
      expect(link?.getURL()).toBe(URL)
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
      expect($isTextNode(child) && child.getStyle()).toContain('color')
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
      expect($isTextNode(child) && child.getStyle()).toContain('color')
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

describe('$buildLinkSessionFromKey', () => {
  it('returns session data for an existing link', () => {
    const editor = createTestEditor()
    let linkKey = ''

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const link = $createLinkNode(URL)
      link.append($createTextNode('My link'))
      paragraph.append(link)
      $getRoot().append(paragraph)
      linkKey = link.getKey()
    })

    editor.getEditorState().read(() => {
      const session = $buildLinkSessionFromKey(linkKey)
      expect(session).toEqual({
        editingLinkKey: linkKey,
        linkText: 'My link',
        linkUrl: URL,
        savedSelection: null,
      })
    })
  })

  it('returns null for unlinked autolink', () => {
    const editor = createTestEditor()
    let linkKey = ''

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const autoLink = $createAutoLinkNode(URL)
      autoLink.setIsUnlinked(true)
      autoLink.append($createTextNode(URL))
      paragraph.append(autoLink)
      $getRoot().append(paragraph)
      linkKey = autoLink.getKey()
    })

    editor.getEditorState().read(() => {
      expect($buildLinkSessionFromKey(linkKey)).toBeNull()
    })
  })
})

describe('$updateLinkDisplayTextByKey', () => {
  it('changes display text without changing URL', () => {
    const editor = createTestEditor()
    let linkKey = ''

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const link = $createLinkNode(URL)
      link.append($createTextNode(URL))
      paragraph.append(link)
      $getRoot().append(paragraph)
      linkKey = link.getKey()
    })

    updateEditor(editor, () => {
      $updateLinkDisplayTextByKey(linkKey, 'Short label')
    })

    editor.getEditorState().read(() => {
      const paragraph = $getRoot().getFirstChild()
      if (!paragraph || !$isElementNode(paragraph)) return
      const link = paragraph.getChildren().find($isLinkNode)
      expect(link?.getURL()).toBe(URL)
      expect(link?.getTextContent()).toBe('Short label')
    })
  })
})

describe('$isSelectionInLink', () => {
  it('returns true when caret is inside a link', () => {
    const editor = createTestEditor()

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const link = $createLinkNode(URL)
      link.append($createTextNode('click here'))
      paragraph.append(link)
      $getRoot().append(paragraph)
      link.select(3, 3)
    })

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) throw new Error('expected range selection')
      expect($isSelectionInLink(selection)).toBe(true)
    })
  })

  it('returns false outside a link', () => {
    const editor = createTestEditor()

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode('plain'))
      $getRoot().append(paragraph)
      paragraph.select(0, 0)
    })

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) throw new Error('expected range selection')
      expect($isSelectionInLink(selection)).toBe(false)
    })
  })
})

describe('$saveLinkSelection', () => {
  it('returns null for collapsed selection', () => {
    const editor = createTestEditor()

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const text = $createTextNode('abc')
      paragraph.append(text)
      $getRoot().append(paragraph)
      text.select(1, 1)
      expect($saveLinkSelection()).toBeNull()
    })
  })
})

describe('$isSelectionInManualLink', () => {
  it('returns false for autolink', () => {
    const editor = createTestEditor()

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const autoLink = $createAutoLinkNode(URL)
      autoLink.append($createTextNode(URL))
      paragraph.append(autoLink)
      $getRoot().append(paragraph)
      autoLink.select(2, 2)
    })

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) throw new Error('expected range selection')
      expect($isSelectionInManualLink(selection)).toBe(false)
    })
  })

  it('returns true for manual link', () => {
    const editor = createTestEditor()

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const link = $createLinkNode(URL)
      link.append($createTextNode('label'))
      paragraph.append(link)
      $getRoot().append(paragraph)
      link.select(1, 1)
    })

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) throw new Error('expected range selection')
      expect($isSelectionInManualLink(selection)).toBe(true)
    })
  })
})

describe('$savedSelectionFromRange and $getLinkDisplayText', () => {
  it('round-trips selection metadata', () => {
    const editor = createTestEditor()
    let saved: SavedLinkSelection | null = null

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const text = $createTextNode('abcdef')
      paragraph.append(text)
      $getRoot().append(paragraph)
      selectText(text, 1, 4)
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) throw new Error('expected range selection')
      saved = $savedSelectionFromRange(selection)
    })

    expect(saved).toMatchObject({
      anchorOffset: 1,
      focusOffset: 4,
    })
  })

  it('reads link display text', () => {
    const editor = createTestEditor()

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const link = $createLinkNode(URL)
      link.append($createTextNode('Visible'))
      paragraph.append(link)
      $getRoot().append(paragraph)
    })

    editor.getEditorState().read(() => {
      const paragraph = $getRoot().getFirstChild()
      if (!paragraph || !$isElementNode(paragraph)) return
      const link = paragraph.getChildren().find($isLinkNode)
      if (!link) throw new Error('missing link')
      expect($getLinkDisplayText(link)).toBe('Visible')
    })
  })
})

describe('$removeLinksInSelection range', () => {
  it('unlinks autolinks in non-collapsed selection', () => {
    const editor = createTestEditor()

    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      const autoLink = $createAutoLinkNode(URL)
      autoLink.append($createTextNode(URL))
      paragraph.append(autoLink)
      $getRoot().append(paragraph)
      autoLink.select(0, URL.length)
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
