'use client'

import { useState, useEffect } from 'react'
import PostCard from './PostCard'
import { Button } from '@/components/ui/button'

interface Post {
  id: string
  title: string | null
  slug: string
  plaintext: string | null
  publishedAt: string | null
  wordCount: number | null
  tags?: { tag: { id: string; name: string; slug: string } }[]
}

interface PostListWithLoadMoreProps {
  initialPosts: Post[]
  tagSlug?: string
  search?: string
}

export default function PostListWithLoadMore({
  initialPosts,
  tagSlug,
  search,
}: PostListWithLoadMoreProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [nextOffset, setNextOffset] = useState<number | null>(initialPosts.length === 10 ? 10 : null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPosts(initialPosts)
    setNextOffset(initialPosts.length === 10 ? 10 : null)
  }, [initialPosts, search])

  const loadMore = async () => {
    if (nextOffset == null || loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '10', offset: String(nextOffset) })
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
  }

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
      {nextOffset != null && (
        <div className="pt-8 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}
