'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  refreshFeaturedMediaThumbUrl,
  useFeaturedMediaThumbUrl,
} from '@/hooks/use-media-url'

interface FeaturedMediaThumbnailProps {
  mediaId: string
  initialSrc?: string | null
  slug: string
}

export function FeaturedMediaThumbnail({
  mediaId,
  initialSrc,
  slug,
}: FeaturedMediaThumbnailProps) {
  const resolvedSrc = useFeaturedMediaThumbUrl(mediaId, initialSrc)
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null)
  const displaySrc = fallbackSrc ?? resolvedSrc

  const handleError = useCallback(() => {
    refreshFeaturedMediaThumbUrl(mediaId).then((url) => {
      if (url) setFallbackSrc(url)
    })
  }, [mediaId])

  if (!displaySrc) return null

  return (
    <Link
      href={`/${slug}`}
      className="shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted block"
    >
      <img
        src={displaySrc}
        alt=""
        className="w-full h-full object-cover"
        width={80}
        height={80}
        onError={handleError}
      />
    </Link>
  )
}
