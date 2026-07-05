import { apiRequest } from './request'
import type { MediaFilterType } from '@/shared/constants'

export interface MediaItem {
  id: string
  filename: string
  mimeType: string | null
  size: number | null
  conversionSize: number
  key: string
  url: string
  thumbUrl?: string | null
  createdAt: string
  mediableType?: string | null
  mediableId?: string | null
  generatedConversions?: Record<string, boolean> | null
  linkedTitle?: string | null
  linkedSlug?: string | null
  isUsed?: boolean
}

export interface MediaLibraryResponse {
  items: MediaItem[]
  hasMore: boolean
  /** Count of media rows matching the current filter (all pages). */
  total: number
  totalStored: number
}

export interface MediaLibraryParams {
  page?: number
  perPage?: number
  type?: MediaFilterType
}

export type MediaBulkDeleteResponse = {
  deleted: string[]
  blocked: Array<{ id: string; reason: string }>
}

export const mediaClient = {
  library(params: MediaLibraryParams = {}) {
    const page = params.page ?? 1
    const perPage = params.perPage ?? 40
    return apiRequest<MediaLibraryResponse>({
      path: '/api/media/library',
      query: {
        page,
        perPage,
        type: params.type,
      },
    })
  },

  bulkDelete(ids: string[]) {
    return apiRequest<MediaBulkDeleteResponse>({
      path: '/api/media/bulk-delete',
      method: 'POST',
      body: { ids },
    })
  },
}

