import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/services/posts.service'
import { authedHandler } from '@/lib/authed-handler'
import { nonEmptyPostUpdateSchema } from '@/lib/validators/schemas'
import { parseJsonBody, parseRouteParams } from '@/lib/validators/parse'
import { idRouteParamsSchema } from '@/lib/validators/query-schemas'

export const PUT = authedHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  const data = await parseJsonBody(nonEmptyPostUpdateSchema, request)
  const post = await postsService.update(id, data)
  return NextResponse.json(post)
})

export const DELETE = authedHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  await postsService.softDelete(id)
  return NextResponse.json({ success: true })
})
