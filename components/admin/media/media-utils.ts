import type { MediaItem } from '@/lib/api/mediaClient'
import { MEDIA_FILTER_TYPES, type MediaFilterType } from '@/shared/constants'

export const MEDIA_PER_PAGE = 40

export const MEDIA_STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024

export const MEDIA_TYPE_FILTERS: { value: MediaFilterType; label: string }[] = [
  { value: MEDIA_FILTER_TYPES.ALL, label: 'All' },
  { value: MEDIA_FILTER_TYPES.IMAGE, label: 'Images' },
  { value: MEDIA_FILTER_TYPES.VIDEO, label: 'Video' },
  { value: MEDIA_FILTER_TYPES.AUDIO, label: 'Audio' },
  { value: MEDIA_FILTER_TYPES.DOCUMENT, label: 'Documents' },
]

export function storedBytes(item: MediaItem): number {
  return (item.size ?? 0) + (item.conversionSize ?? 0)
}
