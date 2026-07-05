'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@phosphor-icons/react'
import { slugify } from '@/lib/utils'
import { useLists, useCreateList } from '@/hooks/api/use-lists'
import { Loader } from '@/components/ui/loader'
import { ListsTable } from '@/components/admin/lists/ListsTable'
import { ListFormDialog } from '@/components/admin/lists/ListFormDialog'

export default function ListsPage() {
  const { data: lists = [], isLoading } = useLists()
  const createList = useCreateList()
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')

  const handleCreateOpen = (open: boolean) => {
    setCreateOpen(open)
    if (!open) {
      setNewTitle('')
      setNewSlug('')
    }
  }

  const handleTitleChange = (value: string) => {
    setNewTitle(value)
    setNewSlug(slugify(value || ''))
  }

  const handleCreate = () => {
    const title = newTitle.trim()
    const slug = newSlug.trim()
    if (!title || !slug) return
    createList.mutate(
      { title, slug },
      { onSuccess: () => handleCreateOpen(false) }
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Lists</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon size={18} className="mr-1.5" />
          New list
        </Button>
      </div>
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,340px))]">
        <ListsTable lists={lists} />
      </div>
      <ListFormDialog
        open={createOpen}
        title={newTitle}
        slug={newSlug}
        onOpenChange={handleCreateOpen}
        onTitleChange={handleTitleChange}
        onSlugChange={setNewSlug}
        onCreate={handleCreate}
      />
    </div>
  )
}
