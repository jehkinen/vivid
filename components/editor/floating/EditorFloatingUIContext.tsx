'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode, type RefObject } from 'react'
import type { SavedLinkSelection } from '@/lib/editor/link-utils'
import type { FloatingPanelPosition } from '@/lib/editor/floating-panel-position'

export type FloatingSurface = 'none' | 'format' | 'link'
export type LinkPhase = 'none' | 'view' | 'edit' | 'create'

export type LinkSession = {
  savedSelection: SavedLinkSelection | null
  linkText: string
  linkUrl: string
  editingLinkKey: string | null
}

type EditorFloatingUIContextValue = {
  surface: FloatingSurface
  surfaceRef: RefObject<FloatingSurface>
  linkPhase: LinkPhase
  linkPhaseRef: RefObject<LinkPhase>
  toolbarRef: RefObject<HTMLDivElement | null>
  linkPopoverRef: RefObject<HTMLDivElement | null>
  toolbarPosition: FloatingPanelPosition | null
  linkPopoverPosition: FloatingPanelPosition | null
  setToolbarPosition: (position: FloatingPanelPosition | null) => void
  setLinkPopoverPosition: (position: FloatingPanelPosition | null) => void
  linkSession: LinkSession | null
  setSurface: (surface: FloatingSurface) => void
  openLinkView: (session: LinkSession) => void
  openLinkEdit: (session: LinkSession) => void
  openLinkCreate: (session: LinkSession) => void
  closeAll: () => void
  formatVisible: boolean
  setFormatVisible: (visible: boolean) => void
}

const EditorFloatingUIContext = createContext<EditorFloatingUIContextValue | null>(null)

export function EditorFloatingUIProvider({ children }: { children: ReactNode }) {
  const [surface, setSurfaceState] = useState<FloatingSurface>('none')
  const surfaceRef = useRef<FloatingSurface>('none')
  const [linkPhase, setLinkPhaseState] = useState<LinkPhase>('none')
  const linkPhaseRef = useRef<LinkPhase>('none')
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const linkPopoverRef = useRef<HTMLDivElement | null>(null)
  const [toolbarPosition, setToolbarPosition] = useState<FloatingPanelPosition | null>(null)
  const [linkPopoverPosition, setLinkPopoverPosition] = useState<FloatingPanelPosition | null>(null)
  const [linkSession, setLinkSession] = useState<LinkSession | null>(null)
  const [formatVisible, setFormatVisible] = useState(false)

  const setSurface = useCallback((next: FloatingSurface) => {
    surfaceRef.current = next
    setSurfaceState(next)
  }, [])

  const setLinkPhase = useCallback((next: LinkPhase) => {
    linkPhaseRef.current = next
    setLinkPhaseState(next)
  }, [])

  const openLinkView = useCallback(
    (session: LinkSession) => {
      setLinkSession(session)
      setLinkPhase('view')
      setSurface('link')
      setFormatVisible(false)
    },
    [setLinkPhase, setSurface]
  )

  const openLinkEdit = useCallback(
    (session: LinkSession) => {
      setLinkSession(session)
      setLinkPhase('edit')
      setSurface('link')
      setFormatVisible(false)
    },
    [setLinkPhase, setSurface]
  )

  const openLinkCreate = useCallback(
    (session: LinkSession) => {
      setLinkSession(session)
      setLinkPhase('create')
      setSurface('link')
      setFormatVisible(true)
    },
    [setLinkPhase, setSurface]
  )

  const closeAll = useCallback(() => {
    setLinkSession(null)
    setLinkPhase('none')
    setSurface('none')
    setFormatVisible(false)
  }, [setLinkPhase, setSurface])

  return (
    <EditorFloatingUIContext.Provider
      value={{
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
        setSurface,
        openLinkView,
        openLinkEdit,
        openLinkCreate,
        closeAll,
        formatVisible,
        setFormatVisible,
      }}
    >
      {children}
    </EditorFloatingUIContext.Provider>
  )
}

export function useEditorFloatingUI() {
  const ctx = useContext(EditorFloatingUIContext)
  if (!ctx) {
    throw new Error('useEditorFloatingUI must be used within EditorFloatingUIProvider')
  }
  return ctx
}
