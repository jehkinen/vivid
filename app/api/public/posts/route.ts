import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/services/posts.service'
import { POST_STATUS, POST_VISIBILITY } from '@/shared/constants'
import { authedHandler } from '@/lib/authed-handler'
import { parseSearchParams } from '@/lib/validators/parse'
import { publicPostsQuerySchema } from '@/lib/validators/query-schemas'

export const GET = authedHandler(async (request: NextRequest) => {
  const query = parseSearchParams(publicPostsQuerySchema, request.nextUrl.searchParams)

  const result = await postsService.findMany({
    status: POST_STATUS.PUBLISHED,
    visibility: POST_VISIBILITY.PUBLIC,
    tagSlug: query.tagSlug,
    search: query.search,
    limit: query.limit,
    offset: query.offset,
    sort: 'newest',
  })

  return NextResponse.json({
    posts: result.posts,
    hasMore: result.hasMore,
    nextOffset: result.hasMore ? query.offset + result.posts.length : null,
  })
})
