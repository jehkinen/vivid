import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { authedHandler } from '@/lib/authed-handler'
import { listItemCreateSchema, listReorderSchema } from '@/lib/validators/schemas'
import { parseJsonBody, parseRouteParams } from '@/lib/validators/parse'
import { idRouteParamsSchema } from '@/lib/validators/query-schemas'

export const POST = authedHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  const list = await listsService.findOne(id)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  const data = await parseJsonBody(listItemCreateSchema, request)
  const item = await listsService.addItem(id, data)
  return NextResponse.json(item)
})

export const PATCH = authedHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  const list = await listsService.findOne(id)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  const data = await parseJsonBody(listReorderSchema, request)
  const updated = await listsService.reorderItems(id, data.itemIds)
  return NextResponse.json(updated)
})
