'use client'

import { Suspense } from 'react'
import HeaderSearch from './HeaderSearch'
import ReadingSettingsPanel from './ReadingSettingsPanel'
import PublicLogo from './PublicLogo'
import PublicHeaderProfile from './PublicHeaderProfile'

interface PublicLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  headerRight?: React.ReactNode
  showReadingSettingsInHeader?: boolean
}

export default function PublicLayout({ children, sidebar, headerRight, showReadingSettingsInHeader = true }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="w-full pl-[50px] pr-4 py-6 flex items-center justify-between gap-4">
          <PublicLogo />
          <Suspense fallback={<div className="h-9 w-48 sm:w-56" />}>
            <HeaderSearch />
          </Suspense>
          <div className="flex items-center gap-2 shrink-0">
            {headerRight}
            {showReadingSettingsInHeader && (
              <span className="mr-4">
                <ReadingSettingsPanel variant="popover" />
              </span>
            )}
            <PublicHeaderProfile />
          </div>
        </div>
      </header>
      <main className="w-full pl-[50px] pr-4 py-8">
        <div className="flex gap-12 w-full">
          <div className="flex-1 min-w-0 max-w-6xl">{children}</div>
          {sidebar && (
            <aside className="topics-sidebar w-72 shrink-0 ml-auto border-l border-border pl-8 pr-6 sticky top-24 self-start h-[calc(100vh-7rem)] min-h-0 overflow-y-auto overflow-x-hidden">
              {sidebar}
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}
