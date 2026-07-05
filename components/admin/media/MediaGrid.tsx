'use client'

import type { MediaItem } from '@/lib/api/mediaClient'
import { formatBytes, formatDateTime } from '@/lib/utils'
import { storedBytes } from '@/components/admin/media/media-utils'
import { cn } from '@/lib/utils'

type MediaGridProps = {
  items: MediaItem[]
  isLoading: boolean
  selectedIds: Set<string>
  onToggleSelect: (itemId: string) => void
  onItemClick: (itemId: string) => void
}

export function MediaGrid({
  items,
  isLoading,
  selectedIds,
  onToggleSelect,
  onItemClick,
}: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
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
                'relative flex flex-col gap-2 rounded-md border bg-background overflow-hidden',
                isSelected ? 'ring-2 ring-foreground/25' : ''
              )}
            >
              <div className="absolute left-2 top-2 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(item.id)}
                  aria-label={`Select ${item.filename}`}
                  className="h-4 w-4 rounded border-border bg-background accent-foreground shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => onItemClick(item.id)}
                className="flex flex-col gap-2 text-left cursor-pointer"
              >
                <div className="relative w-full pb-[75%] bg-muted">
                  {isImage ? (
                    <img
                      src={item.thumbUrl || item.url}
                      alt={item.filename}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground px-2 text-center">
                      {item.mimeType}
                    </div>
                  )}
                </div>
                <figcaption className="px-2 py-1.5 border-t text-xs flex flex-col gap-0.5">
                  <span className="truncate" title={item.filename}>
                    {item.filename}
                  </span>
                  <span className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span>{formatDateTime(item.createdAt)}</span>
                    {bytes > 0 && (
                      <span className="font-mono font-semibold text-foreground tabular-nums shrink-0">
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
