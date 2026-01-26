'use client'

import { createContext, useContext } from 'react'

const MediableContext = createContext<{
  mediableType?: string
  mediableId?: string
} | null>(null)

export function MediableProvider({
  children,
  mediableType,
  mediableId,
}: {
  children: React.ReactNode
  mediableType?: string
  mediableId?: string
}) {
  return (
    <MediableContext.Provider value={{ mediableType, mediableId }}>
      {children}
    </MediableContext.Provider>
  )
}

export function useMediable() {
  const c = useContext(MediableContext)
  return c ?? { mediableType: undefined, mediableId: undefined }
}
