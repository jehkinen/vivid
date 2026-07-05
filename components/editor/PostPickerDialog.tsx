'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PostSearchList, type PostSearchItem } from '@/components/search/PostSearchList'
import { usePosts } from '@/hooks/api/use-posts'
import { POST_SORT_OPTIONS } from '@/shared/constants'

interface PostPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  excludePostId?: string
  onSelect: (post: PostSearchItem) => void
}

export function PostPickerDialog({
  open,
  onOpenChange,
  excludePostId,
  onSelect,
}: PostPickerDialogProps) {
  const [query, setQuery] = useState('')
  const trimmed = query.trim()

  const { data, isLoading } = usePosts({
    search: trimmed || undefined,
    sort: POST_SORT_OPTIONS.RECENTLY_UPDATED,
    limit: 10,
    offset: 0,
  })

  const posts: PostSearchItem[] = (data?.posts ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    plaintext: p.plaintext,
  }))

  const handleSelect = (post: PostSearchItem) => {
    onSelect(post)
    onOpenChange(false)
    setQuery('')
  }

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) setQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined} className="p-0 gap-0 max-w-lg">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle>Link to post</DialogTitle>
        </DialogHeader>
        <div className="p-2 pt-0">
          <PostSearchList
            query={query}
            onQueryChange={setQuery}
            posts={posts}
            isLoading={isLoading}
            excludePostId={excludePostId}
            onSelect={handleSelect}
            placeholder="Search or pick a recent post..."
            heading={trimmed ? 'Results' : 'Recent'}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
