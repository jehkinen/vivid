import { revalidateTag } from 'next/cache'
import { CACHE_TAGS } from '@/shared/constants'

export function invalidatePublishedTagsCache() {
  revalidateTag(CACHE_TAGS.PUBLISHED_TAGS, 'max')
}
