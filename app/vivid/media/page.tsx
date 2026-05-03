'use client'

import { useState } from 'react'
import { useMedia } from '@/hooks/api/use-media'
import { Button } from '@/components/ui/button'
import { formatBytes, formatDateTime } from '@/lib/utils'
import { MEDIA_FILTER_TYPES, type MediaFilterType, MEDIABLE_TYPES } from '@/shared/constants'
import { Lightbox, type LightboxSlide } from '@/components/ui/lightbox'
import type { MediaItem } from '@/lib/api/mediaClient'
import { GridFourIcon, RowsIcon } from '@phosphor-icons/react'

const PER_PAGE = 40

const MEDIA_TYPES: { value: MediaFilterType; label: string }[] = [
  { value: MEDIA_FILTER_TYPES.ALL, label: 'All' },
  { value: MEDIA_FILTER_TYPES.IMAGE, label: 'Images' },
  { value: MEDIA_FILTER_TYPES.VIDEO, label: 'Video' },
  { value: MEDIA_FILTER_TYPES.AUDIO, label: 'Audio' },
  { value: MEDIA_FILTER_TYPES.DOCUMENT, label: 'Documents' },
]

function storedBytes(item: MediaItem): number {
  return (item.size ?? 0) + (item.conversionSize ?? 0)
}

export default function MediaLibraryPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState<MediaFilterType>(MEDIA_FILTER_TYPES.ALL)
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [lightbox, setLightbox] = useState<{
    images: LightboxSlide[]
    index: number
  } | null>(null)
  const { data, isLoading, isFetching } = useMedia({ page, perPage: PER_PAGE, type })

  const hasMore = data?.hasMore ?? false
  const items = data?.items ?? []
  const totalBytes = data?.totalStored ?? 0
  const totalCount = data?.total ?? 0

  const storageLimitBytes = 1 * 1024 * 1024 * 1024
  const usageRatio = Math.min(totalBytes / storageLimitBytes, 1)

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media</h1>
          <p className="text-sm text-muted-foreground">
            Library and storage usage. Sizes include generated thumbnails when present.
          </p>
          {!isLoading && (
            <p className="mt-2 text-sm font-medium text-foreground">
              <span className="tabular-nums">{totalCount}</span> file{totalCount === 1 ? '' : 's'} in this filter
              {totalBytes > 0 && (
                <>
                  {' · '}
                  <span className="tabular-nums">{formatBytes(totalBytes)}</span> total stored
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex rounded-md border p-0.5 bg-muted/40">
            <Button
              type="button"
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-1.5"
              onClick={() => setView('list')}
            >
              <RowsIcon size={16} aria-hidden />
              List
            </Button>
            <Button
              type="button"
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-1.5"
              onClick={() => setView('grid')}
            >
              <GridFourIcon size={16} aria-hidden />
              Grid
            </Button>
          </div>
          <div className="w-full max-w-xs space-y-1">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${usageRatio * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span className="tabular-nums">{formatBytes(totalBytes)} used</span>
              <span className="tabular-nums">{formatBytes(storageLimitBytes)} quota</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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

      <div className="border rounded-lg overflow-hidden">
        {view === 'list' ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="w-12 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">File</div>
              <div className="w-28 shrink-0 text-right">Size</div>
              <div className="hidden w-40 shrink-0 text-right sm:block">Uploaded</div>
            </div>
            {isLoading && items.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">Loading media…</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No media files found.</div>
            ) : (
              items.map((item) => {
                const mime = item.mimeType || ''
                const isImage = mime.startsWith('image/')
                const bytes = storedBytes(item)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openLightbox(item.id)}
                    className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {isImage ? (
                        <img
                          src={item.thumbUrl || item.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-muted-foreground leading-tight">
                          {mime.slice(0, 12) || '—'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-sm" title={item.filename}>
                        {item.filename}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                        {mime || 'unknown type'}
                        {(item.conversionSize ?? 0) > 0 && item.size != null && (
                          <span className="hidden sm:inline">
                            {' · '}
                            orig {formatBytes(item.size)} + conv {formatBytes(item.conversionSize ?? 0)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-28 shrink-0 text-right">
                      <span className="font-mono text-sm font-semibold tabular-nums">
                        {bytes > 0 ? formatBytes(bytes) : '—'}
                      </span>
                    </div>
                    <div className="hidden w-40 shrink-0 text-right text-xs text-muted-foreground sm:block">
                      {formatDateTime(item.createdAt)}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
            {isLoading && items.length === 0 ? (
              <div className="col-span-full text-sm text-muted-foreground">Loading media…</div>
            ) : items.length === 0 ? (
              <div className="col-span-full text-sm text-muted-foreground">No media files found.</div>
            ) : (
              items.map((item) => {
                const mime = item.mimeType || ''
                const isImage = mime.startsWith('image/')
                const bytes = storedBytes(item)
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
                      <span className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>{formatDateTime(item.createdAt)}</span>
                        {bytes > 0 && (
                          <span className="font-mono font-semibold text-foreground tabular-nums shrink-0">
                            {formatBytes(bytes)}
                          </span>
                        )}
                      </span>
                    </figcaption>
                  </figure>
                )
              })
            )}
          </div>
        )}
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
            const bytes = storedBytes(media)
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
                  {bytes > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/60">Stored</span>
                      <span className="text-[11px] font-mono tabular-nums">{formatBytes(bytes)}</span>
                    </div>
                  )}
                  {(media.conversionSize ?? 0) > 0 && media.size != null && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/60">Original</span>
                      <span className="text-[11px] font-mono tabular-nums">{formatBytes(media.size)}</span>
                    </div>
                  )}
                  {(media.conversionSize ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-white/60">Conversions</span>
                      <span className="text-[11px] font-mono tabular-nums">
                        {formatBytes(media.conversionSize ?? 0)}
                      </span>
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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
      </div>
    </div>
  )
}
