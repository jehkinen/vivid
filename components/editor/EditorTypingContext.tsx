'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

const EditorTypingContext = createContext<{
  isTyping: boolean
  setTyping: () => void
} | null>(null)

export function EditorTypingProvider({ children }: { children: React.ReactNode }) {
  const [isTyping, setIsTyping] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setTyping = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setIsTyping(true)
    timer.current = setTimeout(() => {
      setIsTyping(false)
      timer.current = null
    }, 600)
  }, [])
  return (
    <EditorTypingContext.Provider value={{ isTyping, setTyping }}>
      {children}
    </EditorTypingContext.Provider>
  )
}

export function useEditorTyping() {
  const c = useContext(EditorTypingContext)
  return c ?? { isTyping: false, setTyping: () => {} }
}
