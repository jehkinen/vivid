import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api-handler'
import { parseRouteParams } from '@/lib/validators/parse'
import { idRouteParamsSchema } from '@/lib/validators/query-schemas'
import { mediaService } from '@/services/media.service'

export const GET = apiHandler(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await parseRouteParams(idRouteParamsSchema, params)
  const url = await mediaService.resolvePublicFeaturedMediaUrl(id)
  if (!url) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ url })
})
