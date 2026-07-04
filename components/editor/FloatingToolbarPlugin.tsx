'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_MODIFIER_COMMAND,
} from 'lexical'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import {
  $getActiveLinkNode,
  $getLinkDisplayText,
  $isSelectionInLink,
  $savedSelectionFromRange,
  type SavedLinkSelection,
} from '@/lib/editor/link-utils'
import {
  computePanelPositionAbove,
  computePanelPositionAboveLink,
  computePanelPositionBelowLink,
  getDefaultPanelSize,
  getLinkAnchorRect,
  getSelectionAnchorRect,
  FLOATING_PANEL_OFFSET,
} from '@/lib/editor/floating-panel-position'
import { cn } from '@/lib/utils'
import { useEditorFloatingUI } from './EditorFloatingUIContext'
import FloatingToolbar from './FloatingToolbar'
import FloatingLinkEditor from './FloatingLinkEditor'
import FloatingLinkPreview from './FloatingLinkPreview'
import { editorFloatingShellClassName } from './editor-floating-shell'

interface FloatingToolbarPluginProps {
  onOpenChange?: (open: boolean) => void
}

export default function FloatingToolbarPlugin({ onOpenChange }: FloatingToolbarPluginProps) {
  const [editor] = useLexicalComposerContext()
  const {
    surface,
    surfaceRef,
    linkPhase,
    linkPhaseRef,
    toolbarRef,
    linkPopoverRef,
    toolbarPosition,
    linkPopoverPosition,
    setToolbarPosition,
    setLinkPopoverPosition,
    linkSession,
    openLinkCreate,
    openLinkEdit,
    closeAll,
    formatVisible,
    setFormatVisible,
    setSurface,
  } = useEditorFloatingUI()

  const cachedSelectionRef = useRef<SavedLinkSelection | null>(null)
  const cachedLinkTextRef = useRef('')
  const cachedAnchorRectRef = useRef<DOMRect | null>(null)
  const openingLinkRef = useRef(false)

  const toolbarOpen =
    formatVisible && (surface === 'format' || (surface === 'link' && linkPhase === 'create'))
  const linkPopoverOpen = linkPhase === 'view' || linkPhase === 'edit' || linkPhase === 'create'

  useEffect(() => {
    onOpenChange?.(toolbarOpen || linkPopoverOpen)
  }, [toolbarOpen, linkPopoverOpen, onOpenChange])

  const resolveAnchorRect = useCallback(() => {
    const rootElement = editor.getRootElement()
    const linkKey = linkSession?.editingLinkKey
    if (linkKey) {
      const linkRect = getLinkAnchorRect(editor, linkKey)
      if (linkRect) return linkRect
    }
    return getSelectionAnchorRect(rootElement) ?? cachedAnchorRectRef.current
  }, [editor, linkSession?.editingLinkKey])

  const applyToolbarPosition = useCallback(
    (anchorRect: DOMRect) => {
      cachedAnchorRectRef.current = anchorRect
      const measuredWidth = toolbarRef.current?.offsetWidth
      const measuredHeight = toolbarRef.current?.offsetHeight
      const defaults = getDefaultPanelSize('format')
      const width = measuredWidth ?? defaults.width
      const height = measuredHeight ?? defaults.height
      setToolbarPosition(
        computePanelPositionAbove(anchorRect, width, height, FLOATING_PANEL_OFFSET)
      )
    },
    [toolbarRef, setToolbarPosition]
  )

  const applyLinkPopoverPosition = useCallback(
    (anchorRect: DOMRect, panelMode: 'link-preview' | 'link-edit') => {
      cachedAnchorRectRef.current = anchorRect
      const measuredWidth = linkPopoverRef.current?.offsetWidth
      const measuredHeight = linkPopoverRef.current?.offsetHeight
      const defaults = getDefaultPanelSize(panelMode)
      const width = measuredWidth ?? defaults.width
      const height = measuredHeight ?? defaults.height

      const phase = linkPhaseRef.current
      if (phase === 'view' || phase === 'edit') {
        setLinkPopoverPosition(
          computePanelPositionAboveLink(anchorRect, width, height)
        )
      } else {
        setLinkPopoverPosition(
          computePanelPositionBelowLink(anchorRect, width, height)
        )
      }
    },
    [linkPopoverRef, setLinkPopoverPosition, linkPhaseRef]
  )

  const refreshPositions = useCallback(() => {
    const rect = resolveAnchorRect()
    if (!rect) return false

    if (toolbarOpen) {
      applyToolbarPosition(rect)
    }
    if (linkPopoverOpen && linkSession) {
      const panelMode = linkPhase === 'view' ? 'link-preview' : 'link-edit'
      applyLinkPopoverPosition(rect, panelMode)
    }
    return true
  }, [
    resolveAnchorRect,
    toolbarOpen,
    linkPopoverOpen,
    linkSession,
    linkPhase,
    applyToolbarPosition,
    applyLinkPopoverPosition,
  ])

  const updateFormatPanel = useCallback(() => {
    if (linkPhaseRef.current !== 'none') return

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (
        $isRangeSelection(selection) &&
        selection.isCollapsed() &&
        $isSelectionInLink(selection)
      ) {
        setFormatVisible(false)
        setSurface('none')
        return
      }
    })

    const rootElement = editor.getRootElement()
    const rect = getSelectionAnchorRect(rootElement)
    if (!rect) {
      setFormatVisible(false)
      setSurface('none')
      return
    }

    const domSelection = window.getSelection()
    if (!domSelection?.rangeCount || domSelection.getRangeAt(0).collapsed) {
      setFormatVisible(false)
      setSurface('none')
      return
    }

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        cachedSelectionRef.current = $savedSelectionFromRange(selection)
        cachedLinkTextRef.current = selection.getTextContent().trim()
      }
    })

    applyToolbarPosition(rect)
    setSurface('format')
    setFormatVisible(true)
  }, [editor, linkPhaseRef, applyToolbarPosition, setFormatVisible, setSurface])

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

  const handleEditLink = useCallback(
    (session: NonNullable<typeof linkSession>) => {
      openingLinkRef.current = true
      openLinkEdit(session)
      const rect = resolveAnchorRect() ?? getLinkAnchorRect(editor, session.editingLinkKey!)
      if (rect) {
        applyLinkPopoverPosition(rect, 'link-edit')
      }
      requestAnimationFrame(() => {
        openingLinkRef.current = false
      })
    },
    [resolveAnchorRect, editor, applyLinkPopoverPosition, openLinkEdit]
  )

  const handleOpenLinkCreate = useCallback(() => {
    openingLinkRef.current = true
    const session = buildLinkSession()

    const rect = resolveAnchorRect()
    if (rect) {
      applyToolbarPosition(rect)
      applyLinkPopoverPosition(rect, 'link-edit')
    }

    if (session.editingLinkKey) {
      openLinkEdit({
        ...session,
        savedSelection: null,
      })
    } else {
      openLinkCreate(session)
    }

    requestAnimationFrame(() => {
      openingLinkRef.current = false
    })
  }, [
    buildLinkSession,
    resolveAnchorRect,
    applyToolbarPosition,
    applyLinkPopoverPosition,
    openLinkCreate,
    openLinkEdit,
  ])

  useEffect(() => {
    return editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault()
          handleOpenLinkCreate()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_HIGH
    )
  }, [editor, handleOpenLinkCreate])

  useEffect(() => {
    const handleSelectionChange = () => {
      if (linkPhaseRef.current !== 'none') return

      editor.getEditorState().read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          setTimeout(updateFormatPanel, 10)
          return
        }
        setTimeout(() => {
          if (linkPhaseRef.current !== 'none') return
          setFormatVisible(false)
          setSurface('none')
        }, 100)
      })
    }

    const handleMouseUp = () => {
      if (linkPhaseRef.current !== 'none') return
      setTimeout(updateFormatPanel, 10)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [editor, updateFormatPanel, linkPhaseRef, setFormatVisible, setSurface])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (openingLinkRef.current) return
      if (surfaceRef.current === 'none' && linkPhaseRef.current === 'none') return

      const target = e.target
      if (!(target instanceof Node)) return
      if (toolbarRef.current?.contains(target)) return
      if (linkPopoverRef.current?.contains(target)) return
      if (target instanceof Element && target.closest('[data-editor-floating-ui]')) return

      closeAll()
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [closeAll, surfaceRef, linkPhaseRef, toolbarRef, linkPopoverRef])

  useLayoutEffect(() => {
    if (!toolbarOpen && !linkPopoverOpen) return
    refreshPositions()
  }, [toolbarOpen, linkPopoverOpen, linkPhase, linkSession, refreshPositions])

  useEffect(() => {
    if (!toolbarOpen && !linkPopoverOpen) return

    const handleReposition = () => {
      refreshPositions()
    }

    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
    return () => {
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [toolbarOpen, linkPopoverOpen, refreshPositions])

  const defaultToolbarStyle = {
    top: '33%',
    left: '50%',
    transform: 'translate(-50%, -100%)',
  }

  const defaultPopoverStyle = {
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, 0)',
  }

  return (
    <>
      {toolbarOpen && (
        <div
          ref={toolbarRef}
          data-editor-floating-ui="true"
          className="fixed z-50"
          style={{ ...(toolbarPosition ?? defaultToolbarStyle), position: 'fixed' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className={cn(editorFloatingShellClassName, 'px-3 py-2.5')}>
            <FloatingToolbar
              onOpenLink={handleOpenLinkCreate}
              forceLinkActive={surface === 'link'}
            />
          </div>
        </div>
      )}

      {linkPopoverOpen && linkSession && (
        <div
          ref={linkPopoverRef}
          data-editor-floating-ui="true"
          data-editor-link-card="true"
          className="fixed z-50"
          style={{ ...(linkPopoverPosition ?? defaultPopoverStyle), position: 'fixed' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {linkPhase === 'view' ? (
            <FloatingLinkPreview session={linkSession} onEdit={handleEditLink} />
          ) : (
            <FloatingLinkEditor
              session={linkSession}
              phase={linkPhase === 'create' ? 'create' : 'edit'}
            />
          )}
        </div>
      )}
    </>
  )
}
