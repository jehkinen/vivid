'use client'

import { PostSettingsProvider } from '@/lib/post-settings-context'

export default function PostEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <PostSettingsProvider>
      <div className="flex flex-col h-screen overflow-hidden">{children}</div>
    </PostSettingsProvider>
  )
}
