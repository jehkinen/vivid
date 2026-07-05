'use client'

import { useState, useEffect, useRef } from 'react'
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
import { FileTextIcon, TagIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useSearch } from '@/hooks/api/use-search'
import { usePublicSearchResults } from '@/hooks/api/use-public-search-results'

const DEBOUNCE_MS = 300

const LABELS = {
  admin: {
    placeholder: 'Search posts and tags...',
    searching: 'Searching...',
    empty: 'No results found.',
    postsHeading: 'Posts',
    tagsHeading: 'Tags',
    title: 'Search posts and tags',
  },
  public: {
    placeholder: 'Поиск по записям и тегам',
    searching: 'Поиск...',
    empty: 'Ничего не найдено.',
    postsHeading: 'ЗАПИСИ',
    tagsHeading: 'ТЕГИ',
    title: 'Поиск по записям и тегам',
  },
} as const

interface SearchDialogProps {
  variant: 'admin' | 'public'
  open: boolean
  onOpenChange: (open: boolean) => void
  showTrigger?: boolean
}

function SearchDialogAdmin({
  open,
  onOpenChange,
  showTrigger = false,
}: Omit<SearchDialogProps, 'variant'>) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { data: adminResults, isLoading: adminLoading } = useSearch(query.trim())
  const posts = adminResults?.posts ?? []
  const tags = adminResults?.tags ?? []
  const labels = LABELS.admin

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(true)
      }
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpenChange])

  const handleSelectPost = (post: { id: string; title: string; slug: string }) => {
    router.push(`/vivid/editor/post/${post.id}`)
    onOpenChange(false)
    setQuery('')
  }

  const handleSelectTag = (slug: string) => {
    router.push(`/vivid/tags/${slug}`)
    onOpenChange(false)
    setQuery('')
  }

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) setQuery('')
  }

  const searchQuery = query.trim()
  const showEmpty = searchQuery && !adminLoading && posts.length === 0 && tags.length === 0

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-1.5 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Search (⌘K)"
        >
          <MagnifyingGlassIcon size={18} />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium opacity-80 sm:inline-flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            'max-w-xl w-[calc(100%-2rem)] p-0 left-1/2 -translate-x-1/2 translate-y-0',
            'top-6'
          )}
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{labels.title}</DialogTitle>
          <Command shouldFilter={false} className="[&_[data-slot=command-list]]:!max-h-[min(400px,70vh)]">
            <CommandInput
              placeholder={labels.placeholder}
              value={query}
              onValueChange={setQuery}
              onClear={() => setQuery('')}
            />
            <CommandList>
              {adminLoading && (
                <div className="p-4 text-sm text-muted-foreground">{labels.searching}</div>
              )}
              {!adminLoading && showEmpty && <CommandEmpty>{labels.empty}</CommandEmpty>}
              {!adminLoading && posts.length > 0 && (
                <CommandGroup heading={labels.postsHeading}>
                  {posts.map((post) => (
                    <CommandItem
                      key={post.id}
                      onSelect={() => handleSelectPost(post)}
                      className="cursor-pointer"
                    >
                      <FileTextIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{post.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!adminLoading && tags.length > 0 && (
                <CommandGroup heading={labels.tagsHeading}>
                  {tags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleSelectTag(tag.slug)}
                      className="cursor-pointer"
                    >
                      <TagIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{tag.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SearchDialogPublic({
  open,
  onOpenChange,
  showTrigger = false,
}: Omit<SearchDialogProps, 'variant'>) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { posts, tags, isLoading } = usePublicSearchResults(debouncedQuery)
  const labels = LABELS.public

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(true)
      }
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpenChange])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) {
      setDebouncedQuery('')
      return
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setDebouncedQuery(query.trim())
    }, DEBOUNCE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const handleSelectPost = (post: { id: string; title: string; slug: string }) => {
    router.push(`/${post.slug}`)
    onOpenChange(false)
    setQuery('')
  }

  const handleSelectTag = (slug: string) => {
    router.push(`/tag/${slug}`)
    onOpenChange(false)
    setQuery('')
  }

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) setQuery('')
  }

  const searchQuery = debouncedQuery
  const showEmpty = searchQuery && !isLoading && posts.length === 0 && tags.length === 0

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-1.5 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Поиск (⌘K)"
        >
          <MagnifyingGlassIcon size={18} />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium opacity-80 sm:inline-flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-xl w-[calc(100%-2rem)] p-0 left-1/2 top-[70px] -translate-x-1/2 translate-y-0"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{labels.title}</DialogTitle>
          <Command
            shouldFilter={false}
            className="[&_[data-slot=command-list]]:!max-h-[min(400px,70vh)] [&_[data-slot=command-input-wrapper]]:h-14 [&_[data-slot=command-input-wrapper]]:px-4 [&_[data-slot=command-input]]:h-12 [&_[data-slot=command-input]]:text-base [&_[data-slot=command-input]]:py-3"
          >
            <CommandInput
              placeholder={labels.placeholder}
              value={query}
              onValueChange={setQuery}
              onClear={() => setQuery('')}
              className="h-12 text-base"
            />
            <CommandList>
              {isLoading && (
                <div className="p-4 text-sm text-muted-foreground">{labels.searching}</div>
              )}
              {!isLoading && showEmpty && <CommandEmpty>{labels.empty}</CommandEmpty>}
              {!isLoading && posts.length > 0 && (
                <CommandGroup heading={labels.postsHeading}>
                  {posts.map((post) => (
                    <CommandItem
                      key={post.id}
                      onSelect={() => handleSelectPost(post)}
                      className="cursor-pointer"
                    >
                      <FileTextIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{post.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!isLoading && tags.length > 0 && (
                <CommandGroup heading={labels.tagsHeading}>
                  {tags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleSelectTag(tag.slug)}
                      className="cursor-pointer"
                    >
                      <TagIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{tag.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function SearchDialog({ variant, ...props }: SearchDialogProps) {
  if (variant === 'public') {
    return <SearchDialogPublic {...props} />
  }
  return <SearchDialogAdmin {...props} />
}
