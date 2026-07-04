'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode, type RefObject } from 'react'
import type { SavedLinkSelection } from '@/lib/editor/link-utils'

export type FloatingUIMode = 'none' | 'format' | 'link'

export type FloatingPanelPosition = {
  top: string
  left: string
  transform?: string
}

export type LinkSession = {
  savedSelection: SavedLinkSelection | null
  linkText: string
  linkUrl: string
  editingLinkKey: string | null
}

type EditorFloatingUIContextValue = {
  mode: FloatingUIMode
  modeRef: RefObject<FloatingUIMode>
  setMode: (mode: FloatingUIMode) => void
  panelRef: RefObject<HTMLDivElement | null>
  position: FloatingPanelPosition | null
  setPosition: (position: FloatingPanelPosition | null) => void
  linkSession: LinkSession | null
  openLinkSession: (session: LinkSession) => void
  closeLinkSession: () => void
}

const EditorFloatingUIContext = createContext<EditorFloatingUIContextValue | null>(null)

const emptyLinkSession = (): LinkSession => ({
  savedSelection: null,
  linkText: '',
  linkUrl: '',
  editingLinkKey: null,
})

export function EditorFloatingUIProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<FloatingUIMode>('none')
  const modeRef = useRef<FloatingUIMode>('none')
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<FloatingPanelPosition | null>(null)
  const [linkSession, setLinkSession] = useState<LinkSession | null>(null)

  const setMode = useCallback((next: FloatingUIMode) => {
    modeRef.current = next
    setModeState(next)
  }, [])

  const openLinkSession = useCallback(
    (session: LinkSession) => {
      setLinkSession(session)
      setMode('link')
    },
    [setMode]
  )

  const closeLinkSession = useCallback(() => {
    setLinkSession(null)
    setMode('none')
  }, [setMode])

  return (
    <EditorFloatingUIContext.Provider
      value={{
        mode,
        modeRef,
        setMode,
        panelRef,
        position,
        setPosition,
        linkSession,
        openLinkSession,
        closeLinkSession,
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

export { emptyLinkSession }
