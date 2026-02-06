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
import { Feather, ImageIcon, LockIcon, TrashIcon, PencilSimple, Eye, Check } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { POST_SORT_OPTIONS, POST_STATUS, POST_VISIBILITY, TAG_DEFAULT_COLORS, type PostSortOption } from '@/shared/constants'
import { useInfinitePosts, useSoftDeletePost, useRestorePost, useHardDeletePost, useUpdatePost } from '@/hooks/api/use-posts'
import { useTags, useCreateTag, type Tag } from '@/hooks/api/use-tags'
import { formatDateRelative, formatTime, slugify } from '@/lib/utils'
import { TagInput } from '@/components/ui/tag-input'
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
  const [editingTagsPostId, setEditingTagsPostId] = useState<string | null>(null)
  const [editingTagsSelected, setEditingTagsSelected] = useState<string[]>([])
  const [editingTagsInitial, setEditingTagsInitial] = useState<string[]>([])
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const hasScrolledToReturnRef = useRef<string | null>(null)

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
  const returnToId = searchParams.get('returnTo')

  useEffect(() => {
    if (!returnToId || posts.length === 0) return
    if (hasScrolledToReturnRef.current === returnToId) return
    const el = document.querySelector(`[data-post-id="${returnToId}"]`)
    if (!el) return
    hasScrolledToReturnRef.current = returnToId
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => cancelAnimationFrame(id)
  }, [returnToId, posts.length])

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
  const updatePost = useUpdatePost()
  const createTag = useCreateTag()

  const handleDeletePost = () => {
    if (!postToDelete) return
    softDeletePost.mutate(postToDelete.id, {
      onSettled: () => setPostToDelete(null),
    })
  }

  const displayDate = (post: any) => {
    const d = post.publishedAt || post.updatedAt
    if (!d) return '–'
    return `${formatDateRelative(d)}, ${formatTime(d)}`
  }

  const authorNames = (post: any) => {
    const list = post.authors?.map((a: any) => a.author?.name).filter(Boolean)
    return list?.length ? list.join(', ') : null
  }

  const subtitle = (post: any) => {
    if (post.deletedAt) return `Deleted ${formatDateRelative(post.deletedAt)}, ${formatTime(post.deletedAt)}`
    const authors = authorNames(post)
    const date = displayDate(post)
    const hasDate = date && date !== '–'
    if (authors && hasDate) return `By ${authors} – ${date}`
    if (authors) return `By ${authors}`
    if (hasDate) return date
    return '–'
  }

  const postTags = (post: any) => {
    const list = post.tags?.map((t: any) => t.tag).filter(Boolean) ?? []
    return list
  }

  const closeQuickTagEdit = (options?: { keepOpen?: boolean }) => {
    if (!editingTagsPostId) return
    const keepOpen = options?.keepOpen ?? false
    const changed =
      editingTagsSelected.length !== editingTagsInitial.length ||
      editingTagsSelected.some((id) => !editingTagsInitial.includes(id))
    if (changed) {
      updatePost.mutate(
        {
          id: editingTagsPostId,
          data: { tagIds: editingTagsSelected },
          silent: true,
        },
        { onSettled: () => !keepOpen && setEditingTagsPostId(null) }
      )
    } else if (!keepOpen) {
      setEditingTagsPostId(null)
    }
  }

  const openQuickTagEdit = (post: any) => {
    if (editingTagsPostId && editingTagsPostId !== post.id) {
      closeQuickTagEdit({ keepOpen: true })
    }
    const ids = postTags(post).map((t: any) => t.id)
    setEditingTagsPostId(post.id)
    setEditingTagsSelected(ids)
    setEditingTagsInitial(ids)
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
                data-post-id={post.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
              <div
                className="w-16 h-16 shrink-0 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden relative group"
                {...(!post.deletedAt && post.slug ? { 'data-vivid-pointer': '' } : {})}
              >
                {post.featuredMedia?.url ? (
                  <img
                    src={post.featuredMedia.url}
                    alt=""
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <ImageIcon size={24} className="text-muted-foreground pointer-events-none" />
                )}
                {!post.deletedAt && post.slug ? (
                  <Link
                    href={`/${post.slug}?preview=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    data-vivid-pointer
                    aria-label="Preview"
                  >
                    <Eye className="size-6 text-white pointer-events-none" />
                  </Link>
                ) : null}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <Link
                  href={`/vivid/editor/post/${post.id}`}
                  className="min-w-0 cursor-pointer"
                >
                  <div className="font-medium truncate">
                    <span className="truncate">{post.title || 'Untitled'}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {subtitle(post)}
                  </div>
                </Link>
                {!post.deletedAt && (
                  <div
                    className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {editingTagsPostId === post.id ? (
                      <>
                        <TagInput
                          options={[...tags]
                            .sort((a: Tag, b: Tag) => (b.postCount ?? 0) - (a.postCount ?? 0))
                            .map((t: Tag) => ({ value: t.id, label: t.name, color: t.color }))}
                          selected={editingTagsSelected}
                          onSelectedChange={setEditingTagsSelected}
                          placeholder="Type to add tag..."
                          creatable
                          onCreate={async (name) => {
                            try {
                              const tag = await createTag.mutateAsync({
                                name,
                                slug: slugify(name),
                                color: TAG_DEFAULT_COLORS[Math.floor(Math.random() * TAG_DEFAULT_COLORS.length)],
                              })
                              return { value: tag.id, label: tag.name, color: tag.color }
                            } catch {
                              return null
                            }
                          }}
                          className="min-w-[200px]"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => closeQuickTagEdit()}
                        >
                          <Check className="size-4" weight="bold" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {postTags(post).length > 0 ? (
                          postTags(post).map((tag: any, i: number) => (
                            <span key={tag.id} className="inline-flex items-center gap-1">
                              {i > 0 && <span className="text-border select-none">·</span>}
                              <Link
                                href={`/tag/${tag.slug}`}
                                className="inline-flex items-center gap-1.5 italic rounded px-2 py-1 -mx-0.5 bg-muted/30 hover:bg-muted/80 hover:text-foreground hover:font-normal text-muted-foreground transition-colors"
                                data-vivid-pointer
                              >
                                {tag.color && (
                                  <span
                                    className="shrink-0 w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                    aria-hidden
                                    suppressHydrationWarning
                                  />
                                )}
                                {tag.name}
                              </Link>
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground italic">No tags</span>
                        )}
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => openQuickTagEdit(post)}
                          aria-label="Edit tags"
                        >
                          <PencilSimple className="size-4" weight="bold" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {!post.deletedAt && (
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 shrink-0">
                  {post.status === POST_STATUS.DRAFT && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex shrink-0 text-[#3eb8b5]">
                          <Feather size={18} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Draft</TooltipContent>
                    </Tooltip>
                  )}
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
                </div>
              )}
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
                      className="rounded-md text-muted-foreground hover:bg-muted/70 hover:text-destructive"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPostToDelete({ id: post.id, title: post.title || 'Untitled' })
                      }}
                      aria-label="Delete"
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
