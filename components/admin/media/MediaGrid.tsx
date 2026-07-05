'use client'

import type { MouseEvent } from 'react'
import type { MediaItem } from '@/lib/api/mediaClient'
import { formatBytes, formatDateTime, cn } from '@/lib/utils'
import { storedBytes } from '@/components/admin/media/media-utils'
import {
  type MediaSelectionModifiers,
  mediaSelectionModifiers,
} from '@/components/admin/media/media-selection'
import { CheckCircleIcon } from '@phosphor-icons/react'

type MediaGridProps = {
  items: MediaItem[]
  isLoading: boolean
  selectedIds: Set<string>
  onItemSelect: (itemId: string, modifiers: MediaSelectionModifiers) => void
  onItemPreview: (itemId: string) => void
}

function handleSelectionClick(
  event: MouseEvent,
  itemId: string,
  onItemSelect: MediaGridProps['onItemSelect']
) {
  event.stopPropagation()
  onItemSelect(itemId, mediaSelectionModifiers(event))
}

export function MediaGrid({
  items,
  isLoading,
  selectedIds,
  onItemSelect,
  onItemPreview,
}: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 select-none">
      {isLoading && items.length === 0 ? (
        <div className="col-span-full text-sm text-muted-foreground">Loading media…</div>
      ) : items.length === 0 ? (
        <div className="col-span-full text-sm text-muted-foreground">No media files found.</div>
      ) : (
        items.map((item) => {
          const mime = item.mimeType || ''
          const isImage = mime.startsWith('image/')
          const bytes = storedBytes(item)
          const isSelected = selectedIds.has(item.id)
          return (
            <figure
              key={item.id}
              className={cn(
                'relative flex flex-col gap-2 overflow-hidden rounded-md border bg-background transition-colors',
                isSelected
                  ? 'border-primary/50 bg-primary/10 ring-2 ring-primary/25'
                  : 'border-border'
              )}
            >
              <button
                type="button"
                aria-label={`Select ${item.filename}`}
                aria-pressed={isSelected}
                onClick={(event) => handleSelectionClick(event, item.id, onItemSelect)}
                className="absolute left-1.5 top-1.5 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-background/80"
              >
                {isSelected ? (
                  <CheckCircleIcon weight="fill" className="h-5 w-5 text-primary drop-shadow-sm" aria-hidden />
                ) : (
                  <span className="block h-5 w-5 rounded-full border border-border/80 bg-background/90 shadow-sm" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={() => onItemPreview(item.id)}
                className="flex cursor-pointer flex-col gap-2 text-left transition-colors hover:bg-muted/20"
              >
                <div className="relative w-full pb-[75%] bg-muted">
                  {isImage ? (
                    <img
                      src={item.thumbUrl || item.url}
                      alt={item.filename}
                      className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-muted-foreground">
                      {item.mimeType}
                    </div>
                  )}
                </div>
                <figcaption className="flex flex-col gap-0.5 border-t px-2 py-1.5 text-xs">
                  <span className="truncate" title={item.filename}>
                    {item.filename}
                  </span>
                  <span className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span>{formatDateTime(item.createdAt)}</span>
                    {bytes > 0 && (
                      <span className="shrink-0 font-mono font-semibold tabular-nums text-foreground">
                        {formatBytes(bytes)}
                      </span>
                    )}
                  </span>
                </figcaption>
              </button>
            </figure>
          )
        })
      )}
    </div>
  )
}
