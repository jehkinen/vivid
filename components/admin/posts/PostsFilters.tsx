'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { POST_SORT_OPTIONS, POST_STATUS, POST_VISIBILITY, type PostSortOption } from '@/shared/constants'
import type { Tag } from '@/hooks/api/use-tags'
import { TagFilterCombobox } from '@/components/admin/posts/TagFilterCombobox'

type PostsFiltersProps = {
  status: string
  visibility: string
  tagId: string
  sort: PostSortOption
  tags: Tag[]
  tagPopoverOpen: boolean
  onStatusChange: (status: string) => void
  onVisibilityChange: (visibility: string) => void
  onTagIdChange: (tagId: string) => void
  onSortChange: (sort: PostSortOption) => void
  onTagPopoverOpenChange: (open: boolean) => void
}

export function PostsFilters({
  status,
  visibility,
  tagId,
  sort,
  tags,
  tagPopoverOpen,
  onStatusChange,
  onVisibilityChange,
  onTagIdChange,
  onSortChange,
  onTagPopoverOpenChange,
}: PostsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <h1 className="text-3xl font-bold">Posts</h1>
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        <Select
          value={status || 'all'}
          onValueChange={(v) => {
            const newStatus = v === 'all' ? '' : v
            onStatusChange(newStatus)
            const params = new URLSearchParams(searchParams.toString())
            if (newStatus) {
              params.set('status', newStatus)
            } else {
              params.delete('status')
            }
            router.push(`/vivid/posts?${params.toString()}`)
          }}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="All posts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All posts</SelectItem>
            <SelectItem value={POST_STATUS.DRAFT}>Draft</SelectItem>
            <SelectItem value={POST_STATUS.PUBLISHED}>Published</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={visibility || 'all'}
          onValueChange={(v) => onVisibilityChange(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue placeholder="All access" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All access</SelectItem>
            <SelectItem value={POST_VISIBILITY.PUBLIC}>Public</SelectItem>
            <SelectItem value={POST_VISIBILITY.PRIVATE}>Private</SelectItem>
          </SelectContent>
        </Select>
        <TagFilterCombobox
          tags={tags}
          tagId={tagId}
          open={tagPopoverOpen}
          onOpenChange={onTagPopoverOpenChange}
          onTagIdChange={onTagIdChange}
        />
        <Select value={sort} onValueChange={(v) => onSortChange(v as PostSortOption)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={POST_SORT_OPTIONS.NEWEST}>Newest first</SelectItem>
            <SelectItem value={POST_SORT_OPTIONS.OLDEST}>Oldest first</SelectItem>
            <SelectItem value={POST_SORT_OPTIONS.RECENTLY_UPDATED}>Recently updated</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => router.push('/vivid/editor/post/new')}
          className="cursor-pointer"
        >
          New post
        </Button>
      </div>
    </div>
  )
}
