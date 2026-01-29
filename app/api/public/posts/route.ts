import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/services/posts.service'
import { POST_STATUS, POST_VISIBILITY } from '@/shared/constants'
import { apiHandler } from '@/lib/api-handler'

const DEFAULT_LIMIT = 10

export const GET = apiHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(Number(searchParams.get('limit')) || DEFAULT_LIMIT, 50)
  const offset = Number(searchParams.get('offset')) || 0
  const tagSlug = searchParams.get('tagSlug') || undefined
  const search = searchParams.get('search')?.trim() || undefined

  const result = await postsService.findMany({
    status: POST_STATUS.PUBLISHED,
    visibility: POST_VISIBILITY.PUBLIC,
    tagSlug,
    search,
    limit,
    offset,
    sort: 'newest',
  })

  return NextResponse.json({
    posts: result.posts,
    hasMore: result.hasMore,
    nextOffset: result.hasMore ? offset + result.posts.length : null,
  })
})
