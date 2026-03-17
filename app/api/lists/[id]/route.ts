import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { apiHandler } from '@/lib/api-handler'
import { listUpdateSchema, validateRequest, idParamSchema } from '@/lib/validators/schemas'

export const GET = apiHandler(async (
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
  const list = await listsService.findOne(idValidation.data)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  return NextResponse.json(list)
})

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
  const list = await listsService.findOne(idValidation.data)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  const body = await request.json()
  const validation = validateRequest(listUpdateSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }
  const updated = await listsService.update(idValidation.data, validation.data)
  return NextResponse.json(updated)
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
  const list = await listsService.findOne(idValidation.data)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  await listsService.delete(idValidation.data)
  return NextResponse.json({ success: true })
})
