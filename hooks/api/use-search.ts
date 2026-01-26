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