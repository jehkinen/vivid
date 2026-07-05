'use client'

import { Button } from '@/components/ui/button'
import { formatBytes } from '@/lib/utils'
import { GridFourIcon, RowsIcon } from '@phosphor-icons/react'

type MediaPageHeaderProps = {
  view: 'grid' | 'list'
  isLoading: boolean
  totalCount: number
  totalBytes: number
  usageRatio: number
  storageLimitBytes: number
  onViewChange: (view: 'grid' | 'list') => void
}

export function MediaPageHeader({
  view,
  isLoading,
  totalCount,
  totalBytes,
  usageRatio,
  storageLimitBytes,
  onViewChange,
}: MediaPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Media</h1>
        <p className="text-sm text-muted-foreground">
          Library and storage usage. Sizes include generated thumbnails when present.
        </p>
        {!isLoading && (
          <p className="mt-2 text-sm font-medium text-foreground">
            <span className="tabular-nums">{totalCount}</span> file{totalCount === 1 ? '' : 's'} in this filter
            {totalBytes > 0 && (
              <>
                {' · '}
                <span className="tabular-nums">{formatBytes(totalBytes)}</span> total stored
              </>
            )}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:items-end">
        <div className="flex rounded-md border p-0.5 bg-muted/40">
          <Button
            type="button"
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-1.5"
            onClick={() => onViewChange('list')}
          >
            <RowsIcon size={16} aria-hidden />
            List
          </Button>
          <Button
            type="button"
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-1.5"
            onClick={() => onViewChange('grid')}
          >
            <GridFourIcon size={16} aria-hidden />
            Grid
          </Button>
        </div>
        <div className="w-full max-w-xs space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${usageRatio * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span className="tabular-nums">{formatBytes(totalBytes)} used</span>
            <span className="tabular-nums">{formatBytes(storageLimitBytes)} quota</span>
          </div>
        </div>
      </div>
    </div>
  )
}
