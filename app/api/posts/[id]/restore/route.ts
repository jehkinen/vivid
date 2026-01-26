import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/services/posts.service'
import { apiHandler } from '@/lib/api-handler'
import { validateRequest, idParamSchema } from '@/lib/validators/schemas'

export const PATCH = apiHandler(async (
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

  await postsService.restore(idValidation.data)
  return NextResponse.json({ success: true })
})