import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api-handler'
import { validateRequest, mediaUrlsSchema } from '@/lib/validators/schemas'
import { mediaService } from '@/services/media.service'

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validation = validateRequest(mediaUrlsSchema, body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 })
  }
  const ids = [...new Set(validation.data.ids)]
  if (ids.length === 0) {
    return NextResponse.json({ urls: {} })
  }
  const list = await mediaService.findManyByIds(ids)
  const urls: Record<string, string> = {}
  for (const m of list) {
    urls[m.id] = m.url
  }
  return NextResponse.json({ urls })
})
