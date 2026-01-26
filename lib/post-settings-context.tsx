'use client'

import { createContext, useContext, useState, useMemo } from 'react'
import { useRoute } from '@/lib/route-context'
import { routes } from '@/lib/routes'

type PostSettingsContextValue = {
  open: boolean
  setOpen: (v: boolean) => void
  isPostEditor: boolean
}

const PostSettingsContext = createContext<PostSettingsContextValue | null>(null)

export function PostSettingsProvider({ children }: { children: React.ReactNode }) {
  const route = useRoute()
  const isPostEditor = route.name === routes.VIVID_EDITOR_POST_NEW.name || route.name === routes.VIVID_EDITOR_POST.name
  const [open, setOpen] = useState(false)
  const value = useMemo(
    () => ({ open: isPostEditor ? open : false, setOpen, isPostEditor }),
    [isPostEditor, open]
  )
  return (
    <PostSettingsContext.Provider value={value}>
      {children}
    </PostSettingsContext.Provider>
  )
}

export function usePostSettings() {
  const c = useContext(PostSettingsContext)
  return c ?? { open: false, setOpen: () => {}, isPostEditor: false }
}
