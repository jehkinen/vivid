'use client'

import { Button } from '@/components/ui/button'

type MediaPaginationProps = {
  page: number
  isFetching: boolean
  hasMore: boolean
  onPrev: () => void
  onNext: () => void
}

export function MediaPagination({
  page,
  isFetching,
  hasMore,
  onPrev,
  onNext,
}: MediaPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page === 1 || isFetching}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasMore || isFetching}>
          Next
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {page}
          {isFetching && ' · Updating…'}
        </span>
      </div>
    </div>
  )
}
