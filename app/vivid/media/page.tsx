'use client'

import { useState } from 'react'
import { useMedia } from '@/hooks/api/use-media'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { MEDIA_FILTER_TYPES, type MediaFilterType, MEDIABLE_TYPES } from '@/shared/constants'
import { Lightbox, type LightboxSlide } from '@/components/ui/lightbox'

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
  const [lightbox, setLightbox] = useState<{
    images: LightboxSlide[]
    index: number
  } | null>(null)
  const { data, isLoading, isFetching } = useMedia({ page, perPage: PER_PAGE, type })

  const hasMore = data?.hasMore ?? false
  const items = data?.items ?? []
  const totalBytes = data?.totalStored ?? 0

  const storageLimitBytes = 1 * 1024 * 1024 * 1024
  const usageRatio = Math.min(totalBytes / storageLimitBytes, 1)

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

  const lightboxSlides: LightboxSlide[] = items.map((item) => {
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
  })

  const openLightbox = (itemId: string) => {
    if (lightboxSlides.length === 0) return
    const index = items.findIndex((it) => it.id === itemId)
    setLightbox({
      images: lightboxSlides,
      index: index >= 0 ? index : 0,
    })
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
            <span>{formatBytes(totalBytes)} used</span>
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
            items.map((item) => {
              const mime = item.mimeType || ''
              const isImage = mime.startsWith('image/')
              return (
              <figure
                key={item.id}
                className="flex flex-col gap-2 rounded-md border bg-background overflow-hidden cursor-pointer"
                onClick={() => openLightbox(item.id)}
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
                    {(item.size ?? 0) + (item.conversionSize ?? 0) > 0 && (
                      <> · {formatBytes((item.size ?? 0) + (item.conversionSize ?? 0))}</>
                    )}
                  </span>
                </figcaption>
              </figure>
            )
            })
          )}
        </div>
      </div>

      {lightbox && lightbox.images.length > 0 && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          rightPanel={(_, idx) => {
            const media = items[idx]
            if (!media) return null
            const conversions =
              media.generatedConversions && typeof media.generatedConversions === 'object'
                ? Object.entries(media.generatedConversions)
                    .filter(([, v]) => Boolean(v))
                    .map(([k]) => k)
                : []
            return (
              <>
                <div className="mb-3">
                  <div className="text-xs font-semibold truncate" title={media.filename}>
                    {media.filename}
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    {formatDateTime(media.createdAt)}
                  </div>
                </div>
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-white/60">Type</span>
                    <span className="text-[11px]">{media.mimeType || 'unknown'}</span>
                  </div>
                  {(media.size ?? 0) + (media.conversionSize ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/60">Stored</span>
                      <span className="text-[11px]">
                        {formatBytes((media.size ?? 0) + (media.conversionSize ?? 0))}
                      </span>
                    </div>
                  )}
                  {(media.conversionSize ?? 0) > 0 && media.size != null && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/60">Original</span>
                      <span className="text-[11px]">{formatBytes(media.size)}</span>
                    </div>
                  )}
                  {(media.conversionSize ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/60">Conversions</span>
                      <span className="text-[11px]">{formatBytes(media.conversionSize)}</span>
                    </div>
                  )}
                  {conversions.length > 0 && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] text-white/60">Resizes</span>
                      <span className="text-[11px] text-right">{conversions.join(', ')}</span>
                    </div>
                  )}
                </div>
                {media.mediableType && media.mediableId && (
                  <div className="space-y-1 mt-1">
                    <div className="text-[11px] text-white/60">Linked to</div>
                    {media.mediableType === MEDIABLE_TYPES.POST ? (
                      <a
                        href={`/vivid/editor/post/${media.mediableId}`}
                        className="text-[11px] text-emerald-300 hover:text-emerald-200 underline underline-offset-2 truncate block"
                        title={media.linkedTitle ?? media.filename}
                      >
                        {media.linkedTitle || 'Untitled post'}
                      </a>
                    ) : (
                      <div className="text-[11px]">
                        {media.mediableType} · {media.mediableId}
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          }}
        />
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

