import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { apiHandler } from '@/lib/api-handler'
import { listItemCreateSchema, listReorderSchema, validateRequest, idParamSchema } from '@/lib/validators/schemas'

export const POST = apiHandler(async (
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
  const validation = validateRequest(listItemCreateSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }
  const item = await listsService.addItem(idValidation.data, validation.data)
  return NextResponse.json(item)
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
  const validation = validateRequest(listReorderSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }
  const updated = await listsService.reorderItems(idValidation.data, validation.data.itemIds)
  return NextResponse.json(updated)
})
