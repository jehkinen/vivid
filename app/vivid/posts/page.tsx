'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PencilIcon, ImageIcon, LockIcon, TrashIcon } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { POST_SORT_OPTIONS, POST_STATUS, POST_VISIBILITY, type PostSortOption } from '@/shared/constants'
import { useInfinitePosts, useSoftDeletePost, useRestorePost, useHardDeletePost } from '@/hooks/api/use-posts'
import { useTags, type Tag } from '@/hooks/api/use-tags'
import { formatDateRelative } from '@/lib/utils'
import Loader from '@/components/ui/Loader'

export default function PostsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<string>('')
  const [visibility, setVisibility] = useState<string>('')
  const [tagId, setTagId] = useState<string>('')
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)
  const [sort, setSort] = useState<PostSortOption>(POST_SORT_OPTIONS.NEWEST)
  const [postToDelete, setPostToDelete] = useState<{ id: string; title: string } | null>(null)
  const [permanentDeletePost, setPermanentDeletePost] = useState<{ id: string; title: string } | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const statusParam = searchParams.get('status')
    setStatus(statusParam || '')
  }, [searchParams])

  const {
    data,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePosts({
    tagIds: tagId ? [tagId] : undefined,
    status: status || undefined,
    visibility: visibility || undefined,
    sort,
  })

  const posts = data?.pages.flatMap((p: { posts: any[] }) => p.posts) ?? []

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage()
      },
      { rootMargin: '200px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const { data: tags = [] } = useTags()
  const softDeletePost = useSoftDeletePost()
  const restorePost = useRestorePost()
  const hardDeletePost = useHardDeletePost()

  const handleDeletePost = () => {
    if (!postToDelete) return
    softDeletePost.mutate(postToDelete.id, {
      onSettled: () => setPostToDelete(null),
    })
  }

  const displayDate = (post: any) => {
    const d = post.publishedAt || post.updatedAt
    return d ? formatDateRelative(d) : '–'
  }

  const authorNames = (post: any) => {
    const list = post.authors?.map((a: any) => a.author?.name).filter(Boolean)
    return list?.length ? list.join(', ') : null
  }

  const subtitle = (post: any) => {
    if (post.deletedAt) return `Deleted ${formatDateRelative(post.deletedAt)}`
    const authors = authorNames(post)
    const date = displayDate(post)
    const hasDate = date && date !== '–'
    if (authors && hasDate) return `By ${authors} – ${date}`
    if (authors) return `By ${authors}`
    if (hasDate) return date
    return '–'
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold">Posts</h1>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <Select
            value={status || 'all'}
            onValueChange={(v) => {
              const newStatus = v === 'all' ? '' : v
              setStatus(newStatus)
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
          <Select value={visibility || 'all'} onValueChange={(v) => setVisibility(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="All access" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All access</SelectItem>
              <SelectItem value={POST_VISIBILITY.PUBLIC}>Public</SelectItem>
              <SelectItem value={POST_VISIBILITY.PRIVATE}>Private</SelectItem>
            </SelectContent>
          </Select>
          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[160px] justify-between font-normal h-9 px-3 text-sm"
              >
                <span className="truncate">
                  {tagId ? tags.find((t: Tag) => t.id === tagId)?.name ?? 'All tags' : 'All tags'}
                </span>
                <span className="shrink-0 opacity-50">⌄</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandList>
                  <CommandEmpty>No tag found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all tags"
                      onSelect={() => {
                        setTagId('')
                        setTagPopoverOpen(false)
                      }}
                    >
                      All tags
                    </CommandItem>
                    {tags.map((tag: Tag) => (
                      <CommandItem
                        key={tag.id}
                        value={`${tag.name} ${tag.slug}`}
                        onSelect={() => {
                          setTagId(tag.id)
                          setTagPopoverOpen(false)
                        }}
                      >
                        {tag.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Select value={sort} onValueChange={(v) => setSort(v as PostSortOption)}>
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

      <div className="divide-y divide-border">
        {postsLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No posts found</div>
        ) : (
          <>
            {posts.map((post: any) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
              <Link
                href={`/vivid/editor/post/${post.id}`}
                className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
              >
                <div className="w-16 h-16 shrink-0 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                  {post.featuredMedia?.url ? (
                    <img
                      src={post.featuredMedia.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={24} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    <span className="truncate">{post.title || 'Untitled'}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {subtitle(post)}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {!post.deletedAt && (
                      <>
                        <span
                          className={`text-sm ${
                            post.status === POST_STATUS.PUBLISHED
                              ? 'text-muted-foreground'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {post.status?.charAt(0).toUpperCase()}
                          {post.status?.slice(1)}
                        </span>
                        {post.visibility === POST_VISIBILITY.PRIVATE && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex shrink-0">
                                <LockIcon size={16} className="text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Private post</TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Link>
              <div className="shrink-0 flex items-center gap-2">
                {post.deletedAt ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        restorePost.mutate(post.id)
                      }}
                      disabled={restorePost.isPending}
                    >
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setPermanentDeletePost({ id: post.id, title: post.title || 'Untitled' })
                      }}
                      disabled={hardDeletePost.isPending}
                    >
                      Delete permanently
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-xl"
                      onClick={() => {
                        router.push(`/vivid/editor/post/${post.id}`)
                      }}
                      aria-label="Edit"
                    >
                      <PencilIcon className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xl"
                      onClick={() => {
                        setPostToDelete({ id: post.id, title: post.title || 'Untitled' })
                      }}
                      aria-label="Delete"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <TrashIcon className="size-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            ))}
            <div ref={loadMoreRef} className="min-h-12 flex items-center justify-center py-4">
              {isFetchingNextPage && <Loader />}
            </div>
          </>
        )}
      </div>

      <Dialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete «{postToDelete?.title ?? 'this post'}»? It will be moved to Deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={softDeletePost.isPending}
            >
              {softDeletePost.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!permanentDeletePost} onOpenChange={(open) => !open && setPermanentDeletePost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete «{permanentDeletePost?.title ?? 'this post'}»? This cannot be undone and will remove all associated media.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermanentDeletePost(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                permanentDeletePost &&
                hardDeletePost.mutate(permanentDeletePost.id, {
                  onSettled: () => setPermanentDeletePost(null),
                })
              }
              disabled={hardDeletePost.isPending}
            >
              {hardDeletePost.isPending ? 'Deleting...' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
