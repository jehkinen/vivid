import { useQuery } from '@tanstack/react-query'

interface MediaItem {
  id: string
  filename: string
  mimeType: string
  size: number
  key: string
  url: string
  thumbUrl?: string | null
  createdAt: string
}

interface MediaListResponse {
  items: MediaItem[]
  hasMore: boolean
  totalOriginalBytes: number
}

interface MediaListParams {
  page?: number
  perPage?: number
  type?: string
}

export function useMedia(params: MediaListParams = {}) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 40
  const type = params.type ?? 'all'

  const search = new URLSearchParams()
  search.set('page', String(page))
  search.set('perPage', String(perPage))
  if (type && type !== 'all') {
    search.set('type', type)
  }

  return useQuery<MediaListResponse>({
    queryKey: ['media', { page, perPage, type }],
    queryFn: async () => {
      const res = await fetch(`/api/media/library?${search.toString()}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to fetch media')
      }
      return res.json()
    },
  })
}

