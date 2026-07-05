import { useQuery } from '@tanstack/react-query'
import { mediaClient, type MediaLibraryResponse } from '@/lib/api/mediaClient'
import type { MediaFilterType } from '@/shared/constants'
import { queryKeys } from '@/lib/query-keys'

interface MediaListParams {
  page?: number
  perPage?: number
  type?: MediaFilterType
}

export function useMedia(params: MediaListParams = {}) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 40
  const type = params.type

  return useQuery<MediaLibraryResponse>({
    queryKey: queryKeys.media.list({ page, perPage, type }),
    queryFn: () => mediaClient.library({ page, perPage, type }),
  })
}

