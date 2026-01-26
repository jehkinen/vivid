import { NextRequest, NextResponse } from 'next/server'
import { tagsService } from '@/services/tags.service'
import { apiHandler } from '@/lib/api-handler'
import { tagUpdateSchema, validateRequest, slugParamSchema } from '@/lib/validators/schemas'

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params
  const slugValidation = validateRequest(slugParamSchema, slug)

  if (!slugValidation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: slugValidation.errors },
      { status: 400 }
    )
  }

  const tag = await tagsService.findOne(slugValidation.data)

  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...tag,
    postCount: tag._count.posts,
  })
})

export const PUT = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params
  const slugValidation = validateRequest(slugParamSchema, slug)

  if (!slugValidation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: slugValidation.errors },
      { status: 400 }
    )
  }

  const body = await request.json()
  const validation = validateRequest(tagUpdateSchema, body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }

  const tag = await tagsService.findOne(slugValidation.data)
  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
  }

  const updatedTag = await tagsService.update(tag.id, validation.data)
  return NextResponse.json(updatedTag)
})

export const DELETE = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug } = await params
  const slugValidation = validateRequest(slugParamSchema, slug)

  if (!slugValidation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: slugValidation.errors },
      { status: 400 }
    )
  }

  const tag = await tagsService.findOne(slugValidation.data)
  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
  }

  await tagsService.delete(tag.id)
  return NextResponse.json({ success: true })
})