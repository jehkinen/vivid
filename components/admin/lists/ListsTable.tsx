'use client'

import type { List } from '@/hooks/api/use-lists'
import { ListCard } from '@/components/admin/lists/ListCard'

type ListsTableProps = {
  lists: List[]
}

export function ListsTable({ lists }: ListsTableProps) {
  if (lists.length === 0) {
    return (
      <p className="text-muted-foreground col-span-full">No lists yet. Create one to get started.</p>
    )
  }

  return (
    <>
      {lists.map((list) => (
        <ListCard key={list.id} list={list} />
      ))}
    </>
  )
}
