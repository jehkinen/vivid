'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection } from 'lexical'
import { useEffect, useState, useCallback } from 'react'
import FloatingToolbar from './FloatingToolbar'

export default function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState<{ top: string; left: string; transform?: string }>({ top: '0px', left: '0px' })

  const updateToolbar = useCallback(() => {
    const selection = window.getSelection()
    
    if (!selection || selection.rangeCount === 0) {
      setShow(false)
      return
    }

    const range = selection.getRangeAt(0)
    
    if (!range || range.collapsed) {
      setShow(false)
      return
    }

    const editorElement = editor.getRootElement()
    if (!editorElement) {
      setShow(false)
      return
    }

    const commonAncestor = range.commonAncestorContainer
    const ancestorNode = commonAncestor.nodeType === Node.TEXT_NODE 
      ? commonAncestor.parentElement 
      : commonAncestor as Element
    
    if (!ancestorNode || !editorElement.contains(ancestorNode)) {
      setShow(false)
      return
    }

    const rect = range.getBoundingClientRect()
    
    if (rect.width === 0 && rect.height === 0) {
      setShow(false)
      return
    }

    const top = rect.top - 50
    const left = rect.left + rect.width / 2

    setPosition({
      top: `${top}px`,
      left: `${left}px`,
      transform: 'translate(-50%, -100%)',
    })
    setShow(true)
  }, [editor])

  useEffect(() => {
    const handleSelectionChange = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          setTimeout(updateToolbar, 10)
        } else {
          setTimeout(() => setShow(false), 100)
        }
      })
    }

    const handleMouseUp = () => {
      setTimeout(updateToolbar, 10)
    }

    const handleMouseDown = () => {
      setTimeout(() => setShow(false), 100)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [editor, updateToolbar])

  return <FloatingToolbar show={show} style={position} />
}
