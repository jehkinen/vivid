'use client'

import { Button } from '@/components/ui/button'

type MediaBulkToolbarProps = {
  selectedCount: number
  pageCount: number
  allPageSelected: boolean
  isDeleting: boolean
  onToggleSelectAll: () => void
  onClearSelection: () => void
  onDelete: () => void
}

export function MediaBulkToolbar({
  selectedCount,
  pageCount,
  allPageSelected,
  isDeleting,
  onToggleSelectAll,
  onClearSelection,
  onDelete,
}: MediaBulkToolbarProps) {
  if (pageCount === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={allPageSelected}
          onChange={onToggleSelectAll}
          className="h-4 w-4 rounded border-border accent-foreground"
        />
        Select page
      </label>
      {selectedCount > 0 ? (
        <>
          <span className="text-sm text-muted-foreground tabular-nums">{selectedCount} selected</span>
          <Button type="button" size="sm" variant="outline" onClick={onClearSelection} disabled={isDeleting}>
            Clear
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </>
      ) : null}
    </div>
  )
}
