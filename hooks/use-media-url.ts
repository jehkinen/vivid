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
  const [urlMap, setUrlMap] = useState<Record<string, string>>(() => {
    const key = batchCacheKey(ids)
    return batchCache.get(key) ?? {}
  })

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
  }, [[...ids].filter(Boolean).sort().join(',')])

  return urlMap
}
