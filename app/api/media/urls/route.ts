import { NextRequest, NextResponse } from 'next/server'
import { authedHandler } from '@/lib/authed-handler'
import { mediaUrlsSchema } from '@/lib/validators/schemas'
import { parseJsonBody } from '@/lib/validators/parse'
import { mediaService } from '@/services/media.service'

export const POST = authedHandler(async (request: NextRequest) => {
  const { ids } = await parseJsonBody(mediaUrlsSchema, request)
  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length === 0) {
    return NextResponse.json({ urls: {} })
  }
  const list = await mediaService.findManyByIds(uniqueIds)
  const urls: Record<string, string> = {}
  for (const m of list) {
    urls[m.id] = m.url
  }
  return NextResponse.json({ urls })
})
