import { NextRequest, NextResponse } from 'next/server'
import { tagsService } from '@/services/tags.service'
import { authedHandler } from '@/lib/authed-handler'
import { tagCreateSchema } from '@/lib/validators/schemas'
import { parseJsonBody } from '@/lib/validators/parse'
import { invalidatePublishedTagsCache } from '@/lib/cache-invalidation'

export const GET = authedHandler(async () => {
  const tags = await tagsService.findMany()
  const tagsWithCount = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
    description: tag.description,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
    postCount: tag._count.posts,
  }))

  return NextResponse.json(tagsWithCount)
})

export const POST = authedHandler(async (request: NextRequest) => {
  const data = await parseJsonBody(tagCreateSchema, request)
  const tag = await tagsService.create(data)
  invalidatePublishedTagsCache()
  return NextResponse.json(tag)
})
