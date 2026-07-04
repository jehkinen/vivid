'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_MODIFIER_COMMAND,
} from 'lexical'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  $getActiveLinkNode,
  $getLinkDisplayText,
  $isSelectionInLink,
  $savedSelectionFromRange,
  type SavedLinkSelection,
} from '@/lib/editor/link-utils'
import {
  computeFloatingPanelPosition,
  getDefaultPanelSize,
  getSelectionAnchorRect,
  FLOATING_PANEL_OFFSET,
} from '@/lib/editor/floating-panel-position'
import { useEditorFloatingUI } from './EditorFloatingUIContext'
import FloatingToolbar from './FloatingToolbar'
import FloatingLinkEditor from './FloatingLinkEditor'

interface FloatingToolbarPluginProps {
  onOpenChange?: (open: boolean) => void
}

export default function FloatingToolbarPlugin({ onOpenChange }: FloatingToolbarPluginProps) {
  const [editor] = useLexicalComposerContext()
  const {
    mode,
    modeRef,
    setMode,
    panelRef,
    position,
    setPosition,
    linkSession,
    openLinkSession,
    closeLinkSession,
  } = useEditorFloatingUI()
  const [formatVisible, setFormatVisible] = useState(false)
  const cachedSelectionRef = useRef<SavedLinkSelection | null>(null)
  const cachedLinkTextRef = useRef('')
  const cachedAnchorRectRef = useRef<DOMRect | null>(null)
  const openingLinkRef = useRef(false)

  useEffect(() => {
    onOpenChange?.(formatVisible || mode === 'link')
  }, [formatVisible, mode, onOpenChange])

  const applyPanelPosition = useCallback(
    (anchorRect: DOMRect, panelMode: 'format' | 'link') => {
      cachedAnchorRectRef.current = anchorRect
      const measuredWidth = panelRef.current?.offsetWidth
      const measuredHeight = panelRef.current?.offsetHeight
      const defaults = getDefaultPanelSize(panelMode)
      const width = measuredWidth ?? defaults.width
      const height = measuredHeight ?? defaults.height
      setPosition(
        computeFloatingPanelPosition(anchorRect, width, height, FLOATING_PANEL_OFFSET)
      )
    },
    [panelRef, setPosition]
  )

  const resolveAnchorRect = useCallback(() => {
    const rootElement = editor.getRootElement()
    return getSelectionAnchorRect(rootElement) ?? cachedAnchorRectRef.current
  }, [editor])

  const refreshPanelPosition = useCallback(
    (panelMode: 'format' | 'link') => {
      const rect = resolveAnchorRect()
      if (!rect) return false
      applyPanelPosition(rect, panelMode)
      return true
    },
    [applyPanelPosition, resolveAnchorRect]
  )

  const updateFormatPanel = useCallback(() => {
    if (modeRef.current === 'link') return

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (
        $isRangeSelection(selection) &&
        selection.isCollapsed() &&
        $isSelectionInLink(selection)
      ) {
        setFormatVisible(false)
        return
      }
    })

    const rootElement = editor.getRootElement()
    const rect = getSelectionAnchorRect(rootElement)
    if (!rect) {
      setFormatVisible(false)
      return
    }

    const domSelection = window.getSelection()
    if (!domSelection?.rangeCount || domSelection.getRangeAt(0).collapsed) {
      setFormatVisible(false)
      return
    }

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        cachedSelectionRef.current = $savedSelectionFromRange(selection)
        cachedLinkTextRef.current = selection.getTextContent().trim()
      }
    })

    applyPanelPosition(rect, 'format')
    setFormatVisible(true)
    setMode('format')
  }, [editor, modeRef, applyPanelPosition, setMode])

  const buildLinkSession = useCallback(() => {
    let savedSelection: SavedLinkSelection | null = cachedSelectionRef.current
    let linkText = cachedLinkTextRef.current
    let linkUrl = ''
    let editingLinkKey: string | null = null

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const existing = $getActiveLinkNode(selection)
      if (existing) {
        editingLinkKey = existing.getKey()
        linkText = $getLinkDisplayText(existing)
        linkUrl = existing.getURL()
        return
      }

      if (!selection.isCollapsed()) {
        savedSelection = $savedSelectionFromRange(selection)
        linkText = selection.getTextContent().trim()
        cachedSelectionRef.current = savedSelection
        cachedLinkTextRef.current = linkText
      }
    })

    linkUrl = linkUrl || linkText

    return {
      savedSelection,
      linkText,
      linkUrl,
      editingLinkKey,
    }
  }, [editor])

  const handleOpenLink = useCallback(() => {
    openingLinkRef.current = true
    const session = buildLinkSession()
    if (!refreshPanelPosition('link')) {
      const rootElement = editor.getRootElement()
      const fallbackRect =
        cachedAnchorRectRef.current ??
        rootElement?.getBoundingClientRect() ??
        new DOMRect(window.innerWidth / 2, window.innerHeight / 3, 0, 0)
      applyPanelPosition(fallbackRect, 'link')
    }
    openLinkSession(session)
    requestAnimationFrame(() => {
      openingLinkRef.current = false
    })
  }, [buildLinkSession, openLinkSession, refreshPanelPosition, applyPanelPosition, editor])

  useEffect(() => {
    return editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault()
          handleOpenLink()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_HIGH
    )
  }, [editor, handleOpenLink])

  useEffect(() => {
    const handleSelectionChange = () => {
      if (modeRef.current === 'link') return

      editor.getEditorState().read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          setTimeout(updateFormatPanel, 10)
          return
        }
        setTimeout(() => {
          if (modeRef.current === 'link') return
          setFormatVisible(false)
          if (modeRef.current === 'format') setMode('none')
        }, 100)
      })
    }

    const handleMouseUp = () => {
      if (modeRef.current === 'link') return
      setTimeout(updateFormatPanel, 10)
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (modeRef.current === 'link') return
      const editorElement = editor.getRootElement()
      if (editorElement?.contains(e.target as Node)) return
      if (e.target instanceof Element && e.target.closest('[data-editor-floating-ui]')) return
      setTimeout(() => {
        if (modeRef.current === 'link') return
        setFormatVisible(false)
        if (modeRef.current === 'format') setMode('none')
      }, 100)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [editor, updateFormatPanel, setMode, modeRef])

  useEffect(() => {
    if (mode === 'link') {
      setFormatVisible(false)
    }
  }, [mode])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (openingLinkRef.current) return
      if (modeRef.current !== 'link') return
      const target = e.target
      if (!(target instanceof Node)) return
      if (panelRef.current?.contains(target)) return
      if (target instanceof Element && target.closest('[data-editor-floating-ui]')) return
      closeLinkSession()
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [closeLinkSession, modeRef, panelRef])

  const panelOpen = (formatVisible && mode === 'format') || (mode === 'link' && linkSession !== null)

  useLayoutEffect(() => {
    if (!panelOpen) return
    const panelMode = mode === 'link' ? 'link' : 'format'
    refreshPanelPosition(panelMode)
  }, [panelOpen, mode, refreshPanelPosition, linkSession, formatVisible])

  useEffect(() => {
    if (!panelOpen) return

    const handleReposition = () => {
      const panelMode = modeRef.current === 'link' ? 'link' : 'format'
      refreshPanelPosition(panelMode)
    }

    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
    return () => {
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [panelOpen, modeRef, refreshPanelPosition])

  if (!panelOpen) return null

  const panelStyle = position ?? {
    top: '33%',
    left: '50%',
    transform: 'translate(-50%, -100%)',
  }

  return (
    <div
      ref={panelRef}
      data-editor-floating-ui="true"
      data-editor-link-card={mode === 'link' ? 'true' : undefined}
      className="fixed z-50"
      style={{ ...panelStyle, position: 'fixed' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {mode === 'link' && linkSession ? (
        <FloatingLinkEditor session={linkSession} />
      ) : (
        <div className="flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <FloatingToolbar onOpenLink={handleOpenLink} />
        </div>
      )}
    </div>
  )
}
