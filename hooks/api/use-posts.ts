'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { postsClient, type FindPostsParams, type PostListResponse, type PostSummary } from '@/lib/api/postsClient'

const POSTS_PAGE_SIZE = 20

export function usePosts(params: FindPostsParams = {}) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => postsClient.list(params),
  })
}

export function useInfinitePosts(params: Omit<FindPostsParams, 'limit' | 'offset'> = {}) {
  return useInfiniteQuery({
    queryKey: ['posts', 'infinite', params],
    queryFn: ({ pageParam }) =>
      postsClient.list({
        ...params,
        limit: POSTS_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: PostListResponse, allPages) => {
      if (!lastPage?.hasMore) return undefined
      return allPages.length * POSTS_PAGE_SIZE
    },
  })
}

export function useDeletedPosts() {
  return useQuery({
    queryKey: ['posts', 'deleted'],
    queryFn: async () => {
      const result = await postsClient.listDeleted()
      const list = result.posts ?? []
      return list.filter((post: PostSummary) => post.deletedAt)
    },
  })
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => postsClient.get(id, { includeDeleted: true }),
    enabled: !!id,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: postsClient.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Post created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; data: Record<string, unknown>; silent?: boolean }) =>
      postsClient.update(v.id, v.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useSoftDeletePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: postsClient.softDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Post deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useRestorePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: postsClient.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Post restored successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useHardDeletePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: postsClient.hardDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Post deleted permanently')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}