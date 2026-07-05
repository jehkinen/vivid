import { NextRequest, NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { mediaUrlsSchema } from '@/lib/validators/schemas'
import { parseJsonBody } from '@/lib/validators/parse'
import { mediaService } from '@/services/media.service'

export const POST = authedHandler(async (request: NextRequest) => {
  const { ids } = await parseJsonBody(mediaUrlsSchema, request)
  const urls = await mediaService.resolveUrlMap(ids)
  return NextResponse.json({ urls })
})
