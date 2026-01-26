import { NextRequest, NextResponse } from 'next/server'
import { tagsService } from '@/services/tags.service'
import { apiHandler } from '@/lib/api-handler'
import { tagCreateSchema, validateRequest } from '@/lib/validators/schemas'

export const GET = apiHandler(async (request: NextRequest) => {
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

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validation = validateRequest(tagCreateSchema, body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }

  const tag = await tagsService.create(validation.data)
  return NextResponse.json(tag)
})