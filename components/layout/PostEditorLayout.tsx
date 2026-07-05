'use client'

import { PostSettingsProvider } from '@/components/providers/PostSettingsProvider'

export function PostEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <PostSettingsProvider>
      <div className="flex flex-col h-screen overflow-hidden">{children}</div>
    </PostSettingsProvider>
  )
}
