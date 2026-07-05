'use client'

import { useState, useEffect } from 'react'
import { SIGNED_URL_EXPIRES_SECONDS, SIGNED_URL_CACHE_BUFFER_SECONDS } from '@/shared/constants'

const CLIENT_URL_TTL_MS =
  (SIGNED_URL_EXPIRES_SECONDS - SIGNED_URL_CACHE_BUFFER_SECONDS) * 1000

type CacheEntry = { url: string; expiresAt: number }

const cache = new Map<string, CacheEntry | Promise<string | null>>()
const batchCache = new Map<string, { map: Record<string, string>; expiresAt: number }>()

function cacheKey(mediaId: string, variant: 'full' | 'thumb' = 'full') {
  return variant === 'thumb' ? `thumb:${mediaId}` : mediaId
}

function readCachedUrl(key: string): string | null {
  const entry = cache.get(key)
  if (!entry || entry instanceof Promise) return null
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.url
}

function writeCachedUrl(key: string, url: string) {
  cache.set(key, { url, expiresAt: Date.now() + CLIENT_URL_TTL_MS })
}

export function invalidateMediaUrlCache(mediaId: string) {
  cache.delete(mediaId)
  cache.delete(cacheKey(mediaId, 'thumb'))
  batchCache.clear()
}

async function fetchMediaUrl(mediaId: string, path: string): Promise<string | null> {
  const res = await fetch(path)
  if (!res.ok) return null
  const data = (await res.json()) as { url?: string }
  return data.url ?? null
}

function resolveUrl(mediaId: string, variant: 'full' | 'thumb'): Promise<string | null> {
  const key = cacheKey(mediaId, variant)
  const cached = readCachedUrl(key)
  if (cached) return Promise.resolve(cached)

  const pending = cache.get(key)
  if (pending instanceof Promise) return pending

  const path =
    variant === 'thumb'
      ? `/api/public/media/${mediaId}/thumb`
      : `/api/media/${mediaId}`

  const promise = fetchMediaUrl(mediaId, path)
    .then((url) => {
      if (url) writeCachedUrl(key, url)
      else cache.delete(key)
      return url
    })
    .catch(() => {
      cache.delete(key)
      return null
    })

  cache.set(key, promise)
  return promise
}

export function useMediaUrl(mediaId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!mediaId) {
      setUrl(null)
      return
    }
    const cached = readCachedUrl(mediaId)
    if (cached) {
      setUrl(cached)
      return
    }
    const pending = cache.get(mediaId)
    if (pending instanceof Promise) {
      pending.then(setUrl)
      return
    }
    resolveUrl(mediaId, 'full').then(setUrl)
  }, [mediaId])

  return url
}

export function useFeaturedMediaThumbUrl(
  mediaId: string | null | undefined,
  initialSrc?: string | null
): string | null {
  const [url, setUrl] = useState<string | null>(initialSrc ?? null)

  useEffect(() => {
    if (!mediaId) {
      setUrl(null)
      return
    }
    const key = cacheKey(mediaId, 'thumb')
    const cached = readCachedUrl(key)
    if (cached) {
      setUrl(cached)
      return
    }
    const pending = cache.get(key)
    if (pending instanceof Promise) {
      pending.then((resolved) => setUrl(resolved ?? initialSrc ?? null))
      return
    }
    resolveUrl(mediaId, 'thumb').then((resolved) => setUrl(resolved ?? initialSrc ?? null))
  }, [mediaId, initialSrc])

  return url
}

function batchCacheKey(ids: string[]): string {
  return [...new Set(ids)].sort().join(',')
}

export function useMediaUrls(ids: string[]): Record<string, string> {
  const idsKey = batchCacheKey(ids.filter(Boolean))

  const [urlMap, setUrlMap] = useState<Record<string, string>>(() => {
    const cached = batchCache.get(idsKey)
    if (cached && cached.expiresAt > Date.now()) return cached.map
    return {}
  })

  useEffect(() => {
    const clean = ids.filter(Boolean)
    if (clean.length === 0) {
      setUrlMap({})
      return
    }
    const key = batchCacheKey(clean)
    const cached = batchCache.get(key)
    if (cached && cached.expiresAt > Date.now()) {
      setUrlMap(cached.map)
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
        batchCache.set(key, { map, expiresAt: Date.now() + CLIENT_URL_TTL_MS })
        setUrlMap(map)
      })
      .catch(() => setUrlMap({}))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- idsKey
  }, [idsKey])

  return urlMap
}

export async function refreshPublicFeaturedMediaUrl(mediaId: string): Promise<string | null> {
  cache.delete(mediaId)
  const res = await fetch(`/api/public/media/${mediaId}`)
  if (!res.ok) return null
  const data = (await res.json()) as { url?: string }
  const url = data.url ?? null
  if (url) writeCachedUrl(mediaId, url)
  return url
}

export async function refreshFeaturedMediaThumbUrl(mediaId: string): Promise<string | null> {
  cache.delete(cacheKey(mediaId, 'thumb'))
  return resolveUrl(mediaId, 'thumb')
}

export async function refreshMediaUrl(mediaId: string): Promise<string | null> {
  cache.delete(mediaId)
  return resolveUrl(mediaId, 'full')
}
