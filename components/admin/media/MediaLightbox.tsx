'use client'

import { Lightbox, type LightboxSlide } from '@/components/ui/lightbox'
import type { MediaItem } from '@/lib/api/mediaClient'
import { formatBytes, formatDateTime } from '@/lib/utils'
import { MEDIABLE_TYPES } from '@/shared/constants'
import { storedBytes } from '@/components/admin/media/media-utils'

type MediaLightboxProps = {
  items: MediaItem[]
  lightbox: { images: LightboxSlide[]; index: number } | null
  onClose: () => void
}

export function MediaLightbox({ items, lightbox, onClose }: MediaLightboxProps) {
  if (!lightbox || lightbox.images.length === 0) return null

  return (
    <Lightbox
      images={lightbox.images}
      initialIndex={lightbox.index}
      onClose={onClose}
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
  )
}
