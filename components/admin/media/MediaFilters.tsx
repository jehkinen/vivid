'use client'

import { Button } from '@/components/ui/button'
import type { MediaFilterType } from '@/shared/constants'
import { MEDIA_TYPE_FILTERS } from '@/components/admin/media/media-utils'

type MediaFiltersProps = {
  type: MediaFilterType
  onTypeChange: (type: MediaFilterType) => void
}

export function MediaFilters({ type, onTypeChange }: MediaFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {MEDIA_TYPE_FILTERS.map((t) => (
        <Button
          key={t.value}
          type="button"
          variant={type === t.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange(t.value)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  )
}
