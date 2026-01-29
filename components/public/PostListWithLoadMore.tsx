'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import PostCard from './PostCard'
import Loader from '@/components/ui/Loader'

interface Post {
  id: string
  title: string | null
  slug: string
  plaintext: string | null
  publishedAt: string | Date | null
  wordCount: number | null
  tags?: { tag: { id: string; name: string; slug: string } }[]
}

interface PostListWithLoadMoreProps {
  initialPosts: Post[]
  tagSlug?: string
  search?: string
}

const PAGE_SIZE = 10

export default function PostListWithLoadMore({
  initialPosts,
  tagSlug,
  search,
}: PostListWithLoadMoreProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [nextOffset, setNextOffset] = useState<number | null>(
    initialPosts.length === PAGE_SIZE ? PAGE_SIZE : null
  )
  const [loading, setLoading] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPosts(initialPosts)
    setNextOffset(initialPosts.length === PAGE_SIZE ? PAGE_SIZE : null)
  }, [initialPosts, search])

  const loadMore = useCallback(async () => {
    if (nextOffset == null || loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(nextOffset) })
      if (tagSlug) params.set('tagSlug', tagSlug)
      if (search) params.set('search', search)
      const res = await fetch(`/api/public/posts?${params}`)
      const data = await res.json()
      if (data.posts?.length) {
        setPosts((prev) => [...prev, ...data.posts])
      }
      setNextOffset(data.nextOffset)
    } finally {
      setLoading(false)
    }
  }, [nextOffset, loading, tagSlug, search])

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || nextOffset == null || loading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '200px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [nextOffset, loading, loadMore])

  return (
    <div>
      <div className="divide-y divide-border">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            title={post.title}
            slug={post.slug}
            plaintext={post.plaintext}
            publishedAt={post.publishedAt}
            wordCount={post.wordCount}
            tags={post.tags}
          />
        ))}
      </div>
      <div ref={loadMoreRef} className="min-h-12 flex items-center justify-center py-8">
        {loading && <Loader />}
      </div>
    </div>
  )
}
