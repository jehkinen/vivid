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

type MediaListViewProps = {
  items: MediaItem[]
  isLoading: boolean
  selectedIds: Set<string>
  onItemSelect: (itemId: string, modifiers: MediaSelectionModifiers) => void
  onItemPreview: (itemId: string) => void
}

function handleSelectionClick(
  event: MouseEvent,
  itemId: string,
  onItemSelect: MediaListViewProps['onItemSelect']
) {
  event.stopPropagation()
  onItemSelect(itemId, mediaSelectionModifiers(event))
}

export function MediaListView({
  items,
  isLoading,
  selectedIds,
  onItemSelect,
  onItemPreview,
}: MediaListViewProps) {
  return (
    <div className="flex flex-col select-none">
      <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <div className="w-8 shrink-0" aria-hidden />
        <div className="w-12 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">File</div>
        <div className="w-28 shrink-0 text-right">Size</div>
        <div className="hidden w-40 shrink-0 text-right sm:block">Uploaded</div>
      </div>
      {isLoading && items.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">Loading media…</div>
      ) : items.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">No media files found.</div>
      ) : (
        items.map((item) => {
          const mime = item.mimeType || ''
          const isImage = mime.startsWith('image/')
          const bytes = storedBytes(item)
          const isSelected = selectedIds.has(item.id)
          return (
            <div
              key={item.id}
              className={cn(
                'flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors last:border-b-0',
                isSelected ? 'bg-primary/10' : ''
              )}
            >
              <button
                type="button"
                aria-label={`Select ${item.filename}`}
                aria-pressed={isSelected}
                onClick={(event) => handleSelectionClick(event, item.id, onItemSelect)}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-muted/60"
              >
                {isSelected ? (
                  <CheckCircleIcon weight="fill" className="h-5 w-5 text-primary" aria-hidden />
                ) : (
                  <span className="h-5 w-5 rounded-full border border-border/80 bg-background" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={() => onItemPreview(item.id)}
                className={cn(
                  'flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md text-left transition-colors',
                  isSelected ? 'hover:bg-primary/15' : 'hover:bg-muted/40'
                )}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {isImage ? (
                    <img
                      src={item.thumbUrl || item.url}
                      alt=""
                      className="h-full w-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-muted-foreground leading-tight">
                      {mime.slice(0, 12) || '—'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-sm" title={item.filename}>
                    {item.filename}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                    {item.linkedTitle ? (
                      <span className={item.isUsed === false ? 'text-amber-600 dark:text-amber-500' : undefined}>
                        {item.linkedTitle}
                      </span>
                    ) : (
                      mime || 'unknown type'
                    )}
                    {(item.conversionSize ?? 0) > 0 && item.size != null && (
                      <span className="hidden sm:inline">
                        {' · '}
                        orig {formatBytes(item.size)} + conv {formatBytes(item.conversionSize ?? 0)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-28 shrink-0 text-right">
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {bytes > 0 ? formatBytes(bytes) : '—'}
                  </span>
                </div>
                <div className="hidden w-40 shrink-0 text-right text-xs text-muted-foreground sm:block">
                  {formatDateTime(item.createdAt)}
                </div>
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
