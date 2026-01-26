import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api-handler'
import { validateRequest, idParamSchema } from '@/lib/validators/schemas'
import { mediaService } from '@/services/media.service'

export const GET = apiHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const idValidation = validateRequest(idParamSchema, id)
  if (!idValidation.success) {
    return NextResponse.json({ error: 'Validation failed', errors: idValidation.errors }, { status: 400 })
  }
  const media = await mediaService.findOne(idValidation.data)
  if (!media) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(media)
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

  await mediaService.softDelete(idValidation.data)
  return NextResponse.json({ success: true })
})