import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { apiHandler } from '@/lib/api-handler'
import { listItemUpdateSchema, validateRequest, idParamSchema } from '@/lib/validators/schemas'

export const PATCH = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) => {
  const { id, itemId } = await params
  const idValidation = validateRequest(idParamSchema, id)
  const itemIdValidation = validateRequest(idParamSchema, itemId)
  if (!idValidation.success || !itemIdValidation.success) {
    const errors = [
      ...(!idValidation.success ? idValidation.errors : []),
      ...(!itemIdValidation.success ? itemIdValidation.errors : []),
    ]
    return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 })
  }
  const list = await listsService.findOne(idValidation.data)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  const body = await request.json()
  const validation = validateRequest(listItemUpdateSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }
  await listsService.updateItem(idValidation.data, itemIdValidation.data, validation.data)
  const updated = await listsService.findOne(idValidation.data)
  return NextResponse.json(updated)
})

export const DELETE = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) => {
  const { id, itemId } = await params
  const idValidation = validateRequest(idParamSchema, id)
  const itemIdValidation = validateRequest(idParamSchema, itemId)
  if (!idValidation.success || !itemIdValidation.success) {
    const errors = [
      ...(!idValidation.success ? idValidation.errors : []),
      ...(!itemIdValidation.success ? itemIdValidation.errors : []),
    ]
    return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 })
  }
  const list = await listsService.findOne(idValidation.data)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  await listsService.deleteItem(idValidation.data, itemIdValidation.data)
  const updated = await listsService.findOne(idValidation.data)
  return NextResponse.json(updated)
})
