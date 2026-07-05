import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/services/posts.service'
import { authedHandler } from '@/lib/authed-handler'
import { postCreateSchema } from '@/lib/validators/schemas'
import { parseJsonBody, parseSearchParams } from '@/lib/validators/parse'
import { postsListQuerySchema } from '@/lib/validators/query-schemas'

export const GET = authedHandler(async (request: NextRequest) => {
  const query = parseSearchParams(postsListQuerySchema, request.nextUrl.searchParams)

  if (query.id || query.slug) {
    const post = await postsService.findOne({
      id: query.id,
      slug: query.slug,
      includeDeleted: query.includeDeleted,
    })
    return NextResponse.json(post)
  }

  const deletedOnly = query.status === 'deleted'
  const status = deletedOnly ? undefined : query.status

  const result = await postsService.findMany({
    search: query.search,
    tagIds: query.tagIds,
    status,
    visibility: query.visibility,
    authorIds: query.authorIds?.length ? query.authorIds : undefined,
    sort: query.sort,
    deletedOnly,
    limit: query.limit,
    offset: query.offset,
  })

  return NextResponse.json(result)
})

export const POST = authedHandler(async (request: NextRequest) => {
  const data = await parseJsonBody(postCreateSchema, request)
  const post = await postsService.create(data)
  return NextResponse.json(post)
})
