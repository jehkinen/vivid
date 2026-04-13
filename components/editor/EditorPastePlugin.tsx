'use client'

import { $insertDataTransferForRichText } from '@lexical/clipboard'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { CLIPBOARD_MIME, INPUT_INSERT_TYPES } from '@/shared/constants'
import type { LexicalEditor, RangeSelection } from 'lexical'
import {
  PASTE_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  $getSelection,
  $getRoot,
  $setSelection,
  $createRangeSelectionFromDom,
  $getPreviousSelection,
  $isRangeSelection,
  isDOMNode,
  isSelectionCapturedInDecoratorInput,
} from 'lexical'
import { useLayoutEffect, useRef } from 'react'

const SKIP_INPUT_AFTER_CLIPBOARD_MS = 120

function isPasteInputType(inputType: string) {
  return (
    inputType === INPUT_INSERT_TYPES.PASTE || inputType === INPUT_INSERT_TYPES.PASTE_AS_QUOTATION
  )
}

function buildSyntheticDataTransfer(source: DataTransfer): DataTransfer | null {
  const plain = source.getData(CLIPBOARD_MIME.PLAIN)
  const html = source.getData(CLIPBOARD_MIME.HTML)
  const lexical = source.getData(CLIPBOARD_MIME.LEXICAL_EDITOR)
  const uriList = source.getData(CLIPBOARD_MIME.URI_LIST)
  const hasFiles = source.types.includes('Files') && source.files.length > 0
  const hasText = plain !== '' || html !== '' || lexical !== '' || uriList !== ''
  if (hasFiles && !hasText) {
    return null
  }
  if (!plain && !html && !lexical && !uriList && !hasFiles) {
    return null
  }
  const dt = new DataTransfer()
  if (plain) dt.setData(CLIPBOARD_MIME.PLAIN, plain)
  if (html) dt.setData(CLIPBOARD_MIME.HTML, html)
  if (lexical) dt.setData(CLIPBOARD_MIME.LEXICAL_EDITOR, lexical)
  if (uriList) dt.setData(CLIPBOARD_MIME.URI_LIST, uriList)
  if (hasFiles) {
    for (let i = 0; i < source.files.length; i++) {
      dt.items.add(source.files[i])
    }
  }
  return dt
}

function buildSyntheticFromStrings(plain: string, html: string): DataTransfer | null {
  if (!plain && !html) {
    return null
  }
  const dt = new DataTransfer()
  if (plain) dt.setData(CLIPBOARD_MIME.PLAIN, plain)
  if (html) dt.setData(CLIPBOARD_MIME.HTML, html)
  return dt
}

function captureRangeSnapshot(editor: LexicalEditor): RangeSelection | null {
  let snap: RangeSelection | null = null
  editor.getEditorState().read(() => {
    const s = $getSelection()
    if ($isRangeSelection(s)) {
      snap = s.clone()
    }
  })
  return snap
}

function restoreSelectionForPaste(editor: LexicalEditor) {
  let sel = $getSelection()
  if (sel !== null) {
    return sel
  }
  const domSel = typeof window !== 'undefined' ? window.getSelection() : null
  const fromDom = $createRangeSelectionFromDom(domSel, editor)
  if (fromDom !== null) {
    $setSelection(fromDom)
    return $getSelection()
  }
  const prev = $getPreviousSelection()
  if ($isRangeSelection(prev)) {
    $setSelection(prev.clone())
    return $getSelection()
  }
  $setSelection($getRoot().selectEnd())
  return $getSelection()
}

function selectionFromInputTargetRanges(
  event: InputEvent,
  editor: LexicalEditor
): RangeSelection | null {
  const trs = event.getTargetRanges?.()
  if (!trs?.length) {
    return null
  }
  const sr = trs[0]
  const root = editor.getRootElement()
  const doc = root?.ownerDocument
  const view = doc?.defaultView
  if (!root || !doc || !view) {
    return null
  }
  const domSel = view.getSelection()
  if (!domSel) {
    return null
  }
  const range = doc.createRange()
  range.setStart(sr.startContainer, sr.startOffset)
  range.setEnd(sr.endContainer, sr.endOffset)
  domSel.removeAllRanges()
  domSel.addRange(range)
  const lexical = $createRangeSelectionFromDom(domSel, editor)
  domSel.removeAllRanges()
  return lexical
}

