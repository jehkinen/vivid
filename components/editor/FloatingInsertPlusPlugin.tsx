'use client'

import type { LexicalEditor } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection } from 'lexical'
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useMediable } from './MediableContext'
import InsertBlockPlus from './InsertBlockPlus'

export const FloatingPanelContext = createContext<((props: { editor: LexicalEditor }) => React.ReactNode) | null>(null)

export default function FloatingInsertPlusPlugin() {
  const [editor] = useLexicalComposerContext()
  const { mediableType, mediableId } = useMediable()
  const renderFloatingPanel = useContext(FloatingPanelContext)
  const [show, setShow] = useState(false)
  const [top, setTop] = useState<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const updatePosition = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setShow(false)
          return
        }

        const editorElement = editor.getRootElement()
        if (!editorElement) {
          setShow(false)
          return
        }

        try {
          const domSelection = window.getSelection()
          if (!domSelection || domSelection.rangeCount === 0) {
            setShow(false)
            return
          }

          const range = domSelection.getRangeAt(0)
          if (!range.collapsed) {
            setShow(false)
            return
          }

          const clonedRange = range.cloneRange()
          clonedRange.collapse(true)
          
          const rect = clonedRange.getBoundingClientRect()
          const editorRect = editorElement.getBoundingClientRect()
          
          const topPosition = rect.top - editorRect.top + editorElement.scrollTop

          setTop(topPosition)
          setShow(true)
        } catch (error) {
          setShow(false)
        }
      })
    }

    const handleUpdate = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(updatePosition, 100)
    }

    const handleSelectionChange = () => {
      handleUpdate()
    }

    const handleKeyDown = () => {
      handleUpdate()
    }

    const handleClick = () => {
      handleUpdate()
    }

    const handleScroll = () => {
      handleUpdate()
    }

    const editorElement = editor.getRootElement()
    if (editorElement) {
      editorElement.addEventListener('scroll', handleScroll)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClick)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (editorElement) {
        editorElement.removeEventListener('scroll', handleScroll)
      }
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClick)
    }
  }, [editor])

  if (!show || top === null) return null

  if (renderFloatingPanel) {
    const panel = renderFloatingPanel({ editor })
    if (panel == null) return null
    return (
      <div
        className="absolute z-10 pointer-events-none"
        style={{ top: `${top}px`, left: '-56px' }}
      >
        <div className="pointer-events-auto flex flex-col items-center justify-center">
          {panel}
        </div>
      </div>
    )
  }

  return (
    <div
      className="absolute z-10 pointer-events-none"
      style={{ top: `${top}px`, left: '-56px' }}
    >
      <div className="pointer-events-auto flex flex-col items-center justify-center">
        <InsertBlockPlus
          editor={editor}
          mediableType={mediableType}
          mediableId={mediableId}
        />
      </div>
    </div>
  )
}
