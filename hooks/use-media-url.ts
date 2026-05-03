'use client'

import { useState, useEffect } from 'react'

const cache = new Map<string, string | Promise<string | null>>()

export function useMediaUrl(mediaId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!mediaId) {
      setUrl(null)
      return
    }
    const cached = cache.get(mediaId)
    if (typeof cached === 'string') {
      setUrl(cached)
      return
    }
    if (cached && typeof (cached as Promise<string | null>).then === 'function') {
      ;(cached as Promise<string | null>).then(setUrl)
      return
    }
    const promise = fetch(`/api/media/${mediaId}`)
      .then((r) => (r.ok ? r.json().then((d: { url?: string }) => d.url ?? null) : null))
      .catch(() => {
        cache.delete(mediaId)
        return null
      })
    cache.set(mediaId, promise)
    promise.then((u) => {
      if (u != null) cache.set(mediaId, u)
      else cache.delete(mediaId)
      setUrl(u)
    })
  }, [mediaId])

  return url
}

const batchCache = new Map<string, Record<string, string>>()

function batchCacheKey(ids: string[]): string {
  return [...new Set(ids)].sort().join(',')
}

export function useMediaUrls(ids: string[]): Record<string, string> {
  const idsKey = batchCacheKey(ids.filter(Boolean))

  const [urlMap, setUrlMap] = useState<Record<string, string>>(() => batchCache.get(idsKey) ?? {})

  useEffect(() => {
    const clean = ids.filter(Boolean)
    if (clean.length === 0) {
      setUrlMap({})
      return
    }
    const key = batchCacheKey(clean)
    const cached = batchCache.get(key)
    if (cached) {
      setUrlMap(cached)
      return
    }
    fetch('/api/media/urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: clean }),
    })
      .then((r) => (r.ok ? r.json() : { urls: {} }))
      .then((data: { urls?: Record<string, string> }) => {
        const map = data.urls ?? {}
        batchCache.set(key, map)
        setUrlMap(map)
      })
      .catch(() => setUrlMap({}))
    // idsKey fingerprints `ids` for stable batching; including `ids` retriggers on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- idsKey
  }, [idsKey])

  return urlMap
}
