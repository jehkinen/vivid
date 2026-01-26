'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface Tag {
  id: string
  name: string
  slug: string
  color: string | null
  description: string | null
  postCount?: number
}

async function fetchTags() {
  const response = await fetch('/api/tags')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch tags')
  }
  return response.json()
}

async function fetchTag(slug: string) {
  const response = await fetch(`/api/tags/${slug}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch tag')
  }
  return response.json()
}

async function createTag(data: { name: string; slug: string; color?: string }) {
  const response = await fetch('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create tag')
  }
  return response.json()
}

async function updateTag(slug: string, data: { name?: string; slug?: string; color?: string }) {
  const response = await fetch(`/api/tags/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update tag')
  }
  return response.json()
}

async function deleteTag(slug: string) {
  const response = await fetch(`/api/tags/${slug}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete tag')
  }
  return response.json()
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  })
}

export function useTag(slug: string) {
  return useQuery({
    queryKey: ['tag', slug],
    queryFn: () => fetchTag(slug),
    enabled: !!slug,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: any }) => updateTag(slug, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['tag', variables.slug] })
      toast.success('Tag updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}