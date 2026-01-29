import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { postsService } from '@/services/posts.service'
import { tagsService } from '@/services/tags.service'
import { POST_STATUS, POST_VISIBILITY } from '@/shared/constants'
import PublicLayout from '@/components/public/PublicLayout'
import TagsSidebar from '@/components/public/TagsSidebar'
import PostListWithLoadMore from '@/components/public/PostListWithLoadMore'

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tag = await prisma.tag.findUnique({
    where: { slug },
  })

  if (!tag) notFound()

  const [posts, tagsWithCount] = await Promise.all([
    postsService.findMany({
      status: POST_STATUS.PUBLISHED,
      visibility: POST_VISIBILITY.PUBLIC,
      tagSlug: slug,
      limit: 10,
      offset: 0,
      sort: 'newest',
    }),
    tagsService.findManyWithPublishedPostCount(),
  ])

  const postCount = tagsWithCount.find((t) => t.slug === slug)?.postCount ?? 0
  const tags = tagsWithCount.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    color: t.color,
    postCount: t.postCount,
  }))

  return (
    <PublicLayout sidebar={<TagsSidebar tags={tags} />}>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
          TOPIC
        </p>
        <h1 className="text-4xl font-bold mb-2">{tag.name}</h1>
        <p className="text-muted-foreground">
          A collection of {postCount} {postCount === 1 ? 'story' : 'stories'}
        </p>
      </div>
      {posts.length === 0 ? (
        <p className="text-muted-foreground py-8">No posts found with this tag.</p>
      ) : (
        <PostListWithLoadMore initialPosts={posts} tagSlug={slug} />
      )}
    </PublicLayout>
  )
}
