import { apiRequest } from './request'
import { POST_SORT_OPTIONS, type PostSortOption } from '@/shared/constants'
import type {
  PostSummary,
  PostWithListRelations,
  PostListResponse,
  PostDetail,
} from '@/types/posts'
import type { GenerateCoverRequest, GenerateCoverResponse } from '@/types/ai'

export type { PostSummary, PostWithListRelations, PostListResponse, PostDetail }

export interface FindPostsParams {
  search?: string
  tagIds?: string[]
  status?: string
  visibility?: string
  authorIds?: string[]
  sort?: PostSortOption
  includeDeleted?: boolean
  limit?: number
  offset?: number
}

export const postsClient = {
  list(params: FindPostsParams = {}) {
    return apiRequest<PostListResponse>({
      path: '/api/posts',
      query: {
        search: params.search,
        tagIds: params.tagIds && params.tagIds.length ? params.tagIds.join(',') : undefined,
        status: params.status,
        visibility: params.visibility,
        authorIds: params.authorIds && params.authorIds.length ? params.authorIds.join(',') : undefined,
        sort: params.sort || POST_SORT_OPTIONS.NEWEST,
        includeDeleted: params.includeDeleted,
        limit: params.limit,
        offset: params.offset,
      },
    })
  },

  get(id: string, options?: { includeDeleted?: boolean }) {
    return apiRequest<PostDetail>({
      path: '/api/posts',
      query: {
        id,
        includeDeleted: options?.includeDeleted,
      },
    })
  },

  create(data: Record<string, unknown>) {
    return apiRequest<{ id: string }>({
      path: '/api/posts',
      method: 'POST',
      body: data,
    })
  },

  update(id: string, data: Record<string, unknown>) {
    return apiRequest<Record<string, unknown>>({
      path: `/api/posts/${id}`,
      method: 'PUT',
      body: data,
    })
  },

  softDelete(id: string) {
    return apiRequest<Record<string, unknown>>({
      path: `/api/posts/${id}`,
      method: 'DELETE',
    })
  },

  restore(id: string) {
    return apiRequest<Record<string, unknown>>({
      path: `/api/posts/${id}/restore`,
      method: 'PATCH',
    })
  },

  hardDelete(id: string) {
    return apiRequest<Record<string, unknown>>({
      path: `/api/posts/${id}/permanent`,
      method: 'DELETE',
    })
  },

  listDeleted(limit = 500) {
    return apiRequest<PostListResponse>({
      path: '/api/posts',
      query: {
        includeDeleted: true,
        limit,
      },
    })
  },

  generateCover(postId: string, body: GenerateCoverRequest) {
    return apiRequest<GenerateCoverResponse>({
      path: `/api/posts/${postId}/generate-cover`,
      method: 'POST',
      body,
    })
  },
}

