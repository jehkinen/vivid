import { apiRequest } from './request'
import type { MediaFilterType } from '@/shared/constants'

export interface MediaItem {
  id: string
  filename: string
  mimeType: string | null
  size: number | null
  key: string
  url: string
  thumbUrl?: string | null
  createdAt: string
}

export interface MediaLibraryResponse {
  items: MediaItem[]
  hasMore: boolean
  totalOriginalBytes: number
}

export interface MediaLibraryParams {
  page?: number
  perPage?: number
  type?: MediaFilterType
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
}

