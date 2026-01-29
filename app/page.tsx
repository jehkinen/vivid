import { postsService } from '@/services/posts.service'
import { tagsService } from '@/services/tags.service'
import { POST_STATUS, POST_VISIBILITY } from '@/shared/constants'
import PublicLayout from '@/components/public/PublicLayout'
import TagsSidebar from '@/components/public/TagsSidebar'
import PostListWithLoadMore from '@/components/public/PostListWithLoadMore'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const searchQuery = search?.trim() || undefined

  const [postsResult, tagsWithCount] = await Promise.all([
    postsService.findMany({
      status: POST_STATUS.PUBLISHED,
      visibility: POST_VISIBILITY.PUBLIC,
      search: searchQuery,
      limit: 10,
      offset: 0,
      sort: 'newest',
    }),
    tagsService.findManyWithPublishedPostCount(),
  ])
  const posts = postsResult.posts

  const tags = tagsWithCount
    .filter((t) => (t.postCount ?? 0) > 0)
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
      postCount: t.postCount,
    }))

  return (
    <PublicLayout
      sidebar={<TagsSidebar tags={tags} />}
    >
      <PostListWithLoadMore initialPosts={posts} search={searchQuery} />
    </PublicLayout>
  )
}
