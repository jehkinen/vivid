import { apiRequest } from './request'
import type { TagDto, MergeTagsResult } from '@/types/tags'

export type { TagDto }

export const tagsClient = {
  list() {
    return apiRequest<TagDto[]>({
      path: '/api/tags',
    })
  },

  get(slug: string) {
    return apiRequest<TagDto>({
      path: `/api/tags/${slug}`,
    })
  },

  create(data: { name: string; slug: string; color?: string }) {
    return apiRequest<TagDto>({
      path: '/api/tags',
      method: 'POST',
      body: data,
    })
  },

  update(slug: string, data: { name?: string; slug?: string; color?: string | null; description?: string | null }) {
    return apiRequest<TagDto>({
      path: `/api/tags/${slug}`,
      method: 'PUT',
      body: data,
    })
  },

  delete(slug: string) {
    return apiRequest<void>({
      path: `/api/tags/${slug}`,
      method: 'DELETE',
    })
  },

  merge(sourceTagId: string, targetTagId: string) {
    return apiRequest<MergeTagsResult>({
      path: '/api/tags/merge',
      method: 'POST',
      body: { sourceTagId, targetTagId },
    })
  },
}

