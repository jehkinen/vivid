'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { tagsClient, type TagDto } from '@/lib/api/tagsClient'

export interface Tag extends TagDto {}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsClient.list(),
  })
}

export function useTag(slug: string) {
  return useQuery({
    queryKey: ['tag', slug],
    queryFn: () => tagsClient.get(slug),
    enabled: !!slug,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: tagsClient.create,
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
    mutationFn: ({ slug, data }: { slug: string; data: any }) => tagsClient.update(slug, data),
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
    mutationFn: tagsClient.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useMergeTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sourceTagId, targetTagId }: { sourceTagId: string; targetTagId: string }) =>
      tagsClient.merge(sourceTagId, targetTagId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      if (data?.targetTagSlug) {
        queryClient.invalidateQueries({ queryKey: ['tag', data.targetTagSlug] })
      }
      toast.success('Tag merged successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}