'use client'

import { useState, useCallback, useEffect } from 'react'
import { ImageBrokenIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { refreshMediaUrl, refreshPublicFeaturedMediaUrl } from '@/hooks/use-media-url'

type FeaturedCoverImageProps = {
  mediaId: string
  initialUrl: string
  thumbUrl?: string | null
  alt: string
  caption?: string | null
  preview?: boolean
}

export function FeaturedCoverImage({
  mediaId,
  initialUrl,
  thumbUrl,
  alt,
  caption,
  preview = false,
}: FeaturedCoverImageProps) {
  const progressivePreview =
    thumbUrl && thumbUrl !== initialUrl ? thumbUrl : null
  const [src, setSrc] = useState(initialUrl)
  const [fullReady, setFullReady] = useState(!progressivePreview)
  const [broken, setBroken] = useState(false)

  const refreshSrc = useCallback(async () => {
    const url = preview
      ? await refreshMediaUrl(mediaId)
      : await refreshPublicFeaturedMediaUrl(mediaId)
    if (url) {
      setSrc(url)
      setBroken(false)
      return url
    }
    return null
  }, [mediaId, preview])

  useEffect(() => {
    setSrc(initialUrl)
    setFullReady(!progressivePreview)
    setBroken(false)
  }, [mediaId, initialUrl, progressivePreview])

  useEffect(() => {
    refreshSrc()
  }, [refreshSrc])

  const handleError = useCallback(() => {
    refreshSrc().then((url) => {
      if (!url) setBroken(true)
    })
  }, [refreshSrc])

  if (broken) {
    return (
      <figure className="mt-6 -mx-4 sm:mx-0">
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg bg-muted text-muted-foreground">
          <ImageBrokenIcon size={40} className="shrink-0" />
          <span className="text-sm">Cover unavailable</span>
        </div>
      </figure>
    )
  }

  return (
    <figure className="mt-6 -mx-4 sm:mx-0">
      <div className="relative overflow-hidden rounded-lg">
        {progressivePreview ? (
          <img
            src={progressivePreview}
            alt=""
            aria-hidden
            draggable={false}
            className={cn(
              'pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover blur-lg transition-opacity duration-300',
              fullReady ? 'opacity-0' : 'opacity-100'
            )}
          />
        ) : null}
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={() => setFullReady(true)}
          onError={handleError}
          className={cn(
            'relative z-[1] w-full rounded-lg transition-opacity duration-500',
            progressivePreview && !fullReady ? 'opacity-0' : 'opacity-100'
          )}
        />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  )
}
