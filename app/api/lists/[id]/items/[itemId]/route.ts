import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { authedHandler } from '@/lib/authed-handler'
import { listItemUpdateSchema } from '@/lib/validators/schemas'
import { parseJsonBody, parseRouteParams } from '@/lib/validators/parse'
import { listItemRouteParamsSchema } from '@/lib/validators/query-schemas'

export const PATCH = authedHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) => {
  const { id, itemId } = await parseRouteParams(listItemRouteParamsSchema, params)
  const list = await listsService.findOne(id)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  const data = await parseJsonBody(listItemUpdateSchema, request)
  await listsService.updateItem(id, itemId, data)
  const updated = await listsService.findOne(id)
  return NextResponse.json(updated)
})

export const DELETE = authedHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) => {
  const { id, itemId } = await parseRouteParams(listItemRouteParamsSchema, params)
  const list = await listsService.findOne(id)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  await listsService.deleteItem(id, itemId)
  const updated = await listsService.findOne(id)
  return NextResponse.json(updated)
})
