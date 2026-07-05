import { NextRequest, NextResponse } from 'next/server'
import { listsService } from '@/services/lists.service'
import { authedHandler } from '@/lib/authed-handler'
import { listUpdateSchema } from '@/lib/validators/schemas'
import { parseJsonBody, parseRouteParams } from '@/lib/validators/parse'
import { idRouteParamsSchema } from '@/lib/validators/query-schemas'

export const GET = authedHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  const list = await listsService.findOne(id)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  return NextResponse.json(list)
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
  const data = await parseJsonBody(listUpdateSchema, request)
  const updated = await listsService.update(id, data)
  return NextResponse.json(updated)
})

export const DELETE = authedHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  const list = await listsService.findOne(id)
  if (!list) {
    return NextResponse.json({ error: 'List not found' }, { status: 404 })
  }
  await listsService.delete(id)
  return NextResponse.json({ success: true })
})
