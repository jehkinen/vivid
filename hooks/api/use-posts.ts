'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { POST_SORT_OPTIONS, type PostSortOption } from '@/shared/constants'

interface Post {
  id: string
  title: string
  slug: string
  status: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  tags?: Array<{ tag: { id: string; name: string; slug: string; color: string | null } }>
}

interface FindPostsParams {
  search?: string
  tagIds?: string[]
  status?: string
  visibility?: string
  authorIds?: string[]
  sort?: PostSortOption
  includeDeleted?: boolean
}

async function fetchPosts(params: FindPostsParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.set('search', params.search)
  if (params.tagIds?.length) searchParams.set('tagIds', params.tagIds.join(','))
  if (params.status) searchParams.set('status', params.status)
  if (params.visibility) searchParams.set('visibility', params.visibility)
  if (params.authorIds?.length) searchParams.set('authorIds', params.authorIds.join(','))
  if (params.sort) searchParams.set('sort', params.sort)

  const response = await fetch(`/api/posts?${searchParams.toString()}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch posts')
  }
  return response.json()
}

async function fetchPost(id: string) {
  const response = await fetch(`/api/posts?id=${id}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch post')
  }
  return response.json()
}

async function createPost(data: any) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.errors?.[0]?.message || err.error || 'Failed to create post')
  }
  return response.json()
}

async function updatePost(id: string, data: any) {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.errors?.[0]?.message || err.error || 'Failed to update post')
  }
  return response.json()
}

async function softDeletePost(id: string) {
  const response = await fetch(`/api/posts/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete post')
  }
  return response.json()
}

async function restorePost(id: string) {
  const response = await fetch(`/api/posts/${id}/restore`, {
    method: 'PATCH',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to restore post')
  }
  return response.json()
}

async function hardDeletePost(id: string) {
  const response = await fetch(`/api/posts/${id}/permanent`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete post permanently')
  }
  return response.json()
}

export function usePosts(params: FindPostsParams = {}) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => fetchPosts(params),
  })
}

export function useDeletedPosts() {
  return useQuery({
    queryKey: ['posts', 'deleted'],
    queryFn: async () => {
      const response = await fetch('/api/posts?includeDeleted=true')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch deleted posts')
      }
      const allPosts = await response.json()
      return allPosts.filter((post: any) => post.deletedAt)
    },
  })
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    enabled: !!id,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPost,
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
    mutationFn: (v: { id: string; data: any; silent?: boolean }) => updatePost(v.id, v.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] })
      if (!variables.silent) toast.success('Post updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useSoftDeletePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: softDeletePost,
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
    mutationFn: restorePost,
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
    mutationFn: hardDeletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Post deleted permanently')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}