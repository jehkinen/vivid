'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { POST_SORT_OPTIONS, TAG_DEFAULT_COLORS, type PostSortOption } from '@/shared/constants'
import {
  useInfinitePosts,
  useSoftDeletePost,
  useRestorePost,
  useHardDeletePost,
  useUpdatePost,
} from '@/hooks/api/use-posts'
import type { PostWithListRelations } from '@/lib/api/postsClient'
import { useTags, useCreateTag } from '@/hooks/api/use-tags'
import { slugify } from '@/lib/utils'
import { postTags } from '@/components/admin/posts/post-display-helpers'

export function usePostsAdminPage() {
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

  const posts = (data?.pages.flatMap((p) => p.posts) ?? []) as PostWithListRelations[]
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

  const handleDeletePost = useCallback(() => {
    if (!postToDelete) return
    softDeletePost.mutate(postToDelete.id, {
      onSettled: () => setPostToDelete(null),
    })
  }, [postToDelete, softDeletePost])

  const handleConfirmHardDelete = useCallback(() => {
    if (!permanentDeletePost) return
    hardDeletePost.mutate(permanentDeletePost.id, {
      onSettled: () => setPermanentDeletePost(null),
    })
  }, [permanentDeletePost, hardDeletePost])

  const closeQuickTagEdit = useCallback(
    (options?: { keepOpen?: boolean }) => {
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
    },
    [editingTagsPostId, editingTagsInitial, editingTagsSelected, updatePost]
  )

  const openQuickTagEdit = useCallback(
    (post: PostWithListRelations) => {
      if (editingTagsPostId && editingTagsPostId !== post.id) {
        closeQuickTagEdit({ keepOpen: true })
      }
      const ids = postTags(post).map((t) => t.id)
      setEditingTagsPostId(post.id)
      setEditingTagsSelected(ids)
      setEditingTagsInitial(ids)
    },
    [editingTagsPostId, closeQuickTagEdit]
  )

  const handleCreateTag = useCallback(
    async (name: string) => {
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
    },
    [createTag]
  )

  return {
    status,
    visibility,
    tagId,
    sort,
    tags,
    tagPopoverOpen,
    posts,
    postsLoading,
    isFetchingNextPage,
    loadMoreRef,
    postToDelete,
    permanentDeletePost,
    editingTagsPostId,
    editingTagsSelected,
    softDeletePending: softDeletePost.isPending,
    hardDeletePending: hardDeletePost.isPending,
    restorePending: restorePost.isPending,
    setStatus,
    setVisibility,
    setTagId,
    setSort,
    setTagPopoverOpen,
    setPostToDelete,
    setPermanentDeletePost,
    setEditingTagsSelected,
    handleDeletePost,
    handleConfirmHardDelete,
    closeQuickTagEdit,
    openQuickTagEdit,
    handleCreateTag,
    restorePost,
  }
}
