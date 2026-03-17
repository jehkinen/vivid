'use client'

import { useState } from 'react'
import { useMedia } from '@/hooks/api/use-media'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { MEDIA_FILTER_TYPES, type MediaFilterType } from '@/shared/constants'

const PER_PAGE = 40

const MEDIA_TYPES: { value: MediaFilterType; label: string }[] = [
  { value: MEDIA_FILTER_TYPES.ALL, label: 'All' },
  { value: MEDIA_FILTER_TYPES.IMAGE, label: 'Images' },
  { value: MEDIA_FILTER_TYPES.VIDEO, label: 'Video' },
  { value: MEDIA_FILTER_TYPES.AUDIO, label: 'Audio' },
  { value: MEDIA_FILTER_TYPES.DOCUMENT, label: 'Documents' },
]

export default function MediaLibraryPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState<MediaFilterType>(MEDIA_FILTER_TYPES.ALL)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { data, isLoading, isFetching } = useMedia({ page, perPage: PER_PAGE, type })

  const hasMore = data?.hasMore ?? false
  const items = data?.items ?? []
  const totalOriginalBytes = data?.totalOriginalBytes ?? 0

  const approximateTotalBytes = items.reduce((acc, item) => {
    const base = item.size || 0
    const hasThumb = Boolean(item.thumbUrl)
    const multiplier = hasThumb ? 2 : 1
    return acc + base * multiplier
  }, totalOriginalBytes)

  const storageLimitBytes = 1 * 1024 * 1024 * 1024
  const usageRatio = Math.min(approximateTotalBytes / storageLimitBytes, 1)

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let value = bytes
    let idx = 0
    while (value >= 1024 && idx < units.length - 1) {
      value /= 1024
      idx += 1
    }
    return `${value.toFixed(1)} ${units[idx]}`
  }

  const handleTypeChange = (next: MediaFilterType) => {
    setType(next)
    setPage(1)
  }

  const handlePrev = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleNext = () => {
    if (hasMore) {
      setPage(page + 1)
    }
  }

  const openLightbox = (index: number) => {
    if (type !== 'image') return
    setLightboxIndex(index)
  }

  const closeLightbox = () => {
    setLightboxIndex(null)
  }

  const showPrev = () => {
    if (lightboxIndex == null || lightboxIndex <= 0) return
    setLightboxIndex(lightboxIndex - 1)
  }

  const showNext = () => {
    if (lightboxIndex == null || lightboxIndex >= items.length - 1) return
    setLightboxIndex(lightboxIndex + 1)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Media</h1>
          <p className="text-sm text-muted-foreground">Browse all uploaded files.</p>
        </div>
        <div className="w-64 space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${usageRatio * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{formatBytes(approximateTotalBytes)} used</span>
            <span>{formatBytes(storageLimitBytes)} total</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {MEDIA_TYPES.map((t) => (
          <Button
            key={t.value}
            type="button"
            variant={type === t.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="border rounded-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
          {isLoading && items.length === 0 ? (
            <div className="col-span-full text-sm text-muted-foreground">Loading media…</div>
          ) : items.length === 0 ? (
            <div className="col-span-full text-sm text-muted-foreground">No media files found.</div>
          ) : (
            items.map((item, index) => {
              const mime = item.mimeType || ''
              const isImage = mime.startsWith('image/')
              return (
              <figure
                key={item.id}
                className="flex flex-col gap-2 rounded-md border bg-background overflow-hidden cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <div className="relative w-full pb-[75%] bg-muted">
                  {isImage ? (
                    <img
                      src={item.thumbUrl || item.url}
                      alt={item.filename}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground px-2 text-center">
                      {item.mimeType}
                    </div>
                  )}
                </div>
                <figcaption className="px-2 py-1.5 border-t text-xs flex flex-col gap-0.5">
                  <span className="truncate" title={item.filename}>
                    {item.filename}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateTime(item.createdAt)}
                    {item.size != null && (
                      <> · {formatBytes(item.size)}</>
                    )}
                  </span>
                </figcaption>
              </figure>
            )
            })
          )}
        </div>
      </div>

      {type === 'image' && lightboxIndex != null && items[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
          <button
            type="button"
            className="absolute top-4 right-4 px-3 py-1.5 text-sm rounded-md bg-black/60 text-white border border-white/20"
            onClick={closeLightbox}
          >
            Close
          </button>
          <div className="flex items-center justify-center gap-4 w-full px-6">
            <button
              type="button"
              className="px-3 py-2 text-sm rounded-md bg-black/60 text-white border border-white/20 disabled:opacity-40"
              onClick={showPrev}
              disabled={lightboxIndex <= 0}
            >
              Prev
            </button>
            <div className="max-w-5xl max-h-[80vh] w-full flex items-center justify-center">
              <img
                src={items[lightboxIndex].url}
                alt={items[lightboxIndex].filename}
                className="max-w-full max-h-[80vh] object-contain rounded-md bg-black"
              />
            </div>
            <button
              type="button"
              className="px-3 py-2 text-sm rounded-md bg-black/60 text-white border border-white/20 disabled:opacity-40"
              onClick={showNext}
              disabled={lightboxIndex >= items.length - 1}
            >
              Next
            </button>
          </div>
          <div className="mt-4 text-xs text-white/80 px-4 text-center max-w-5xl truncate">
            {items[lightboxIndex].filename}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev} disabled={page === 1 || isFetching}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext} disabled={!hasMore || isFetching}>
            Next
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page}
            {isFetching && ' · Updating…'}
          </span>
        </div>
        <div className="flex-1" />
      </div>
    </div>
  )
}

