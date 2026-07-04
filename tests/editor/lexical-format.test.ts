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
  type LexicalEditor,
} from 'lexical'
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $createQuoteNode, $isQuoteNode } from '@lexical/rich-text'
import { EDITOR_NODES } from '@/components/editor/editor-nodes'

function createTestEditor(): LexicalEditor {
  return createEditor({
    namespace: 'format-test',
    nodes: EDITOR_NODES,
    onError: (error) => {
      throw error
    },
  })
}

function updateEditor(editor: LexicalEditor, fn: () => void) {
  editor.update(fn, { discrete: true })
}

function selectAllText(editor: LexicalEditor) {
  updateEditor(editor, () => {
    const paragraph = $getRoot().getFirstChild()
    if (!paragraph) return
    const text = paragraph.getFirstChild()
    if (!text) return
    const selection = $createRangeSelection()
    selection.anchor.set(text.getKey(), 0, 'text')
    selection.focus.set(text.getKey(), text.getTextContent().length, 'text')
    $setSelection(selection)
  })
}

describe('lexical formatting', () => {
  let editor: LexicalEditor

  beforeEach(() => {
    editor = createTestEditor()
    updateEditor(editor, () => {
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode('Hello world'))
      $getRoot().append(paragraph)
    })
  })

  it('toggles bold on selection', () => {
    updateEditor(editor, () => {
      const paragraph = $getRoot().getFirstChild()
      if (!paragraph) return
      const text = paragraph.getFirstChild()
      if (!text) return
      const selection = $createRangeSelection()
      selection.anchor.set(text.getKey(), 0, 'text')
      selection.focus.set(text.getKey(), text.getTextContent().length, 'text')
      $setSelection(selection)
      selection.toggleFormat('bold')
    })

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) throw new Error('no selection')
      expect(selection.hasFormat('bold')).toBe(true)
    })

    updateEditor(editor, () => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      selection.toggleFormat('bold')
    })

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) throw new Error('no selection')
      expect(selection.hasFormat('bold')).toBe(false)
    })
  })

  it('converts block to heading', () => {
    selectAllText(editor)
    updateEditor(editor, () => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      $setBlocksType(selection, () => $createHeadingNode('h2'))
    })

    editor.getEditorState().read(() => {
      const block = $getRoot().getFirstChild()
      expect($isHeadingNode(block)).toBe(true)
      if ($isHeadingNode(block)) {
        expect(block.getTag()).toBe('h2')
      }
    })
  })

  it('wraps content in quote block', () => {
    selectAllText(editor)
    updateEditor(editor, () => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      $setBlocksType(selection, () => $createQuoteNode())
    })

    editor.getEditorState().read(() => {
      const block = $getRoot().getFirstChild()
      expect($isQuoteNode(block)).toBe(true)
    })
  })
})
