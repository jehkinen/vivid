import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/services/posts.service'
import { POST_SORT_OPTIONS } from '@/shared/constants'
import { apiHandler } from '@/lib/api-handler'
import { postCreateSchema, validateRequest, idParamSchema } from '@/lib/validators/schemas'

export const GET = apiHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')
  const slug = searchParams.get('slug')
  const search = searchParams.get('search')
  const tagIdsParam = searchParams.get('tagIds')
  const sort = (searchParams.get('sort') || POST_SORT_OPTIONS.NEWEST) as any

  if (id) {
    const idValidation = validateRequest(idParamSchema, id)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: idValidation.errors },
        { status: 400 }
      )
    }
  }

  if (id || slug) {
    const post = await postsService.findOne({ id: id || undefined, slug: slug || undefined })
    return NextResponse.json(post)
  }

  const tagIds = tagIdsParam
    ? typeof tagIdsParam === 'string'
      ? tagIdsParam.split(',')
      : Array.isArray(tagIdsParam)
        ? tagIdsParam
        : [tagIdsParam]
    : undefined

  const authorIdsParam = searchParams.get('authorIds')
  const authorIds = authorIdsParam
    ? typeof authorIdsParam === 'string'
      ? authorIdsParam.split(',')
      : []
    : undefined

  const statusParam = searchParams.get('status') || undefined
  const deletedOnly = statusParam === 'deleted'
  const status = deletedOnly ? undefined : statusParam
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100)
  const offset = parseInt(searchParams.get('offset') || '0', 10) || 0

  const result = await postsService.findMany({
    search: search || undefined,
    tagIds,
    status,
    visibility: searchParams.get('visibility') || undefined,
    authorIds: authorIds?.length ? authorIds : undefined,
    sort,
    deletedOnly,
    limit,
    offset,
  })

  return NextResponse.json(result)
})

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validation = validateRequest(postCreateSchema, body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }

  const post = await postsService.create(validation.data)
  return NextResponse.json(post)
})