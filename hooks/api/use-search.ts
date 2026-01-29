'use client'

import { useQuery } from '@tanstack/react-query'

interface SearchResult {
  posts: Array<{
    id: string
    title: string
    slug: string
  }>
  tags: Array<{
    id: string
    name: string
    slug: string
    color: string | null
  }>
}

async function search(query: string): Promise<SearchResult> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to search')
  }
  return response.json()
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => search(query),
    enabled: !!query && query.trim().length > 0,
  })
}

async function publicSearch(query: string): Promise<{ posts: Array<{ id: string; title: string; slug: string }> }> {
  const response = await fetch(
    `/api/public/posts?search=${encodeURIComponent(query.trim())}&limit=10&offset=0`
  )
  if (!response.ok) throw new Error('Failed to search')
  const data = await response.json()
  return {
    posts: (data.posts ?? []).map((p: { id: string; title: string; slug: string }) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
    })),
  }
}

export function usePublicSearch(query: string) {
  return useQuery({
    queryKey: ['publicSearch', query],
    queryFn: () => publicSearch(query),
    enabled: !!query && query.trim().length > 0,
  })
}

async function publicTagsSearch(query: string): Promise<{
  tags: Array<{ id: string; name: string; slug: string; color: string | null }>
}> {
  const response = await fetch(
    `/api/public/tags?search=${encodeURIComponent(query.trim())}`
  )
  if (!response.ok) throw new Error('Failed to search tags')
  const data = await response.json()
  return {
    tags: (data ?? []).map((t: { id: string; name: string; slug: string; color: string | null }) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
    })),
  }
}

export function usePublicTagsSearch(query: string) {
  return useQuery({
    queryKey: ['publicTagsSearch', query],
    queryFn: () => publicTagsSearch(query),
    enabled: !!query && query.trim().length > 0,
  })
}