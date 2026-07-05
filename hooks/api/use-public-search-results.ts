'use client'

import { useEffect, useState } from 'react'

type PublicSearchPost = {
  id: string
  title: string
  slug: string
}

type PublicSearchTag = {
  id: string
  name: string
  slug: string
  color: string | null
}

async function fetchPublicPosts(query: string): Promise<PublicSearchPost[]> {
  const response = await fetch(
    `/api/public/posts?search=${encodeURIComponent(query.trim())}&limit=10&offset=0`
  )
  if (!response.ok) throw new Error('Failed to search')
  const data = await response.json()
  return (data.posts ?? []).map((p: PublicSearchPost) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
  }))
}

async function fetchPublicTags(query: string): Promise<PublicSearchTag[]> {
  const response = await fetch(`/api/public/tags?search=${encodeURIComponent(query.trim())}`)
  if (!response.ok) throw new Error('Failed to search tags')
  const data = await response.json()
  return (data ?? []).map((t: PublicSearchTag) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    color: t.color,
  }))
}

export function usePublicSearchResults(query: string) {
  const [posts, setPosts] = useState<PublicSearchPost[]>([])
  const [tags, setTags] = useState<PublicSearchTag[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setPosts([])
      setTags([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    Promise.all([fetchPublicPosts(trimmed), fetchPublicTags(trimmed)])
      .then(([nextPosts, nextTags]) => {
        if (cancelled) return
        setPosts(nextPosts)
        setTags(nextTags)
      })
      .catch(() => {
        if (cancelled) return
        setPosts([])
        setTags([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [query])

  return { posts, tags, isLoading }
}
