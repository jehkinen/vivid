'use client'

import { FileTextIcon } from '@phosphor-icons/react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export interface PostSearchItem {
  id: string
  title: string | null
  slug: string
  plaintext?: string | null
}

interface PostSearchListProps {
  query: string
  onQueryChange: (value: string) => void
  posts: PostSearchItem[]
  isLoading: boolean
  excludePostId?: string
  onSelect: (post: PostSearchItem) => void
  emptyLabel?: string
  searchingLabel?: string
  heading?: string
  placeholder?: string
}

export function PostSearchList({
  query,
  onQueryChange,
  posts,
  isLoading,
  excludePostId,
  onSelect,
  emptyLabel = 'No posts found.',
  searchingLabel = 'Searching...',
  heading = 'Posts',
  placeholder = 'Search posts...',
}: PostSearchListProps) {
  const filtered = excludePostId ? posts.filter((p) => p.id !== excludePostId) : posts
  const searchQuery = query.trim()
  const showEmpty = searchQuery && !isLoading && filtered.length === 0

  return (
    <Command shouldFilter={false} className="[&_[data-slot=command-list]]:!max-h-[min(360px,60vh)]">
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={onQueryChange}
        onClear={() => onQueryChange('')}
      />
      <CommandList>
        {isLoading && (
          <div className="p-4 text-sm text-muted-foreground">{searchingLabel}</div>
        )}
        {!isLoading && showEmpty && <CommandEmpty>{emptyLabel}</CommandEmpty>}
        {!isLoading && filtered.length > 0 && (
          <CommandGroup heading={heading}>
            {filtered.map((post) => (
              <CommandItem
                key={post.id}
                value={post.id}
                onSelect={() => onSelect(post)}
                className="cursor-pointer flex-col items-start gap-0.5 py-2"
              >
                <span className="flex items-center gap-2 w-full min-w-0">
                  <FileTextIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate font-medium">{post.title || 'Untitled'}</span>
                </span>
                {post.plaintext && (
                  <span className="pl-6 text-xs text-muted-foreground line-clamp-1 w-full">
                    {post.plaintext}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}
