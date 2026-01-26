'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { FileTextIcon, TagIcon } from '@phosphor-icons/react'
import { useSearch } from '@/hooks/api/use-search'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { data: results, isLoading } = useSearch(query)

  const handleSelect = (type: 'post' | 'tag', slugOrId: string) => {
    if (type === 'post') {
      router.push(`/vivid/editor/post/${slugOrId}`)
    } else {
      router.push(`/vivid/tags/${slugOrId}`)
    }
    onOpenChange(false)
    setQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl sm:max-w-4xl w-[calc(100%-2rem)] p-0 top-6 left-1/2 -translate-x-1/2 translate-y-0"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Search posts and tags</DialogTitle>
        <Command
          shouldFilter={false}
          className="[&_[data-slot=command-list]]:!max-h-[min(400px,70vh)]"
        >
          <CommandInput
            placeholder="Search posts and tags..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoading && <div className="p-4 text-sm text-muted-foreground">Searching...</div>}
            {!isLoading && (!results || (results.posts.length === 0 && results.tags.length === 0)) && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {results && results.posts.length > 0 && (
              <CommandGroup heading="Posts">
                {results.posts.map((post) => (
                  <CommandItem
                    key={post.id}
                    onSelect={() => handleSelect('post', post.id)}
                    className="cursor-pointer"
                  >
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    {post.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results && results.tags.length > 0 && (
              <CommandGroup heading="Tags">
                {results.tags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => handleSelect('tag', tag.slug)}
                    className="cursor-pointer"
                  >
                    <TagIcon className="mr-2 h-4 w-4" />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}