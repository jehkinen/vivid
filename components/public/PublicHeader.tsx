'use client'

import { HeaderSearch } from './HeaderSearch'
import { ReadingSettingsPanel } from './ReadingSettingsPanel'
import { PublicLogo } from './PublicLogo'
import { PublicHeaderProfile } from './PublicHeaderProfile'

interface PublicHeaderProps {
  headerRight?: React.ReactNode
  showReadingSettingsInHeader?: boolean
}

export function PublicHeader({
  headerRight,
  showReadingSettingsInHeader = true,
}: PublicHeaderProps) {
  return (
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
  )
}
