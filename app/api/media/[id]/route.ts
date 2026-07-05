import { NextRequest, NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { parseRouteParams } from '@/lib/validators/parse'
import { idRouteParamsSchema } from '@/lib/validators/query-schemas'
import { mediaService } from '@/services/media.service'

export const GET = authedHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  const media = await mediaService.findOne(id)
  if (!media) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(media)
})

export const DELETE = authedHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  await mediaService.softDelete(id)
  return NextResponse.json({ success: true })
})
