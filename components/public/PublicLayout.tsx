'use client'

import { HeaderSearch } from './HeaderSearch'
import { ReadingSettingsPanel } from './ReadingSettingsPanel'
import { PublicLogo } from './PublicLogo'
import { PublicHeaderProfile } from './PublicHeaderProfile'

interface PublicLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  headerRight?: React.ReactNode
  showReadingSettingsInHeader?: boolean
}

export function PublicLayout({ children, sidebar, headerRight, showReadingSettingsInHeader = true }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-background">
          <div className="flex w-full items-center justify-between gap-4 pl-[50px] pr-4 py-6">
            <PublicLogo />
            <HeaderSearch />
            <div className="flex shrink-0 items-center gap-2">
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
          <div className="flex w-full gap-12">
            <div className="min-w-0 max-w-6xl flex-1">{children}</div>
            {sidebar && (
              <aside className="topics-sidebar sticky top-24 ml-auto h-[calc(100vh-7rem)] min-h-0 w-72 shrink-0 self-start overflow-y-auto overflow-x-hidden border-l border-border pl-8 pr-6">
                {sidebar}
              </aside>
            )}
          </div>
        </main>
    </div>
  )
}
