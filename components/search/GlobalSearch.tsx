'use client'

import { SearchDialog } from './SearchDialog'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  return <SearchDialog variant="admin" open={open} onOpenChange={onOpenChange} />
}