function insertFromDataTransfer(
  editor: LexicalEditor,
  dt: DataTransfer,
  snapshot: RangeSelection | null,
  rangeFallback: RangeSelection | null
) {
  editor.update(() => {
    if (snapshot !== null) {
      $setSelection(snapshot.clone())
    } else if (rangeFallback !== null) {
      $setSelection(rangeFallback.clone())
    } else {
      restoreSelectionForPaste(editor)
    }
    const sel = $getSelection()
    if (sel !== null) {
      $insertDataTransferForRichText(dt, sel, editor)
    }
  })
}

async function readClipboardAsSynthetic(): Promise<DataTransfer | null> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return null
  }
  try {
    if (navigator.clipboard.read) {
      const items = await navigator.clipboard.read()
      let plain = ''
      let html = ''
      for (const item of items) {
        if (item.types.includes(CLIPBOARD_MIME.HTML)) {
          const blob = await item.getType(CLIPBOARD_MIME.HTML)
          html = await blob.text()
        }
        if (item.types.includes(CLIPBOARD_MIME.PLAIN)) {
          const blob = await item.getType(CLIPBOARD_MIME.PLAIN)
          plain = await blob.text()
        }
      }
      return buildSyntheticFromStrings(plain, html)
    }
    const plain = await navigator.clipboard.readText()
    return buildSyntheticFromStrings(plain || '', '')
  } catch {
    return null
  }
}

export default function EditorPastePlugin() {
  const [editor] = useLexicalComposerContext()
  const clipboardHandledAtRef = useRef(0)
  const asyncPastePendingRef = useRef(false)
  const pasteGenRef = useRef(0)

  useLayoutEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: Event) => {
        if (isDOMNode(event.target) && isSelectionCapturedInDecoratorInput(event.target)) {
          return false
        }
        const rootEl = editor.getRootElement()
        if (!rootEl) {
          return false
        }
        const active = typeof document !== 'undefined' ? document.activeElement : null
        const contains = (n: Node | null) => n !== null && rootEl.contains(n)
        if (!contains(event.target as Node | null) && !contains(active)) {
          return false
        }

        if (event instanceof ClipboardEvent && event.clipboardData) {
          if (asyncPastePendingRef.current) {
            pasteGenRef.current += 1
            asyncPastePendingRef.current = false
          }
          const hasFiles =
            event.clipboardData.types.includes('Files') && event.clipboardData.files.length > 0
          const plain = event.clipboardData.getData(CLIPBOARD_MIME.PLAIN)
          const html = event.clipboardData.getData(CLIPBOARD_MIME.HTML)
          const hasText = plain !== '' || html !== ''
          if (hasFiles && !hasText) {
            return false
          }
          const synth = buildSyntheticDataTransfer(event.clipboardData)
          if (synth === null) {
            return false
          }
          const snapshot = captureRangeSnapshot(editor)
          event.preventDefault()
          clipboardHandledAtRef.current = Date.now()
          insertFromDataTransfer(editor, synth, snapshot, null)
          return true
        }

        if (event instanceof InputEvent && isPasteInputType(event.inputType)) {
          if (Date.now() - clipboardHandledAtRef.current < SKIP_INPUT_AFTER_CLIPBOARD_MS) {
            event.preventDefault()
            return true
          }
          const snapshot = captureRangeSnapshot(editor)
          const rangeFallback =
            snapshot === null ? selectionFromInputTargetRanges(event, editor) : null
          if (event.data != null && event.data.length > 0) {
            const dt = buildSyntheticFromStrings(event.data, '')
            event.preventDefault()
            if (dt !== null) {
              clipboardHandledAtRef.current = Date.now()
              insertFromDataTransfer(editor, dt, snapshot, rangeFallback)
            }
            return true
          }
          event.preventDefault()
          const gen = ++pasteGenRef.current
          asyncPastePendingRef.current = true
          void readClipboardAsSynthetic().then((dt) => {
            asyncPastePendingRef.current = false
            if (pasteGenRef.current !== gen) {
              return
            }
            if (dt !== null) {
              clipboardHandledAtRef.current = Date.now()
              insertFromDataTransfer(editor, dt, snapshot, rangeFallback)
            }
          })
          return true
        }

        return false
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])

  return null
}
