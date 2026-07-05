'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useMedia } from '@/hooks/api/use-media'
import { useBulkDeleteMedia } from '@/hooks/api/use-bulk-delete-media'
import type { LightboxSlide } from '@/components/ui/lightbox'
import { MEDIA_FILTER_TYPES, type MediaFilterType } from '@/shared/constants'
import {
  MEDIA_PER_PAGE,
  MEDIA_STORAGE_LIMIT_BYTES,
  storedBytes,
} from '@/components/admin/media/media-utils'
import { applyMediaSelection, type MediaSelectionModifiers } from '@/components/admin/media/media-selection'

export function useMediaAdminPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState<MediaFilterType>(MEDIA_FILTER_TYPES.ALL)
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [lightbox, setLightbox] = useState<{
    images: LightboxSlide[]
    index: number
  } | null>(null)
  const selectionAnchorRef = useRef<string | null>(null)
  const { data, isLoading, isFetching } = useMedia({ page, perPage: MEDIA_PER_PAGE, type })
  const bulkDelete = useBulkDeleteMedia()

  const hasMore = data?.hasMore ?? false
  const items = data?.items ?? []
  const totalBytes = data?.totalStored ?? 0
  const totalCount = data?.total ?? 0
  const usageRatio = Math.min(totalBytes / MEDIA_STORAGE_LIMIT_BYTES, 1)

  useEffect(() => {
    setSelectedIds(new Set())
    selectionAnchorRef.current = null
  }, [page, type])

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

  const handleItemSelect = useCallback(
    (id: string, modifiers: MediaSelectionModifiers) => {
      setSelectedIds((current) => {
        const result = applyMediaSelection(items, current, id, selectionAnchorRef.current, modifiers)
        selectionAnchorRef.current = result.anchorId
        return result.selectedIds
      })
    },
    [items]
  )

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds((current) => {
      const pageIds = items.map((item) => item.id)
      const allSelected = pageIds.length > 0 && pageIds.every((id) => current.has(id))
      if (allSelected) {
        const next = new Set(current)
        for (const id of pageIds) next.delete(id)
        selectionAnchorRef.current = pageIds[0] ?? null
        return next
      }
      selectionAnchorRef.current = pageIds[0] ?? null
      return new Set([...current, ...pageIds])
    })
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    selectionAnchorRef.current = null
  }, [])

  const allPageSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  )

  const selectedCount = selectedIds.size

  const handleConfirmDelete = useCallback(async () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    await bulkDelete.mutateAsync(ids)
    setDeleteDialogOpen(false)
    setSelectedIds(new Set())
    selectionAnchorRef.current = null
  }, [bulkDelete, selectedIds])

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
    selectedIds,
    selectedCount,
    allPageSelected,
    deleteDialogOpen,
    isDeleting: bulkDelete.isPending,
    setView,
    setLightbox,
    setDeleteDialogOpen,
    handleTypeChange,
    handlePrev,
    handleNext,
    openLightbox,
    handleItemSelect,
    toggleSelectAllOnPage,
    clearSelection,
    handleConfirmDelete,
  }
}
