'use client'

import { useState, useMemo, useCallback } from 'react'
import { useMedia } from '@/hooks/api/use-media'
import type { LightboxSlide } from '@/components/ui/lightbox'
import { MEDIA_FILTER_TYPES, type MediaFilterType } from '@/shared/constants'
import {
  MEDIA_PER_PAGE,
  MEDIA_STORAGE_LIMIT_BYTES,
  storedBytes,
} from '@/components/admin/media/media-utils'

export function useMediaAdminPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState<MediaFilterType>(MEDIA_FILTER_TYPES.ALL)
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [lightbox, setLightbox] = useState<{
    images: LightboxSlide[]
    index: number
  } | null>(null)
  const { data, isLoading, isFetching } = useMedia({ page, perPage: MEDIA_PER_PAGE, type })

  const hasMore = data?.hasMore ?? false
  const items = data?.items ?? []
  const totalBytes = data?.totalStored ?? 0
  const totalCount = data?.total ?? 0
  const usageRatio = Math.min(totalBytes / MEDIA_STORAGE_LIMIT_BYTES, 1)

  const handleTypeChange = useCallback((next: MediaFilterType) => {
    setType(next)
    setPage(1)
  }, [])

  const handlePrev = useCallback(() => {
    setPage((p) => (p > 1 ? p - 1 : p))
  }, [])

  const handleNext = useCallback(() => {
    if (hasMore) setPage((p) => p + 1)
  }, [hasMore])

  const lightboxSlides: LightboxSlide[] = useMemo(
    () =>
      items.map((item) => {
        const mime = item.mimeType || ''
        const isImage = mime.startsWith('image/')
        const thumb = item.thumbUrl
        const hasThumb = Boolean(thumb && thumb !== item.url)
        return {
          src: item.url,
          alt: item.filename,
          mimeType: item.mimeType,
          previewSrc: isImage && hasThumb ? thumb : null,
        }
      }),
    [items]
  )

  const openLightbox = useCallback(
    (itemId: string) => {
      if (lightboxSlides.length === 0) return
      const index = items.findIndex((it) => it.id === itemId)
      setLightbox({
        images: lightboxSlides,
        index: index >= 0 ? index : 0,
      })
    },
    [items, lightboxSlides]
  )

  return {
    page,
    type,
    view,
    lightbox,
    items,
    isLoading,
    isFetching,
    hasMore,
    totalBytes,
    totalCount,
    usageRatio,
    storageLimitBytes: MEDIA_STORAGE_LIMIT_BYTES,
    setView,
    setLightbox,
    handleTypeChange,
    handlePrev,
    handleNext,
    openLightbox,
  }
}
