import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/services/posts.service'
import { apiHandler } from '@/lib/api-handler'
import { postUpdateSchema, validateRequest, idParamSchema } from '@/lib/validators/schemas'

export const PUT = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const idValidation = validateRequest(idParamSchema, id)

  if (!idValidation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: idValidation.errors },
      { status: 400 }
    )
  }

  const body = await request.json()
  if (body === null || typeof body !== 'object' || Object.keys(body).length === 0) {
    return NextResponse.json(
      { error: 'Request body must be a non-empty object' },
      { status: 400 }
    )
  }
  const validation = validateRequest(postUpdateSchema, body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }

  const post = await postsService.update(idValidation.data, validation.data)
  return NextResponse.json(post)
})

export const DELETE = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const idValidation = validateRequest(idParamSchema, id)

  if (!idValidation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: idValidation.errors },
      { status: 400 }
    )
  }

  await postsService.softDelete(idValidation.data)
  return NextResponse.json({ success: true })
})