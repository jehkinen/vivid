import { NextRequest, NextResponse } from 'next/server'
import { tagsService } from '@/services/tags.service'
import { authedHandler } from '@/lib/authed-handler'
import { tagUpdateSchema } from '@/lib/validators/schemas'
import { parseJsonBody, parseRouteParams } from '@/lib/validators/parse'
import { slugRouteParamsSchema } from '@/lib/validators/query-schemas'

export const GET = authedHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await parseRouteParams(slugRouteParamsSchema, params)
  const tag = await tagsService.findOne(slug)

  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...tag,
    postCount: tag._count.posts,
  })
})

export const PUT = authedHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await parseRouteParams(slugRouteParamsSchema, params)
  const data = await parseJsonBody(tagUpdateSchema, request)
  const tag = await tagsService.findOne(slug)
  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
  }

  const updatedTag = await tagsService.update(tag.id, data)
  return NextResponse.json(updatedTag)
})

export const DELETE = authedHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await parseRouteParams(slugRouteParamsSchema, params)
  const tag = await tagsService.findOne(slug)
  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
  }

  await tagsService.delete(tag.id)
  return NextResponse.json({ success: true })
})
